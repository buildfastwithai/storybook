import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey: userApiKey } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Use user provided key, or fall back to env vars
    const apiKey = userApiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const config = {
      responseModalities: [
        'IMAGE',
      ],
      imageConfig: {
        imageSize: '1K',
      },
    };
    
    const model = 'gemini-3-pro-image-preview';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    // Using generateContentStream as requested, though generateContent might also work.
    // We'll capture the first image and return it.
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let base64Image: string | null = null;

    for await (const chunk of response) {
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        // Construct data URL
        base64Image = `data:${inlineData.mimeType};base64,${inlineData.data}`;
        break; // Found an image, stop.
      }
    }

    if (!base64Image) {
      throw new Error("No image generated");
    }

    return NextResponse.json({ imageUrl: base64Image });

  } catch (error: any) {
    console.error("Error generating image:", error);
    
    const isQuotaExceeded = error.status === 429 || 
                           error.code === 429 || 
                           error.message?.includes('429') || 
                           error.message?.includes('quota');

    if (isQuotaExceeded) {
      return NextResponse.json(
        { error: "QUOTA_EXCEEDED", message: "Free tier quota exceeded. Please use a paid API key." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
