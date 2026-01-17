import React, { useState, useEffect } from 'react';
import { getMovies } from './services/dbService';
import { Movie } from './types';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { Play, Sparkles, Info, ArrowRight, ShoppingBag, Gift } from 'lucide-react';
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
      {/* Cinematic Left Hero */}
      <div className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden rounded-3xl -mt-24 sm:-mt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/30 z-10"></div>
        
        {/* Background Movie Poster */}
        {movies.length > 0 && (
            <img 
              src={movies[0].posterUrl} 
              alt="Hero BG" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 scale-110 blur-sm sm:blur-none"
            />
        )}

        <div className="relative z-20 max-w-4xl px-6 md:px-16 xl:px-24">
           <div className="mb-6 flex items-center gap-3">
              <span className="px-3 py-1 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full">New Season</span>
              <span className="flex items-center gap-1 text-gray-400 font-bold text-xs"><Sparkles size={14} className="text-yellow-500" /> TOP TRENDING</span>
           </div>
           
           <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none uppercase">
             ANILO <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">PREMIUM</span><br/>
             CATALOG
           </h1>
           
           <p className="text-gray-300 text-base md:text-xl mb-10 max-w-xl font-medium opacity-80 leading-relaxed border-l-4 border-orange-600 pl-6">
             Sevimli animelaringizni yuqori sifatda, o'zbek tilida tomosha qiling. Har kuni yangi qismlar, professional dublyajda va hech qanday cheklovlarsiz!
           </p>
           
           <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={onStart}
                className="px-10 py-5 bg-orange-600 text-white hover:bg-white hover:text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 group"
              >
                Hozir Ko'rish <Play fill="currentColor" size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-sm uppercase tracking-widest backdrop-blur-xl transition-all flex items-center justify-center gap-3"
              >
                Kashf qilish <ArrowRight size={18} />
              </button>
           </div>
        </div>
      </div>

      {/* ANILO SHOP AD PROMO CARD */}
      <div className="container mx-auto px-4 md:px-8">
          <div 
            onClick={() => window.location.href = '/?page=shop'}
            className="group relative h-64 md:h-80 bg-zinc-900 border border-white/5 rounded-[3rem] overflow-hidden cursor-pointer hover:border-orange-500/30 transition-all duration-500 shadow-2xl"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-transparent"></div>
              <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                  <img src="https://i.imgur.com/uN8fD3A.png" alt="Merch" className="h-full w-full object-cover translate-x-10 group-hover:translate-x-0 transition-transform duration-700" />
              </div>

              <div className="relative h-full flex flex-col justify-center p-10 md:p-16 space-y-6 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-500">
                      <ShoppingBag size={14}/> Anilo Shop is LIVE
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">
                      Sevimli animelaringiz <br/> <span className="text-orange-600">endit kiyimingizda!</span>
                  </h2>
                  <p className="text-zinc-500 text-sm md:text-base font-medium max-w-md">
                      Aksessuarlar, futbolkalar va haykalchalar - barchasi do'konimizda. Homiy bo'ling va Aniloni qo'llab-quvvatlang!
                  </p>
                  <button className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs group-hover:text-orange-500 transition-colors">
                      DO'KONGA O'TISH <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </button>
              </div>
          </div>
      </div>

      {/* Trending Section */}
      <div id="trending" className="px-4 md:px-8 space-y-10 container mx-auto">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-1 bg-orange-600 rounded-full"></div>
                <h2 className="text-2xl font-black tracking-widest uppercase text-white">Trending Anime</h2>
             </div>
             <button onClick={onStart} className="text-xs font-bold text-gray-500 hover:text-orange-500 uppercase tracking-widest transition-colors">Barchasini ko'rish &rarr;</button>
          </div>
          
          {loading ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {movies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                ))}
            </div>
          )}
      </div>
    </div>
  );
};