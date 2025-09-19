import React from 'react';

interface WebHandoffDisplayProps {
    onClose: () => void;
}

export const WebHandoffDisplay: React.FC<WebHandoffDisplayProps> = ({ onClose }) => {
    return (
        <div className="space-y-8 animate-fade-in text-center">
            <div className="flex justify-center">
                <div className="p-4 bg-green-500/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-200">
                    ¡Listo para Generar!
                </h2>
                <p className="mt-2 text-gray-400 max-w-xl mx-auto">
                    Hemos copiado tu prompt y abierto Gemini en una nueva pestaña. Simplemente pégalo (<kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl+V</kbd> o <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Cmd+V</kbd>) para crear tu imagen.
                </p>
            </div>
            
            <div className="flex justify-center">
                 <button
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0E1116] focus:ring-pink-500 transition-all"
                >
                    Crear Otro
                </button>
            </div>
        </div>
    );
};
