import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Define the schema for character descriptions
const CharacterSchema = z.object({
  name: z.string(),
  description: z.string(),
  appearance: z.string(),
});

// Define the schema for a story page
const StoryPageSchema = z.object({
  pageNumber: z.number(),
  title: z.string(),
  content: z.string(),
  characters: z.array(z.string()),
  setting: z.string(),
  mood: z.string(),
  imagePrompt: z.string().describe("A detailed visual description of the scene for an AI image generator. Include art style details like 'storybook illustration', 'watercolor', or 'vibrant digital art'."),
});


export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey } = await request.json();

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const systemInstruction = `You are a master storyteller and children's book author. 
    Your goal is to write a captivating short story based on the user's input.
    The story should be between 6 to 10 pages long.
    Each page should have 2-4 sentences of engaging narrative text.
    
    CRITICAL FOR IMAGE GENERATION:
    1. Define a consistent "visualTheme" for the entire book (e.g., "Watercolor style, soft pastel colors, whimsical atmosphere").
    2. For each character, provide a detailed "appearance" description that MUST be used in every image prompt where they appear.
    3. For each page, provide an "imagePrompt" that describes the scene action.
    
    The tone should be magical, whimsical, and appropriate for all ages.`;

    const storyResult = await generateObject({
      model: google("gemini-2.5-flash"), 
      schema: z.object({
        title: z.string(),
        visualTheme: z.string().describe("A detailed description of the overall art style and visual atmosphere for the entire book."),
        pages: z.array(StoryPageSchema),
        characters: z.array(CharacterSchema),
        genre: z.string(),
        targetAge: z.string(),
      }),
      system: systemInstruction,
      prompt: `Create a captivating and creative children's storybook based on this prompt: "${prompt}".`,
    });

    const story = storyResult.object;

    // Map to internal structure expected by frontend
    const mappedStory = {
      title: story.title,
      pages: story.pages.map(p => {
        // Construct a robust image prompt
        const charactersInScene = story.characters.filter(c => p.characters.includes(c.name));
        const characterDescriptions = charactersInScene.map(c => `${c.name} (${c.appearance})`).join(", ");
        
        const robustImagePrompt = `
          Style: ${story.visualTheme}.
          Scene: ${p.imagePrompt}.
          Characters present: ${characterDescriptions}.
          No text, no words, high quality illustration.
        `.trim().replace(/\s+/g, ' ');

        return {
          text: p.content,
          imagePrompt: robustImagePrompt,
          isLoadingImage: false
        };
      })
    };

    return NextResponse.json(mappedStory);

  } catch (error) {
    console.error("Error generating story:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
