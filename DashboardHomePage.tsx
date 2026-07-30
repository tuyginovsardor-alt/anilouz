
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie } from './types';
import { getMovies, isMovieSaved, toggleSaveMovie } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Play, Star, TrendingUp, Info, ChevronLeft, ChevronRight, Bookmark, Plus, Moon, Crown, Compass } from 'lucide-react';
import { useNotification } from './hooks/useNotification';
import { Page } from './App';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  onMainNavigate?: (page: Page) => void;
}

const TITLE_STYLES = [
    "font-sans tracking-tighter", 
    "font-serif tracking-wide italic", 
    "font-mono tracking-tight", 
];

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onMovieClick, onMainNavigate }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isHeroSaved, setIsHeroSaved] = useState(false);
    
    const [scrollY, setScrollY] = useState(0);
    
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
            
            // SEO: Inject JSON-LD ItemList for Google Bot to discover movies
            if (movies.length > 0) {
                const schemaList = {
                    "@context": "https://schema.org",
                    "@type": "ItemList",
                    "numberOfItems": movies.length,
                    "itemListElement": movies.slice(0, 50).map((movie, index) => ({
                        "@type": "ListItem",
                        "position": index + 1,
                        "item": {
                            "@type": "Movie",
                            "name": movie.title,
                            "url": `https://anilo.uz/?movie_id=${movie.id}`,
                            "image": movie.posterUrl,
                            "datePublished": movie.year.toString(),
                            "genre": movie.genre,
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": movie.rating.toFixed(1),
                                "bestRating": "5",
                                "worstRating": "1"
                            }
                        }
                    }))
                };
                
                const scriptId = 'json-ld-catalog';
                let script = document.getElementById(scriptId) as HTMLScriptElement;
                if (!script) {
                    script = document.createElement('script');
                    script.id = scriptId;
                    script.type = 'application/ld+json';
                    document.head.appendChild(script);
                }
                script.text = JSON.stringify(schemaList);
            }

            setIsLoading(false);
        };
        fetch();

        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            const script = document.getElementById('json-ld-catalog');
            if (script) script.remove();
        };
    }, []);

    const heroMovies = allMovies.slice(0, 6);
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

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
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
            
            {/* HERO CAROUSEL */}
            <div 
                className="relative w-full h-[90vh] lg:h-[900px] group overflow-hidden mb-20 shadow-2xl -mt-24"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div 
                    className="flex h-full transition-transform duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
                    style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                >
                    {heroMovies.map((movie, idx) => (
                        <div key={movie.id} className="relative w-full h-full flex-shrink-0 overflow-hidden">
                            <div 
                                className="absolute inset-0 w-full h-full"
                                style={{ 
                                    transform: `translateY(${scrollY * 0.3}px) scale(1.05)`,
                                    transition: 'transform 0.1s linear'
                                }}
                            >
                                <img 
                                    src={movie.poster_url || movie.posterUrl} 
                                    className={`w-full h-full object-cover transition-transform duration-[20000ms] ease-out ${heroIndex === idx ? 'scale-110' : 'scale-100'}`} 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]"></div>
                            </div>

                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
                                <div className={`transition-all duration-1000 transform max-w-5xl ${heroIndex === idx ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                                    
                                    <div className="flex items-center justify-center gap-4 mb-8">
                                        <span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-2xl shadow-orange-600/50">
                                            YANGI
                                        </span>
                                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-2xl">
                                            <Star size={14} className="text-yellow-400 fill-yellow-400"/>
                                            <span className="text-white font-black text-xs">5.0</span>
                                        </div>
                                        <span className="bg-white/10 backdrop-blur-xl text-white text-[10px] font-black px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-[0.2em]">
                                            {movie.genre.split(',')[0]}
                                        </span>
                                    </div>
                                    
                                    <h1 className="text-5xl md:text-8xl lg:text-[10rem] font-black text-white mb-10 uppercase leading-[0.8] tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                                        {movie.title}
                                    </h1>
                                    
                                    <p className="text-zinc-300 text-sm md:text-lg lg:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed drop-shadow-2xl line-clamp-3">
                                        {movie.plot}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center gap-5">
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="h-16 px-12 bg-white text-black hover:bg-orange-600 hover:text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group"
                                        >
                                            <Play fill="currentColor" size={20}/> 
                                            KO'RISH
                                        </button>
                                        
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="h-16 px-12 bg-black/40 backdrop-blur-2xl border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95"
                                        >
                                            <Info size={20} />
                                            BATAFSIL
                                        </button>

                                        <button 
                                            className="h-16 px-12 bg-black/40 backdrop-blur-2xl border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95 group"
                                        >
                                            <Crown size={20} className="group-hover:animate-bounce" />
                                            OBUNA BO'LISH
                                        </button>
                                        
                                        <button 
                                            onClick={handleHeroSave}
                                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 border-2 ${isHeroSaved ? 'bg-orange-600 border-orange-600 text-white' : 'bg-black/40 border-white/10 text-white hover:bg-white/10'}`}
                                        >
                                            <Plus size={28} className={isHeroSaved ? 'rotate-45' : ''} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SLIDE NAVIGATION CONTROLS */}
                <div className="absolute top-1/2 -translate-y-1/2 left-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleManualNav('prev')} className="p-4 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-orange-600 transition-all active:scale-90">
                        <ChevronLeft size={32} />
                    </button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleManualNav('next')} className="p-4 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-orange-600 transition-all active:scale-90">
                        <ChevronRight size={32} />
                    </button>
                </div>

                {/* PAGINATION NUMBERS */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30 bg-black/20 backdrop-blur-xl px-10 py-4 rounded-full border border-white/5">
                    {[1, 2, 3, 4, 5, '...', 100].map((num, i) => (
                        <button 
                            key={i} 
                            onClick={() => { if(typeof num === 'number') setHeroIndex(i); setIsAutoPlaying(false); }} 
                            className={`text-[11px] font-black transition-all ${i === heroIndex ? 'text-orange-500 scale-125' : 'text-zinc-500 hover:text-white'}`}
                        >
                            {num}
                        </button>
                    ))}
                    <button className="text-zinc-600 hover:text-white transition-colors ml-2"><ChevronRight size={16} /></button>
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-12 space-y-32">
                {/* QUICK ACTIONS BAR */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                    {[
                        { label: 'TV Seriyalar', icon: <TrendingUp size={24} />, color: 'text-orange-500' },
                        { label: 'Filmlar', icon: <Play size={24} />, color: 'text-blue-500' },
                        { label: 'OVA/ONA', icon: <Info size={24} />, color: 'text-purple-500' },
                        { label: 'Maxsus', icon: <Star size={24} />, color: 'text-yellow-500' },
                        { label: 'Dublaj', icon: <Bookmark size={24} />, color: 'text-emerald-500' },
                        { label: 'Tarjima', icon: <TrendingUp size={24} />, color: 'text-pink-500' },
                        { label: 'Yangi', icon: <Plus size={24} />, color: 'text-red-500' },
                        { label: 'Eng yaxshi', icon: <Star size={24} />, color: 'text-cyan-500' },
                    ].map((item, i) => (
                        <button key={i} className="flex flex-col items-center gap-3 p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] hover:bg-white/[0.02] hover:border-white/10 transition-all group active:scale-95">
                            <div className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* 1. YANGI QO'SHILGANLAR */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-1 bg-orange-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Yangi Qo'shilganlar</h2>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-orange-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                            Barchasi
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {allMovies.slice(0, 6).map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </div>

                {/* 2. ANIMELAR */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Animelar</h2>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-purple-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                            Barchasi
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {allMovies.filter(m => m.type === 'anime').slice(0, 6).map(movie => (
                            <MovieCard key={`anime-${movie.id}`} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                        {allMovies.filter(m => m.type === 'anime').length === 0 && (
                            <div className="col-span-full py-10 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hozircha animelar yo'q</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. TARJIMA FILMLAR */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Tarjima Filmlar</h2>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                            Barchasi
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {allMovies.filter(m => m.type === 'kino').slice(0, 6).map(movie => (
                            <MovieCard key={`kino-${movie.id}`} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                        {allMovies.filter(m => m.type === 'kino').length === 0 && (
                            <div className="col-span-full py-10 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hozircha filmlar yo'q</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. DORAMALAR */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Doramalar</h2>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                            Barchasi
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {allMovies.filter(m => m.type === 'kdrama').slice(0, 6).map(movie => (
                            <MovieCard key={`kdrama-${movie.id}`} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                        {allMovies.filter(m => m.type === 'kdrama').length === 0 && (
                            <div className="col-span-full py-10 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hozircha doramalar yo'q</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. MULTFILMLAR */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-1 bg-pink-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Multfilmlar</h2>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-pink-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                            Barchasi
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {allMovies.filter(m => m.type === 'multfilm').slice(0, 6).map(movie => (
                            <MovieCard key={`multfilm-${movie.id}`} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                        {allMovies.filter(m => m.type === 'multfilm').length === 0 && (
                            <div className="col-span-full py-10 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hozircha multfilmlar yo'q</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* KATEGORIYALAR SECTION */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-1 bg-red-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Kategoriyalar</h2>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                            Barchasi
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                            { name: 'Action', count: 1240 },
                            { name: 'Adventure', count: 980 },
                            { name: 'Comedy', count: 1150 },
                            { name: 'Drama', count: 860 },
                            { name: 'Fantasy', count: 1030 },
                            { name: 'Horror', count: 320 },
                            { name: 'Romance', count: 780 },
                            { name: 'School', count: 540 },
                        ].map((cat, i) => (
                            <button key={i} className="flex items-center justify-between p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] hover:bg-white/[0.02] hover:border-white/10 transition-all group active:scale-95 text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-red-600 group-hover:text-white transition-all">
                                        <Compass size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white uppercase tracking-widest">{cat.name}</p>
                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">({cat.count})</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-zinc-800 group-hover:text-red-600" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* TOP REYTING SECTION */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-1 bg-yellow-500 rounded-full"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Top Reyting</h2>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-yellow-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                            To'liq Ro'yxat
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...allMovies].sort((a,b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 3).map((movie, idx) => (
                            <div key={`top-${movie.id}`} className="group relative bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-orange-500/50 transition-all">
                                <div className="flex items-center p-4 gap-6">
                                    <div className="relative w-24 h-32 flex-shrink-0 rounded-2xl overflow-hidden">
                                        <img src={movie.poster_url || movie.posterUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute top-2 left-2 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-black text-sm">
                                            #{idx + 1}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 line-clamp-1">{movie.title}</h3>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase">{movie.year}</span>
                                            <span className="text-[10px] font-black text-orange-500 uppercase">{movie.type}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Play size={12} className="text-orange-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{movie.view_count || 0} ko'rilgan</span>
                                        </div>
                                    </div>
                                    <button onClick={() => onMovieClick(movie)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SIZ UCHUN TAVSIYA ETILGAN */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-1 bg-red-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Siz uchun tavsiya etilgan</h2>
                        </div>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                            Barchasi
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {allMovies.slice().reverse().slice(0, 6).map(movie => (
                            <MovieCard key={`rec-${movie.id}`} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
