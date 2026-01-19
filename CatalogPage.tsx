
import React, { useState, useEffect } from 'react';
import { getMovies } from './services/dbService';
import { Movie } from './types';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Search, Filter, SlidersHorizontal, Zap } from 'lucide-react';

interface CatalogPageProps {
    onMovieClick: (movie: Movie) => void;
}

const GENRES = [
    'Barchasi', 'Action', 'Sarguzasht', 'Komediya', 'Drama', 'Fantastika', 
    'Romantika', 'Qo\'rqinchli', 'Detektiv', 'Sport', 'Psixologik', 'Triller'
];

export const CatalogPage: React.FC<CatalogPageProps> = ({ onMovieClick }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('Barchasi');
    const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');

    useEffect(() => {
        const loadMovies = async () => {
            try {
                const movies = await getMovies();
                setAllMovies(movies);
                setFilteredMovies(movies);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadMovies();
    }, []);

    useEffect(() => {
        let result = allMovies;

        // 1. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(m => 
                m.title.toLowerCase().includes(q) || 
                m.genre.toLowerCase().includes(q)
            );
        }

        // 2. Genre Filter
        if (selectedGenre !== 'Barchasi') {
            result = result.filter(m => m.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
        }

        // 3. Access Filter
        if (accessFilter !== 'all') {
            result = result.filter(m => m.access_type === accessFilter);
        }

        setFilteredMovies(result);
    }, [searchQuery, selectedGenre, accessFilter, allMovies]);

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-[#050505] pb-32 animate-fade-in pt-4">
            
            {/* Header & Search */}
            <div className="container mx-auto px-4 sticky top-20 z-40 bg-[#050505]/95 backdrop-blur-md pb-4 pt-2">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">KATALOG</span>
                    </h1>
                    <div className="bg-zinc-900 border border-white/5 rounded-full px-4 py-1 text-xs text-zinc-400 font-bold uppercase tracking-widest">
                        {filteredMovies.length} Anime
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Anime nomi, janri..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white font-bold outline-none focus:border-orange-500 transition-all placeholder:text-zinc-600"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col gap-4">
                    {/* Access Type Toggle */}
                    <div className="flex bg-zinc-900 p-1 rounded-xl w-full sm:w-auto self-start">
                        {[
                            { id: 'all', label: 'Barchasi' },
                            { id: 'free', label: 'Bepul', icon: <Zap size={14} className="text-green-400"/> },
                            { id: 'premium', label: 'Premium', icon: <Zap size={14} className="text-yellow-400"/> },
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setAccessFilter(type.id as any)}
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                    accessFilter === type.id 
                                    ? 'bg-white text-black shadow-lg' 
                                    : 'text-zinc-500 hover:text-white'
                                }`}
                            >
                                {type.icon}
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Genres (Horizontal Scroll) */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {GENRES.map(genre => (
                            <button
                                key={genre}
                                onClick={() => setSelectedGenre(genre)}
                                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                    selectedGenre === genre
                                    ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-600/30'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
                                }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="container mx-auto px-4 mt-4">
                {filteredMovies.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl mt-8">
                        <Filter size={48} className="mx-auto text-zinc-800 mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest">Hech narsa topilmadi</p>
                        <button onClick={() => {setSearchQuery(''); setSelectedGenre('Barchasi'); setAccessFilter('all')}} className="mt-4 text-orange-500 text-sm font-bold hover:underline">Filtrlarni tozalash</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                        {filteredMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
