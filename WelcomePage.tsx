
import React, { useState, useEffect } from 'react';
import { getAppConfig } from './services/dbService';
import { Movie } from './types';
import { Crown } from 'lucide-react';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { UzumakiLogo } from './components/icons/UzumakiLogo';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void; 
  onSearch: (query: string) => void;
  onStart: () => void; // Bu Login modalni ochadi
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const config = await getAppConfig();
        if (config['site_background']) {
          setCustomBg(config['site_background']);
        }
        if (config['site_logo']) {
            setCustomLogo(config['site_logo']);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadContent();
  }, []);

  // Default fallback image
  const heroBg = customBg || 'https://i.imgur.com/sC56bsu.jpg';

  return (
    <div className="relative h-screen w-full bg-[#000000] overflow-hidden font-sans">
      
      {/* 1. FULL SCREEN BACKGROUND IMAGE (No Borders) */}
      <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Background" 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Gradient Overlay: Pastdan tepaga qorayib borishi uchun */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/95"></div>
      </div>

      {/* 2. CONTENT (BOTTOM ALIGNED) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-12 flex flex-col items-center text-center animate-slide-in-up">
          
          {/* Logo & Text - No Frames/Borders on Logo */}
          <div className="mb-8 max-w-md mx-auto">
              <div className="flex justify-center mb-6">
                  {customLogo ? (
                      <img src={customLogo} alt="Logo" className="w-24 h-24 object-contain drop-shadow-2xl" />
                  ) : (
                      <UzumakiLogo className="w-20 h-20 text-orange-500 drop-shadow-2xl" />
                  )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter uppercase drop-shadow-xl">
                  Anilo.uz
              </h1>
              <p className="text-gray-200 text-sm md:text-base font-bold leading-relaxed drop-shadow-md opacity-90">
                  Sevimli animelaringiz. Barchasi bitta joyda. <br/>
                  Cheksiz tomosha va yuqori sifat.
              </p>
          </div>

          {/* Buttons Container */}
          <div className="w-full max-w-xs space-y-4">
              
              {/* Explore Free Trial */}
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="w-full py-4 bg-[#f4b308] hover:bg-[#eab308] text-black font-extrabold text-xs uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,179,8,0.4)] clip-path-slant"
                style={{ clipPath: 'polygon(4% 0, 100% 0, 96% 100%, 0% 100%)' }}
              >
                <Crown size={18} fill="black" /> Explore Free Trial
              </button>

              {/* Log In Button */}
              <button 
                onClick={onStart} // App.tsx da bu AuthModal ni ochadi
                className="w-full py-4 bg-transparent border-2 border-white/20 text-white font-extrabold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95 backdrop-blur-sm"
              >
                Log In
              </button>
          </div>

          {/* Create Account Link */}
          <div className="mt-6">
              <button 
                onClick={onStart} 
                className="text-orange-500 text-[10px] font-black hover:text-orange-400 transition-colors uppercase tracking-[0.2em]"
              >
                Create Account
              </button>
          </div>
      </div>

      {/* Premium Modal Popup (Tariflar) */}
      {showPremiumModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => setShowPremiumModal(false)}>
              <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowPremiumModal(false)} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors">✕</button>
                  <div className="p-8">
                      <h2 className="text-2xl font-black text-white text-center mb-2 flex items-center justify-center gap-2">
                          <Crown className="text-[#f4b308] fill-[#f4b308]" /> Premium Tariflar
                      </h2>
                      <p className="text-center text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">Eng yaxshi taklifni tanlang</p>
                      <SubscriptionPlans />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
