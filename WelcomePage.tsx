
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

  useEffect(() => {
    const loadContent = async () => {
      try {
        const config = await getAppConfig();
        // Admin paneldan "site_background" ni olish
        if (config['site_background']) {
          setCustomBg(config['site_background']);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadContent();
  }, []);

  // Default fallback image (Agar bazada rasm bo'lmasa)
  const heroBg = customBg || 'https://i.imgur.com/sC56bsu.jpg';

  return (
    <div className="relative h-screen w-full bg-[#000000] overflow-hidden font-sans">
      
      {/* 1. FULL SCREEN BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Background" 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Gradient Overlay: Pastdan tepaga qorayib borishi uchun */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/95"></div>
      </div>

      {/* 2. CONTENT (BOTTOM CENTERED) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-16 md:pb-24 flex flex-col items-center text-center animate-slide-in-up">
          
          {/* Logo & Text */}
          <div className="mb-10 max-w-md mx-auto">
              <div className="flex justify-center mb-6">
                  <UzumakiLogo className="w-20 h-20 text-orange-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tighter uppercase drop-shadow-xl">
                  Anilo.uz
              </h1>
              <p className="text-gray-200 text-base md:text-lg font-medium leading-relaxed drop-shadow-md">
                  Sevimli animelaringiz. Barchasi bitta joyda. <br/>
                  Cheksiz tomosha va yuqori sifat.
              </p>
          </div>

          {/* Buttons Container */}
          <div className="w-full max-w-sm space-y-4">
              
              {/* Explore Free Trial (Premium Modal) */}
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="w-full py-4 bg-[#f4b308] hover:bg-[#eab308] text-black font-extrabold text-sm uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/20 clip-path-slant"
                style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}
              >
                <Crown size={20} fill="black" /> Explore Free Trial
              </button>

              {/* Log In Button */}
              <button 
                onClick={onStart} // App.tsx da bu AuthModal ni ochadi
                className="w-full py-4 bg-black/60 backdrop-blur-md border border-white/30 text-white font-extrabold text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95"
              >
                Log In
              </button>
          </div>

          {/* Create Account Link */}
          <div className="mt-8">
              <button 
                onClick={onStart} 
                className="text-orange-500 text-xs font-bold hover:text-orange-400 transition-colors uppercase tracking-[0.2em]"
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
