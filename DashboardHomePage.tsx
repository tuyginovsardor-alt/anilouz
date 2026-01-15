


import React, { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GenreSection } from './components/GenreSection';
import { GiftIcon } from './components/icons/GiftIcon';
import { Page } from './App';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  onNavigate?: (page: Page) => void; // New prop
}

// Dashboardda ko'rsatiladigan asosiy janrlar ro'yxati
const DASHBOARD_GENRES = [
    { key: 'action', label: 'Jangari (Action)' },
    { key: 'comedy', label: 'Kulgi va Komediya' },
    { key: 'adventure', label: 'Sarguzashtlar olami' },
    { key: 'romance', label: 'Romantika va Sevgi' },
    { key: 'fantasy', label: 'Fantastika' },
    { key: 'drama', label: 'Drama' },
    { key: 'sci-fi', label: 'Ilmiy Fantastika' },
    { key: 'horror', label: 'Qo\'rqinchli' },
];

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onSearch, onMovieClick, onNavigate }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const movies = await getMovies();
                setAllMovies(movies);
            } catch (err) {
                console.error(err);
                setError("Animelar ro'yxatini yuklashda xatolik.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMovies();
    }, []);

    // Janr bo'yicha filtrlash funksiyasi (Admin panelda tanlangan janrlarga mos tushadi)
    const getMoviesByGenre = (genreKey: string) => {
        const searchTerms: Record<string, string[]> = {
            'action': ['action', 'jangari'],
            'comedy': ['comedy', 'komediya', 'kulgi'],
            'adventure': ['adventure', 'sarguzasht'],
            'romance': ['romance', 'romantika', 'sevgi'],
            'fantasy': ['fantasy', 'fantastika'],
            'drama': ['drama'],
            'sci-fi': ['sci-fi', 'ilmiy'],
            'horror': ['horror', 'qo\'rqinchli', 'dahshat']
        };

        const terms = searchTerms[genreKey] || [genreKey];

        return allMovies.filter(m => {
            const movieGenres = m.genre ? m.genre.toLowerCase() : '';
            return terms.some(term => movieGenres.includes(term));
        });
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
                    Xush kelibsiz!
                </h1>
                <p className="text-gray-400 text-sm">Bugun nima tomosha qilamiz?</p>
            </div>
            
            <div className="max-w-2xl mx-auto mb-12">
                <SearchBar onSearch={onSearch} isLoading={false} />
            </div>

            {/* ANICONCURS BANNER */}
            <div 
                className="mb-12 relative overflow-hidden rounded-2xl group cursor-pointer" 
                onClick={() => onNavigate && onNavigate('aniconcurs')}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-blue-900 opacity-90"></div>
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
                
                <div className="relative p-6 sm:p-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">YANGI</span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white">AniConcurs</h2>
                        </div>
                        <p className="text-gray-300 max-w-md text-sm sm:text-base mb-4">
                            O'ynang, ATC yig'ing va qimmatbaho sovrinlar yutib oling! Premium obunachilar uchun maxsus.
                        </p>
                        <button className="bg-white text-purple-900 px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2">
                            <GiftIcon className="w-5 h-5" />
                            O'ynashni boshlash
                        </button>
                    </div>
                    <div className="hidden sm:block transform group-hover:scale-110 transition-transform duration-500">
                        <div className="text-6xl">🎡</div>
                    </div>
                </div>
            </div>

            {isLoading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
            
            {error && !isLoading && (
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && allMovies.length === 0 && !error && (
                 <div className="text-center text-gray-500 py-10">Bazada hozircha anime yo'q.</div>
            )}

            {!isLoading && allMovies.length > 0 && (
                <div className="space-y-6">
                    {/* 1. Eng asosiysi: Tavsiya etiladi / Ommabop (Barchasidan aralash yoki yangilari) */}
                    <GenreSection 
                        title="🔥 Siz uchun tavsiya etiladi" 
                        movies={allMovies.slice(0, 14)} // Eng so'nggi 14 tasini oladi
                        onMovieClick={onMovieClick} 
                    />

                    {/* 2. Qolgan janrlar ketma-ket */}
                    {DASHBOARD_GENRES.map((genre) => {
                        const genreMovies = getMoviesByGenre(genre.key);
                        if (genreMovies.length === 0) return null;

                        return (
                            <GenreSection 
                                key={genre.key}
                                title={genre.label}
                                movies={genreMovies}
                                onMovieClick={onMovieClick}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};