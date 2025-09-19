import React, { useState, useCallback, useRef, useEffect } from 'react';
import { VISUAL_STYLES, AnalyzeIcon, AnimateIcon, GeneratorIcon } from '../constants';
import { geminiService, storageService, grokService } from '../services/apiService';
import type { VisualStyle, AspectRatio, Scene, StoredImage, PromptHistoryEntry } from '../types';
import { GenerationMode as Mode, GenerationEngine as Engine } from '../types';
import AnimationModal from '../components/AnimationModal';
import Lightbox from '../components/Lightbox';
import PromptHistory from '../components/PromptHistory';
import PromptConfirmationModal from '../components/PromptConfirmationModal';

const Spinner: React.FC<{ size?: string }> = ({ size = 'h-5 w-5' }) => (
    <div className={`animate-spin rounded-full border-b-2 border-white ${size}`}></div>
);

const Generator: React.FC = () => {
    const [mode, setMode] = useState<Mode>(Mode.SIMPLE);
    const [scenes, setScenes] = useState<Scene[]>([{ id: 'scene-1', value: '' }]);
    const [negativePrompt, setNegativePrompt] = useState('');
    const [style, setStyle] = useState<VisualStyle>(VISUAL_STYLES[0]);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [variants, setVariants] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<StoredImage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isAnimationModalOpen, setIsAnimationModalOpen] = useState(false);
    const [imageToAnimate, setImageToAnimate] = useState<StoredImage | null>(null);
    const [lightboxImageSrc, setLightboxImageSrc] = useState<string | null>(null);
    const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);
    
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [originalPromptForModal, setOriginalPromptForModal] = useState('');
    const [optimizationError, setOptimizationError] = useState<string | null>(null);


    const refreshPromptHistory = useCallback(() => {
        setPromptHistory(storageService.getPromptHistory());
    }, []);

    useEffect(() => {
        refreshPromptHistory();
    }, [refreshPromptHistory]);

    const handleUseHistoryEntry = (entry: PromptHistoryEntry) => {
        const newScenes = entry.scenes.map((s, i) => ({ id: `scene-hist-${Date.now()}-${i}`, value: s }));
        setScenes(newScenes.length > 0 ? newScenes : [{ id: 'scene-1', value: '' }]);
        setMode(newScenes.length > 1 || entry.negativePrompt ? Mode.PRO : Mode.SIMPLE);
        setNegativePrompt(entry.negativePrompt);
        const newStyle = VISUAL_STYLES.find(s => s.id === entry.style.id) || VISUAL_STYLES[0];
        setStyle(newStyle);
        setAspectRatio(entry.aspectRatio);
    };

    const handleDeleteHistoryEntry = (id: string) => {
        storageService.removeFromPromptHistory(id);
        refreshPromptHistory();
    };

    const handleClearHistory = () => {
        storageService.clearPromptHistory();
        refreshPromptHistory();
    };

    const handleAnimateClick = (image: StoredImage) => {
        setImageToAnimate(image);
        setIsAnimationModalOpen(true);
    };

    const updateScene = (id: string, value: string) => {
        setScenes(scenes.map(s => (s.id === id ? { ...s, value } : s)));
    };

    const addScene = () => {
        if (scenes.length < 5) {
            setScenes([...scenes, { id: `scene-${Date.now()}`, value: '' }]);
        }
    };

    const removeScene = (id: string) => {
        setScenes(scenes.filter(s => s.id !== id));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleAnalyzeImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzeImage = async (base64Image: string) => {
        setIsOptimizing(true);
        setError(null);
        setOptimizedPrompt('Analizando imagen...');
        try {
            const prompt = await geminiService.analyzeImage(base64Image);
            setOptimizedPrompt(prompt);
            setScenes([{ id: 'scene-1', value: prompt }]);
            setMode(Mode.SIMPLE);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al analizar la imagen.');
            setOptimizedPrompt(null);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleStartGeneration = async () => {
        if (scenes.every(s => s.value.trim() === '')) return;

        setError(null);
        setGeneratedImages([]);
        setOptimizationError(null);

        const combinedScenes = scenes.map(s => s.value).filter(s => s.trim() !== '').join('. ');
        const originalFullPrompt = `${combinedScenes}${negativePrompt ? ` | Negativo: ${negativePrompt}` : ''}`.trim();

        setOriginalPromptForModal(originalFullPrompt);
        setOptimizedPrompt(null);
        setIsConfirmationModalOpen(true);
        setIsOptimizing(true);
        
        storageService.saveToPromptHistory({
            scenes: scenes.map(s => s.value),
            negativePrompt,
            style,
            aspectRatio
        });
        refreshPromptHistory();

        try {
            const finalPrompt = await geminiService.optimizePrompt(scenes.map(s => s.value), negativePrompt);
            setOptimizedPrompt(finalPrompt);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al optimizar el prompt.';
            setOptimizationError(errorMessage);
            setOptimizedPrompt(null);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerationConfirmation = async (promptToUse: string) => {
        setIsConfirmationModalOpen(false);
        setIsLoading(true);
        setError(null);
        setOptimizedPrompt(`Usando prompt: ${promptToUse.substring(0, 100)}...`);

        try {
            const generationSettings = { prompt: promptToUse, style, aspectRatio, variants };
            let imageResults: string[] = [];
            let engineUsed: Engine = Engine.GEMINI;

            try {
                imageResults = await geminiService.generateImages(generationSettings);
            } catch (geminiError) {
                console.warn('Gemini failed, trying Grok...', geminiError);
                setError('Gemini falló. Intentando con Grok...');
                try {
                    imageResults = await grokService.generateImages(generationSettings);
                    engineUsed = Engine.GROK;
                } catch (grokError) {
                    console.error('Grok also failed.', grokError);
                    setError('Todos los motores de generación fallaron. Por favor, inténtelo de nuevo más tarde.');
                    setIsLoading(false);
                    setOptimizedPrompt(null);
                    return;
                }
            }
            
            const newImages: StoredImage[] = imageResults.map(base64 => {
                const newImage: StoredImage = {
                    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    src: `data:image/jpeg;base64,${base64}`,
                    prompt: promptToUse,
                    style: style.name,
                    timestamp: Date.now(),
                    engine: engineUsed,
                };
                storageService.saveToGallery(newImage);
                return newImage;
            });

            setGeneratedImages(prev => [...newImages, ...prev]);
            setError(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setOptimizedPrompt(null);
        }
    };
    
    const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

    return (
    <>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generation Settings Column */}
            <div className="lg:col-span-1 space-y-6">
                 {/* Prompt Section */}
                <div className="bg-brand-surface p-4 rounded-lg border border-white/10">
                    <h3 className="font-semibold mb-3 text-white">1. Describe tu idea</h3>
                    <div className="flex items-center bg-brand-bg rounded-lg p-1 mb-4">
                        {(Object.values(Mode) as Mode[]).map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${mode === m ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:bg-white/10'}`}>
                                {m}
                            </button>
                        ))}
                    </div>

                    {mode === Mode.SIMPLE ? (
                         <textarea value={scenes[0].value} onChange={(e) => updateScene('scene-1', e.target.value)} rows={4} className="w-full bg-brand-bg border border-white/10 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="Ej: Un astronauta montando a caballo en Marte, arte digital."></textarea>
                    ) : (
                        <div className="space-y-2">
                            {scenes.map((scene, index) => (
                                <div key={scene.id} className="flex items-center space-x-2">
                                    <input type="text" value={scene.value} onChange={(e) => updateScene(scene.id, e.target.value)} className="w-full bg-brand-bg border border-white/10 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder={`Escena ${index + 1}`} />
                                     {scenes.length > 1 && (
                                        <button onClick={() => removeScene(scene.id)} className="p-2 text-brand-text-muted hover:text-red-500 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {scenes.length < 5 && (
                                <button onClick={addScene} className="w-full text-sm text-brand-secondary hover:text-brand-primary transition-colors py-1">+ Añadir Escena</button>
                            )}
                        </div>
                    )}
                     {mode === Mode.PRO && (
                        <div className="mt-4">
                             <label className="text-xs font-medium text-brand-text-muted" htmlFor="negative-prompt">Prompt Negativo (Opcional)</label>
                             <textarea id="negative-prompt" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} rows={2} className="w-full bg-brand-bg border border-white/10 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="Ej: borroso, texto, manos mal hechas"></textarea>
                        </div>
                    )}
                    <div className="mt-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                         <button onClick={() => fileInputRef.current?.click()} className="w-full text-sm text-brand-secondary hover:text-brand-primary transition-colors py-1 flex items-center justify-center space-x-2">
                             <AnalyzeIcon className="w-4 h-4" />
                             <span>Analizar Imagen para Prompt</span>
                         </button>
                    </div>
                </div>

                {/* Visual Style Section */}
                <div className="bg-brand-surface p-4 rounded-lg border border-white/10">
                    <h3 className="font-semibold mb-3 text-white">2. Elige un Estilo Visual</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {VISUAL_STYLES.map(s => (
                            <button key={s.id} onClick={() => setStyle(s)} className={`p-2 rounded-md text-sm transition-colors ${style.id === s.id ? 'bg-brand-primary text-white font-semibold' : 'bg-brand-bg hover:bg-white/10'}`}>
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Final Adjustments Section */}
                <div className="bg-brand-surface p-4 rounded-lg border border-white/10">
                    <h3 className="font-semibold mb-3 text-white">3. Ajustes Finales</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-brand-text-muted mb-2 block">Relación de Aspecto</label>
                            <div className="grid grid-cols-5 gap-2">
                                {aspectRatios.map(ar => (
                                    <button key={ar} onClick={() => setAspectRatio(ar)} className={`py-2 rounded-md font-mono text-sm transition-colors ${aspectRatio === ar ? 'bg-brand-primary text-white font-semibold' : 'bg-brand-bg hover:bg-white/10'}`}>
                                        {ar}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="variants" className="text-sm font-medium text-brand-text-muted mb-2 block">Variantes ({variants})</label>
                            <input id="variants" type="range" min="1" max="4" step="1" value={variants} onChange={(e) => setVariants(parseInt(e.target.value))} className="w-full h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer range-thumb" />
                        </div>
                    </div>
                </div>

                <button onClick={handleStartGeneration} disabled={isLoading || scenes.every(s => s.value.trim() === '')} className="w-full bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-opacity">
                    {isLoading ? <Spinner /> : <GeneratorIcon className="w-5 h-5" />}
                    <span>{isLoading ? 'Generando...' : 'Generar'}</span>
                </button>
                
                <PromptHistory 
                    history={promptHistory}
                    onUse={handleUseHistoryEntry}
                    onDelete={handleDeleteHistoryEntry}
                    onClear={handleClearHistory}
                />
            </div>
            
            {/* Results Column */}
            <div className="lg:col-span-2 bg-brand-surface p-4 rounded-lg border border-white/10 min-h-[60vh] flex flex-col">
                 <div className="flex-grow flex items-center justify-center">
                    {isLoading ? (
                         <div className="text-center text-brand-text-muted">
                            <Spinner size="h-12 w-12"/>
                            <p className="mt-4 font-semibold text-white">Generando imágenes...</p>
                            <p className="text-sm max-w-md mx-auto">{error || optimizedPrompt || "Esto puede tardar un momento."}</p>
                         </div>
                    ) : error && generatedImages.length === 0 ? (
                        <div className="text-center text-red-400 max-w-md">
                            <h3 className="text-lg font-semibold">Ocurrió un error</h3>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    ) : generatedImages.length > 0 ? (
                         <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            {generatedImages.map((image) => (
                                 <div key={image.id} className="group relative rounded-lg overflow-hidden border border-white/10">
                                     <img src={image.src} alt={image.prompt} className="w-full h-full object-contain cursor-zoom-in" onClick={() => setLightboxImageSrc(image.src)} />
                                     <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleAnimateClick(image)} className="bg-white/20 p-2 rounded-full hover:bg-brand-accent" title="Animar">
                                                    <AnimateIcon className="w-4 h-4" />
                                                </button>
                                                <a href={image.src} download={`escena-ai-${image.id}.jpg`} className="bg-white/20 p-2 rounded-full hover:bg-blue-500" title="Descargar">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                </a>
                                            </div>
                                             {image.engine && <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded">{image.engine}</span>}
                                        </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    ) : (
                         <div className="text-center text-brand-text-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2a10 10 0 0 0-10 10"/><path d="M12 12a5 5 0 1 0 5-5"/><path d="M12 12a5 5 0 0 0-5 5"/><path d="m2 12 5 5"/><path d="m17 7 5 5"/></svg>
                            <h2 className="mt-4 text-xl font-semibold text-white">Resultados de la Generación</h2>
                            <p className="mt-2">Tus imágenes aparecerán aquí una vez generadas.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
        {lightboxImageSrc && <Lightbox src={lightboxImageSrc} onClose={() => setLightboxImageSrc(null)} />}
        <AnimationModal 
            isOpen={isAnimationModalOpen} 
            onClose={() => setIsAnimationModalOpen(false)} 
            image={imageToAnimate} 
        />
        <PromptConfirmationModal
            isOpen={isConfirmationModalOpen}
            onClose={() => setIsConfirmationModalOpen(false)}
            isOptimizing={isOptimizing}
            originalPrompt={originalPromptForModal}
            optimizedPrompt={optimizedPrompt}
            onConfirm={handleGenerationConfirmation}
            optimizationError={optimizationError}
        />
        <style>{`
          .range-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #A855F7;
            border-radius: 50%;
            cursor: pointer;
            margin-top: -6px;
          }
          
          .range-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #A855F7;
            border-radius: 50%;
            cursor: pointer;
          }
        `}</style>
    </>
    );
};

export default Generator;