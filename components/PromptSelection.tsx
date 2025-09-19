import React from 'react';

interface PromptSelectionProps {
    originalPrompt: string;
    optimizedPrompt: string;
    scores: { original: number; optimized: number };
    onSelect: (chosenPrompt: string) => void;
    onCancel: () => void;
}

const ScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
    const getScoreColor = () => {
        if (score >= 75) return 'text-green-400 border-green-400';
        if (score >= 40) return 'text-yellow-400 border-yellow-400';
        return 'text-red-400 border-red-400';
    };

    return (
        <div className={`w-14 h-14 flex-shrink-0 rounded-full border-2 ${getScoreColor()} flex items-center justify-center`}>
            <span className="font-bold text-lg">{score}</span>
        </div>
    );
};


interface PromptCardProps {
    title: string;
    prompt: string;
    score: number;
    onSelect: () => void;
    isOptimized?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({ title, prompt, score, onSelect, isOptimized = false }) => {
    const buttonClasses = isOptimized
        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        : "bg-gray-600 hover:bg-gray-700";

    const titleClasses = isOptimized ? "text-purple-300" : "text-gray-300";

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col h-full">
             <div className="flex items-start justify-between gap-4">
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${titleClasses}`}>{title}</h3>
                <ScoreIndicator score={score} />
            </div>
            <p className="mt-3 text-gray-300 flex-grow text-base">{prompt}</p>
            <button
                onClick={onSelect}
                className={`mt-6 w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-all duration-300 ${buttonClasses}`}
            >
                Usar este Prompt
            </button>
        </div>
    );
};

export const PromptSelection: React.FC<PromptSelectionProps> = ({ originalPrompt, optimizedPrompt, scores, onSelect, onCancel }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-200">
                    Elige tu Prompt
                </h2>
                <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
                    La IA ha optimizado tu prompt para añadir más detalle. Las puntuaciones reflejan la calidad del prompt. Elige qué versión te gustaría usar.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <PromptCard
                    title="Tu Prompt"
                    prompt={originalPrompt}
                    score={scores.original}
                    onSelect={() => onSelect(originalPrompt)}
                />
                <PromptCard
                    title="Prompt Optimizado por IA"
                    prompt={optimizedPrompt}
                    score={scores.optimized}
                    onSelect={() => onSelect(optimizedPrompt)}
                    isOptimized={true}
                />
            </div>
            <div className="text-center">
                 <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-white text-sm font-semibold transition-colors"
                >
                    Empezar de Nuevo
                </button>
            </div>
        </div>
    );
};
