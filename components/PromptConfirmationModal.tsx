import React from 'react';

interface PromptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOptimizing: boolean;
  originalPrompt: string;
  optimizedPrompt: string | null;
  onConfirm: (prompt: string) => void;
  optimizationError: string | null;
}

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const PromptConfirmationModal: React.FC<PromptConfirmationModalProps> = ({
  isOpen,
  onClose,
  isOptimizing,
  originalPrompt,
  optimizedPrompt,
  onConfirm,
  optimizationError,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-[fade-in_0.3s_ease-out]" onClick={onClose}>
      <div className="bg-brand-surface rounded-xl border border-white/10 shadow-lg w-full max-w-2xl p-6 relative animate-[slide-up_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-brand-text-muted hover:text-white text-2xl leading-none">&times;</button>
        <h2 className="text-xl font-bold text-white mb-4">Confirmar Prompt</h2>
        <p className="text-sm text-brand-text-muted mb-6">Elige si quieres usar tu prompt original o la versión optimizada por la IA para generar tu imagen.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Original Prompt */}
            <div>
                <h3 className="font-semibold mb-2 text-white">Tu Prompt Original</h3>
                <div className="bg-brand-bg border border-white/10 rounded-lg p-3 text-sm h-40 overflow-y-auto">
                    {originalPrompt}
                </div>
            </div>

            {/* Optimized Prompt */}
            <div>
                <h3 className="font-semibold mb-2 text-white">Prompt Optimizado (Inglés)</h3>
                <div className="bg-brand-bg border border-white/10 rounded-lg p-3 text-sm h-40 overflow-y-auto flex items-center justify-center text-center">
                    {isOptimizing ? (
                        <div className="flex flex-col items-center">
                           <Spinner />
                           <p className="mt-2 text-xs text-brand-text-muted">Optimizando...</p>
                        </div>
                    ) : optimizationError ? (
                        <p className="text-red-400 text-xs">{optimizationError}</p>
                    ) : (
                        <p>{optimizedPrompt}</p>
                    )}
                </div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row-reverse gap-3">
             <button
                onClick={() => onConfirm(optimizedPrompt || '')}
                disabled={isOptimizing || !!optimizationError || !optimizedPrompt}
                className="w-full sm:w-auto bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-opacity"
            >
                Usar Optimizado
            </button>
            <button
                onClick={() => onConfirm(originalPrompt)}
                disabled={isOptimizing}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Usar Original
            </button>
        </div>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slide-up {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `}</style>
      </div>
    </div>
  );
};

export default PromptConfirmationModal;
