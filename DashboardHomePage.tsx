import React, { useState, useEffect, useCallback } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Page } from './App';
import { Play, Info, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  onNavigate?: (page: Page) => void;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onSearch, onMovieClick, onNavigate }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const heroMovies = allMovies.slice(0, 6); // Top 6 as hero carousel

    const nextHero = useCallback(() => {
        setHeroIndex((prev) => (prev + 1) % heroMovies.length);
        setProgress(0);
    }, [heroMovies.length]);

    const prevHero = () => {
        setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
        setProgress(0);
    };

    useEffect(() => {
        getMovies().then(movies => {
            setAllMovies(movies);
            setIsLoading(false);
        });
    }, []);

    // 6-second auto-play logic
    useEffect(() => {
        if (heroMovies.length === 0) return;
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextHero();
                    return 0;
                }
                return prev + (100 / 60); // 6 seconds = 60 steps of 100ms
            });
        }, 100);

        return () => clearInterval(interval);
    }, [heroMovies.length, nextHero]);

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

    const currentHero = heroMovies[heroIndex];

    return (
        <div className="pb-32 pt-0">
            {/* CINEMATIC AUTO-CAROUSEL HERO */}
            {currentHero && (
                <div className="relative w-full h-[85vh] sm:h-[90vh] overflow-hidden">
                    {/* Background layers */}
                    <div key={`bg-${currentHero.id}`} className="absolute inset-0 animate-ken-burns">
                        <img 
                            src={currentHero.posterUrl} 
                            className="w-full h-full object-cover opacity-40 scale-110" 
                            alt="" 
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/30 z-10"></div>

                    {/* Content Container */}
                    <div className="container mx-auto px-6 md:px-16 h-full flex items-center relative z-20">
                        <div className="max-w-3xl animate-slide-right">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-3 py-1 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-md">Trending</span>
                                <div className="flex gap-1">
                                    {heroMovies.map((_, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`h-1 rounded-full transition-all duration-300 ${idx === heroIndex ? 'w-8 bg-orange-500' : 'w-2 bg-gray-700'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <h1 key={`title-${currentHero.id}`} className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase leading-none drop-shadow-2xl animate-title-blur">
                                {currentHero.title}
                            </h1>
                            
                            <p key={`plot-${currentHero.id}`} className="text-gray-300 text-base md:text-lg mb-10 max-w-xl font-medium opacity-80 leading-relaxed border-l-4 border-orange-600 pl-6 line-clamp-3">
                                {currentHero.plot}
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <button 
                                    onClick={() => onMovieClick(currentHero)}
                                    className="px-10 py-4 bg-orange-600 text-white hover:bg-white hover:text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl active:scale-95 group"
                                >
                                    Hozir ko'rish <Play fill="currentColor" size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => onMovieClick(currentHero)}
                                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-sm uppercase tracking-widest backdrop-blur-xl transition-all"
                                >
                                    Batafsil
                                </button>
                            </div>
                        </div>

                        {/* Side Controls */}
                        <div className="absolute bottom-10 right-10 flex gap-4">
                            <button onClick={prevHero} className="p-3 bg-white/5 hover:bg-orange-600 rounded-full border border-white/10 transition-all text-white">
                                <ChevronLeft size={24} />
                            </button>
                            <button onClick={nextHero} className="p-3 bg-white/5 hover:bg-orange-600 rounded-full border border-white/10 transition-all text-white">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Auto-play progress bar */}
                    <div className="absolute bottom-0 left-0 h-1 bg-orange-600/50 z-30 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {/* LIVE MOVING CAROUSEL SECTION */}
            <div className="mt-20 space-y-12 overflow-hidden">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-4">
                        <div className="w-10 h-1 bg-orange-600 rounded-full"></div>
                        Popular Anime
                    </h2>
                    <button className="text-xs font-bold text-gray-500 hover:text-orange-500 uppercase tracking-widest">Barchasi &rarr;</button>
                </div>

                {/* The "Live" Continuous Scroll */}
                <div className="relative group">
                    <div className="flex gap-6 animate-infinite-scroll group-hover:pause-scroll">
                        {[...allMovies, ...allMovies].map((movie, idx) => (
                            <div key={`${movie.id}-${idx}`} className="w-[180px] sm:w-[220px] flex-shrink-0">
                                <MovieCard movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Regular Grid for secondary section */}
                <div className="container mx-auto px-6 pt-10">
                     <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-4 mb-10">
                        <div className="w-10 h-1 bg-orange-600 rounded-full"></div>
                        Yangi qo'shilganlar
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                        {allMovies.slice(6).map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};