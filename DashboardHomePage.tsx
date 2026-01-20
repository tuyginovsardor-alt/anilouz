
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Play, Star, TrendingUp, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onMovieClick }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        getMovies().then(movies => {
            setAllMovies(movies);
            setIsLoading(false);
        });
    }, []);

    const heroMovies = allMovies.slice(0, 6);

    const nextHero = useCallback(() => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, [heroMovies.length]);

    const prevHero = useCallback(() => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
    }, [heroMovies.length]);

    useEffect(() => {
        if (isAutoPlaying && heroMovies.length > 0) {
            timerRef.current = window.setInterval(nextHero, 7000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoPlaying, nextHero, heroMovies.length]);

    const handleManualNav = (direction: 'next' | 'prev') => {
        setIsAutoPlaying(false);
        if (direction === 'next') nextHero();
        else prevHero();
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="pb-32 bg-[#050505] animate-fade-in">
            
            {/* HERO CAROUSEL - Edge to Edge, Behind Header */}
            {/* -mt-20 pulls it up to cover the header area (since header is transparent) */}
            <div className="relative w-full h-[65vh] md:h-[800px] group overflow-hidden mb-16 shadow-2xl -mt-20">
                <div 
                    className="flex h-full transition-transform duration-1000 cubic-bezier(0.23, 1, 0.32, 1)"
                    style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                >
                    {heroMovies.map((movie, idx) => (
                        <div key={movie.id} className="relative w-full h-full flex-shrink-0">
                            <div className="absolute inset-0">
                                <img 
                                    src={movie.posterUrl} 
                                    className={`absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-[10000ms] ${heroIndex === idx ? 'scale-110' : 'scale-100'}`} 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent"></div>
                            </div>

                            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-24 lg:w-3/5 z-20 pb-20 md:pb-32">
                                <div className={`transition-all duration-1000 delay-300 transform ${heroIndex === idx ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                                        <span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.6)]">
                                            {movie.access_type === 'premium' ? 'PREMIUM' : 'BEPUL'}
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                                            <span className="text-white font-black text-xs">{movie.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    
                                    <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white mb-4 md:mb-8 uppercase tracking-tighter leading-none drop-shadow-2xl">
                                        {movie.title}
                                    </h1>
                                    
                                    <p className="text-zinc-300 text-sm md:text-lg mb-8 md:mb-10 max-w-xl line-clamp-3 font-medium opacity-90 leading-relaxed border-l-4 border-orange-600 pl-6 drop-shadow-md">
                                        {movie.plot}
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="px-8 md:px-10 py-4 md:py-5 bg-white text-black hover:bg-orange-600 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
                                        >
                                            <Play fill="currentColor" size={20} /> Hozir ko'rish
                                        </button>
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="px-8 md:px-10 py-4 md:py-5 bg-black/40 backdrop-blur-md text-white rounded-xl font-black uppercase tracking-widest text-[10px] md:text-[11px] hover:bg-zinc-800 transition-all border border-white/10 flex items-center justify-center gap-3"
                                        >
                                            <Info size={20} /> Batafsil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={() => handleManualNav('prev')} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex"><ChevronLeft size={24} /></button>
                <button onClick={() => handleManualNav('next')} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex"><ChevronRight size={24} /></button>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
                    {heroMovies.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => { setHeroIndex(i); setIsAutoPlaying(false); }} 
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === heroIndex ? 'w-8 bg-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                        ></button>
                    ))}
                </div>
            </div>

            {/* CATALOG - IMPROVED SPACING AND GRID */}
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            <div className="w-1.5 h-8 md:h-12 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                            Katalog
                        </h2>
                        <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 ml-6">Eng so'nggi animelar</p>
                    </div>
                    <div className="hidden md:flex bg-zinc-900 border border-white/5 px-6 py-2.5 rounded-full items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <TrendingUp size={16} className="text-orange-500" />
                        Ommabop
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14">
                    {allMovies.map(movie => (
                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                    ))}
                </div>
            </div>
        </div>
    );
};
