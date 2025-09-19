import React, { useState, useCallback, useEffect } from 'react';
import { generateImage, optimizePrompt, styleDescriptions, QuotaExceededError, ratePrompt } from './services/geminiService';
import { Header } from './components/Header';
import { PromptForm } from './components/PromptForm';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ResultDisplay } from './components/ResultDisplay';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Gallery } from './components/Gallery';
import { PromptSelection } from './components/PromptSelection';
import { WebHandoffDisplay } from './components/WebPromptDisplay';

type GenerationState = 'idle' | 'optimizing_prompts' | 'prompt_selection' | 'generating' | 'success' | 'error' | 'web_handoff';
export type GenerationMode = 'quality' | 'fast';
export type GenerationType = 'image'; // Only image generation is supported
export type UIMode = 'simple' | 'pro';
export type AppView = 'generator' | 'gallery';

export type GalleryItem = {
  id: string;
  mediaUrl: string;
  type: GenerationType;
  originalPrompt: string;
  optimizedPrompt: string;
  negativePrompt: string;
  style: string;
  aspectRatio: string;
  createdAt: number;
};

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [optimizedPrompts, setOptimizedPrompts] = useState<string[]>([]);
  const [style, setStyle] = useState<string>('Pixar');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('quality');
  const [uiMode, setUiMode] = useState<UIMode>('simple');
  const [generatedMedia, setGeneratedMedia] = useState<(string | null)[]>([]);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [errorMessage, setErrorMessage] = useState<Error | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [promptScores, setPromptScores] = useState<{ original: number; optimized: number } | null>(null);
  const [lastAttemptedPrompt, setLastAttemptedPrompt] = useState<string>('');
  
  const [view, setView] = useState<AppView>('generator');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const isLoading = generationState === 'optimizing_prompts' || generationState === 'generating';

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('ai-image-gallery');
      if (storedItems) {
        const parsed = JSON.parse(storedItems).map((item: any) => ({
          ...item,
          mediaUrl: item.mediaUrl || item.imageUrl,
          type: 'image' as GenerationType // Force type to image for legacy items
        })).filter((item: any) => item.type === 'image'); // Filter out any old video items
        setGalleryItems(parsed);
      }
    } catch (error) {
      console.error("Failed to load from localStorage", error);
    }
  }, []);

  const handleSaveToGallery = (item: Omit<GalleryItem, 'id' | 'createdAt'>) => {
    const isDuplicate = galleryItems.some(g => g.mediaUrl === item.mediaUrl && g.originalPrompt === item.originalPrompt);
    if (isDuplicate) return;

    const newItem: GalleryItem = { ...item, id: new Date().toISOString() + Math.random(), createdAt: Date.now() };
    const updatedGallery = [newItem, ...galleryItems].sort((a, b) => b.createdAt - a.createdAt);
    setGalleryItems(updatedGallery);
    localStorage.setItem('ai-image-gallery', JSON.stringify(updatedGallery));
  };

  const handleRemoveFromGallery = (id: string) => {
    const updatedGallery = galleryItems.filter(item => item.id !== id);
    setGalleryItems(updatedGallery);
    localStorage.setItem('ai-image-gallery', JSON.stringify(updatedGallery));
  };

  const resetState = () => {
    setOptimizedPrompts([]);
    setGeneratedMedia([]);
    setGenerationState('idle');
    setErrorMessage(null);
    setLoadingMessage('');
    setPromptScores(null);
    setLastAttemptedPrompt('');
  };
  
  const handleWebHandoff = () => {
    const handoff = (promptToCopy?: string) => {
        const url = 'https://gemini.google.com/app';
        if (promptToCopy) {
            navigator.clipboard.writeText(promptToCopy).then(() => {
                window.open(url, '_blank');
                setGenerationState('web_handoff');
            }).catch(err => {
                console.error("Failed to copy prompt:", err);
                window.open(url, '_blank');
                setGenerationState('web_handoff');
            });
        } else {
             console.error("No prompt was available to hand off.");
             window.open(url, '_blank');
             setGenerationState('web_handoff');
        }
    };
    handoff(lastAttemptedPrompt);
  };

  const handleImageGeneration = async () => {
    setGenerationState('optimizing_prompts');
    setErrorMessage(null);
    setGeneratedMedia([]);
    setLoadingMessage('Optimizing your prompt(s)...');
    setOptimizedPrompts([]);
    setPromptScores(null);

    try {
        // Only show selection screen for a single prompt
        if (prompts.length === 1 && prompts[0].trim()) {
            const originalPrompt = prompts[0];
            const optimizedPrompt = await optimizePrompt(originalPrompt);

            // If optimization is negligible, skip selection and just generate.
            if (optimizedPrompt.toLowerCase() === originalPrompt.toLowerCase()) {
                setOptimizedPrompts([optimizedPrompt]);
                // Proceed directly to generation
                setGenerationState('generating');
                setLoadingMessage(`Generating 1 image...`);
                setLastAttemptedPrompt(optimizedPrompt);
                const imageBase64 = await generateImage(optimizedPrompt, style, aspectRatio, negativePrompt);
                const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
                setGeneratedMedia([imageUrl]);
                handleSaveToGallery({
                    mediaUrl: imageUrl, type: 'image', originalPrompt,
                    optimizedPrompt, negativePrompt, style, aspectRatio
                });
                setGenerationState('success');
                return;
            }
            
            setLoadingMessage('Rating prompts...');
            const [originalScore, optimizedScore] = await Promise.all([
                ratePrompt(originalPrompt),
                ratePrompt(optimizedPrompt)
            ]);

            setOptimizedPrompts([optimizedPrompt]);
            setPromptScores({ original: originalScore, optimized: optimizedScore });
            setGenerationState('prompt_selection'); // Hand off to the user

        } else { // Multi-prompt or empty prompt: generate all without selection
            const activePrompts = prompts.filter(p => p.trim());
            const optimized = await Promise.all(
                activePrompts.map(p => optimizePrompt(p))
            );
            setOptimizedPrompts(optimized);

            setGenerationState('generating');
            setLoadingMessage(`Generating ${optimized.length} image(s)...`);

            const newMedia: (string | null)[] = [];
            for (const [index, optPrompt] of optimized.entries()) {
                setLoadingMessage(`Generating image ${index + 1} of ${optimized.length}...`);
                setLastAttemptedPrompt(optPrompt);
                const imageBase64 = await generateImage(optPrompt, style, aspectRatio, negativePrompt);
                const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
                
                newMedia.push(imageUrl);
                setGeneratedMedia([...newMedia]); // Update UI incrementally
                
                handleSaveToGallery({
                    mediaUrl: imageUrl, type: 'image', originalPrompt: activePrompts[index],
                    optimizedPrompt: optPrompt, negativePrompt, style, aspectRatio
                });
            }
            setGenerationState('success');
        }
    } catch (error) {
        console.error(error);
        const err = error as Error;
        if (err.name === 'QuotaExceededError') {
            setCooldownEndTime(Date.now() + 60000);
        }
        setErrorMessage(err);
        setGenerationState('error');
    }
  };

  const handlePromptSelection = async (chosenPrompt: string) => {
      setGenerationState('generating');
      setErrorMessage(null);
      setLoadingMessage(`Generating image...`);

      try {
          setLastAttemptedPrompt(chosenPrompt);
          const imageBase64 = await generateImage(chosenPrompt, style, aspectRatio, negativePrompt);
          const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
          setGeneratedMedia([imageUrl]);
          
          handleSaveToGallery({
              mediaUrl: imageUrl,
              type: 'image',
              originalPrompt: prompts[0], // The original user prompt
              optimizedPrompt: chosenPrompt, // The prompt that was actually used
              negativePrompt: negativePrompt,
              style: style,
              aspectRatio: aspectRatio
          });
          
          setGenerationState('success');
      } catch (error) {
          console.error(error);
          const err = error as Error;
          if (err.name === 'QuotaExceededError') {
              setCooldownEndTime(Date.now() + 60000);
          }
          setErrorMessage(err);
          setGenerationState('error');
      }
  };

  const handleSubmit = () => {
    handleImageGeneration();
  };

  const renderContent = () => {
      if (view === 'gallery') {
          return <Gallery items={galleryItems} onRemove={handleRemoveFromGallery} />;
      }

      switch (generationState) {
          case 'idle':
              return <PromptForm 
                prompts={prompts} 
                setPrompts={setPrompts}
                negativePrompt={negativePrompt}
                setNegativePrompt={setNegativePrompt}
                style={style}
                setStyle={setStyle}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                generationMode={generationMode}
                setGenerationMode={setGenerationMode}
                uiMode={uiMode}
                setUiMode={setUiMode}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                cooldownEndTime={cooldownEndTime}
              />;
          case 'generating':
          case 'optimizing_prompts':
              return <LoadingIndicator message={loadingMessage} generatedMedia={generatedMedia} />;
          case 'success':
              return <ResultDisplay 
                mediaUrls={generatedMedia}
                originalPrompts={prompts}
                optimizedPrompts={optimizedPrompts}
                negativePrompt={negativePrompt}
                style={style}
                aspectRatio={aspectRatio}
                galleryItems={galleryItems}
                onSaveToGallery={handleSaveToGallery}
                onReset={resetState}
              />;
          case 'error':
              return <ErrorDisplay error={errorMessage!} onRetry={resetState} onWebHandoff={handleWebHandoff} />;
          case 'prompt_selection':
              return <PromptSelection 
                originalPrompt={prompts[0]}
                optimizedPrompt={optimizedPrompts[0]}
                scores={promptScores!}
                onSelect={handlePromptSelection}
                onCancel={resetState}
              />;
          case 'web_handoff':
              return <WebHandoffDisplay onClose={resetState} />;
          default:
              return null;
      }
  };

  return (
    <div className="min-h-screen bg-[#0E1116] text-gray-200">
      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-12">
        <Header view={view} setView={setView} />
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
