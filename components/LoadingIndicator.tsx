import React from 'react';

interface LoadingIndicatorProps {
    message: string;
    generatedMedia: (string | null)[];
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message, generatedMedia }) => {
    return (
        <div className="text-center p-6 bg-gray-700/50 rounded-lg flex flex-col items-center justify-center space-y-4">
            {generatedMedia.length > 0 && (
                <div className="mb-4 w-full">
                    <p className="text-sm font-medium text-gray-300 mb-2">Generated Scenes:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {generatedMedia.map((image, index) => (
                            image ? <img key={index} src={image} alt={`Generated scene ${index + 1}`} className="rounded-md shadow-md border-2 border-pink-500/50 aspect-video object-cover" /> : null
                        ))}
                    </div>
                </div>
            )}
            <div className="flex items-center text-lg text-gray-200">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="transition-opacity duration-500">{message}</span>
            </div>
        </div>
    );
};
