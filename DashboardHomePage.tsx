
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
                className="relative w-full h-[60vh] md:h-[80vh] group overflow-hidden mb-12 md:mb-20 shadow-2xl -mt-24"
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
                                    transform: `translateY(${scrollY * 0.2}px)`,
                                    transition: 'transform 0.1s linear'
                                }}
                            >
                                <img 
                                    src={movie.poster_url || movie.posterUrl} 
                                    className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${heroIndex === idx ? 'scale-110' : 'scale-100'}`} 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>
                            </div>

                            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 z-20 max-w-6xl mx-auto">
                                <div className={`transition-all duration-1000 transform ${heroIndex === idx ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                    
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] shadow-2xl shadow-orange-600/50">
                                            YANGI
                                        </span>
                                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-3 py-1 rounded-lg border border-white/10 shadow-2xl">
                                            <Star size={12} className="text-yellow-400 fill-yellow-400"/>
                                            <span className="text-white font-black text-xs">{movie.rating.toFixed(1)}</span>
                                        </div>
                                        <span className="bg-white/10 backdrop-blur-xl text-white text-[10px] font-black px-3 py-1 rounded-lg border border-white/10 uppercase tracking-[0.2em]">
                                            {movie.genre.split(',')[0]}
                                        </span>
                                    </div>
                                    
                                    <h1 className="text-4xl md:text-8xl lg:text-9xl font-black text-white mb-6 uppercase leading-[0.9] tracking-tighter drop-shadow-2xl max-w-4xl">
                                        {movie.title}
                                    </h1>
                                    
                                    <p className="text-zinc-300 text-xs md:text-lg max-w-2xl mb-10 font-medium leading-relaxed drop-shadow-2xl line-clamp-2 md:line-clamp-3">
                                        {movie.plot}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="px-8 md:px-12 py-4 md:py-5 bg-white text-black hover:bg-orange-600 hover:text-white rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group"
                                        >
                                            <Play fill="currentColor" size={20}/> 
                                            KO'RISH
                                        </button>
                                        
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="px-8 md:px-12 py-4 md:py-5 bg-black/40 backdrop-blur-2xl border border-white/10 text-white rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95"
                                        >
                                            <Info size={20} />
                                            BATAFSIL
                                        </button>

                                        <button 
                                            onClick={handleHeroSave}
                                            className={`p-4 md:p-5 rounded-2xl md:rounded-[2rem] flex items-center justify-center transition-all active:scale-90 border ${isHeroSaved ? 'bg-orange-600 border-orange-600 text-white' : 'bg-black/40 backdrop-blur-xl border-white/10 text-white hover:bg-white/10'}`}
                                        >
                                            <Plus size={24} className={isHeroSaved ? 'rotate-45' : ''} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SLIDE NAVIGATION CONTROLS - Desktop Only */}
                <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleManualNav('prev')} className="p-4 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-orange-600 transition-all active:scale-90">
                        <ChevronLeft size={32} />
                    </button>
                </div>
                <div className="hidden md:block absolute top-1/2 -translate-y-1/2 right-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleManualNav('next')} className="p-4 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-orange-600 transition-all active:scale-90">
                        <ChevronRight size={32} />
                    </button>
                </div>

                {/* PAGINATION INDICATORS */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-black/20 backdrop-blur-xl px-6 py-3 rounded-full border border-white/5">
                    {heroMovies.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => { setHeroIndex(i); setIsAutoPlaying(false); }} 
                            className={`transition-all duration-500 rounded-full ${i === heroIndex ? 'w-8 h-1.5 bg-orange-600' : 'w-1.5 h-1.5 bg-zinc-500 hover:bg-white'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-12 mt-12">
                <div className="flex flex-col lg:flex-row gap-16 md:gap-24">
                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 space-y-24 md:space-y-32">
                        
                        {/* STUDIYALAR SECTION */}
                        <div>
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="h-6 w-1 bg-white rounded-full"></div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Studiyalar</h2>
                                </div>
                                <button onClick={() => onMainNavigate?.('studio')} className="flex items-center gap-2 text-zinc-500 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                                    Barchasi
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="flex gap-4 md:gap-8 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
                                {[
                                    { name: 'Anilo', color: 'from-orange-600 to-red-600', icon: 'A' },
                                    { name: 'Kuzuki', color: 'from-purple-600 to-blue-600', icon: 'K' },
                                    { name: 'A-Media', color: 'from-emerald-600 to-teal-600', icon: 'AM' },
                                    { name: 'DubUZ', color: 'from-blue-600 to-indigo-600', icon: 'D' },
                                    { name: 'AnimeStar', color: 'from-pink-600 to-rose-600', icon: 'AS' },
                                    { name: 'Fandub', color: 'from-yellow-600 to-orange-600', icon: 'F' },
                                ].map((studio, i) => (
                                    <div key={i} className="flex-shrink-0 w-24 md:w-36 flex flex-col items-center gap-4 group cursor-pointer" onClick={() => onMainNavigate?.('studio')}>
                                        <div className={`w-16 h-16 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${studio.color} flex items-center justify-center text-white text-lg md:text-3xl font-black shadow-2xl group-hover:scale-110 transition-transform duration-500 border-4 border-white/10`}>
                                            {studio.icon}
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">{studio.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* YANGI QO'SHILGANLAR */}
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-12">
                                {allMovies.slice(0, 10).map((movie, i) => (
                                    <MovieCard key={movie.id} movie={movie} isActive={i === 0} onClick={() => onMovieClick(movie)} />
                                ))}
                            </div>
                        </div>

                        {/* ANIMELAR */}
                        <div>
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mashhur Animelar</h2>
                                </div>
                                <button className="flex items-center gap-2 text-zinc-500 hover:text-purple-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors group">
                                    Barchasi
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-12">
                                {allMovies.filter(m => m.type === 'anime').slice(0, 10).map((movie) => (
                                    <MovieCard key={`anime-${movie.id}`} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SIDE PANEL (Reference Style) */}
                    <div className="hidden xl:block w-96 space-y-16">
                        {/* QUICK ACCESS */}
                        <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-8 px-2">Tez Ko'rish</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Eng yangi seriyalar', icon: <TrendingUp size={16} className="text-orange-500" /> },
                                    { label: 'Eng ko\'p ko\'rilgan', icon: <Compass size={16} className="text-blue-500" /> },
                                    { label: 'Eng yaxshi reyting', icon: <Star size={16} className="text-yellow-500" /> },
                                    { label: 'Tavsiya etilgan', icon: <Play size={16} className="text-purple-500" /> },
                                    { label: 'Sevimli anime', icon: <Bookmark size={16} className="text-pink-500" /> },
                                ].map((item, i) => (
                                    <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {item.icon}
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white transition-colors">{item.label}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-zinc-800 group-hover:text-white transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TOP ANIME - Real Data from Supabase */}
                        <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-10 px-2">
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Top Anime</h3>
                                <div className="flex gap-2">
                                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest border border-orange-500/30 px-2.5 py-1 rounded-lg">Kun</span>
                                    <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest border border-white/5 px-2.5 py-1 rounded-lg hover:text-white transition-colors cursor-pointer">Hafta</span>
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                {[...allMovies].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 6).map((movie, i) => (
                                    <div 
                                        key={movie.id} 
                                        onClick={() => onMovieClick(movie)}
                                        className="flex items-center gap-5 group cursor-pointer"
                                    >
                                        <span className="text-3xl font-black text-zinc-900 group-hover:text-orange-600/50 transition-colors w-8">{i + 1}</span>
                                        <div className="w-16 h-20 rounded-xl overflow-hidden shadow-2xl shrink-0 border border-white/5">
                                            <img src={movie.poster_url || movie.posterUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1 mb-2 group-hover:text-orange-500 transition-colors">{movie.title}</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="text-[10px] font-black text-zinc-500">{movie.rating.toFixed(1)}</span>
                                                </div>
                                                <div className="w-1 h-1 bg-zinc-800 rounded-full"></div>
                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">{(movie.view_count || 0).toLocaleString()} ko'rish</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button className="w-full mt-10 py-4 bg-white/5 border border-white/5 rounded-2xl text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all">
                                To'liq ro'yxat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
