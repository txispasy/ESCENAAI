import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/apiService';
import type { ClassificationImage } from '../types';
import Lightbox from '../components/Lightbox';

interface ClassificationCardProps {
    image: ClassificationImage;
    onVote: (id: string, vote: 1 | -1) => void;
    onImageClick: (image: ClassificationImage) => void;
}

const ClassificationCard: React.FC<ClassificationCardProps> = ({ image, onVote, onImageClick }) => {
    return (
        <div className="bg-brand-surface p-4 rounded-lg border border-white/10 flex flex-col space-y-4">
            <div className="relative cursor-zoom-in" onClick={() => onImageClick(image)}>
                <img src={image.src} alt={image.prompt} className="w-full object-cover aspect-square rounded-md" />
            </div>
            <div>
                 <p className="text-xs text-brand-text-muted line-clamp-2 mb-2">Prompt: {image.prompt}</p>
                 <p className="text-xs text-brand-text-muted">Estilo: {image.style}</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button onClick={() => onVote(image.id, 1)} className="bg-white/10 p-2 rounded-full hover:bg-green-500/50" title="Votar a favor">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11v 4a1 1 0 0 0 1 1h3"/><path d="M11 15v-4a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1z"/><path d="m7 11-3-3 3-3"/><path d="m17 13 3 3-3 3"/></svg>
                    </button>
                     <button onClick={() => onVote(image.id, -1)} className="bg-white/10 p-2 rounded-full hover:bg-red-500/50" title="Votar en contra">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13 4 10l3-3"/><path d="M17 11v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1zM4 10h7a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h0z"/></svg>
                    </button>
                </div>
                <span className="text-lg font-bold text-white">{image.votes}</span>
            </div>
        </div>
    );
};

const Classification: React.FC = () => {
    const [images, setImages] = useState<ClassificationImage[]>([]);
    const [lightboxImageSrc, setLightboxImageSrc] = useState<string | null>(null);

    const loadImages = useCallback(() => {
        const sortedImages = storageService.getClassificationImages().sort((a, b) => b.votes - a.votes);
        setImages(sortedImages);
    }, []);

    useEffect(() => {
        loadImages();
    }, [loadImages]);

    const handleVote = (id: string, vote: 1 | -1) => {
        storageService.voteForImage(id, vote);
        loadImages();
    };
    
    const handleImageClick = (image: ClassificationImage) => {
        setLightboxImageSrc(image.src);
    };

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-muted">
                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15-4 4v-5"/><path d="m19 9-4-4v5"/><path d="M14.5 18.5 22 11"/><path d="M2 12h10"/><path d="M9.5 4.5 2 12"/></svg>
                <h2 className="mt-4 text-xl font-semibold text-white">No hay imágenes para clasificar</h2>
                <p className="mt-2">Envía imágenes desde tu galería para que la comunidad vote.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map(image => (
                    <ClassificationCard 
                        key={image.id} 
                        image={image} 
                        onVote={handleVote}
                        onImageClick={handleImageClick}
                    />
                ))}
            </div>
            {lightboxImageSrc && <Lightbox src={lightboxImageSrc} onClose={() => setLightboxImageSrc(null)} />}
        </>
    );
};

export default Classification;