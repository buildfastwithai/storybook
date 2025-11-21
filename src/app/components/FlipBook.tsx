import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { ChevronLeft, ChevronRight, BookOpen, RotateCw } from 'lucide-react';

interface FlipBookProps {
  story: Story;
  onRestart: () => void;
}

export const FlipBook: React.FC<FlipBookProps> = ({ story, onRestart }) => {
  // 0 = Cover
  // 1 = Spread 1 (Pages 0 & 1)
  // 2 = Spread 2 (Pages 2 & 3)
  // ...
  // Last = Back Cover
  const [viewIndex, setViewIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const totalContentPages = story.pages.length;
  // Calculate total spreads needed for content. 
  // E.g., 4 pages = 2 spreads. 5 pages = 3 spreads.
  const contentSpreads = Math.ceil(totalContentPages / 2);
  // Total views: Cover + Content Spreads + Back Cover
  const totalViews = 1 + contentSpreads + 1;

  const handleNext = () => {
    if (viewIndex < totalViews - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setViewIndex(prev => prev + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (viewIndex > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setViewIndex(prev => prev - 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewIndex, isFlipping]);

  // --- Render Helpers ---

  const Cover = () => (
    <div className="w-full max-w-md md:max-w-lg aspect-[2/3] flex flex-col items-center justify-center p-8 text-center border-[8px] md:border-[12px] border-amber-900/40 rounded-r-lg rounded-l-sm bg-[#4a3b32] text-amber-100 shadow-2xl transform transition-transform duration-500 hover:scale-[1.02]">
      <div className="border-4 border-amber-500/30 p-8 w-full h-full flex flex-col items-center justify-center rounded-sm bg-[#2c241f] relative overflow-hidden">
        {/* Decorative Corner Elements */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-500/40"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-500/40"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-500/40"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-500/40"></div>

        <div className="bg-amber-500/10 p-6 rounded-full mb-8 backdrop-blur-sm">
            <BookOpen size={48} className="text-amber-400" />
        </div>
        
        <h1 className="font-title text-3xl md:text-5xl text-amber-100 mb-6 leading-tight drop-shadow-lg line-clamp-3">
          {story.title}
        </h1>
        
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-8 rounded-full"></div>
        
        <p className="text-amber-200/60 font-serif-story italic text-lg">A Tale Woven by Gemini</p>
        
        <div className="mt-auto pt-8 flex flex-col items-center gap-2">
            <span className="text-xs text-amber-200/30 uppercase tracking-[0.2em]">DreamWeaver Press</span>
            <span className="text-[10px] text-amber-200/20">Est. 2025</span>
        </div>
      </div>
    </div>
  );

  const BackCover = () => (
    <div className="w-full max-w-md md:max-w-lg aspect-[2/3] flex flex-col items-center justify-center p-12 bg-[#4a3b32] text-amber-100 border-[8px] md:border-[12px] border-amber-900/40 rounded-l-lg rounded-r-sm shadow-2xl">
      <div className="w-full h-full border-4 border-amber-500/20 flex flex-col items-center justify-center p-8 bg-[#2c241f]">
        <h2 className="font-title text-4xl mb-6 text-amber-100">The End</h2>
        <div className="w-16 h-16 text-amber-500/20 mb-8">
            <SparkleIcon />
        </div>
        <button 
            onClick={onRestart}
            className="group relative px-8 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-amber-900/50 overflow-hidden"
        >
            <span className="relative z-10 flex items-center gap-2">
                <RotateCw size={18} />
                Write Another Story
            </span>
        </button>
      </div>
    </div>
  );

  const PageContent = ({ pageIndex }: { pageIndex: number }) => {
    const page = story.pages[pageIndex];
    if (!page) return <div className="w-full h-full bg-[#fdfbf7] paper-texture shadow-inner"></div>;

    return (
      <div className="w-full h-full flex flex-col p-6 md:p-8 lg:p-10 bg-[#fdfbf7] text-stone-900 paper-texture shadow-inner relative">
        {/* Page Number */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-stone-400 font-serif-story text-xs md:text-sm tracking-widest">
          - {pageIndex + 1} -
        </div>

        <div className="flex-1 flex flex-col justify-start items-center overflow-y-auto scrollbar-hide">
            {/* Image Container */}
            <div className="aspect-square w-full max-w-[90%] mb-6 rounded-sm shadow-md border-[6px] border-white bg-stone-200 relative overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
                {page.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                        src={page.imageUrl} 
                        alt="Story illustration" 
                        className="w-full h-full object-cover animate-fade-in"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100">
                        {page.isLoadingImage ? (
                            <>
                                <div className="w-10 h-10 border-4 border-stone-300 border-t-amber-500 rounded-full animate-spin mb-3"></div>
                                <span className="text-xs font-medium uppercase tracking-wide opacity-70">Illustrating...</span>
                            </>
                        ) : (
                            <span className="text-xs font-medium uppercase tracking-wide opacity-50">Waiting...</span>
                        )}
                    </div>
                )}
            </div>

            {/* Text Container */}
            <div className="w-full font-serif-story text-base md:text-lg lg:text-xl leading-loose text-stone-800 text-justify px-2">
                <span className="float-left text-4xl md:text-5xl font-title text-amber-900 mr-3 mt-[-8px] leading-[0.8]">
                  {page.text.charAt(0)}
                </span>
                {page.text.slice(1)}
            </div>
        </div>
      </div>
    );
  };

  const Spread = () => {
    // Determine which pages to show based on viewIndex
    // View 1 -> Left: Page 0, Right: Page 1
    // View 2 -> Left: Page 2, Right: Page 3
    const contentSpreadIndex = viewIndex - 1;
    const leftPageIndex = contentSpreadIndex * 2;
    const rightPageIndex = contentSpreadIndex * 2 + 1;

    return (
      <div className="flex w-full h-full max-w-5xl aspect-[3/2] shadow-2xl rounded-lg overflow-hidden bg-[#fdfbf7] relative">
        {/* Spine Shadow */}
        <div className="absolute left-1/2 top-0 bottom-0 w-12 -ml-6 bg-gradient-to-r from-transparent via-black/10 to-transparent z-20 pointer-events-none mix-blend-multiply"></div>

        {/* Left Page */}
        <div className="w-1/2 h-full border-r border-stone-300/50 relative">
           <PageContent pageIndex={leftPageIndex} />
        </div>

        {/* Right Page */}
        <div className="w-1/2 h-full border-l border-stone-300/50 relative">
           <PageContent pageIndex={rightPageIndex} />
        </div>
      </div>
    );
  };

  // --- Main Render ---

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
      {/* Previous Button */}
      <button 
        onClick={handlePrev}
        disabled={viewIndex === 0}
        className="absolute left-2 md:left-8 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 disabled:opacity-0 transition-all hover:scale-110"
      >
        <ChevronLeft size={32} />
      </button>

      {/* Book Content Area */}
      <div className={`transition-all duration-500 ease-in-out transform ${isFlipping ? 'scale-95 opacity-80 blur-[1px]' : 'scale-100 opacity-100 blur-0'}`}>
        {viewIndex === 0 && <Cover />}
        {viewIndex > 0 && viewIndex < totalViews - 1 && <Spread />}
        {viewIndex === totalViews - 1 && <BackCover />}
      </div>

      {/* Next Button */}
      <button 
        onClick={handleNext}
        disabled={viewIndex === totalViews - 1}
        className="absolute right-2 md:right-8 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 disabled:opacity-0 transition-all hover:scale-110"
      >
        <ChevronRight size={32} />
      </button>
      
      {/* Progress Indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-40">
        {Array.from({ length: totalViews }).map((_, i) => (
            <div 
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === viewIndex ? 'bg-amber-500 w-6' : 'bg-stone-600'}`}
            />
        ))}
      </div>
    </div>
  );
};

const SparkleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
