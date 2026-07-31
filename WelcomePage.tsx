
import React from 'react';
import { Page } from './App';
import { Movie } from './types';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void; 
  onSearch: (query: string) => void;
  onStart: () => void; 
  onNavigate: (page: Page) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-12 group hover:scale-110 transition-transform cursor-pointer" onClick={onStart}>
          <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
          Yangi Davr<br/><span className="text-orange-600 italic">Boshlanmoqda</span>
        </h1>
        
        <p className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.6em] mb-12 max-w-lg">
          Anilo.uz platformasi to'liq yangilanmoqda. Tez kunda biz bilan bo'ling.
        </p>
        
        <button 
          onClick={onStart}
          className="px-12 py-5 bg-white text-black rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-orange-600 hover:text-white transition-all shadow-2xl active:scale-95"
        >
          Kirish
        </button>
      </div>
      
      {/* Decorative Lines */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-600/50 to-transparent"></div>
    </div>
  );
};
