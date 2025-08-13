import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createFal } from "@ai-sdk/fal";
import {
  generateObject,
  generateText,
  experimental_generateImage as generateImage,
} from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Define the schema for a story page
const StoryPageSchema = z.object({
  pageNumber: z.number(),
  title: z.string(),
  content: z.string(),
  characters: z.array(z.string()),
  setting: z.string(),
  mood: z.string(),
});

// Define the schema for the complete story
const StorySchema = z.object({
  title: z.string(),
  pages: z.array(StoryPageSchema),
  genre: z.string(),
  targetAge: z.string(),
});

interface StoryWithImages extends z.infer<typeof StorySchema> {
  pages: Array<z.infer<typeof StoryPageSchema> & { imageUrl?: string }>;
  coverImageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, pageCount = 5, apiKeys } = await request.json();

    const google = createGoogleGenerativeAI({
      apiKey: apiKeys.geminiKey,
    });

    const fal = createFal({
      apiKey: apiKeys.falKey,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!apiKeys || !apiKeys.geminiKey || !apiKeys.falKey) {
      return NextResponse.json(
        { error: "API keys are required" },
        { status: 400 }
      );
    }

    // Unified visual theme to keep all images consistent and avoid buggy outputs
    const IMAGE_STYLE_DIRECTIVE = `
      Consistent children's book watercolor illustration theme with soft pastel colors and gentle lighting; 
      hand-painted feel with clean outlines; cute rounded proportions; consistent character designs across all pages 
      (same clothes, colors, hair, and species); single cohesive art style throughout. Avoid text, letters, 
      watermarks, signatures, frames, borders, photorealism, 3D rendering, pixelation, glitches, artifacts, 
      distorted faces, extra fingers, extra limbs, or deformed anatomy.
    `
      .replace(/\s+/g, " ")
      .trim();

    // Local placeholder (never fails)
    const makePlaceholderImage = (title: string) => {
      const safeTitle = (title || "Story").slice(0, 40);
      const svg = `<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#a8e6cf'/>
      <stop offset='50%' stop-color='#7fcdcd'/>
      <stop offset='100%' stop-color='#81c784'/>
    </linearGradient>
  </defs>
  <rect width='1024' height='1024' fill='url(#g)'/>
  <g fill='#000000' opacity='0.15'>
    <circle cx='200' cy='200' r='60'/>
    <circle cx='250' cy='260' r='20'/>
    <circle cx='160' cy='260' r='20'/>
  </g>
  <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Georgia, serif' font-size='64' fill='rgba(0,0,0,0.65)'>${safeTitle}</text>
  <text x='50%' y='60%' dominant-baseline='middle' text-anchor='middle' font-family='Georgia, serif' font-size='36' fill='rgba(0,0,0,0.55)'>Illustration placeholder</text>
 </svg>`;
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    };

    // Step 1: Generate the story structure using Gemini 2.5 Flash
    console.log("Generating story structure...");
    const storyResult = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: StorySchema,
      prompt: `Create a children's storybook based on this prompt: "${prompt}". 
      The story should have exactly ${pageCount} pages, with each page having:
      - A clear title
      - 2-3 sentences of engaging content appropriate for children
      - Characters involved in that scene
      - Setting/location description
      - Mood/atmosphere
      
      Make it educational, fun, and age-appropriate for children aged 4-8 years.`,
    });

    const story = storyResult.object as StoryWithImages;

    console.log("Story generated:", story.title);
    console.log("Number of pages:", story.pages.length);

    // Step 2: Generate cover image
    console.log("Generating cover image...");
    let coverImageUrl: string | undefined;
    try {
      const coverPromptResult = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `Create a detailed cover image prompt for this children's storybook. Use a single, consistent visual theme for the entire book as specified below.
        
        Title: ${story.title}
        Genre: ${story.genre}
        Main Characters: ${story.pages
          .map((p) => p.characters)
          .flat()
          .filter((char, index, arr) => arr.indexOf(char) === index)
          .join(", ")}
        
         Generate a prompt for a beautiful, colorful children's book cover illustration.
         Enforce this exact visual theme (do not deviate across pages): ${IMAGE_STYLE_DIRECTIVE}
        Include:
        - Main characters in a welcoming scene
        - Title placement area (but don't include text)
        - Warm, inviting colors
         - Child-friendly artistic style with consistent character appearance
         - Storybook cover composition matching the theme
        
        Keep it concise (max 80 words).`,
      });

      const coverImageResult = await generateImage({
        model: fal.image("fal-ai/qwen-image"),
        prompt: `${coverPromptResult.text}. Visual theme: ${IMAGE_STYLE_DIRECTIVE}`,
        size: "1024x1024",
      });

      coverImageUrl = `data:image/png;base64,${Buffer.from(
        coverImageResult.image.uint8Array
      ).toString("base64")}`;

      console.log("Cover image generated successfully");
    } catch (error) {
      console.error("Error generating cover image:", error);
      // Ensure we always have a cover image for downstream fallbacks
      coverImageUrl = makePlaceholderImage(story.title);
    }

    // Helpers for robust retries
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    async function retry<T>(
      fn: () => Promise<T>,
      attempts = 3,
      baseDelayMs = 700
    ): Promise<T> {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i += 1) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          const delay = baseDelayMs * Math.pow(2, i);
          console.warn(
            `Attempt ${i + 1}/${attempts} failed. Retrying in ${delay}ms...`
          );
          await sleep(delay);
        }
      }
      throw lastErr;
    }

    // Step 3: Generate image prompts and images in parallel with limited concurrency, retry, and fallback
    const CONCURRENCY = 3;

    async function generatePageImage(
      page: z.infer<typeof StoryPageSchema>,
      index: number
    ) {
      try {
        const imagePromptResult = await retry(() =>
          generateText({
            model: google("gemini-2.5-flash"),
            prompt: `Create a detailed, child-friendly illustration prompt for this storybook page. Use a single, consistent visual theme for the entire book as specified below.
            
            Title: ${page.title}
            Content: ${page.content}
            Characters: ${page.characters.join(", ")}
            Setting: ${page.setting}
            Mood: ${page.mood}
            
             Generate a prompt for a colorful children's book illustration that captures this scene.
             Enforce this exact visual theme (do not deviate across pages): ${IMAGE_STYLE_DIRECTIVE}
             Ensure character consistency (same clothing, colors, and features) and coherent proportions.
            Include details about:
            - The characters and their expressions
            - The setting and environment
            - Colors and lighting that match the mood
            - Important objects or elements from the story
            
            Keep it descriptive but concise (max 80 words).`,
          })
        );

        const basePrompt = imagePromptResult.text;
        const enhancedPrompt = `${basePrompt}. Visual theme: ${IMAGE_STYLE_DIRECTIVE}`;

        const imageResult = await retry(async () => {
          try {
            return await generateImage({
              model: fal.image("fal-ai/qwen-image"),
              prompt: enhancedPrompt,
              size: "1024x1024",
            });
          } catch (err) {
            console.warn(
              "Primary model failed, trying fallback: fal-ai/flux-pro"
            );
            return await generateImage({
              model: fal.image("fal-ai/flux-pro"),
              prompt: enhancedPrompt,
              size: "1024x1024",
            });
          }
        });

        const base64Image = `data:image/png;base64,${Buffer.from(
          imageResult.image.uint8Array
        ).toString("base64")}`;

        return {
          ...page,
          imageUrl: base64Image,
          imagePrompt: enhancedPrompt,
        };
      } catch (error) {
        console.error(
          `Image generation failed for page ${index + 1} after retries:`,
          error
        );
        return {
          ...page,
          imageUrl: coverImageUrl ?? makePlaceholderImage(page.title),
          imagePrompt: "[FALLBACK] Used cover image due to generation failures",
        };
      }
    }

    async function runWithConcurrency<T>(
      factories: Array<() => Promise<T>>,
      limit: number
    ): Promise<T[]> {
      const results: T[] = new Array(factories.length);
      let next = 0;
      async function worker() {
        while (true) {
          const current = next++;
          if (current >= factories.length) break;
          results[current] = await factories[current]();
        }
      }
      const workers = Array(Math.min(limit, factories.length))
        .fill(0)
        .map(() => worker());
      await Promise.all(workers);
      return results;
    }

    const factories = story.pages.map(
      (page, index) => () => generatePageImage(page, index)
    );
    const pagesWithImages = await runWithConcurrency(factories, CONCURRENCY);

    const finalStory = {
      ...story,
      pages: pagesWithImages,
      coverImageUrl,
    };

    console.log("Story generation complete!");

    return NextResponse.json(finalStory);
  } catch (error) {
    console.error("Error generating story:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
