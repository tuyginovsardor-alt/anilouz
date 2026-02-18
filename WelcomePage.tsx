
import React, { useState, useEffect } from 'react';
import { getAppConfig } from './services/dbService';
import { Movie } from './types';
import { Crown, X, ArrowLeft, ShieldCheck, FileText, Info } from 'lucide-react';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { Page } from './App';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void; 
  onSearch: (query: string) => void;
  onStart: () => void; 
  onNavigate: (page: Page) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStart, onNavigate }) => {
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const config = await getAppConfig();
        if (config['site_background']) setCustomBg(config['site_background']);
        if (config['site_logo']) setCustomLogo(config['site_logo']);
      } catch (e) { console.error(e); }
    };
    loadContent();
  }, []);

  const handlePlanSelection = (plan: string) => {
      setShowPremiumModal(false);
      setTimeout(() => onStart(), 300);
  };

  const heroBg = customBg || 'https://i.imgur.com/sC56bsu.jpg';

  return (
    <div className="relative h-screen w-full bg-[#000000] overflow-hidden font-sans">
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Background" className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black"></div>
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center animate-slide-in-up">
          
          <div className="mb-8 flex flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center shrink-0">
                  <img 
                    src={customLogo || "/logotip.png"} 
                    alt="Anilo Logo" 
                    className="w-full h-full object-cover p-1"
                    onError={(e) => {
                        // Agar PNG ham yuklanmasa, SVG ga qaytamiz
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjEyOCIgZmlsbD0iIzAwMDAwMCIvPjxwYXRoIGQ9Ik0yNTYgMTIwQzE4MC44OSAxMjAgMTIwIDE4MC44OSAxMjAgMjU2QzEyMCAzMzEuMTEgMTgwLjg5IDM5MiAyNTYgMzkyQzMzMS4xMSAzOTIgMzkyIDMzMS4xMSAzOTIgMjU2IiBzdHJva2U9IiNmOTczMTYiIHN0cm9rZS13aWR0aD0iMjQiLz48L3N2Zz4=';
                    }}
                  />
              </div>
              <div className="text-left">
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-xl font-mono">
                      ANILO<span className="text-orange-600">.UZ</span>
                  </h1>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em] mt-1 pl-1">
                      Professional Dublyaj
                  </p>
              </div>
          </div>

          <p className="text-gray-300 text-xs md:text-sm font-medium leading-relaxed drop-shadow-md max-w-sm mb-10 opacity-90">
              O'zbekistonning eng katta anime portali. Yuqori sifat va tezkor tarjimalar faqat bizda.
          </p>

          <div className="w-full max-w-xs space-y-3">
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="w-full py-4 bg-white text-black hover:bg-gray-200 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <Crown size={16} fill="black" /> Premium Sotib Olish
              </button>

              <button 
                onClick={onStart} 
                className="w-full py-4 bg-black/60 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-black/80 transition-all active:scale-95 backdrop-blur-md rounded-2xl"
              >
                Kirish
              </button>
          </div>

          <div className="mt-8">
              <button onClick={onStart} className="text-zinc-500 text-[10px] font-bold hover:text-white transition-colors uppercase tracking-[0.2em]">
                Hisob yaratish
              </button>
          </div>
      </div>

      {/* FOOTER LEGAL LINKS */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-2 md:gap-6 bg-black/40 backdrop-blur-md border border-white/5 p-1 rounded-full px-4">
              <button 
                onClick={() => onNavigate('copyright')}
                className="flex items-center gap-1.5 py-2 px-3 text-[10px] font-black text-zinc-400 hover:text-orange-500 transition-all uppercase tracking-widest"
              >
                  <ShieldCheck size={12} /> Maxfiylik
              </button>
              <div className="w-px h-3 bg-zinc-800"></div>
              <button 
                onClick={() => onNavigate('copyright')}
                className="flex items-center gap-1.5 py-2 px-3 text-[10px] font-black text-zinc-400 hover:text-orange-500 transition-all uppercase tracking-widest"
              >
                  <FileText size={12} /> Oferta
              </button>
              <div className="w-px h-3 bg-zinc-800"></div>
              <button 
                onClick={() => onNavigate('copyright')}
                className="flex items-center gap-1.5 py-2 px-3 text-[10px] font-black text-zinc-400 hover:text-orange-500 transition-all uppercase tracking-widest"
              >
                  <Info size={12} /> Biz haqimizda
              </button>
          </div>
          <p className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.4em]">© 2025 ANILO MEDIA GROUP</p>
      </div>

      {/* PREMIUM MODAL */}
      {showPremiumModal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setShowPremiumModal(false)}>
              <div 
                className="bg-[#0a0a0a] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-6xl h-[90vh] sm:h-auto sm:max-h-[95vh] overflow-hidden shadow-2xl relative flex flex-col transition-transform duration-300" 
                onClick={e => e.stopPropagation()}
              >
                  <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={() => setShowPremiumModal(false)}>
                      <div className="w-12 h-1.5 bg-zinc-800 rounded-full"></div>
                  </div>

                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-600/20 rounded-lg text-orange-500"><Crown size={20} /></div>
                          <div>
                              <h2 className="text-lg font-black text-white uppercase tracking-tight">Premium Rejalar</h2>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Cheklovsiz kirish</p>
                          </div>
                      </div>
                      <button onClick={() => setShowPremiumModal(false)} className="text-zinc-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-[#0a0a0a]">
                      <div className="py-6 px-4">
                          <SubscriptionPlans onPlanSelect={handlePlanSelection} />
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
