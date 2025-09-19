export enum GenerationEngine {
  GEMINI = 'Gemini',
  GROK = 'Grok',
  PERCHANCE = 'Perchance',
}

export interface StoredImage {
  id: string;
  src: string; // base64 string
  prompt: string;
  style: string;
  timestamp: number;
  engine?: GenerationEngine;
}

export interface ClassificationImage extends StoredImage {
  votes: number;
}

export type VisualStyle = {
  id: string;
  name: string;
  prompt: string;
};

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export enum GenerationMode {
  SIMPLE = 'Simple',
  PRO = 'Pro',
}

export interface Scene {
  id:string;
  value: string;
}

export interface GenerationSettings {
    prompt: string;
    style: VisualStyle;
    aspectRatio: AspectRatio;
    variants: number;
}

export interface PromptHistoryEntry {
  id: string;
  scenes: string[];
  negativePrompt: string;
  style: VisualStyle;
  aspectRatio: AspectRatio;
  timestamp: number;
}