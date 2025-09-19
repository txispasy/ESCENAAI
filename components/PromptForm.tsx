import React, { useState, useEffect } from 'react';
import { GenerationMode, UIMode } from '../App';

interface PromptFormProps {
    prompts: string[];
    setPrompts: (prompts: string[]) => void;
    negativePrompt: string;
    setNegativePrompt: (prompt: string) => void;
    style: string;
    setStyle: (style: string) => void;
    aspectRatio: string;
    setAspectRatio: (aspectRatio: string) => void;
    generationMode: GenerationMode;
    setGenerationMode: (mode: GenerationMode) => void;
    uiMode: UIMode;
    setUiMode: (mode: UIMode) => void;
    onSubmit: () => void;
    isLoading: boolean;
    cooldownEndTime: number | null;
}

const styles = ['Pixar', 'Disney 3D', 'Realistic', 'Fantasy', 'Creepy', 'Comic', 'Anime', 'Biblical', 'Cinematic'];
const styleVisuals: { [key: string]: string } = {
    'Pixar': 'bg-sky-500',
    'Disney 3D': 'bg-blue-500',
    'Realistic': 'bg-slate-500',
    'Fantasy': 'bg-purple-600',
    'Creepy': 'bg-red-900',
    'Comic': 'bg-yellow-500',
    'Anime': 'bg-pink-500',
    'Biblical': 'bg-amber-700',
    'Cinematic': 'bg-indigo-700',
};

const aspectRatios = { 'Horizontal': '16:9', 'Vertical': '9:16' };

const MAX_PROMPTS = 4;
const PROMPT_MAX_LENGTH = 4000;
const NEGATIVE_PROMPT_MAX_LENGTH = 500;

export const PromptForm: React.FC<PromptFormProps> = ({ prompts, setPrompts, negativePrompt, setNegativePrompt, style, setStyle, aspectRatio, setAspectRatio, generationMode, setGenerationMode, uiMode, setUiMode, onSubmit, isLoading, cooldownEndTime }) => {
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (cooldownEndTime && Date.now() < cooldownEndTime) {
            const updateCountdown = () => {
                const remaining = Math.ceil((cooldownEndTime - Date.now()) / 1000);
                setCooldownSeconds(remaining > 0 ? remaining : 0);
            };

            updateCountdown();
            const interval = setInterval(updateCountdown, 1000);
            return () => clearInterval(interval);
        } else {
            setCooldownSeconds(0);
        }
    }, [cooldownEndTime]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || cooldownSeconds > 0) return;
        onSubmit();
    }

    const handlePromptChange = (index: number, value: string) => {
        const newPrompts = [...prompts];
        newPrompts[index] = value.slice(0, PROMPT_MAX_LENGTH);
        setPrompts(newPrompts);
    };

    const addPrompt = () => {
        if (prompts.length < MAX_PROMPTS) {
            setPrompts([...prompts, '']);
        }
    };

    const removePrompt = (index: number) => {
        const newPrompts = prompts.filter((_, i) => i !== index);
        setPrompts(newPrompts);
    };
    
    const isSubmitDisabled = isLoading || cooldownSeconds > 0 || prompts.every(p => p.trim() === '');
    
    const getButtonText = () => {
      if (isLoading) {
          return (
              <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
              </>
          );
      }
      if (cooldownSeconds > 0) {
        return `Listo en ${cooldownSeconds}s`;
      }
      const activePrompts = prompts.filter(p => p.trim()).length;
      if (activePrompts === 0) {
        return 'Generar';
      }
      if (activePrompts === 1) {
        return 'Generar Escena';
      }
      return `Generar ${activePrompts} Escenas`;
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-8">
            <div className="space-y-4 animate-fade-in">
                {prompts.map((prompt, index) => (
                    <div key={index} className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => handlePromptChange(index, e.target.value)}
                            placeholder={index === 0 ? "ej., Una toma cinemática de un mapache en una biblioteca..." : "Añade otra descripción de escena..."}
                            rows={2}
                            className="w-full bg-[#1A1F2A] border border-gray-700 rounded-md p-3 pr-24 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                        />
                         <p className="absolute bottom-2 right-12 text-xs text-gray-500">{prompt.length} / {PROMPT_MAX_LENGTH}</p>
                        {prompts.length > 1 && (
                            <button type="button" onClick={() => removePrompt(index)} className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-gray-500 hover:text-white rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors" aria-label="Quitar prompt">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
                 {prompts.length < MAX_PROMPTS && (
                    <button type="button" onClick={addPrompt} className="w-full text-sm font-semibold text-gray-400 hover:text-white bg-[#1A1F2A] border border-dashed border-gray-600 rounded-md p-2 transition-colors">
                        + Añadir otra escena
                    </button>
                )}
            </div>
            
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-left text-gray-400 hover:text-white transition-colors py-2"
                    aria-expanded={showAdvanced}
                    aria-controls="advanced-settings"
                >
                    <span className="font-semibold">Ajustes Avanzados</span>
                    <svg
                        className={`w-5 h-5 transition-transform ${showAdvanced ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>

                {showAdvanced && (
                    <div id="advanced-settings" className="space-y-6 pt-4 border-t border-gray-700/50 animate-fade-in-down">
                        <div>
                            <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-300">Prompt Negativo</label>
                            <textarea
                                id="negative-prompt"
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value.slice(0, NEGATIVE_PROMPT_MAX_LENGTH))}
                                placeholder="ej., borroso, texto, marca de agua, feo"
                                rows={2}
                                className="mt-1 w-full bg-[#1A1F2A] border border-gray-700 rounded-md p-3 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            />
                            <p className="text-right text-xs text-gray-500">{negativePrompt.length} / {NEGATIVE_PROMPT_MAX_LENGTH}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Relación de Aspecto</label>
                            <div className="flex items-center space-x-2 bg-[#1A1F2A] p-1 rounded-full border border-[#222A35] max-w-min">
                                {Object.entries(aspectRatios).map(([name, value]) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => setAspectRatio(value)}
                                        className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#1A1F2A] ${aspectRatio === value ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        aria-pressed={aspectRatio === value}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Estilo Visual</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {styles.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStyle(s)}
                                        className={`relative w-full aspect-[16/9] rounded-lg text-white text-sm font-semibold flex items-center justify-center p-2 text-center transition-all duration-200 focus:outline-none ring-2 ring-offset-2 ring-offset-[#0E1116] ${style === s ? 'ring-pink-500' : 'ring-transparent hover:ring-pink-500/50'}`}
                                    >
                                        <div className={`absolute inset-0 rounded-lg opacity-80 ${styleVisuals[s]}`}></div>
                                        <span className="relative z-10 drop-shadow-md">{s}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4">
                 <button type="submit" disabled={isSubmitDisabled} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0E1116] focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                    {getButtonText()}
                </button>
            </div>
        </form>
    );
};
