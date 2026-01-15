import React, { useState, useEffect, useCallback } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Page } from './App';
import { Play, ChevronRight, ChevronLeft, Calendar, Star } from 'lucide-react';

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

    // Limitni olib tashladik, barcha animelar aylanadi
    const heroMovies = allMovies.length > 0 ? allMovies : [];

    const nextHero = useCallback(() => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev + 1) % heroMovies.length);
        setProgress(0);
    }, [heroMovies.length]);

    const prevHero = () => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
        setProgress(0);
    };

    useEffect(() => {
        getMovies().then(movies => {
            setAllMovies(movies);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (heroMovies.length === 0) return;
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextHero();
                    return 0;
                }
                return prev + (100 / 60); // 6 secund
            });
        }, 100);

        return () => clearInterval(interval);
    }, [heroMovies.length, nextHero]);

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

    const currentHero = heroMovies[heroIndex];

    return (
        <div className="pb-32 pt-0 overflow-x-hidden">
            {/* CINEMATIC AUTO-CAROUSEL HERO */}
            {currentHero && (
                <div className="relative w-full h-[80vh] sm:h-[90vh] overflow-hidden">
                    <div key={`bg-${currentHero.id}`} className="absolute inset-0 animate-ken-burns">
                        <img 
                            src={currentHero.posterUrl} 
                            className="w-full h-full object-cover opacity-50 scale-110" 
                            alt="" 
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/20 z-10"></div>

                    <div className="container mx-auto px-6 md:px-16 h-full flex items-center relative z-20 pt-10">
                        <div className="max-w-4xl animate-slide-right">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex gap-1 bg-white/5 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                                    {heroMovies.slice(0, 10).map((_, idx) => ( // Dastlabki 10 tasini indikator qilib ko'rsatamiz
                                        <div 
                                            key={idx} 
                                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === heroIndex ? 'w-10 bg-orange-500' : 'w-1.5 bg-gray-600'}`}
                                        />
                                    ))}
                                </div>
                                <span className="px-3 py-1 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-md animate-pulse">Live Now</span>
                            </div>

                            <h1 key={`title-${currentHero.id}`} className="text-5xl md:text-[7rem] font-black text-white mb-6 tracking-tighter uppercase leading-[0.9] drop-shadow-2xl animate-title-blur">
                                {currentHero.title}
                            </h1>
                            
                            <div className="flex items-center gap-6 mb-8 text-sm font-bold text-gray-300">
                                <span className="flex items-center gap-2"><Calendar size={16} className="text-orange-500"/> {currentHero.year}</span>
                                <span className="flex items-center gap-2"><Star size={16} className="text-yellow-500 fill-yellow-500"/> {currentHero.rating.toFixed(1)}</span>
                                <span className="px-2 py-0.5 border border-white/20 rounded text-[10px] uppercase tracking-tighter">{currentHero.quality}</span>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <button 
                                    onClick={() => onMovieClick(currentHero)}
                                    className="px-12 py-5 bg-white text-black hover:bg-orange-600 hover:text-white rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 group"
                                >
                                    Watch Now <Play fill="currentColor" size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => onMovieClick(currentHero)}
                                    className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-sm uppercase tracking-widest backdrop-blur-2xl transition-all"
                                >
                                    Details
                                </button>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="absolute bottom-12 right-6 md:right-16 flex gap-3">
                            <button onClick={prevHero} className="p-4 bg-white/5 hover:bg-orange-600 rounded-full border border-white/10 transition-all text-white backdrop-blur-md">
                                <ChevronLeft size={28} />
                            </button>
                            <button onClick={nextHero} className="p-4 bg-white/5 hover:bg-orange-600 rounded-full border border-white/10 transition-all text-white backdrop-blur-md">
                                <ChevronRight size={28} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 h-1.5 bg-orange-600 z-30 transition-all duration-100 ease-linear shadow-[0_0_20px_#f97316]" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {/* POPULAR MOVING STRIP */}
            <div className="mt-16 space-y-12">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Popular Anime</h2>
                </div>

                <div className="relative group">
                    <div className="flex gap-6 animate-infinite-scroll group-hover:pause-scroll py-10">
                        {[...allMovies, ...allMovies].map((movie, idx) => (
                            <div key={`${movie.id}-${idx}`} className="w-[200px] sm:w-[260px] flex-shrink-0 px-2">
                                <MovieCard movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};