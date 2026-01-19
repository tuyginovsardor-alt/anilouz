
import React, { useState, useEffect } from 'react';
import { getAppConfig } from './services/dbService';
import { Movie } from './types';
import { Crown } from 'lucide-react';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { UzumakiLogo } from './components/icons/UzumakiLogo';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void; // Kechiktirilgan (hozircha ishlatilmaydi, lekin prop qolishi kerak)
  onSearch: (query: string) => void;
  onStart: () => void; // Bu Login modalni ochish uchun ishlatiladi (App.tsx da bog'lanadi)
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

  // Default fallback image agar admin panelda rasm bo'lmasa
  const heroBg = customBg || 'https://i.imgur.com/sC56bsu.jpg';

  const handleExplorePremium = () => {
      setShowPremiumModal(true);
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans">
      
      {/* 1. FULL SCREEN BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay: Pastdan qorayib kelishi uchun */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90"></div>
      </div>

      {/* 2. CONTENT (BOTTOM) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-12 flex flex-col items-center text-center animate-slide-in-up">
          
          {/* Logo & Text */}
          <div className="mb-8">
              <div className="flex justify-center mb-4">
                  <UzumakiLogo className="w-16 h-16 text-orange-500" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2 tracking-wide">Anilo.uz</h1>
              <p className="text-gray-300 text-sm font-medium">
                  Sevimli animelaringiz. Barchasi bitta joyda.
              </p>
          </div>

          {/* Buttons */}
          <div className="w-full max-w-sm space-y-3">
              {/* Explore Free Trial (Premium) */}
              <button 
                onClick={handleExplorePremium}
                className="w-full py-3.5 bg-[#f4b308] hover:bg-[#eab308] text-black font-bold text-sm uppercase tracking-wider rounded-none clip-path-slant transition-transform active:scale-95 flex items-center justify-center gap-2"
                style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }} // Qiya burchakli stil (Crunchyroll style)
              >
                <Crown size={18} fill="black" /> Explore Free Trial
              </button>

              {/* Log In Button */}
              <button 
                onClick={onStart} // App.tsx da bu AuthModal ni ochadi
                className="w-full py-3.5 bg-transparent border-2 border-white text-white font-bold text-sm uppercase tracking-wider hover:bg-white hover:text-black transition-all active:scale-95"
              >
                Log In
              </button>
          </div>

          {/* Create Account Link */}
          <button 
            onClick={onStart} 
            className="mt-6 text-orange-500 text-sm font-bold hover:text-orange-400 transition-colors uppercase tracking-widest"
          >
            Create Account
          </button>
      </div>

      {/* Premium Modal Popup */}
      {showPremiumModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => setShowPremiumModal(false)}>
              <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowPremiumModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
                  <div className="p-6">
                      <h2 className="text-2xl font-black text-white text-center mb-6 flex items-center justify-center gap-2">
                          <Crown className="text-[#f4b308]" /> Premium
                      </h2>
                      <SubscriptionPlans />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
