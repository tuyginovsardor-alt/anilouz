import React, { useState, useEffect, useCallback } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Play, ChevronRight, ChevronLeft, Calendar, Star } from 'lucide-react';

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
        setHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, [heroMovies.length]);

    const prevHero = () => {
        setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
    };

    useEffect(() => {
        if (heroMovies.length === 0) return;
        const interval = setInterval(nextHero, 5000);
        return () => clearInterval(interval);
    }, [heroMovies.length, nextHero]);

    if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

    const currentHero = heroMovies[heroIndex];

    return (
        <div className="pb-20">
            {/* HERO SECTION */}
            {currentHero && (
                <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl mb-12 shadow-2xl">
                    <img 
                        src={currentHero.posterUrl} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60" 
                        alt="" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-2/3">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">Top Rated</span>
                            <span className="text-gray-300 font-bold text-sm flex items-center gap-1"><Star size={14} className="text-yellow-500 fill-yellow-500"/> {currentHero.rating.toFixed(1)}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
                            {currentHero.title}
                        </h1>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => onMovieClick(currentHero)}
                                className="px-8 py-4 bg-white text-black hover:bg-orange-600 hover:text-white rounded-xl font-bold transition-all flex items-center gap-2"
                            >
                                <Play fill="currentColor" size={20} /> Ko'rish
                            </button>
                            <button 
                                onClick={() => onMovieClick(currentHero)}
                                className="px-8 py-4 bg-gray-800/80 text-white rounded-xl font-bold backdrop-blur-md hover:bg-gray-700 transition-all"
                            >
                                Tafsilotlar
                            </button>
                        </div>
                    </div>

                    <div className="absolute bottom-8 right-8 flex gap-2">
                        <button onClick={prevHero} className="p-3 bg-white/10 hover:bg-orange-600 rounded-full text-white backdrop-blur-md transition-all"><ChevronLeft size={24}/></button>
                        <button onClick={nextHero} className="p-3 bg-white/10 hover:bg-orange-600 rounded-full text-white backdrop-blur-md transition-all"><ChevronRight size={24}/></button>
                    </div>
                </div>
            )}

            {/* MOVIE LISTS */}
            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                        <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
                        Barcha Animelar
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {allMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};