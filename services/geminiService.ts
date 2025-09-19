import { GoogleGenAI } from "@google/genai";

// This function creates a client instance using the environment variable.
const getAiClient = () => {
    // The API key is obtained exclusively from the environment variable `process.env.API_KEY`.
    // This is a hard requirement from the instructions, and it is assumed to be configured.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Custom error class for quota issues to enable specific catch logic
export class QuotaExceededError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaExceededError";
    }
}

export const styleDescriptions: { [key: string]: string } = {
    'Pixar': 'in a vibrant 3D Pixar animated style, cinematic lighting',
    'Disney 3D': 'in a vibrant 3D Disney animated style, cinematic lighting, expressive characters',
    'Realistic': 'photorealistic, 8k, cinematic lighting, highly detailed',
    'Fantasy': 'in a fantasy art style, epic, magical, detailed, cinematic lighting',
    'Creepy': 'creepy, horror, unsettling, dark, cinematic lighting',
    'Comic': 'in a vibrant American comic book art style, bold lines, dynamic shading, cinematic lighting',
    'Anime': 'in a vibrant Japanese anime style, cinematic lighting, detailed characters',
    'Biblical': 'in a biblical epic art style, majestic, cinematic lighting',
    'Cinematic': 'cinematic, dramatic lighting, epic scope, 8k, wide angle lens'
};

/**
 * Parses API errors and returns a user-friendly error object.
 * @param error The error caught from an API call.
 * @param context A string describing the context of the error (e.g., "Image Generation").
 * @returns A standard Error object with a user-friendly message.
 */
const handleApiError = (error: unknown, context: string): Error => {
    console.error(`Error in ${context}:`, error);

    // Check for the specific JSON structure from Gemini API errors
    if (typeof error === 'object' && error !== null) {
        const errorPayload = (error as any).error;
        if (typeof errorPayload === 'object' && errorPayload !== null) {
            const status = errorPayload.status;
            const message = errorPayload.message || `An unknown API error occurred in ${context}.`;

            if (status === 'RESOURCE_EXHAUSTED' || errorPayload.code === 429) {
                // Pass the detailed message from the API directly to the user.
                return new QuotaExceededError(message);
            }
             // Gemini API often sends user-friendly messages for invalid keys or billing issues.
            if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('billing')) {
                return new Error(message);
            }
        }
    }

    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();
        // Keywords for messages that are already user-friendly and should be passed through directly.
        const passthroughKeywords = ['quota', 'safety', 'violate', 'api key', 'billing'];

        if (passthroughKeywords.some(keyword => lowerCaseMessage.includes(keyword))) {
            return error; // Return the original error as it's already user-friendly
        }

        return new Error(`${context} failed: ${error.message}`);
    }

    return new Error(`${context} failed due to an unknown error.`);
};

/**
 * Rates the quality of a prompt on a scale of 0-100.
 * @param prompt The text prompt to be rated.
 * @returns A promise that resolves to a numerical score (0-100).
 */
export const ratePrompt = async (prompt: string): Promise<number> => {
    try {
        const ai = getAiClient();
        const systemInstruction = `You are a prompt quality evaluator for a text-to-image AI.
- Your task is to rate the following prompt on a scale of 0 to 100.
- A score of 0 is a terrible, vague prompt (e.g., "a dog").
- A score of 100 is a perfect, highly-detailed, and creative prompt (e.g., "a photo of a golden retriever puppy playing in a field of wildflowers during a golden hour sunset, cinematic lighting, high detail").
- Base your score on its detail, clarity, and potential to generate a high-quality, visually interesting image.
- Respond ONLY with the numerical score as an integer. Do not include any other text, symbols, or explanations.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            // FIX: Completed the ratePrompt function which was cut off. This resolves the TypeScript error about a missing return value.
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1,
            },
        });

        const scoreText = response.text.trim();
        const score = parseInt(scoreText, 10);

        if (isNaN(score) || score < 0 || score > 100) {
            console.error(`Failed to parse score from response: "${scoreText}"`);
            return 50; // Return a neutral score on failure
        }
        return score;
    } catch (error) {
        throw handleApiError(error, 'Prompt Rating');
    }
};

// FIX: Added and exported the missing optimizePrompt function, which was causing an import error in App.tsx.
/**
 * Optimizes a user's prompt to be more descriptive for image generation.
 * @param originalPrompt The user-provided prompt.
 * @returns A promise that resolves to an AI-enhanced prompt string.
 */
export const optimizePrompt = async (originalPrompt: string): Promise<string> => {
    if (!originalPrompt.trim()) {
        return '';
    }
    try {
        const ai = getAiClient();
        const systemInstruction = `You are an expert prompt engineer for a text-to-image AI. 
- Your task is to take a user's prompt and rewrite it to be more descriptive, vivid, and effective for generating a high-quality, visually stunning image.
- Add specific details about the subject, setting, lighting, camera angles, and overall mood.
- Do NOT add negative prompts. Do not use phrases like "negative prompt:".
- Keep the core concept of the original prompt.
- The optimized prompt should be a single, continuous string of text.
- Respond ONLY with the optimized prompt text. Do not include any other explanations, greetings, or markdown formatting.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Original prompt: "${originalPrompt}"`,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
            },
        });

        // Clean up the response to ensure it's just the prompt
        let optimized = response.text.trim();
        // Remove potential markdown like ``` or surrounding quotes
        optimized = optimized.replace(/^"|"$|`/g, '').trim();

        return optimized;
    } catch (error) {
        throw handleApiError(error, 'Prompt Optimization');
    }
};

// FIX: Added and exported the missing generateImage function, which was causing an import error in App.tsx.
/**
 * Generates an image based on a prompt and other parameters.
 * @param prompt The text prompt for the image.
 * @param style The visual style of the image.
 * @param aspectRatio The desired aspect ratio.
 * @param negativePrompt A string of concepts to exclude from the image.
 * @returns A promise that resolves to the base64-encoded image string.
 */
export const generateImage = async (
    prompt: string,
    style: string,
    aspectRatio: string,
    negativePrompt: string
): Promise<string> => {
    try {
        const ai = getAiClient();
        const styleDescription = styleDescriptions[style] || '';
        
        // Combine prompt elements. The API doesn't have a separate negative_prompt field,
        // so we include it in the main prompt text as a common convention.
        const fullPrompt = `${prompt}, ${styleDescription}${negativePrompt ? `. Negative prompt: ${negativePrompt}` : ''}`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                // Cast to the type expected by the SDK
                aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
            },
        });
        
        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Image generation failed: No images returned from API.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return base64ImageBytes;
        
    } catch (error) {
        throw handleApiError(error, 'Image Generation');
    }
};
