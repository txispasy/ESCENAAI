import { GoogleGenAI, Operation } from "@google/genai";
import type { GenerateContentResponse, GenerateVideosResponse } from "@google/genai";
import type { StoredImage, ClassificationImage, GenerationSettings, AspectRatio, PromptHistoryEntry, VisualStyle } from '../types';

// ===================================================================================
// Configuración de API Keys
// Las claves de API se obtienen de las variables de entorno.
// Se asume que process.env.API_KEY (para Gemini) y
// process.env.XAI_API_KEY (para Grok) están configuradas en el entorno de ejecución.
// ===================================================================================

if (!process.env.API_KEY) {
    // En un entorno real, este error debería ser manejado de forma más elegante
    // o el entorno de compilación/ejecución debería garantizar su existencia.
    throw new Error("La variable de entorno API_KEY para Gemini no está configurada.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
    async optimizePrompt(scenes: string[], negativePrompt: string): Promise<string> {
        const combinedPrompt = scenes.filter(s => s.trim() !== '').join('. ');
        if (!combinedPrompt) {
            return '';
        }

        const fullUserPrompt = `User prompt: "${combinedPrompt}". ${negativePrompt ? `Negative prompt: "${negativePrompt}"` : ''}`;

        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullUserPrompt,
                config: {
                    systemInstruction: "You are an expert prompt engineer for an AI image generator. The user will provide a prompt, potentially in a language other than English. Your task is to: 1. Translate the user's prompt into English. 2. Enhance and expand the translated prompt to be a highly detailed, descriptive, and artistic prompt. Focus on composition, lighting, mood, and specific visual elements. 3. The final output must be ONLY the enhanced English prompt, with no additional text, preambles, or explanations.",
                },
            });
            return response.text.trim();
        } catch (error) {
            console.error('Error optimizing prompt:', error);
            throw new Error('No se pudo optimizar el prompt con Gemini.');
        }
    },

    async analyzeImage(base64Image: string): Promise<string> {
        const match = base64Image.match(/^data:(image\/.+);base64,(.+)$/);
        if (!match) {
            throw new Error("Invalid base64 image string format.");
        }
        const mimeType = match[1];
        const data = match[2];

        const imagePart = {
            inlineData: { mimeType, data },
        };

        const textPart = {
            text: "Describe this image in detail. Create a prompt that an AI image generator could use to create a similar image. Be descriptive and focus on style, composition, and subject matter.",
        };

        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    systemInstruction: "You are an expert prompt engineer for an AI image generator. You analyze an image and create a detailed, descriptive, and artistic prompt that could have been used to generate it. The final output must be ONLY the enhanced English prompt, with no additional text, preambles, or explanations.",
                },
            });
            return response.text.trim();
        } catch (error) {
            console.error('Error analyzing image:', error);
            throw new Error('Failed to analyze image.');
        }
    },

    async generateImages(settings: GenerationSettings): Promise<string[]> {
        const fullPrompt = `${settings.prompt}, ${settings.style.prompt}`;
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: {
                    numberOfImages: settings.variants,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: settings.aspectRatio,
                },
            });
            return response.generatedImages.map(img => img.image.imageBytes);
        } catch (error) {
            console.error('Error generating images:', error);
            throw new Error('Failed to generate images.');
        }
    },

    async animateImage(base64Image: string, prompt: string): Promise<string> {
        const match = base64Image.match(/^data:(image\/.+);base64,(.+)$/);
        if (!match) {
            throw new Error("Invalid base64 image string format.");
        }
        const imageBytes = match[2];
        const mimeType = match[1];

        try {
            let operation: Operation<GenerateVideosResponse> = await ai.models.generateVideos({
                model: 'veo-2.0-generate-001',
                prompt: `Animate this image beautifully: ${prompt}`,
                image: {
                    imageBytes: imageBytes,
                    mimeType: mimeType,
                },
                config: {
                    numberOfVideos: 1
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new Error('Video generation completed but no download link was found.');
            }
            
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!videoResponse.ok) {
                throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
            }
            const videoBlob = await videoResponse.blob();
            return URL.createObjectURL(videoBlob);

        } catch (error) {
            console.error('Error animating image:', error);
            throw new Error('Failed to animate image.');
        }
    },
};

const mapAspectRatioToGrokSize = (aspectRatio: AspectRatio): string => {
    switch (aspectRatio) {
        case '16:9':
            return '1792x1024';
        case '9:16':
            return '1024x1792';
        case '4:3':
            return '1344x1024'
        case '3:4':
            return '1024x1344'
        case '1:1':
        default:
            return '1024x1024';
    }
};

