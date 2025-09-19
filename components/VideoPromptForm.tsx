import React, { useState, useEffect, useRef } from 'react';

interface VideoPromptFormProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    sourceImage: File | null;
    setSourceImage: (file: File | null) => void;
    onSubmit: () => void;
    isLoading: boolean;
    cooldownEndTime: number | null;
}

const PROMPT_MAX_LENGTH = 1000;

export const VideoPromptForm: React.FC<VideoPromptFormProps> = ({ prompt, setPrompt, sourceImage, setSourceImage, onSubmit, isLoading, cooldownEndTime }) => {
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    useEffect(() => {
        if (sourceImage) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(sourceImage);
        } else {
            setImagePreview(null);
        }
    }, [sourceImage]);


    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || cooldownSeconds > 0) return;
        onSubmit();
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSourceImage(file);
        }
    };
    
    const removeImage = () => {
        setSourceImage(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isSubmitDisabled = isLoading || cooldownSeconds > 0 || prompt.trim() === '';
    
    const getButtonText = () => {
      if (isLoading) {
          return "Generando...";
      }
      if (cooldownSeconds > 0) {
        return `Listo en ${cooldownSeconds}s`;
      }
      return 'Generar Video';
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-8 animate-fade-in">
            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_MAX_LENGTH))}
                        placeholder="ej., Un águila majestuosa volando por un cielo nublado, cinemático..."
                        rows={3}
                        className="w-full bg-[#1A1F2A] border border-gray-700 rounded-md p-3 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <p className="absolute bottom-2 right-3 text-xs text-gray-500">{prompt.length} / {PROMPT_MAX_LENGTH}</p>
                </div>
            </div>
            
            <div className="space-y-2">
                 <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300">Animar una Imagen (Opcional)</label>
                 <div className="mt-1 flex items-center justify-center w-full">
                     <label htmlFor="image-upload-input" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-[#1A1F2A] hover:bg-gray-800/60 transition-colors">
                        {imagePreview ? (
                            <div className="relative w-full h-full">
                                <img src={imagePreview} alt="Vista previa de la imagen" className="w-full h-full object-contain rounded-lg p-2" />
                                <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-white rounded-full bg-black/50 hover:bg-red-600/80 transition-colors" aria-label="Quitar imagen">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                 <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                     <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                 </svg>
                                 <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                 <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                             </div>
                         )}
                         <input id="image-upload-input" ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                     </label>
                 </div> 
            </div>

            <div className="pt-4">
                 <button type="submit" disabled={isSubmitDisabled} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0E1116] focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                    {isLoading && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {getButtonText()}
                </button>
            </div>
        </form>
    );
};
