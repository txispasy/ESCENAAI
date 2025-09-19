import React, { useState } from 'react';
import type { PromptHistoryEntry } from '../types';

interface PromptHistoryProps {
  history: PromptHistoryEntry[];
  onUse: (entry: PromptHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
);


const PromptHistory: React.FC<PromptHistoryProps> = ({ history, onUse, onDelete, onClear }) => {
    const [isOpen, setIsOpen] = useState(false);

    const formatPrompt = (entry: PromptHistoryEntry) => {
        const main = entry.scenes.filter(s => s.trim()).join('. ');
        if (entry.negativePrompt.trim()) {
            return `${main} [Neg: ${entry.negativePrompt.trim()}]`;
        }
        return main;
    };

    if (history.length === 0) {
        return null;
    }

    return (
        <div className="bg-brand-surface rounded-lg border border-white/10">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left"
                aria-expanded={isOpen}
            >
                <div className="flex items-center space-x-3">
                    <HistoryIcon className="w-5 h-5 text-brand-text-muted" />
                    <h3 className="font-semibold text-white">Historial de Prompts</h3>
                </div>
                <svg className={`w-5 h-5 text-brand-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 pt-0">
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                         {history.map(entry => (
                            <div key={entry.id} className="bg-brand-bg p-2 rounded-md flex items-center justify-between group">
                                <div className="flex-1 pr-2 overflow-hidden">
                                    <p className="text-sm text-white truncate" title={formatPrompt(entry)}>{formatPrompt(entry)}</p>
                                    <div className="flex items-center space-x-2 text-xs text-brand-text-muted mt-1">
                                        <span>{entry.style.name}</span>
                                        <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{entry.aspectRatio}</span>
                                    </div>
                                </div>
                                <div className="flex items-center flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onUse(entry)} className="p-1.5 rounded text-white bg-white/10 hover:bg-brand-primary" title="Usar Prompt">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                                    </button>
                                     <button onClick={() => onDelete(entry.id)} className="p-1.5 rounded text-white bg-white/10 hover:bg-red-500" title="Eliminar Prompt">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={onClear} className="w-full text-center text-xs text-red-400 hover:underline mt-4 disabled:opacity-50" disabled={history.length === 0}>
                        Limpiar Historial
                    </button>
                </div>
            )}
        </div>
    );
};

export default PromptHistory;
