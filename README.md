# AI Storybook Creator

An interactive web application that generates personalized children's storybooks with AI-powered text and illustrations. Create unique, engaging stories with consistent characters and beautiful watercolor-style illustrations.

## Features

🎨 **AI-Generated Stories** - Create custom children's stories from simple prompts
🖼️ **Consistent Character Illustrations** - Maintain character appearance across all pages
📖 **Interactive Page Flip** - Realistic book-reading experience with smooth page transitions
⚙️ **Secure API Management** - Local storage of API keys for privacy

## How It Works

1. **Enter a Story Prompt** - Describe your story idea (e.g., "A brave little mouse who dreams of becoming a chef")
2. **Set Page Count** - Choose between 1-10 pages for your story
3. **AI Generation** - The app creates:
   - Story structure with detailed character descriptions
   - Cover image with main characters
   - Individual page illustrations with consistent character appearance

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, SCSS
- **Page Flip Animation**: page-flip library for realistic book experience
- **AI Text Generation**: Google Gemini 2.5 Flash
- **AI Image Generation**: Fal AI (qwen-image, flux-pro fallback)
- **Styling**: Custom SCSS with watercolor theme
- **Schema Validation**: Zod for type-safe data handling

## Prerequisites

You'll need API keys from:

- [Google AI Studio](https://aistudio.google.com/app/apikey) - For Gemini API
- [Fal AI Dashboard](https://fal.ai/dashboard/api-keys) - For image generation

## Getting Started

1. **Clone the repository**

```bash
git clone <repository-url>
cd storybook
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Configure API Keys**

- Click "API Settings" in the app
- Enter your Google Gemini API key
- Enter your Fal AI API key
- Keys are stored locally in your browser

## Usage

### Creating a Story

1. Enter a creative prompt describing your story idea
2. Select the number of pages (1-10)
3. Click "Generate Story"
4. Wait for AI generation (typically 2-3 minutes)
5. Enjoy your interactive storybook!

### Navigation

- Use arrow buttons to flip pages
- Track progress with the page counter
- Click "New Story" to create another storybook

## AI Generation Process

### Story Creation

- Generates structured story with character descriptions
- Creates detailed character appearance profiles
- Ensures educational and age-appropriate content

### Image Generation

- Cover image featuring main characters
- Individual page illustrations with scene-specific content
- Character consistency maintained through detailed appearance descriptions
- Watercolor illustration style with no text overlay

### Character Consistency Features

- Detailed character schemas with appearance descriptions
- Exact character descriptions passed to all image prompts
- Consistent clothing, colors, hair, and physical features
- Visual theme enforcement across all illustrations

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate-story/
│   │       └── route.ts          # Main API endpoint for story generation
│   ├── page.tsx                  # Main application component
│   ├── layout.tsx               # App layout
│   ├── story.scss               # Storybook styling
│   └── settings.scss            # Settings dialog styling
```

## Key Components

- **Story Generation API** (`route.ts`) - Handles AI generation with character consistency
- **Interactive UI** (`page.tsx`) - Manages book state, page flipping, and user interactions
- **Character Schema** - Ensures consistent character appearance across illustrations
- **Page Flip Integration** - Realistic book reading experience

## Privacy & Security

- API keys stored locally in browser (localStorage)
- No server-side storage of personal data
- Keys only sent to official AI providers (Google, Fal AI)
- No data collection or tracking

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Customization

- Modify `IMAGE_STYLE_DIRECTIVE` in `route.ts` to change illustration style
- Adjust story generation prompts for different content types
- Customize UI themes in SCSS files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and feature requests, please create an issue in the repository.

---

**Created with ❤️ using AI technology to inspire young readers and storytellers**
