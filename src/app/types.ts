export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string; // Populated after image generation
  isLoadingImage?: boolean;
}

export interface Story {
  title: string;
  pages: StoryPage[];
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_STORY = 'GENERATING_STORY',
  READING = 'READING',
  ERROR = 'ERROR'
}

// Gemini Schema Types
export interface GeminiStorySchema {
  title: string;
  pages: {
    text: string;
    imagePrompt: string;
  }[];
}
