import React, { useState, useEffect } from 'react';
import { getMovies } from './services/dbService';
import { Movie } from './types';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { Play, Sparkles, Info } from 'lucide-react';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void;
  onSearch: (query: string) => void;
  onStart: () => void;
}

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
        <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 via-transparent to-[#0a0a0c] z-0"></div>
        
        <div className="relative z-10 max-w-4xl px-4">
           <div className="mb-10 flex justify-center">
              <UzumakiLogo className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_20px_rgba(225,29,72,0.4)]" />
           </div>
           <h1 className="text-6xl md:text-9xl font-black text-white mb-6 tracking-tighter leading-none">
             ANILO <span className="text-orange-500">UZ</span>
           </h1>
           <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium opacity-80 leading-relaxed">
             Sevimli animelaringizni yuqori sifatda, o'zbek tilida tomosha qiling. Har kuni yangi qismlar, professional dublyajda!
           </p>
           
           <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <button 
                onClick={onStart}
                className="px-12 py-5 bg-white text-black hover:bg-orange-600 hover:text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl transition-all transform active:scale-95"
              >
                <Play fill="currentColor" size={18} className="inline mr-2" /> Start Watching
              </button>
              <button 
                onClick={() => document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-sm uppercase tracking-widest backdrop-blur-xl transition-all flex items-center justify-center gap-2"
              >
                Learn More <Info size={18} />
              </button>
           </div>
        </div>
      </div>

      {/* Trending Row */}
      <div id="trending" className="px-4 space-y-10">
          <div className="flex items-center gap-4">
             <div className="w-8 h-0.5 bg-orange-600"></div>
             <h2 className="text-xl font-black tracking-widest uppercase flex items-center gap-3">
                <Sparkles size={18} className="text-orange-500" /> Trending Anime
             </h2>
          </div>
          
          {loading ? <div className="py-20"><LoadingSpinner /></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                {movies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                ))}
            </div>
          )}
      </div>
    </div>
  );
};