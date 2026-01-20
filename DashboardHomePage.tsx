
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie } from './types';
import { getMovies, isMovieSaved, toggleSaveMovie } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Play, Star, TrendingUp, Info, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { useNotification } from './hooks/useNotification';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onMovieClick }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isHeroSaved, setIsHeroSaved] = useState(false);
    
    // Parallax & Scroll State
    const [scrollY, setScrollY] = useState(0);
    
    // Swipe Logic State
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const { addNotification } = useNotification();
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(user) setUserId(user.id);
            const movies = await getMovies();
            setAllMovies(movies);
            setIsLoading(false);
        };
        fetch();

        // Parallax uchun scroll event
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const heroMovies = allMovies.slice(0, 6);
    const currentHeroMovie = heroMovies[heroIndex];

    // Check save status for current hero movie
    useEffect(() => {
        const checkSaved = async () => {
            if (userId && currentHeroMovie?.id) {
                const saved = await isMovieSaved(userId, currentHeroMovie.id);
                setIsHeroSaved(saved);
            }
        }
        checkSaved();
    }, [userId, currentHeroMovie, heroIndex]);

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

    const handleHeroSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userId || !currentHeroMovie?.id) {
            addNotification({type: 'warning', title: 'Kirish kerak', message: 'Saqlash uchun tizimga kiring.'});
            return;
        }
        const newState = await toggleSaveMovie(userId, currentHeroMovie.id);
        setIsHeroSaved(newState);
        addNotification({
            type: 'success', 
            title: newState ? 'Saqlandi' : 'O\'chirildi',
            message: newState ? 'Anime saqlanganlarga qo\'shildi' : 'Anime saqlanganlardan olib tashlandi'
        });
    };

    // --- SWIPE HANDLERS ---
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null); // Reset
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleManualNav('next');
        }
        if (isRightSwipe) {
            handleManualNav('prev');
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="pb-32 bg-[#050505] animate-fade-in">
            
            {/* HERO CAROUSEL - Parallax & Swipe Enabled */}
            <div 
                className="relative w-full h-[70vh] md:h-[850px] group overflow-hidden mb-16 shadow-2xl -mt-20"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div 
                    className="flex h-full transition-transform duration-1000 cubic-bezier(0.23, 1, 0.32, 1)"
                    style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                >
                    {heroMovies.map((movie, idx) => (
                        <div key={movie.id} className="relative w-full h-full flex-shrink-0 overflow-hidden">
                            {/* PARALLAX IMAGE LAYER */}
                            <div 
                                className="absolute inset-0 w-full h-[120%] -top-[10%]"
                                style={{ 
                                    // Rasm scroll bo'lganda sekinroq harakatlanadi (0.5 tezlikda)
                                    // Bu rasmning "joyida qolish" effektini beradi
                                    transform: `translateY(${scrollY * 0.5}px) scale(1.1)`,
                                    transition: 'transform 0.1s linear'
                                }}
                            >
                                <img 
                                    src={movie.posterUrl} 
                                    className={`w-full h-full object-cover transition-transform duration-[10000ms] ${heroIndex === idx ? 'scale-105' : 'scale-100'}`} 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-transparent to-transparent"></div>
                            </div>

                            {/* CONTENT LAYER - Normal Scroll (Faster than image) */}
                            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-24 lg:w-3/5 z-20 pb-12 md:pb-24">
                                <div className={`transition-all duration-1000 delay-300 transform ${heroIndex === idx ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                    <div className="flex items-center gap-3 mb-3 md:mb-5">
                                        <span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.6)]">
                                            {movie.access_type === 'premium' ? 'PREMIUM' : 'BEPUL'}
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                                            <span className="text-white font-black text-xs">{movie.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    
                                    <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white mb-3 md:mb-6 uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                                        {movie.title}
                                    </h1>
                                    
                                    <p className="text-zinc-300 text-sm md:text-lg mb-6 md:mb-8 max-w-xl line-clamp-3 font-medium opacity-90 leading-relaxed border-l-4 border-orange-600 pl-6 drop-shadow-md">
                                        {movie.plot}
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="px-8 md:px-10 py-4 bg-white text-black hover:bg-orange-600 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
                                        >
                                            <Play fill="currentColor" size={20} /> Hozir ko'rish
                                        </button>
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="px-8 md:px-10 py-4 bg-black/40 backdrop-blur-md text-white rounded-xl font-black uppercase tracking-widest text-[10px] md:text-[11px] hover:bg-zinc-800 transition-all border border-white/10 flex items-center justify-center gap-3"
                                        >
                                            <Info size={20} /> Batafsil
                                        </button>
                                        
                                        <button 
                                            onClick={handleHeroSave}
                                            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 border ${isHeroSaved ? 'bg-yellow-500 text-black border-yellow-500 shadow-yellow-500/30' : 'bg-black/40 backdrop-blur-md text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10'}`}
                                        >
                                            <Bookmark size={24} fill={isHeroSaved ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={() => handleManualNav('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-4 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex"><ChevronLeft size={24} /></button>
                <button onClick={() => handleManualNav('next')} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-4 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex"><ChevronRight size={24} /></button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
                    {heroMovies.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => { setHeroIndex(i); setIsAutoPlaying(false); }} 
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === heroIndex ? 'w-8 bg-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                        ></button>
                    ))}
                </div>
            </div>

            {/* CATALOG */}
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
