import React from 'react';
import { GalleryItem } from '../App';

interface ResultDisplayProps {
    mediaUrls: (string | null)[];
    originalPrompts: string[];
    optimizedPrompts: string[];
    negativePrompt: string;
    style: string;
    aspectRatio: string;
    galleryItems: GalleryItem[];
    onSaveToGallery: (item: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
    onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ mediaUrls, originalPrompts, optimizedPrompts, negativePrompt, style, aspectRatio, galleryItems, onSaveToGallery, onReset }) => {

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleDownload = async (mediaUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = mediaUrl;
        const extension = 'jpeg';
        link.download = `ai-creation-${index + 1}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async (mediaUrl: string, prompt: string, index: number) => {
        try {
            const response = await fetch(mediaUrl);
            const blob = await response.blob();
            const extension = 'jpeg';
            const filename = `escena-ai-creation-${index + 1}.${extension}`;
            const file = new File([blob], filename, { type: blob.type });

            const shareData = {
                title: 'AI Creation from Escena.AI',
                text: `Check out what I made with Escena.AI! Prompt: "${prompt}"`,
                files: [file],
            };

            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(`Check out what I made with Escena.AI! Prompt: "${prompt}"`);
                alert('Prompt copied to clipboard! Please download the media to share it on your favorite platform.');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            alert('Sharing failed. Please download the media and share it manually.');
        }
    };

    const handleSave = (index: number) => {
        const mediaUrl = mediaUrls[index];
        if (!mediaUrl) return;

        const itemToSave: Omit<GalleryItem, 'id' | 'createdAt'> = {
          mediaUrl,
          type: 'image',
          originalPrompt: originalPrompts[index] || '',
          optimizedPrompt: optimizedPrompts[index] || '',
          negativePrompt: negativePrompt,
          style: style,
          aspectRatio: aspectRatio,
        };
        onSaveToGallery(itemToSave);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-200">
                Your AI-Enhanced Creations
            </h2>
            <div className="space-y-8">
                {mediaUrls.map((mediaUrl, index) => {
                    const isSaved = mediaUrl ? galleryItems.some(item => item.mediaUrl === mediaUrl) : false;
                    const currentPrompt = originalPrompts[index] || optimizedPrompts[index] || 'AI creation';
                    return mediaUrl && (
                        <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                            <img src={mediaUrl} alt={`Generated scene for: ${originalPrompts[index]}`} className="w-full h-auto object-cover aspect-video" />
                            <div className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Your Prompt</h3>
                                    <p className="text-gray-300 mt-1">{originalPrompts[index]}</p>
                                </div>
                                {optimizedPrompts[index] && optimizedPrompts[index] !== originalPrompts[index] && (
                                  <div>
                                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">AI-Optimized Prompt</h3>
                                      <p className="text-purple-300 italic mt-1">{optimizedPrompts[index]}</p>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                                     <button
                                        onClick={() => handleSave(index)}
                                        disabled={isSaved}
                                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                        aria-label={isSaved ? "Saved in gallery" : "Save to gallery"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                           <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                        {isSaved ? 'Saved' : 'Save to Gallery'}
                                    </button>
                                    <button
                                        onClick={() => handleShare(mediaUrl, currentPrompt, index)}
                                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-colors"
                                        aria-label="Share media"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                        </svg>
                                        Share
                                    </button>
                                     <button
                                        onClick={() => handleDownload(mediaUrl, index)}
                                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-colors"
                                        aria-label="Download media"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                     {optimizedPrompts[index] && (
                                        <button
                                            onClick={() => copyToClipboard(optimizedPrompts[index])}
                                            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-colors"
                                            aria-label="Copy optimized prompt"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy Prompt
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-700/50">
                                    {negativePrompt && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Negative Prompt</h3>
                                            <p className="text-red-400/90 mt-1">{negativePrompt}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <button
                onClick={onReset}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-all duration-300"
            >
                Create More
            </button>
        </div>
    );
};
