
import React, { useState, useEffect } from 'react';
import { getAppConfig } from './services/dbService';
import { Movie } from './types';
import { Crown, X, ArrowLeft } from 'lucide-react';
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

  // Handle plan selection in guest mode: Close premium modal, Open login modal
  const handlePlanSelection = (plan: string) => {
      setShowPremiumModal(false);
      onStart(); // Triggers AuthModal in App.tsx
  };

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
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/95"></div>
      </div>

      {/* 2. CONTENT (BOTTOM ALIGNED) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-12 flex flex-col items-center text-center animate-slide-in-up">
          
          {/* LOGO & TITLE BLOCK */}
          <div className="mb-10 flex flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-black border-2 border-orange-500 overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center shrink-0">
                  {customLogo ? (
                      <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                      <UzumakiLogo className="w-full h-full p-1 text-orange-500 drop-shadow-md" />
                  )}
              </div>
              
              <div className="text-left">
                  <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-xl" style={{ fontFamily: 'Impact, sans-serif' }}>
                      ANILO<span className="text-orange-500">.UZ</span>
                  </h1>
                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.3em] mt-1 opacity-90">
                      Anime Olami
                  </p>
              </div>
          </div>

          <p className="text-gray-200 text-xs md:text-sm font-bold leading-relaxed drop-shadow-md opacity-80 max-w-sm mb-8">
              Sevimli animelaringiz. Barchasi bitta joyda. Cheksiz tomosha va yuqori sifat.
          </p>

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
                onClick={onStart} 
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

      {/* Premium Modal Popup (Resonsive) */}
      {showPremiumModal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
              <div 
                className="bg-[#0f0f0f] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-5xl h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col" 
                onClick={e => e.stopPropagation()}
              >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-20">
                      <button onClick={() => setShowPremiumModal(false)} className="text-zinc-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors">
                          <ArrowLeft size={18} /> Orqaga
                      </button>
                      <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                          <Crown className="text-[#f4b308] fill-[#f4b308]" size={20} /> Premium
                      </h2>
                      <button onClick={() => setShowPremiumModal(false)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                          <X size={18} />
                      </button>
                  </div>

                  {/* Modal Content - Scrollable */}
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 pb-24 sm:pb-6">
                      <div className="text-center mb-8">
                          <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Eng yaxshi rejalarni tanlang</h3>
                          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Cheklovsiz kirish va yuqori sifat</p>
                      </div>
                      
                      {/* Pass onPlanSelect to handle guest redirect */}
                      <SubscriptionPlans onPlanSelect={handlePlanSelection} />
                      
                      <div className="mt-8 text-center sm:hidden">
                          <button onClick={() => { setShowPremiumModal(false); onStart(); }} className="text-zinc-500 text-xs underline">
                              Hisobingiz bormi? Kirish
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
