import React, { useState, useEffect, useCallback } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Play, ChevronRight, ChevronLeft, Calendar, Star, TrendingUp } from 'lucide-react';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onMovieClick }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);

    useEffect(() => {
        getMovies().then(movies => {
            setAllMovies(movies);
            setIsLoading(false);
        });
    }, []);

    const heroMovies = allMovies.slice(0, 10);

    const nextHero = useCallback(() => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, [heroMovies.length]);

    const prevHero = () => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
    };

    useEffect(() => {
        if (heroMovies.length === 0) return;
        const interval = setInterval(nextHero, 6000);
        return () => clearInterval(interval);
    }, [heroMovies.length, nextHero]);

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

    const currentHero = heroMovies[heroIndex];

    return (
        <div className="pb-20 bg-[#0a0a0c] animate-fade-in">
            {/* HERO SECTION (Restored Stable) */}
            {currentHero && (
                <div className="relative w-full h-[550px] md:h-[650px] overflow-hidden rounded-[3rem] mb-16 shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/5">
                    <img 
                        src={currentHero.posterUrl} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-1000" 
                        alt="" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 p-8 md:p-20 w-full md:w-3/4 lg:w-1/2">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-orange-600/30">Top Rated</span>
                            <span className="text-gray-300 font-black text-sm flex items-center gap-1.5"><Star size={16} className="text-yellow-500 fill-yellow-500"/> {currentHero.rating.toFixed(1)}</span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black text-white mb-8 uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                            {currentHero.title}
                        </h1>
                        <div className="flex flex-wrap gap-5">
                            <button 
                                onClick={() => onMovieClick(currentHero)}
                                className="px-10 py-5 bg-white text-black hover:bg-orange-600 hover:text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 shadow-xl active:scale-95"
                            >
                                <Play fill="currentColor" size={20} /> Hozir ko'rish
                            </button>
                            <button 
                                onClick={() => onMovieClick(currentHero)}
                                className="px-10 py-5 bg-white/10 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] backdrop-blur-xl hover:bg-white/20 transition-all border border-white/10"
                            >
                                Tafsilotlar
                            </button>
                        </div>
                    </div>

                    {/* Pagination Indicators */}
                    <div className="absolute bottom-10 right-10 flex gap-4 items-center">
                        <div className="flex gap-2 mr-4">
                            {heroMovies.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === heroIndex ? 'w-8 bg-orange-600' : 'w-2 bg-white/20'}`}></div>
                            ))}
                        </div>
                        <button onClick={prevHero} className="p-4 bg-white/5 hover:bg-orange-600 rounded-2xl text-white backdrop-blur-xl transition-all border border-white/10"><ChevronLeft size={24}/></button>
                        <button onClick={nextHero} className="p-4 bg-white/5 hover:bg-orange-600 rounded-2xl text-white backdrop-blur-xl transition-all border border-white/10"><ChevronRight size={24}/></button>
                    </div>
                </div>
            )}

            {/* MOVIE GRID (Restored Professional) */}
            <div className="container mx-auto px-4 space-y-20">
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
                            <div className="w-2 h-10 bg-orange-600 rounded-full shadow-[0_0_20px_rgba(234,88,12,0.5)]"></div>
                            Barcha Animelar
                        </h2>
                        <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
                             <TrendingUp size={16} className="text-orange-500" />
                             Trendda
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                        {allMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};