export const grokService = {
    async generateImages(settings: GenerationSettings): Promise<string[]> {
        if (!process.env.XAI_API_KEY) {
            throw new Error('La variable de entorno XAI_API_KEY no está configurada. La generación de imágenes de Grok no funcionará.');
        }

        const fullPrompt = `${settings.prompt}, ${settings.style.prompt}`;
        
        try {
            const response = await fetch("https://api.x.ai/v1/images/generations", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: "grok-2-image",
                  prompt: fullPrompt,
                  n: settings.variants,
                  size: mapAspectRatioToGrokSize(settings.aspectRatio),
                  response_format: "b64_json"
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error generating images with Grok:', errorData);
                throw new Error(`Error de Grok: ${errorData.error?.message || response.statusText}`);
            }

            const json = await response.json();
            if (!json.data || !Array.isArray(json.data)) {
                 throw new Error('Formato de respuesta inválido de la API de Grok.');
            }
            
            return json.data.map((image: { b64_json: string }) => image.b64_json);

        } catch (error) {
            console.error('Error calling Grok API:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('No se pudieron generar las imágenes con Grok.');
        }
    },
};

export const perchanceService = {
    async generateImages(settings: GenerationSettings): Promise<string[]> {
        const fullPrompt = `${settings.prompt}, ${settings.style.prompt}`;
        // Note: This is a hypothetical Perchance API endpoint.
        // It assumes an endpoint that takes a prompt and returns base64 image data,
        // similar to the Grok API, to fit into the existing application architecture.
        // The real Perchance API might differ and may require a backend proxy for CORS.
        const PERCHANCE_API_URL = "https://api.perchance.org/v1/images/generations";

        try {
            const promises = Array.from({ length: settings.variants }).map(async () => {
                const response = await fetch(PERCHANCE_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        // Perchance APIs are often simpler and may not support all these features.
                        // We send the prompt and hope for the best.
                        response_format: "b64_json" 
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Error de Perchance: ${response.statusText}`);
                }
                const json = await response.json();
                if (!json.b64_json) {
                    throw new Error('Formato de respuesta inválido de la API de Perchance.');
                }
                return json.b64_json;
            });
            
            return await Promise.all(promises);

        } catch (error) {
            console.error('Error calling Perchance API:', error);
            throw new Error('No se pudieron generar las imágenes con Perchance.');
        }
    }
};


const GALLERY_KEY = 'escena-ai-gallery';
const CLASSIFICATION_KEY = 'escena-ai-classification';
const PROMPT_HISTORY_KEY = 'escena-ai-prompt-history';
const EXPIRY_DAYS = 90;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

const getActiveItems = <T extends { timestamp: number }>(key: string): T[] => {
    try {
        const itemsJson = localStorage.getItem(key);
        if (!itemsJson) return [];
        const items = JSON.parse(itemsJson) as T[];
        const now = Date.now();
        return items.filter(item => now - item.timestamp < EXPIRY_MS);
    } catch (error) {
        console.error('Error reading from localStorage', error);
        return [];
    }
};

export const storageService = {
    getGalleryImages: (): StoredImage[] => getActiveItems<StoredImage>(GALLERY_KEY),
    getClassificationImages: (): ClassificationImage[] => getActiveItems<ClassificationImage>(CLASSIFICATION_KEY),
    getPromptHistory: (): PromptHistoryEntry[] => getActiveItems<PromptHistoryEntry>(PROMPT_HISTORY_KEY),

    saveToGallery: (image: StoredImage) => {
        const images = storageService.getGalleryImages();
        localStorage.setItem(GALLERY_KEY, JSON.stringify([image, ...images]));
    },

    sendToClassification: (image: StoredImage) => {
        const images = storageService.getClassificationImages();
        if (images.some(img => img.id === image.id)) return; // Avoid duplicates
        const classificationImage: ClassificationImage = { ...image, votes: 0 };
        localStorage.setItem(CLASSIFICATION_KEY, JSON.stringify([classificationImage, ...images]));
    },
    
    removeFromGallery: (id: string) => {
        const images = storageService.getGalleryImages();
        const filteredImages = images.filter(img => img.id !== id);
        localStorage.setItem(GALLERY_KEY, JSON.stringify(filteredImages));
    },

    voteForImage: (id: string, vote: 1 | -1) => {
        const images = storageService.getClassificationImages();
        const updatedImages = images.map(img => img.id === id ? { ...img, votes: img.votes + vote } : img);
        localStorage.setItem(CLASSIFICATION_KEY, JSON.stringify(updatedImages));
    },

    saveToPromptHistory: (entry: { scenes: string[], negativePrompt: string, style: VisualStyle, aspectRatio: AspectRatio }) => {
        const history = storageService.getPromptHistory();
        if (entry.scenes.every(s => s.trim() === '') && entry.negativePrompt.trim() === '') {
            return;
        }
        const isDuplicate = history.some(h =>
            JSON.stringify(h.scenes) === JSON.stringify(entry.scenes) &&
            h.negativePrompt === entry.negativePrompt &&
            h.style.id === entry.style.id &&
            h.aspectRatio === entry.aspectRatio
        );
        if (isDuplicate) return;

        const newEntry: PromptHistoryEntry = {
            ...entry,
            id: `prompt_${Date.now()}`,
            timestamp: Date.now(),
        };
        const updatedHistory = [newEntry, ...history].slice(0, 50); // Limit history to 50 entries
        localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updatedHistory));
    },

    removeFromPromptHistory: (id: string) => {
        const history = storageService.getPromptHistory();
        const filteredHistory = history.filter(h => h.id !== id);
        localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(filteredHistory));
    },

    clearPromptHistory: () => {
        localStorage.removeItem(PROMPT_HISTORY_KEY);
    }
};