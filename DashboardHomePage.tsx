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

    const heroMovies = allMovies.slice(0, 6); // Top 6 ta anime hero uchun

    const nextHero = useCallback(() => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, [heroMovies.length]);

    const prevHero = useCallback(() => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
    }, [heroMovies.length]);

    // Auto-play mantig'i
    useEffect(() => {
        if (isAutoPlaying && heroMovies.length > 0) {
            timerRef.current = window.setInterval(nextHero, 7000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoPlaying, nextHero, heroMovies.length]);

    const handleManualNav = (direction: 'next' | 'prev') => {
        setIsAutoPlaying(false); // Foydalanuvchi aralashsa, avto-playni to'xtatamiz
        if (direction === 'next') nextHero();
        else prevHero();
        // 10 soniyadan keyin yana yoqish
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

    return (
        <div className="pb-20 bg-[#0a0a0c] animate-fade-in">
            
            {/* --- CINEMATIC HERO CAROUSEL --- */}
            <div className="relative w-full h-[70vh] md:h-[800px] group overflow-hidden md:rounded-[3.5rem] mb-16 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-b md:border border-white/5">
                
                {/* Sliders Container */}
                <div 
                    className="flex h-full transition-transform duration-[1000ms] cubic-bezier(0.23, 1, 0.32, 1)"
                    style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                >
                    {heroMovies.map((movie, idx) => (
                        <div key={movie.id} className="relative w-full h-full flex-shrink-0">
                            {/* Background Image with Ken Burns */}
                            <div className="absolute inset-0 overflow-hidden">
                                <img 
                                    src={movie.posterUrl} 
                                    className={`absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-[10000ms] ${heroIndex === idx ? 'scale-110' : 'scale-100'}`} 
                                    alt="" 
                                />
                                {/* Cinematic Gradients */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-transparent hidden lg:block"></div>
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-24 lg:w-3/5 z-20">
                                <div className={`transition-all duration-1000 delay-300 transform ${heroIndex === idx ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-orange-600/30">
                                            {movie.access_type === 'premium' ? 'PREMIUM ACCESS' : 'BEPUL TOMOSHA'}
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                                            <span className="text-white font-black text-xs">{movie.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    
                                    <h1 className="text-5xl md:text-8xl font-black text-white mb-8 uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                                        {movie.title}
                                    </h1>
                                    
                                    <p className="text-gray-300 text-sm md:text-lg mb-10 max-w-xl line-clamp-3 font-medium opacity-80 leading-relaxed border-l-4 border-orange-600 pl-6">
                                        {movie.plot}
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="px-10 py-5 bg-white text-black hover:bg-orange-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                                        >
                                            <Play fill="currentColor" size={20} /> Hozir ko'rish
                                        </button>
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="px-10 py-5 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] backdrop-blur-xl hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3"
                                        >
                                            <Info size={20} /> Ma'lumot
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <button 
                    onClick={() => handleManualNav('prev')}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 bg-black/20 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/5 text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={() => handleManualNav('next')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 bg-black/20 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/5 text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Progress Indicators (Professional Look) */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
                    {heroMovies.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => { setHeroIndex(i); setIsAutoPlaying(false); }}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === heroIndex ? 'w-12 bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.8)]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                        ></button>
                    ))}
                </div>
            </div>

            {/* --- CATALOG SECTION --- */}
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            <div className="w-2 h-10 md:h-14 bg-orange-600 rounded-full"></div>
                            Katalog
                        </h2>
                        <p className="text-gray-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.4em] mt-2">Barcha animelar</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 px-6 py-2.5 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <TrendingUp size={16} className="text-orange-500" />
                        Ommabop
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                    {allMovies.map(movie => (
                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                    ))}
                </div>
            </div>
        </div>
    );
};