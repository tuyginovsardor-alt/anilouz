import React, { useState, useEffect, useCallback } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Play, Calendar, Star, TrendingUp, Info } from 'lucide-react';

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

    // Avtomatik 6 soniyalik taymer
    useEffect(() => {
        if (heroMovies.length === 0) return;
        const interval = setInterval(nextHero, 6000);
        return () => clearInterval(interval);
    }, [heroMovies.length, nextHero]);

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

    const currentHero = heroMovies[heroIndex];

    return (
        <div className="pb-20 bg-[#0a0a0c] animate-fade-in overflow-hidden">
            
            {/* --- PREMIUM HERO SLIDER --- */}
            {currentHero && (
                <div className="relative w-full h-[60vh] md:h-[750px] overflow-hidden sm:rounded-[3rem] mb-12 md:mb-20 shadow-[0_50px_100px_rgba(0,0,0,0.9)] border-b md:border border-white/5 group">
                    
                    {/* Background Image with Smooth Transition */}
                    <div className="absolute inset-0 transition-all duration-1000 ease-in-out scale-105 group-hover:scale-100">
                        <img 
                            key={currentHero.id}
                            src={currentHero.posterUrl} 
                            className="absolute inset-0 w-full h-full object-cover opacity-50 animate-ken-burns" 
                            alt="" 
                        />
                    </div>
                    
                    {/* Professional Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/50 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-transparent hidden md:block"></div>
                    
                    {/* Hero Content */}
                    <div className="absolute bottom-0 left-0 p-6 md:p-20 w-full md:w-3/4 lg:w-2/3 z-20">
                        <div className="flex items-center gap-3 mb-6 animate-slide-up">
                            <span className="bg-orange-600 text-white text-[9px] md:text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-xl shadow-orange-600/40">
                                {currentHero.status === 'ongoing' ? 'Yangi Qismlar' : 'Premium Tanlov'}
                            </span>
                            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                                <span className="text-white font-black text-xs md:text-sm">{currentHero.rating.toFixed(1)}</span>
                            </div>
                        </div>
                        
                        <h1 
                            key={`title-${currentHero.id}`}
                            className="text-4xl md:text-8xl font-black text-white mb-6 md:mb-10 uppercase tracking-tighter leading-[0.85] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-title-reveal"
                        >
                            {currentHero.title}
                        </h1>
                        
                        <div className="flex flex-wrap gap-4 md:gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                            <button 
                                onClick={() => onMovieClick(currentHero)}
                                className="flex-1 sm:flex-none px-8 md:px-12 py-4 md:py-6 bg-white text-black hover:bg-orange-600 hover:text-white rounded-2xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-[12px] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                            >
                                <Play fill="currentColor" size={20} /> Ko'rish
                            </button>
                            <button 
                                onClick={() => onMovieClick(currentHero)}
                                className="flex-1 sm:flex-none px-8 md:px-12 py-4 md:py-6 bg-white/5 text-white rounded-2xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-[12px] backdrop-blur-2xl hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3"
                            >
                                <Info size={20} /> Ma'lumot
                            </button>
                        </div>
                    </div>

                    {/* Pagination Indicators (Professional Minimalist) */}
                    <div className="absolute bottom-6 md:bottom-12 right-6 md:right-16 flex items-center gap-2 z-30">
                        {heroMovies.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 rounded-full transition-all duration-700 ${i === heroIndex ? 'w-10 md:w-16 bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.8)]' : 'w-1.5 md:w-3 bg-white/20'}`}
                            ></div>
                        ))}
                    </div>

                    {/* Desktop Navigation Buttons Only */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-10 hidden xl:flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                         {/* Tugmalar olib tashlanmadi, shunchaki faqat kerak bo'lganda (desktopda) chiqadi */}
                    </div>
                </div>
            )}

            {/* --- CATALOG GRID --- */}
            <div className="container mx-auto px-4 md:px-8 space-y-20">
                <section>
                    <div className="flex items-center justify-between mb-10 md:mb-16">
                        <div className="flex flex-col">
                            <h2 className="text-3xl md:text-5xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
                                <div className="w-1.5 md:w-2.5 h-10 md:h-14 bg-orange-600 rounded-full shadow-[0_0_30px_rgba(234,88,12,0.6)]"></div>
                                Anime Katalog
                            </h2>
                            <p className="text-gray-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] mt-2 ml-14">Eng so'nggi yuklanganlar</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                             <TrendingUp size={16} className="text-orange-500" />
                             Hozir Trendda
                        </div>
                    </div>

                    {/* Infinite-like Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                        {allMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};