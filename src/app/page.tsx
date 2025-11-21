"use client";

import React, { useState, useRef } from 'react';
import { Story, AppState, StoryPage } from './types';
import { FlipBook } from './components/FlipBook';
import { Button } from './components/Button';
import { BookOpen, Sparkles, PenTool, AlertCircle, Key, X } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track if we should continue generating images
  const isGeneratingImagesRef = useRef(false);

  const handleGenerateStory = async () => {
    if (!prompt.trim()) return;

    if (!apiKey.trim()) {
      setModalError(null);
      setIsApiKeyModalOpen(true);
      return;
    }

    setStatus(AppState.GENERATING_STORY);
    setError(null);
    setStory(null);
    isGeneratingImagesRef.current = false;

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const generatedStory: Story = await response.json();
      setStory(generatedStory);
      setStatus(AppState.READING);
      
      // Start generating images in the background
      startImageGenerationQueue(generatedStory);
    } catch (err) {
      console.error(err);
      setError("Failed to weave your story. Please try a different prompt.");
      setStatus(AppState.ERROR);
    }
  };

  const startImageGenerationQueue = async (currentStory: Story) => {
    isGeneratingImagesRef.current = true;
    const pages = [...currentStory.pages];

    // We generate images sequentially to ensure order and manage rate limits gently
    for (let i = 0; i < pages.length; i++) {
      if (!isGeneratingImagesRef.current) break;
      
      // Update loading state for this page
      updatePageStatus(i, { isLoadingImage: true });

      try {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: pages[i].imagePrompt, apiKey }),
        });

        if (response.status === 429) {
           const data = await response.json();
           setModalError(data.message || "Free tier quota exceeded. Please enter a paid Gemini API key.");
           setIsApiKeyModalOpen(true);
           isGeneratingImagesRef.current = false;
           updatePageStatus(i, { isLoadingImage: false });
           break;
        }

        if (!response.ok) {
            throw new Error('Failed to generate image');
        }

        const { imageUrl } = await response.json();

        if (!isGeneratingImagesRef.current) break;
        
        updatePageStatus(i, { imageUrl, isLoadingImage: false });
      } catch (e) {
        console.error(`Failed to generate image for page ${i}`, e);
        updatePageStatus(i, { isLoadingImage: false }); // Just stop loading, leave placeholder
      }
    }
    isGeneratingImagesRef.current = false;
  };

  const updatePageStatus = (index: number, updates: Partial<StoryPage>) => {
    setStory(prev => {
      if (!prev) return null;
      const newPages = [...prev.pages];
      newPages[index] = { ...newPages[index], ...updates };
      return { ...prev, pages: newPages };
    });
  };

  const handleRestart = () => {
    isGeneratingImagesRef.current = false;
    setStatus(AppState.IDLE);
    setPrompt('');
    setStory(null);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-stone-200 flex flex-col relative overflow-hidden font-sans">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-2 rounded-lg shadow-lg shadow-orange-900/50">
            <BookOpen className="text-white h-6 w-6" />
          </div>
          <h1 className="font-sans text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-100">
            Storybook
          </h1>
        </div>

        <div className="flex items-center gap-4">
           <Button 
             variant="ghost" 
             onClick={() => {
               setModalError(null);
               setIsApiKeyModalOpen(true);
             }}
             className="text-stone-400 hover:text-amber-400"
           >
             <Key className="w-4 h-4 mr-2" />
             {apiKey ? "Update API Key" : "Add Gemini API Key"}
           </Button>

          {status === AppState.READING && (
            <Button variant="ghost" onClick={handleRestart} className="hidden md:flex">
              Create New Story
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-7xl mx-auto">
        
        {status === AppState.IDLE && (
          <div className="w-full max-w-2xl flex flex-col items-center text-center animate-fade-in">
            <div className="mb-8 p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="font-title text-4xl md:text-5xl mb-6 text-white drop-shadow-lg">
              What story shall we tell today?
            </h2>
            <p className="text-lg text-stone-400 mb-10 max-w-md leading-relaxed">
              Enter a short idea, character, or theme, and watch as we weave a magical illustrated book just for you.
            </p>
            
            <div className="w-full bg-stone-800/50 backdrop-blur-xl border border-stone-700 rounded-2xl p-2 shadow-2xl shadow-black/50 transition-all focus-within:border-amber-500/50 focus-within:ring-4 focus-within:ring-amber-500/10">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: A lonely robot who finds a flower on Mars..."
                className="w-full bg-transparent border-none text-xl text-white placeholder-stone-600 p-4 focus:ring-0 resize-none min-h-[120px] rounded-xl outline-none"
                maxLength={300}
              />
              <div className="flex justify-between items-center px-4 pb-2 pt-2">
                <span className="text-xs text-stone-600 font-medium">{prompt.length}/300</span>
                <Button 
                  onClick={handleGenerateStory} 
                  disabled={!prompt.trim()}
                  className="shadow-amber-500/20"
                >
                  <PenTool className="w-4 h-4" />
                  Weave Story
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {[
                "A magical cat who can control time",
                "A young astronaut exploring a candy planet",
                "A dragon who is afraid of fire"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="px-4 py-2 rounded-full bg-stone-800/50 border border-stone-700 text-stone-400 text-sm hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-200 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === AppState.GENERATING_STORY && (
          <div className="flex flex-col items-center justify-center animate-pulse">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
              <BookOpen className="absolute inset-0 m-auto text-amber-500 w-8 h-8" />
            </div>
            <h3 className="font-title text-2xl text-amber-100 mb-2">Weaving your tale...</h3>
            <p className="text-stone-400">Crafting characters and plot twists</p>
          </div>
        )}

        {status === AppState.ERROR && (
          <div className="flex flex-col items-center text-center max-w-md p-8 bg-red-900/20 border border-red-500/30 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="font-title text-xl text-red-200 mb-2">The ink spilled!</h3>
            <p className="text-stone-400 mb-6">{error}</p>
            <Button variant="secondary" onClick={() => setStatus(AppState.IDLE)}>
              Try Again
            </Button>
          </div>
        )}

        {status === AppState.READING && story && (
          <div className="w-full h-full flex items-center justify-center perspective-1000">
            <FlipBook story={story} onRestart={handleRestart} />
          </div>
        )}
      </main>
      
      <footer className="relative z-10 p-4 text-center text-stone-600 text-sm">
        Powered by <Link href={"https://buildfastwithai.com"} target='_blank'>Build Fast with AI</Link>
      </footer>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1a1a1a] border border-stone-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <Key className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Enter Gemini API Key</h3>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{modalError}</p>
              </div>
            )}

            <p className="text-stone-400 mb-6 text-sm leading-relaxed">
              To generate stories and images, you'll need a Google Gemini API key. 
              Your key is used only for this session and is never stored on our servers.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-black/20 border border-stone-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all placeholder-stone-700"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setIsApiKeyModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsApiKeyModalOpen(false)}>
                  Save Key
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}