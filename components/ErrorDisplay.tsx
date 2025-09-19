import React from 'react';

interface ErrorDisplayProps {
    error: Error;
    onRetry: () => void;
    onWebHandoff: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onWebHandoff }) => {
    const isQuotaError = error.name === 'QuotaExceededError';
    
    return (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg space-y-4" role="alert">
            <div>
                <strong className="font-bold">Ha ocurrido un error:</strong>
                <p className="mt-1">{error.message}</p>
            </div>

            {isQuotaError && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 text-yellow-200 p-3 rounded-md text-sm">
                    <p className="font-semibold">Límite de Cuota Alcanzado</p>
                    <p className="mt-1">
                        Has excedido tu cuota de generación por ahora. Puedes continuar de forma gratuita en el sitio web oficial de Gemini. Copiaremos el último prompt que intentaste usar por ti.
                    </p>
                    <button
                        onClick={onWebHandoff}
                        className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-900/30 focus:ring-pink-500 transition-all duration-300"
                    >
                        Continuar en Gemini Web (Gratis) &rarr;
                    </button>
                </div>
            )}

             <button
                onClick={onRetry}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900/50 focus:ring-pink-500 transition-all duration-300"
            >
                Empezar de Nuevo
            </button>
        </div>
    );
};
