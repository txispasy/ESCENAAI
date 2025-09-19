import React, { useState, useCallback, useEffect } from 'react';
import { generateImage, optimizePrompt, ratePrompt } from './services/geminiService';
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
export type UIMode = 'simple' | 'pro';
export type AppView = 'generator' | 'gallery';

export type GalleryItem = {
  id: string;
  mediaUrl: string;
  originalPrompt: string;
  createdAt: number;
  optimizedPrompt?: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio?: string;
};

// This is the data structure for what's displayed on the results screen
export type ResultItem = Omit<GalleryItem, 'id' | 'createdAt'>;

const App: React.FC = () => {
  // Common State
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [errorMessage, setErrorMessage] = useState<Error | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [lastAttemptedPrompt, setLastAttemptedPrompt] = useState<string>('');
  const [view, setView] = useState<AppView>('generator');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [generatedResults, setGeneratedResults] = useState<ResultItem[]>([]);
  
  // Image-specific State
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [optimizedPrompts, setOptimizedPrompts] = useState<string[]>([]);
  const [style, setStyle] = useState<string>('Pixar');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('quality');
  const [uiMode, setUiMode] = useState<UIMode>('simple');
  const [promptScores, setPromptScores] = useState<{ original: number; optimized: number } | null>(null);

  const isLoading = generationState === 'optimizing_prompts' || generationState === 'generating';

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('ai-image-gallery');
      if (storedItems) {
        // Ensure all loaded items have a 'type', defaulting to 'image' for legacy items
        const parsed: GalleryItem[] = JSON.parse(storedItems).map((item: any) => ({
          ...item,
          type: item.type || 'image',
          mediaUrl: item.mediaUrl || item.imageUrl, // Handle legacy property
        }));
        setGalleryItems(parsed);
      }
    } catch (error)
      {
      console.error("Failed to load from localStorage", error);
    }
  }, []);

  const handleSaveToGallery = (item: ResultItem) => {
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
    setGeneratedResults([]);
    setGenerationState('idle');
    setErrorMessage(null);
    setLoadingMessage('');
    setPromptScores(null);
    setLastAttemptedPrompt('');
  };
  
  const handleWebHandoff = () => {
     const url = 'https://gemini.google.com/app';
      if (lastAttemptedPrompt) {
          navigator.clipboard.writeText(lastAttemptedPrompt).then(() => {
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

  const handleImageGeneration = async () => {
    setGenerationState('optimizing_prompts');
    setErrorMessage(null);
    setGeneratedResults([]);
    setLoadingMessage('Optimizando tu(s) prompt(s)...');
    setOptimizedPrompts([]);
    setPromptScores(null);

    try {
        if (prompts.length === 1 && prompts[0].trim()) {
            const originalPrompt = prompts[0];
            const optimizedPrompt = await optimizePrompt(originalPrompt);

            if (optimizedPrompt.toLowerCase() === originalPrompt.toLowerCase()) {
                setOptimizedPrompts([optimizedPrompt]);
                setGenerationState('generating');
                setLoadingMessage(`Generando 1 imagen...`);
                setLastAttemptedPrompt(optimizedPrompt);
                const imageBase64 = await generateImage(optimizedPrompt, style, aspectRatio, negativePrompt);
                const result: ResultItem = {
                    mediaUrl: `data:image/jpeg;base64,${imageBase64}`, originalPrompt,
                    optimizedPrompt, negativePrompt, style, aspectRatio
                };
                setGeneratedResults([result]);
                handleSaveToGallery(result);
                setGenerationState('success');
                return;
            }
            
            setLoadingMessage('Calificando prompts...');
            const [originalScore, optimizedScore] = await Promise.all([ ratePrompt(originalPrompt), ratePrompt(optimizedPrompt) ]);

            setOptimizedPrompts([optimizedPrompt]);
            setPromptScores({ original: originalScore, optimized: optimizedScore });
            setGenerationState('prompt_selection');

        } else {
            const activePrompts = prompts.filter(p => p.trim());
            const optimized = await Promise.all(activePrompts.map(p => optimizePrompt(p)));
            setOptimizedPrompts(optimized);
            setGenerationState('generating');
            setLoadingMessage(`Generando ${optimized.length} imágen(es)...`);

            const newResults: ResultItem[] = [];
            for (const [index, optPrompt] of optimized.entries()) {
                setLoadingMessage(`Generando imagen ${index + 1} de ${optimized.length}...`);
                setLastAttemptedPrompt(optPrompt);
                const imageBase64 = await generateImage(optPrompt, style, aspectRatio, negativePrompt);
                const result: ResultItem = {
                    mediaUrl: `data:image/jpeg;base64,${imageBase64}`, originalPrompt: activePrompts[index],
                    optimizedPrompt: optPrompt, negativePrompt, style, aspectRatio
                };
                newResults.push(result);
                setGeneratedResults([...newResults]);
                handleSaveToGallery(result);
            }
            setGenerationState('success');
        }
    } catch (error) {
        console.error(error);
        const err = error as Error;
        setErrorMessage(err);
        setGenerationState('error');
    }
  };

  const handlePromptSelection = async (chosenPrompt: string) => {
      setGenerationState('generating');
      setErrorMessage(null);
      setLoadingMessage(`Generando imagen...`);
      try {
          setLastAttemptedPrompt(chosenPrompt);
          const imageBase64 = await generateImage(chosenPrompt, style, aspectRatio, negativePrompt);
          const result: ResultItem = {
              mediaUrl: `data:image/jpeg;base64,${imageBase64}`, originalPrompt: prompts[0],
              optimizedPrompt: chosenPrompt, negativePrompt, style, aspectRatio
          };
          setGeneratedResults([result]);
          handleSaveToGallery(result);
          setGenerationState('success');
      } catch (error) {
          console.error(error);
          const err = error as Error;
          setErrorMessage(err);
          setGenerationState('error');
      }
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
                onSubmit={handleImageGeneration}
                isLoading={isLoading}
                cooldownEndTime={cooldownEndTime}
              />;
          case 'generating':
          case 'optimizing_prompts':
              const mediaUrls = generatedResults.map(r => r.mediaUrl);
              return <LoadingIndicator message={loadingMessage} generatedMedia={mediaUrls} />;
          case 'success':
              return <ResultDisplay 
                results={generatedResults}
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