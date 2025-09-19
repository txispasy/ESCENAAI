import React, { useEffect } from 'react';

interface LightboxProps {
  src: string;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 animate-[fade-in_0.3s_ease-out]" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full h-full flex items-center justify-center" 
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt="Vista ampliada" className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        <button 
          onClick={onClose} 
          className="absolute top-0 right-0 m-2 bg-white/10 hover:bg-white/30 text-white text-3xl leading-none w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          aria-label="Cerrar vista ampliada"
        >
          &times;
        </button>
      </div>
       <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `}</style>
    </div>
  );
};

export default Lightbox;
