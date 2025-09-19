import React from 'react';
import type { VisualStyle } from './types';

export const VISUAL_STYLES: VisualStyle[] = [
    { id: 'pixar', name: 'Pixar', prompt: 'in the iconic style of a Disney Pixar animation. Features vibrant colors, soft lighting, and detailed, expressive character design.' },
    { id: 'ultra_realistic', name: 'Ultra-Realistic', prompt: 'award-winning ultra-realistic photography, photorealistic, 8k, hyperdetailed, insane detail, intricate details, octane render, unreal engine 5, masterpiece.' },
    { id: 'fantasy', name: 'Fantasy', prompt: 'fantasy art, intricate, elegant, highly detailed, digital painting, artstation, concept art, smooth, sharp focus, illustration.' },
    { id: 'creepy', name: 'Creepy', prompt: 'creepy, horror, dark, unsettling, eerie, atmospheric, moody lighting, macabre.' },
    { id: 'comic', name: 'Comic', prompt: 'comic book style, graphic novel art, bold lines, vibrant colors, halftone dots, pop art.' },
    { id: 'anime', name: 'Anime', prompt: 'anime style, vibrant, detailed, beautiful lighting, by Makoto Shinkai.' },
    { id: '3d_disney', name: '3D Disney', prompt: '3D Disney style, charming, whimsical, detailed character design, vibrant colors, magical atmosphere.' },
    { id: 'cinematic', name: 'Cinematic', prompt: 'cinematic shot, epic composition, dramatic lighting, high detail, film grain.' },
];

export const GeneratorIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 2a10 10 0 0 0-10 10" />
        <path d="M12 12a5 5 0 1 0 5-5" />
        <path d="M12 12a5 5 0 0 0-5 5" />
        <path d="m2 12 5 5" />
        <path d="m17 7 5 5" />
    </svg>
);

export const GalleryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <line x1="3" x2="21" y1="9" y2="9"/>
        <line x1="9" x2="9" y1="21" y2="9"/>
    </svg>
);

export const ClassificationIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m7 15-4 4v-5" />
        <path d="m19 9-4-4v5" />
        <path d="M14.5 18.5 22 11"/>
        <path d="M2 12h10"/>
        <path d="M9.5 4.5 2 12"/>
    </svg>
);

export const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
);

export const AnalyzeIcon = (props: React.SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L11.28 9.72a1.21 1.21 0 0 0 0 1.72l8.64 8.64a1.21 1.21 0 0 0 1.72 0l1.28-1.28a1.21 1.21 0 0 0 0-1.72z" />
        <path d="m14 7 3 3" />
        <path d="M5 6v4" />
        <path d="M3 8h4" />
        <path d="M6 17v4" />
        <path d="M4 19h4" />
    </svg>
);

export const AnimateIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M8 5v14l11-7z" />
    </svg>
);

export const NAV_ITEMS = [
    { name: 'Generador', path: '/', icon: GeneratorIcon, description: 'La página principal donde das vida a tus ideas más creativas.' },
    { name: 'Galería', path: '/gallery', icon: GalleryIcon, description: 'Tu espacio personal. Las imágenes favoritas se conservan durante 90 días.' },
    { name: 'Clasificación', path: '/classification', icon: ClassificationIcon, description: 'Galería pública donde votas por las mejores creaciones de la comunidad.' },
];