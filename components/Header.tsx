import React from 'react';
import { AppView } from '../App';

interface HeaderProps {
    view: AppView;
    setView: (view: AppView) => void;
}

export const Header: React.FC<HeaderProps> = ({ view, setView }) => {
    return (
        <header className="text-center space-y-6">
             <div className="relative">
                <h1 className="font-display text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 py-2">
                    Escena.AI
                </h1>
            </div>
            <div className="flex justify-center">
                <div className="flex items-center space-x-1 bg-[#0E1116] p-1 rounded-full border border-[#222A35]">
                    <button
                        onClick={() => setView('generator')}
                        className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#0E1116] ${
                            view === 'generator' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                        aria-pressed={view === 'generator'}
                    >
                        Generador
                    </button>
                    <button
                        onClick={() => setView('gallery')}
                        className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0E1116] ${
                            view === 'gallery' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                        aria-pressed={view === 'gallery'}
                    >
                        Galería
                    </button>
                </div>
            </div>
        </header>
    );
};