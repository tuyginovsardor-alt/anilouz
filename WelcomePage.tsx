
import React, { useState, useEffect } from 'react';
import { getMovies, getAppConfig } from './services/dbService';
import { Movie } from './types';
import { Play, Sparkles, ArrowRight, ShoppingBag, Crown, Star, Clock } from 'lucide-react';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TrendingSlider } from './components/TrendingSlider';
import { SubscriptionPlans } from './components/SubscriptionPlans';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void;
  onSearch: (query: string) => void;
  onStart: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onMovieClick, onSearch, onStart }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [movieRes, config] = await Promise.all([
          getMovies(),
          getAppConfig()
        ]);
        setMovies(movieRes);
        if (config['site_background']) {
          setCustomBg(config['site_background']);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const heroBg = customBg || 'https://i.imgur.com/sC56bsu.jpg';

  const handleExplorePremium = () => {
      setShowPremiumModal(true);
  };

  const newArrivals = movies.slice(0, 10).sort((a, b) => (b.year - a.year)); // Mock sorting
  const topRated = movies.filter(m => m.rating >= 4.5).slice(0, 10);

  return (
    <div className="space-y-16 pb-32">
      {/* Cinematic Hero Section */}
      <div className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden -mt-24 sm:-mt-20">
        <div className="absolute inset-0 z-0">
            <img 
              src={heroBg} 
              alt="Hero BG" 
              className="w-full h-full object-cover transition-opacity duration-1000 animate-fade-in"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
        </div>

        <div className="relative z-20 max-w-4xl px-6 md:px-16 xl:px-24 animate-slide-in-up mt-20">
           <div className="mb-6 flex items-center gap-3">
              <span className="px-4 py-1.5 bg-orange-600/90 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)] border border-orange-400/30">
                  #1 O'zbek Anime Portali
              </span>
           </div>
           
           <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.9] uppercase drop-shadow-2xl">
             Cheksiz <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Anime Olami</span>
           </h1>
           
           <p className="text-gray-300 text-base md:text-xl mb-10 max-w-xl font-medium opacity-90 leading-relaxed border-l-4 border-orange-600 pl-6 drop-shadow-md">
             Sevimli animelaringizni yuqori sifatda, o'zbek tilida tomosha qiling. Har kuni yangi qismlar va eksklyuziv dublyajlar.
           </p>
           
           <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={handleExplorePremium}
                className="px-10 py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group border border-orange-400/30"
              >
                <Crown size={20} className="text-yellow-300" />
                Explore Free Trial
              </button>
              
              <button 
                onClick={onStart}
                className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-sm uppercase tracking-widest backdrop-blur-xl transition-all flex items-center justify-center gap-3 hover:scale-105"
              >
                Kirish <ArrowRight size={18} />
              </button>
           </div>
        </div>
      </div>

      {/* TRENDING CAROUSEL (Hand Scrollable) */}
      <div className="-mt-32 relative z-30 pl-4 md:pl-8">
          <TrendingSlider movies={movies.slice(0, 10)} onMovieClick={onMovieClick} />
      </div>

      {/* NEW SECTION: TOP RATED */}
      <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 mb-8">
              <div className="w-1.5 h-10 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
              <h2 className="text-3xl font-black tracking-tighter uppercase text-white">Eng Sara Animelar</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {topRated.map(movie => (
                  <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
              ))}
          </div>
      </div>

      {/* ANILO SHOP AD PROMO CARD */}
      <div className="container mx-auto px-4 md:px-8">
          <div 
            onClick={() => window.location.href = '/?page=shop'}
            className="group relative h-64 md:h-80 bg-[#0a0a0a] border border-zinc-800 rounded-[3rem] overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all duration-500 shadow-2xl"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-transparent to-transparent"></div>
              <div className="absolute right-0 top-0 h-full w-1/2 opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                  <img src="https://i.imgur.com/uN8fD3A.png" alt="Merch" className="h-full w-full object-cover translate-x-10 group-hover:translate-x-0 transition-transform duration-700" />
              </div>

              <div className="relative h-full flex flex-col justify-center p-10 md:p-16 space-y-6 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-500 backdrop-blur-md">
                      <ShoppingBag size={14}/> Anilo Shop is LIVE
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">
                      Sevimli animelaringiz <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">endi kiyimingizda!</span>
                  </h2>
                  <button className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs group-hover:text-orange-500 transition-colors">
                      DO'KONGA O'TISH <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </button>
              </div>
          </div>
      </div>

      {/* NEW SECTION: FRESH ARRIVALS */}
      <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                <h2 className="text-3xl font-black tracking-tighter uppercase text-white">Yangi Qo'shilganlar</h2>
             </div>
             <button onClick={onStart} className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">Ko'proq <ArrowRight size={14}/></button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
              {newArrivals.map(movie => (
                  <div key={movie.id} className="min-w-[160px] md:min-w-[200px]">
                      <MovieCard movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                  </div>
              ))}
          </div>
      </div>

      {/* Premium Modal Popup */}
      {showPremiumModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setShowPremiumModal(false)}>
              <div className="bg-[#0f0f0f] border border-white/10 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowPremiumModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><ArrowRight size={24} className="rotate-45" /></button>
                  <div className="p-8">
                      <h2 className="text-2xl font-black text-white text-center mb-6">Premium Rejalar</h2>
                      <SubscriptionPlans />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
