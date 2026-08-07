
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie } from '../types';
import { getMovies, isMovieSaved, toggleSaveMovie } from '../services/dbService';
import { supabase } from '../supabaseClient';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MovieCard } from '../components/MovieCard';
import { Play, Star, TrendingUp, Info, ChevronLeft, ChevronRight, Bookmark, Plus, Zap, Heart, History, Clock, Flame } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { Page } from '../types';

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
        <div className="pb-16 animate-fade-in bg-[#131313]">
            {/* Hero Section */}
            {currentHeroMovie && (
                <section className="relative h-[380px] bg-[#1A1A1A] overflow-hidden group rounded-[24px] mx-5 mt-5">
                    <div className="absolute inset-0">
                        <img 
                            src={currentHeroMovie.posterUrl || currentHeroMovie.poster_url} 
                            className="w-full h-full object-cover opacity-50 transition-transform duration-[10000ms] scale-105 group-hover:scale-110" 
                            alt="" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#131313] via-[#131313]/80 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent"></div>
                    </div>

                    <div className="relative h-full flex flex-col justify-center px-8 z-10 max-w-xl">
                        <div className="flex items-center gap-2 mb-2.5">
                            <span className="bg-[#ffb77d] text-[#4d2600] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Trendda</span>
                            <div className="flex items-center gap-1 text-[#ffb77d]">
                                <Star size={14} className="fill-current" />
                                <span className="font-bold text-[10px]">{currentHeroMovie.rating.toFixed(1)}</span>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter leading-tight uppercase drop-shadow-xl">
                            {currentHeroMovie.title}
                        </h2>

                        <div className="flex items-center gap-3 text-zinc-500 font-bold text-[9px] mb-5 uppercase tracking-widest">
                            <span>{currentHeroMovie.year}</span>
                            <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                            <span>{currentHeroMovie.genre.split(',')[0]}</span>
                        </div>

                        <p className="text-zinc-400 text-[11px] mb-7 max-w-sm leading-relaxed font-medium drop-shadow-lg line-clamp-2">
                            {currentHeroMovie.plot}
                        </p>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => onMovieClick(currentHeroMovie)}
                                className="bg-[#ff8c00] text-white font-black px-5 py-2.5 rounded-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ff8c00]/20"
                            >
                                <Play fill="currentColor" size={14} />
                                <span className="text-[10px] uppercase tracking-widest">Tomosha qilish</span>
                            </button>
                            <button 
                                onClick={handleHeroSave}
                                className="bg-white/5 backdrop-blur-md text-white border border-white/10 font-black px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all"
                            >
                                <Plus size={14} className={isHeroSaved ? 'rotate-45' : ''} />
                                <span className="text-[10px] uppercase tracking-widest">Sevimli</span>
                            </button>
                        </div>

                        {/* Slide Indicators */}
                        <div className="absolute bottom-5 left-8 flex gap-1.5">
                            {heroMovies.map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => { setHeroIndex(i); setIsAutoPlaying(false); }} 
                                    className={`transition-all duration-500 rounded-full h-1 ${i === heroIndex ? 'w-6 bg-orange-500' : 'w-2 bg-white/10 hover:bg-white/20'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Sidebar Panel: Continue Watching */}
                    <div className="absolute top-0 right-0 bottom-0 w-64 bg-black/50 backdrop-blur-xl border-l border-white/5 flex flex-col p-4 overflow-hidden hidden xl:flex">
                        <h3 className="text-[10px] font-black text-white mb-4 flex items-center justify-between uppercase tracking-widest">
                            <span>Davom etayotgan</span>
                            <ChevronRight size={14} className="text-orange-500" />
                        </h3>
                        <div className="space-y-3">
                            {allMovies.slice(5, 9).map((m) => (
                                <div key={m.id} className="flex gap-2.5 group/item cursor-pointer" onClick={() => onMovieClick(m)}>
                                    <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 relative bg-zinc-800 border border-white/5">
                                        <img src={m.posterUrl || m.poster_url} className="w-full h-full object-cover transition-transform group-hover/item:scale-110" alt="" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                        <h4 className="text-[10px] font-bold text-white truncate group-hover/item:text-orange-500 transition-colors uppercase tracking-tight">{m.title}</h4>
                                        <p className="text-[8px] text-zinc-600 mb-1.5 uppercase font-black">{Math.floor(Math.random() * 12) + 1}-qism</p>
                                        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="bg-orange-600 h-full" style={{ width: `${Math.floor(Math.random() * 60) + 30}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Main Content Areas */}
            <div className="px-5 mt-8 space-y-8">
                {/* Mashhur Animelar Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-orange-600/10 rounded-lg flex items-center justify-center text-orange-500 border border-orange-600/20">
                                <Flame size={12} className="fill-current" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Mashhur animelar</h3>
                        </div>
                        <button className="flex items-center gap-1 text-zinc-600 hover:text-orange-500 font-black text-[7px] uppercase tracking-widest transition-all group">
                            Barchasini ko'rish
                            <ChevronRight size={8} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                        {allMovies.slice(0, 16).map((movie) => (
                            <MovieCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie)} isActive={false} />
                        ))}
                    </div>
                </section>

                {/* Yangi Chiqarilganlar Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-600/20">
                                <Zap size={12} className="fill-current" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Yangi chiqarilganlar</h3>
                        </div>
                        <button className="flex items-center gap-1 text-zinc-600 hover:text-blue-500 font-black text-[7px] uppercase tracking-widest transition-all group">
                            Barchasini ko'rish
                            <ChevronRight size={8} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                        {allMovies.filter(m => m.type === 'anime').slice(0, 16).map((movie) => (
                            <MovieCard key={`new-${movie.id}`} movie={movie} onClick={() => onMovieClick(movie)} isActive={false} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
