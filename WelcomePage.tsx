import React, { useState, useEffect } from 'react';
import { getMovies } from './services/dbService';
import { Movie } from './types';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { Play, Sparkles, ChevronRight, Info } from 'lucide-react';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void;
  onSearch: (query: string) => void;
  onStart: () => void;
}

// FIX: Added onSearch to destructured arguments
export const WelcomePage: React.FC<WelcomePageProps> = ({ onMovieClick, onSearch, onStart }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMovies().then(res => {
      setMovies(res.slice(0, 10));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-16 pb-10">
      {/* Hero Splash */}
      <div className="relative h-[85vh] min-h-[600px] flex flex-col items-center justify-center text-center overflow-hidden rounded-3xl -mt-6">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-600/20 via-transparent to-[#07070a] z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(249,115,22,0.1)_0%,transparent_70%)] animate-pulse"></div>
        
        <div className="relative z-10 max-w-4xl px-4">
           <div className="mb-8 flex justify-center">
              <UzumakiLogo className="w-32 h-32 md:w-44 md:h-44 animate-neon" />
           </div>
           <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none">
             ANIME <span className="text-orange-500">LEVEL UP</span>
           </h1>
           <p className="text-gray-400 text-lg md:text-2xl mb-12 max-w-2xl mx-auto font-medium">
             O'zbekistondagi eng tezkor va sifatli anime portali. Har kuni yangi qismlar, professional dublyajda!
           </p>
           
           <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={onStart}
                className="px-12 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xl shadow-2xl shadow-orange-600/30 flex items-center justify-center gap-3 transition-all transform active:scale-95"
              >
                <Play fill="currentColor" size={24} /> TOMOSHANI BOSHLASH
              </button>
              <button 
                onClick={() => document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                KO'PROQ MA'LUMOT <Info size={20} />
              </button>
           </div>
        </div>
      </div>

      {/* Trending Row */}
      <div id="trending" className="px-2 space-y-6">
          <div className="flex justify-between items-center px-4">
             <h2 className="text-2xl md:text-4xl font-black flex items-center gap-3">
                <Sparkles className="text-yellow-400" /> TRENDDAGI ANIMELAR
             </h2>
          </div>
          
          {loading ? <div className="py-10"><LoadingSpinner /></div> : (
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-4">
                {movies.map(movie => (
                    <div key={movie.id} className="min-w-[170px] sm:min-w-[240px] anime-card-hover">
                        <MovieCard movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                    </div>
                ))}
            </div>
          )}
      </div>

      {/* Why Us Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {[
              { icon: '🚀', title: 'Ultra Tezlik', desc: 'Videolar qotmasdan, istalgan sifatda ochiladi.' },
              { icon: '💎', title: 'Premium Sifat', desc: 'Faqat Full HD va 4K formatda animelar.' },
              { icon: '🎭', title: 'Professional Ovoz', desc: 'Aniblativ jamoasidan eng yaxshi tarjimalar.' },
          ].map((f, i) => (
              <div key={i} className="glass-effect p-10 rounded-3xl text-center border-orange-500/10 hover:border-orange-500/30 transition-all group">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">{f.icon}</div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
          ))}
      </div>
    </div>
  );
};