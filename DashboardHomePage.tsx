import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Page } from './App';
import { Play, Info, Sparkles } from 'lucide-react';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  onNavigate?: (page: Page) => void;
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onSearch, onMovieClick, onNavigate }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getMovies().then(movies => {
            setAllMovies(movies);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

    const featured = allMovies[0];

    return (
        <div className="pb-32 pt-0">
            {/* CINEMATIC HERO */}
            {featured && (
                <div className="relative w-full h-[90vh] overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img src={featured.posterUrl} className="w-full h-full object-cover blur-[100px] opacity-30 scale-125" alt="" />
                    </div>

                    <div className="container mx-auto px-4 md:px-12 h-full flex flex-col md:flex-row items-center gap-16 relative z-10">
                        <div className="flex-1 text-center md:text-left pt-20 md:pt-0">
                            <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
                                <Sparkles size={16} className="text-orange-500 fill-orange-500" />
                                <span className="text-gray-400 font-black text-xs tracking-[0.3em] uppercase">Trending Now</span>
                            </div>
                            <h1 className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter uppercase leading-none drop-shadow-2xl">
                                {featured.title}
                            </h1>
                            <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl line-clamp-3 font-medium leading-relaxed opacity-80">
                                {featured.plot}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
                                <button 
                                    onClick={() => onMovieClick(featured)}
                                    className="px-12 py-5 bg-white text-black hover:bg-orange-500 hover:text-white rounded-full font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95"
                                >
                                    <Play fill="currentColor" size={18} /> Watch Now
                                </button>
                                <button className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-sm uppercase tracking-widest backdrop-blur-xl transition-all flex items-center justify-center gap-2">
                                    <Info size={18} /> Details
                                </button>
                            </div>
                        </div>

                        <div className="hidden lg:block w-1/3 aspect-[2/3] relative">
                            <img 
                                src={featured.posterUrl} 
                                className="w-full h-full object-cover rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5 relative z-10" 
                                alt={featured.title} 
                            />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-64 hero-gradient z-[5]"></div>
                </div>
            )}

            {/* SECTIONS */}
            <div className="container mx-auto px-4 md:px-12 -mt-24 relative z-20 space-y-24">
                <div>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-4">
                            <div className="w-8 h-0.5 bg-orange-600"></div>
                            Popular Anime
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                        {allMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};