"use client";

import React, { useEffect, useRef, useState } from "react";
import { PageFlip } from "page-flip";
import type { SizeType } from "page-flip";
import "./story.scss";
import "./settings.scss";

interface StoryPage {
  pageNumber: number;
  title: string;
  content: string;
  characters: string[];
  setting: string;
  mood: string;
  imageUrl?: string;
}

interface Story {
  title: string;
  pages: StoryPage[];
  genre: string;
  targetAge: string;
  coverImageUrl?: string;
}

export default function Page() {
  const flipBookRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageState, setPageState] = useState("read");
  const [orientation, setOrientation] = useState("landscape");
  const [story, setStory] = useState<Story | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [pageCount, setPageCount] = useState(5);
  const [showGenerator, setShowGenerator] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    geminiKey: "",
    falKey: "",
  });

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem("ai-storybook-keys");

    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(parsedKeys);
      } catch (error) {
        console.error("Error parsing saved keys:", error);
        localStorage.removeItem("ai-storybook-keys");
      }
    }
  }, []);

  useEffect(() => {
    if (
      flipBookRef.current &&
      !pageFlipRef.current &&
      story &&
      !showGenerator
    ) {
      const pageFlip = new PageFlip(flipBookRef.current, {
        width: 400,
        height: 300,
        size: "stretch" as SizeType,
        minWidth: 300,
        maxWidth: 600,
        minHeight: 200,
        maxHeight: 200,
        maxShadowOpacity: 0.5,
        showCover: true,
        mobileScrollSupport: false,
      });

      pageFlip.loadFromHTML(document.querySelectorAll(".page"));

      // Set total pages as: Cover + Story pages + End = story.pages.length + 2
      setTotalPages(story.pages.length + 2);
      setOrientation(String(pageFlip.getOrientation()));

      pageFlip.on("flip", (e) => {
        const pageIndex = typeof e.data === "number" ? e.data : 0;
        // Account for structure: Cover (0), Hidden (1), Story pairs (2,3), (4,5), ..., Hidden (n-1), End (n)
        let displayPage = 1;

        if (pageIndex <= 1) {
          displayPage = 1; // Cover page (index 0 or 1)
        } else if (pageIndex >= story.pages.length * 2 + 2) {
          displayPage = story.pages.length + 2; // End page
        } else {
          // Story pages: subtract 2 for cover+hidden, then divide by 2, then add 2 for cover+first story page
          displayPage = Math.floor((pageIndex - 2) / 2) + 2;
        }

        setCurrentPage(displayPage);
      });

      pageFlip.on("changeState", (e) => {
        setPageState(String(e.data));
      });

      pageFlip.on("changeOrientation", (e) => {
        setOrientation(String(e.data));
      });

      pageFlipRef.current = pageFlip;
    }
  }, [story, showGenerator]);

  const handlePrevPage = () => {
    if (pageFlipRef.current) {
      pageFlipRef.current.flipPrev();
    }
  };

  const handleNextPage = () => {
    if (pageFlipRef.current) {
      pageFlipRef.current.flipNext();
    }
  };

  const generateStory = async () => {
    if (!prompt.trim()) return;

    // Check if API keys are provided
    if (!apiKeys.geminiKey || !apiKeys.falKey) {
      alert(
        "Please configure your API keys in the settings before generating a story."
      );
      setShowSettings(true);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          pageCount,
          apiKeys: {
            geminiKey: apiKeys.geminiKey,
            falKey: apiKeys.falKey,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const generatedStory = await response.json();

      setStory(generatedStory);
      setShowGenerator(false);
    } catch (error) {
      console.error("Error generating story:", error);
      alert("Failed to generate story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetToGenerator = () => {
    setShowGenerator(true);
    setStory(null);
    setPrompt("");
    pageFlipRef.current = null;
  };

  const saveApiKeys = () => {
    localStorage.setItem("ai-storybook-keys", JSON.stringify(apiKeys));
    setShowSettings(false);
  };

  const handleKeyChange = (key: "geminiKey" | "falKey", value: string) => {
    setApiKeys((prev) => ({ ...prev, [key]: value }));
  };

  // Settings Dialog should take priority over generator
  if (showSettings) {
    return (
      <div className="story-container">
        <div className="settings-container">
          <h1>API Settings</h1>
          <p>Enter your API keys to generate AI stories and illustrations.</p>

          <div className="settings-form">
            <div className="input-group">
              <label htmlFor="gemini-key">Google Gemini API Key</label>
              <input
                id="gemini-key"
                type="password"
                value={apiKeys.geminiKey}
                onChange={(e) => handleKeyChange("geminiKey", e.target.value)}
                placeholder="Enter your Gemini API key"
                className="api-input"
              />
              <small>
                Get your key from:{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google AI Studio
                </a>
              </small>
            </div>

            <div className="input-group">
              <label htmlFor="fal-key">Fal AI API Key</label>
              <input
                id="fal-key"
                type="password"
                value={apiKeys.falKey}
                onChange={(e) => handleKeyChange("falKey", e.target.value)}
                placeholder="Enter your Fal AI key"
                className="api-input"
              />
              <small>
                Get your key from:{" "}
                <a
                  href="https://fal.ai/dashboard/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Fal AI Dashboard
                </a>
              </small>
            </div>

            <div className="settings-buttons">
              <button
                onClick={() => setShowSettings(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={saveApiKeys}
                disabled={!apiKeys.geminiKey || !apiKeys.falKey}
                className="save-btn"
              >
                Save Keys
              </button>
            </div>
          </div>

          <div className="security-note">
            <p>
              <strong>🔒 Security Note:</strong> Your API keys are stored
              locally in your browser and never sent to any server except the
              official AI providers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div className="story-container">
        <div className="generator-container">
          <h1>AI Storybook Creator</h1>
          <p>
            Enter a prompt to generate a personalized children&#39;s storybook
            with AI-generated illustrations!
          </p>

          <div className="prompt-input-container">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your story idea... (e.g., 'A brave little mouse who dreams of becoming a chef' or 'An adventure in a magical forest with talking animals')"
              className="prompt-input"
              rows={4}
              disabled={isGenerating}
            />

            <div className="page-count-container">
              <label htmlFor="page-count">Number of Pages:</label>
              <select
                id="page-count"
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="page-count-select"
                disabled={isGenerating}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} page{i + 1 > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="action-buttons">
              <button
                onClick={() => setShowSettings(true)}
                className="settings-btn"
                disabled={isGenerating}
              >
                ⚙️ API Settings
              </button>
              <button
                onClick={generateStory}
                disabled={
                  !prompt.trim() ||
                  isGenerating ||
                  !apiKeys.geminiKey ||
                  !apiKeys.falKey
                }
                className="generate-btn"
              >
                {isGenerating ? "Generating Story..." : "Generate Story"}
              </button>
            </div>
          </div>

          {isGenerating && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>
                Creating your magical storybook... This may take a few minutes.
              </p>
            </div>
          )}

          {/* API Keys Status */}
          <div className="api-status">
            <p>
              Status:
              {apiKeys.geminiKey && apiKeys.falKey ? (
                <span className="status-ready">✅ Ready to generate</span>
              ) : (
                <span className="status-needs-setup">
                  ⚠️ Please configure API keys
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Settings Dialog
  if (showSettings) {
    return (
      <div className="story-container">
        <div className="settings-container">
          <h1>API Settings</h1>
          <p>Enter your API keys to generate AI stories and illustrations.</p>

          <div className="settings-form">
            <div className="input-group">
              <label htmlFor="gemini-key">Google Gemini API Key</label>
              <input
                id="gemini-key"
                type="password"
                value={apiKeys.geminiKey}
                onChange={(e) => handleKeyChange("geminiKey", e.target.value)}
                placeholder="Enter your Gemini API key"
                className="api-input"
              />
              <small>
                Get your key from:{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google AI Studio
                </a>
              </small>
            </div>

            <div className="input-group">
              <label htmlFor="fal-key">Fal AI API Key</label>
              <input
                id="fal-key"
                type="password"
                value={apiKeys.falKey}
                onChange={(e) => handleKeyChange("falKey", e.target.value)}
                placeholder="Enter your Fal AI key"
                className="api-input"
              />
              <small>
                Get your key from:{" "}
                <a
                  href="https://fal.ai/dashboard/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Fal AI Dashboard
                </a>
              </small>
            </div>

            <div className="settings-buttons">
              <button
                onClick={() => setShowSettings(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={saveApiKeys}
                disabled={!apiKeys.geminiKey || !apiKeys.falKey}
                className="save-btn"
              >
                Save Keys
              </button>
            </div>
          </div>

          <div className="security-note">
            <p>
              <strong>🔒 Security Note:</strong> Your API keys are stored
              locally in your browser and never sent to any server except the
              official AI providers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="story-container">
      <div className="book-controls">
        <button
          type="button"
          className="nav-btn reset-btn"
          onClick={resetToGenerator}
          aria-label="Create new story"
        >
          ✏️ New Story
        </button>
        <button
          type="button"
          className="nav-btn prev-btn"
          onClick={handlePrevPage}
          aria-label="Previous page"
        >
          ←
        </button>
        <span className="page-counter">
          {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className="nav-btn next-btn"
          onClick={handleNextPage}
          aria-label="Next page"
        >
          →
        </button>
      </div>
      <div className="book-container">
        <div className="flip-book" ref={flipBookRef}>
          {/* Cover Page */}
          <div className="page page-cover page-cover-top" data-density="hard">
            <div className="page-content">
              {story?.coverImageUrl ? (
                <div className="cover-with-image">
                  <img
                    src={story.coverImageUrl}
                    alt={`Cover for ${story.title}`}
                    className="cover-image"
                  />
                  <div className="cover-text">
                    <h1>{story.title}</h1>
                  </div>
                </div>
              ) : (
                <>
                  <h1>{story?.title || "Generated Story"}</h1>
                  <p className="subtitle">
                    {story?.genre} • Ages {story?.targetAge}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Story Pages - Split into separate left and right pages */}
          {story?.pages.map((page) => (
            <React.Fragment key={page.pageNumber}>
              {/* Left Page - Image */}
              <div className="page page-left-only">
                <div className="page-content">
                  <div className="story-illustration">
                    {page.imageUrl ? (
                      <img
                        src={page.imageUrl}
                        alt={`Illustration for ${page.title}`}
                        className="generated-image"
                      />
                    ) : (
                      <div className="illustration-placeholder">
                        🎨 Generating...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Page - Text */}
              <div className="page page-right-only">
                <div className="page-content">
                  <h3 className="page-title">{page.title}</h3>
                  <div className="story-text">
                    <p>{page.content}</p>
                  </div>
                  <div className="page-number">{page.pageNumber}</div>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* End Page */}
          <div
            className="page page-cover page-cover-bottom"
            data-density="hard"
          >
            <div className="page-content">
              <h2>THE END</h2>
              <p className="subtitle">Thank you for reading!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
