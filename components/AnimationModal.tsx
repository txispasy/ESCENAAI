import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/apiService';
import type { StoredImage } from '../types';

interface AnimationModalProps {
  image: StoredImage | null;
  isOpen: boolean;
  onClose: () => void;
}

const progressMessages = [
    'Analizando los fotogramas clave de la imagen...',
    'Construyendo la secuencia de movimiento inicial...',
    'Aplicando efectos visuales y de partículas...',
    'Renderizando el video en alta definición...',
    'Casi listo, puliendo los últimos detalles...'
];

const AnimationModal: React.FC<AnimationModalProps> = ({ image, isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'animating' | 'success' | 'error'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('Iniciando el proceso de animación...');

  useEffect(() => {
    if (isOpen && image && status === 'idle') {
      const animate = async () => {
        setStatus('animating');
        setError(null);
        setVideoUrl(null);

        try {
          const url = await geminiService.animateImage(image.src, image.prompt);
          setVideoUrl(url);
          setStatus('success');
        } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al generar el video.');
          setStatus('error');
        }
      };
      animate();
    }
  }, [isOpen, image, status]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (status === 'animating') {
      let messageIndex = 0;
      setProgressMessage(progressMessages[messageIndex]);
      intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % progressMessages.length;
        setProgressMessage(progressMessages[messageIndex]);
      }, 7000); // Change message every 7 seconds
    }
    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup video URL to prevent memory leaks
      if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
      }
      // Delay state reset for closing animation
      setTimeout(() => {
        setStatus('idle');
        setVideoUrl(null);
        setError(null);
        setProgressMessage('Iniciando el proceso de animación...');
      }, 300);
    }
  }, [isOpen, videoUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-[fade-in_0.3s_ease-out]" onClick={onClose}>
      <div className="bg-brand-surface rounded-xl border border-white/10 shadow-lg w-full max-w-lg p-6 relative animate-[slide-up_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-brand-text-muted hover:text-white text-2xl leading-none">&times;</button>
        <h2 className="text-xl font-bold text-white mb-4">Animando tu Creación</h2>
        
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
          {status === 'success' && videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
          ) : (
             image && <img src={image.src} alt="Preview de la imagen a animar" className={`w-full h-full object-contain transition-opacity duration-500 ${status === 'animating' ? 'opacity-20' : 'opacity-100'}`} />
          )}

          {status === 'animating' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
              <p className="text-white font-semibold">{progressMessage}</p>
              <p className="text-sm text-brand-text-muted mt-2">Este proceso puede tardar varios minutos. ¡Gracias por tu paciencia!</p>
            </div>
          )}
        </div>

        {status === 'error' && (
            <div className="mt-4 text-center bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-md">
                <p className="font-semibold">Error en la Animación</p>
                <p className="text-sm">{error}</p>
            </div>
        )}

        {status === 'success' && videoUrl ? (
            <a 
              href={videoUrl}
              download={`escena-ai-animation-${image?.id || 'video'}.mp4`}
              className="mt-6 w-full bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-opacity"
            >
              Descargar Video (MP4)
            </a>
        ) : (
             <button
              onClick={onClose}
              className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              {status === 'error' ? 'Cerrar' : 'Cancelar'}
            </button>
        )}

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

export default AnimationModal;