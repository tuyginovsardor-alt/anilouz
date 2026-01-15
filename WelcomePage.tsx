
import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getMovies } from './services/dbService';
import { Movie } from './types';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { Play, Sparkles, ChevronRight } from 'lucide-react';
import { MovieCard } from './components/MovieCard';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void;
  onSearch: (query: string) => void;
  onStart: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onMovieClick, onStart }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMovies().then(res => {
      setMovies(res.slice(0, 10));
      setLoading(false);
    });
  }, []);

  return (
    <div className="animate-fade-in space-y-12">
      {/* Splash Hero */}
      <div className="relative h-[80vh] min-h-[500px] flex flex-col items-center justify-center text-center overflow-hidden -mt-6 sm:-mt-10 rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 via-transparent to-[#07070a] z-0"></div>
        
        {/* Animated Background Icons */}
        <div className="absolute top-10 left-10 opacity-10 animate-pulse"><UzumakiLogo className="w-40 h-40" /></div>
        <div className="absolute bottom-20 right-10 opacity-10 animate-neon"><Sparkles className="w-24 h-24" /></div>

        <div className="relative z-10 max-w-3xl px-4">
           <div className="mb-6 flex justify-center">
              <UzumakiLogo className="w-28 h-28 sm:w-40 sm:h-40 animate-neon" />
           </div>
           <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
             ANIME OLAMIGA <br/> <span className="text-orange-500">XUSH KELIBSID!</span>
           </h1>
           <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto font-medium">
             O'zbekistondagi eng sifatli tarjima animelar platformasi. Hoziroq tomoshani boshlang!
           </p>
           
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onStart}
                className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-black text-xl shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3 transition-all transform active:scale-95"
              >
                <Play fill="currentColor" size={24} /> KIRISH
              </button>
              <button 
                onClick={() => document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                KO'RIB CHIQISH <ChevronRight />
              </button>
           </div>
        </div>
      </div>

      {/* Trending Horizontal Section */}
      <div id="trending" className="space-y-6">
          <div className="flex justify-between items-end px-2">
             <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Sparkles className="text-yellow-400" /> TRENDDAGI ANIMELAR
             </h2>
          </div>
          
          {loading ? <LoadingSpinner /> : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                {movies.map(movie => (
                    <div key={movie.id} className="min-w-[160px] sm:min-w-[220px] anime-card-hover">
                        <MovieCard movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                    </div>
                ))}
            </div>
          )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10">
          {[
              { icon: '🎬', title: 'Yuqori Sifat', desc: 'Faqat Full HD va 4K formatda animelar.' },
              { icon: '🎙️', title: 'Aniblativ', desc: 'O\'zbek tilidagi professional ovozlashtirish.' },
              { icon: '🔥', title: 'Konkurslar', desc: 'Tomosha qiling va qimmatbaho sovrinlar yuting.' },
          ].map((f, i) => (
              <div key={i} className="glass-effect p-8 rounded-3xl text-center hover:border-orange-500/30 transition-colors">
                  <div className="text-5xl mb-4">{f.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
          ))}
      </div>
    </div>
  );
};
