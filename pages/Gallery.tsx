import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/apiService';
import { AnimateIcon } from '../constants';
import type { StoredImage } from '../types';
import AnimationModal from '../components/AnimationModal';
import Lightbox from '../components/Lightbox';

interface ImageCardProps {
    image: StoredImage;
    onDelete: (id: string) => void;
    onSendToClassification: (image: StoredImage) => void;
    onAnimate: (image: StoredImage) => void;
    onImageClick: (image: StoredImage) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete, onSendToClassification, onAnimate, onImageClick }) => {
    return (
        <div className="group relative rounded-lg overflow-hidden border border-white/10 cursor-zoom-in" onClick={() => onImageClick(image)}>
            <img src={image.src} alt={image.prompt} className="w-full h-full object-cover aspect-square" />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                <div>
                    <p className="text-xs text-brand-text-muted mb-1">{image.style} Style</p>
                    <p className="text-xs text-white line-clamp-3">{image.prompt}</p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); onSendToClassification(image); }} className="bg-white/20 p-2 rounded-full hover:bg-brand-primary" title="Enviar a Clasificación">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(image.id); }} className="bg-white/20 p-2 rounded-full hover:bg-red-500" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onAnimate(image); }} className="bg-white/20 p-2 rounded-full hover:bg-brand-accent" title="Animar">
                             <AnimateIcon className="w-4 h-4" />
                        </button>
                        <a href={image.src} download={`escena-ai-${image.id}.jpg`} onClick={(e) => e.stopPropagation()} className="bg-white/20 p-2 rounded-full hover:bg-blue-500" title="Descargar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        </a>
                    </div>
                     {image.engine && <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded">{image.engine}</span>}
                </div>
            </div>
        </div>
    );
};


const Gallery: React.FC = () => {
    const [images, setImages] = useState<StoredImage[]>([]);
    const [isAnimationModalOpen, setIsAnimationModalOpen] = useState(false);
    const [imageToAnimate, setImageToAnimate] = useState<StoredImage | null>(null);
    const [lightboxImageSrc, setLightboxImageSrc] = useState<string | null>(null);

    const loadImages = useCallback(() => {
        setImages(storageService.getGalleryImages());
    }, []);

    useEffect(() => {
        loadImages();
    }, [loadImages]);

    const handleDelete = (id: string) => {
        storageService.removeFromGallery(id);
        loadImages();
    };

    const handleSendToClassification = (image: StoredImage) => {
        storageService.sendToClassification(image);
        // Consider adding a toast notification for user feedback
    };
    
    const handleAnimateClick = (image: StoredImage) => {
        setImageToAnimate(image);
        setIsAnimationModalOpen(true);
    };

    const handleImageClick = (image: StoredImage) => {
        setLightboxImageSrc(image.src);
    };

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9"x2="9" y1="21" y2="9"/></svg>
                <h2 className="mt-4 text-xl font-semibold text-white">Tu galería está vacía</h2>
                <p className="mt-2">Las imágenes que generes se guardarán automáticamente aquí.</p>
            </div>
        );
    }
    
    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {images.map(image => (
                    <ImageCard 
                        key={image.id} 
                        image={image} 
                        onDelete={handleDelete}
                        onSendToClassification={handleSendToClassification}
                        onAnimate={handleAnimateClick}
                        onImageClick={handleImageClick}
                    />
                ))}
            </div>
            {lightboxImageSrc && <Lightbox src={lightboxImageSrc} onClose={() => setLightboxImageSrc(null)} />}
            <AnimationModal 
                isOpen={isAnimationModalOpen} 
                onClose={() => setIsAnimationModalOpen(false)} 
                image={imageToAnimate} 
            />
        </>
    );
};

export default Gallery;