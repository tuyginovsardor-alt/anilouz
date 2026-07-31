
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie } from './types';
import { getMovies, isMovieSaved, toggleSaveMovie } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Play, Star, TrendingUp, Info, ChevronLeft, ChevronRight, Bookmark, Plus, Zap, Heart, History, Clock, Flame } from 'lucide-react';
import { useNotification } from './hooks/useNotification';
import { Page } from './App';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  onMainNavigate?: (page: Page) => void;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onMovieClick, onMainNavigate }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isHeroSaved, setIsHeroSaved] = useState(false);
    
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
    }, []);

    const heroMovies = allMovies.slice(0, 5);
    const currentHeroMovie = heroMovies[heroIndex];

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

    useEffect(() => {
        if (isAutoPlaying && heroMovies.length > 0) {
            timerRef.current = window.setInterval(nextHero, 8000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoPlaying, nextHero, heroMovies.length]);

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

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#131313]"><LoadingSpinner /></div>;

    return (
        <div className="pb-32 animate-fade-in bg-[#131313]">
            {/* Hero Section */}
            {currentHeroMovie && (
                <section className="relative h-[500px] bg-[#1A1A1A] overflow-hidden group rounded-[32px] mx-12 mt-8">
                    <div className="absolute inset-0">
                        <img 
                            src={currentHeroMovie.posterUrl || currentHeroMovie.poster_url} 
                            className="w-full h-full object-cover opacity-60 transition-transform duration-[10000ms] scale-105 group-hover:scale-110" 
                            alt="" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#131313] via-[#131313]/70 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent"></div>
                    </div>

                    <div className="relative h-full flex flex-col justify-center px-12 z-10 max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-[#ffb77d] text-[#4d2600] text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase">Trendda</span>
                            <div className="flex items-center gap-1 text-[#ffb77d]">
                                <Star size={18} className="fill-current" />
                                <span className="font-bold text-sm">{currentHeroMovie.rating.toFixed(1)}</span>
                            </div>
                        </div>

                        <h2 className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter leading-none uppercase drop-shadow-xl">
                            {currentHeroMovie.title}
                        </h2>

                        <div className="flex items-center gap-4 text-zinc-400 font-bold text-xs mb-6 uppercase tracking-widest">
                            <span>{currentHeroMovie.year}</span>
                            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                            <span>{currentHeroMovie.genre.split(',')[0]}</span>
                        </div>

                        <p className="text-zinc-300 text-base mb-8 max-w-xl leading-relaxed font-medium drop-shadow-lg line-clamp-3">
                            {currentHeroMovie.plot}
                        </p>

                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => onMovieClick(currentHeroMovie)}
                                className="bg-[#ff8c00] text-white font-bold px-8 py-4 rounded-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ff8c00]/20"
                            >
                                <Play fill="currentColor" size={20} />
                                <span className="text-sm uppercase tracking-tight font-black">Tomosha qilish</span>
                            </button>
                            <button 
                                onClick={handleHeroSave}
                                className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold px-8 py-4 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-all"
                            >
                                <Plus size={20} className={isHeroSaved ? 'rotate-45' : ''} />
                                <span className="text-sm uppercase tracking-tight font-black">Sevimli</span>
                            </button>
                        </div>

                        {/* Slide Indicators */}
                        <div className="absolute bottom-8 left-12 flex gap-2">
                            {heroMovies.map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => { setHeroIndex(i); setIsAutoPlaying(false); }} 
                                    className={`transition-all duration-500 rounded-full h-1.5 ${i === heroIndex ? 'w-8 bg-orange-500' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Sidebar Panel: Continue Watching */}
                    <div className="absolute top-0 right-0 bottom-0 w-80 bg-black/40 backdrop-blur-xl border-l border-white/10 flex flex-col p-6 overflow-hidden hidden xl:flex">
                        <h3 className="text-sm font-black text-white mb-6 flex items-center justify-between uppercase">
                            <span>Davom etayotgan</span>
                            <ChevronRight size={20} className="text-orange-500" />
                        </h3>
                        <div className="space-y-4">
                            {allMovies.slice(5, 9).map((m, idx) => (
                                <div key={m.id} className="flex gap-3 group/item cursor-pointer" onClick={() => onMovieClick(m)}>
                                    <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                                        <img src={m.posterUrl || m.poster_url} className="w-full h-full object-cover transition-transform group-hover/item:scale-110" alt="" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                        <h4 className="text-[12px] font-bold text-white truncate group-hover/item:text-orange-500 transition-colors uppercase">{m.title}</h4>
                                        <p className="text-[10px] text-zinc-500 mb-2">{Math.floor(Math.random() * 12) + 1}-qism</p>
                                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div className="bg-orange-500 h-full" style={{ width: `${Math.floor(Math.random() * 60) + 30}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Main Content Areas */}
            <div className="px-12 mt-16 space-y-16">
                {/* Mashhur Animelar Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-600/20">
                                <Flame size={20} className="fill-current" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Mashhur animelar</h3>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-orange-500 font-black text-[10px] uppercase tracking-widest transition-all group">
                            Barchasini ko'rish
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {allMovies.slice(0, 12).map((movie) => (
                            <MovieCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie)} isActive={false} />
                        ))}
                    </div>
                </section>

                {/* Yangi Chiqarilganlar Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-600/20">
                                <Zap size={20} className="fill-current" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Yangi chiqarilganlar</h3>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 font-black text-[10px] uppercase tracking-widest transition-all group">
                            Barchasini ko'rish
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {allMovies.filter(m => m.type === 'anime').slice(0, 12).map((movie) => (
                            <MovieCard key={`new-${movie.id}`} movie={movie} onClick={() => onMovieClick(movie)} isActive={false} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
