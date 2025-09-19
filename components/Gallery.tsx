import React from 'react';
import { GalleryItem } from '../App';

interface GalleryProps {
    items: GalleryItem[];
    onRemove: (id: string) => void;
}

const GalleryItemCard: React.FC<{ item: GalleryItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
    return (
        <div className="group relative bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg overflow-hidden aspect-video">
            <img 
                src={item.mediaUrl} 
                alt={`Generated image for: ${item.originalPrompt}`} 
                className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                <p className="text-white text-sm font-semibold line-clamp-2">{item.originalPrompt}</p>
                <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 bg-red-600/80 text-white rounded-full hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                    aria-label="Remove from gallery"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};


export const Gallery: React.FC<GalleryProps> = ({ items, onRemove }) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-200">Your Gallery is Empty</h2>
                <p className="mt-2 text-gray-400">
                    Go to the generator to create and save your first AI creation!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-200">
                Your Saved Creations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                   <GalleryItemCard key={item.id} item={item} onRemove={onRemove} />
                ))}
            </div>
        </div>
    );
};
