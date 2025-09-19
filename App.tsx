import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Generator from './pages/Generator';
import Gallery from './pages/Gallery';
import Classification from './pages/Classification';
import { NAV_ITEMS } from './constants';

const Header = () => {
    const location = useLocation();
    const currentNav = NAV_ITEMS.find(item => item.path === location.pathname);
    return (
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{currentNav?.name || 'Escena.AI'}</h1>
            <p className="text-brand-text-muted mt-2">{currentNav?.description || 'Tu estudio creativo para convertir ideas en imágenes espectaculares.'}</p>
        </div>
    );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex h-screen bg-brand-bg text-brand-text font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            <Header />
            <Routes>
                <Route path="/" element={<Generator />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/classification" element={<Classification />} />
            </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  );
};

export default App;