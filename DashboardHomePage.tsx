import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Page } from './App';
import { Play, Info } from 'lucide-react';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  onNavigate?: (page: Page) => void;
}

// FIX: Added onSearch to destructured arguments
export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onSearch, onMovieClick, onNavigate }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getMovies().then(movies => {
            setAllMovies(movies);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

    const featured = allMovies[0];

    return (
        <div className="pb-32 pt-20">
            {/* FEATURED HERO (Screenshot 3 style) */}
            {featured && (
                <div className="relative w-full h-[85vh] overflow-hidden">
                    {/* Background Blur Image */}
                    <div className="absolute inset-0 z-0">
                        <img src={featured.posterUrl} className="w-full h-full object-cover blur-[80px] opacity-40 scale-110" alt="" />
                    </div>

                    <div className="container mx-auto px-4 md:px-12 h-full flex flex-col md:flex-row items-center gap-12 relative z-10">
                        {/* Text Info */}
                        <div className="flex-1 text-center md:text-left pt-10 md:pt-0">
                            <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded">CINEMA HD</span>
                                <span className="text-gray-400 font-bold tracking-widest">{featured.year} • {featured.genre.split(',')[0]}</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase leading-none">
                                {featured.title}
                            </h1>
                            <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-xl line-clamp-3 font-medium opacity-80 leading-relaxed">
                                {featured.plot}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button 
                                    onClick={() => onMovieClick(featured)}
                                    className="px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl shadow-rose-600/20 active:scale-95"
                                >
                                    <Play fill="white" size={24} /> WATCH NOW
                                </button>
                                <button className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full font-bold text-lg backdrop-blur-xl transition-all flex items-center justify-center gap-2">
                                    <Info size={20} /> DETAILS
                                </button>
                            </div>
                        </div>

                        {/* Main Poster Display */}
                        <div className="hidden lg:block w-1/3 aspect-[2/3] relative group">
                            <div className="absolute inset-0 bg-rose-500/20 blur-3xl group-hover:bg-rose-500/40 transition-all rounded-[3rem]"></div>
                            <img 
                                src={featured.posterUrl} 
                                className="w-full h-full object-cover rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 relative z-10" 
                                alt={featured.title} 
                            />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-40 hero-gradient z-[5]"></div>
                </div>
            )}

            {/* SECTIONS */}
            <div className="container mx-auto px-4 md:px-12 -mt-20 relative z-20 space-y-16">
                <div>
                    <h2 className="text-3xl font-black text-white mb-8 tracking-tight flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-rose-600"></div>
                        NEW ARRIVALS
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
                        {allMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};