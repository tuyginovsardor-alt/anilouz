
import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GenreSection } from './components/GenreSection';
import { Gift, TrendingUp, Sparkles } from 'lucide-react';
import { Page } from './App';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  onNavigate?: (page: Page) => void;
}

const DASHBOARD_GENRES = [
    { key: 'action', label: '🔥 Jangari (Action)' },
    { key: 'romance', label: '💖 Romantika va Sevgi' },
    { key: 'fantasy', label: '🔮 Fantastika' },
    { key: 'comedy', label: '😂 Kulgi va Komediya' },
];

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onMovieClick, onNavigate }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getMovies().then(movies => {
            setAllMovies(movies);
            setIsLoading(false);
        });
    }, []);

    const getMoviesByGenre = (genreKey: string) => {
        const terms: Record<string, string[]> = {
            'action': ['action', 'jangari'],
            'comedy': ['comedy', 'komediya'],
            'fantasy': ['fantasy', 'fantastika'],
            'romance': ['romance', 'sevgi'],
        };
        const search = terms[genreKey] || [genreKey];
        return allMovies.filter(m => search.some(t => m.genre.toLowerCase().includes(t)));
    };

    if (isLoading) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="animate-fade-in space-y-10 pb-20">
            {/* Featured Banner (Netflix Style) */}
            <div 
                className="relative h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden group cursor-pointer"
                onClick={() => onNavigate && onNavigate('aniconcurs')}
            >
                <img src="https://images.unsplash.com/photo-1541562232579-512a21359920?auto=format&fit=crop&w=1200" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/40 to-transparent"></div>
                
                <div className="absolute bottom-10 left-10 max-w-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded">SPECIAL</div>
                        <span className="text-white font-bold flex items-center gap-1"><TrendingUp size={14} className="text-orange-500" /> Trendda</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">ANICONCURS 2025</h2>
                    <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-2">
                        Anime ko'ring, vazifalarni bajaring va har kuni kashlokga ARK to'plang. iPhone 15 Pro yutib olish imkoniyatini boy bermang!
                    </p>
                    <button className="px-8 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all shadow-lg">
                        <Gift size={20} /> HOZIR QATNASHISH
                    </button>
                </div>
            </div>

            {/* Content Rows */}
            <div className="space-y-4">
                <GenreSection 
                    title="🆕 Yangi qo'shilganlar" 
                    movies={allMovies.slice(0, 15)} 
                    onMovieClick={onMovieClick} 
                />

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

            {/* Newsletter / CTA */}
            <div className="glass-effect p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 border-orange-500/10">
                <div>
                   <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><Sparkles className="text-orange-500" /> Premium Olami</h3>
                   <p className="text-gray-400">Hech qanday reklamalarsiz va eng yuqori sifatda tomosha qilishni istaysizmi?</p>
                </div>
                <button 
                  onClick={() => onNavigate?.('dashboard')}
                  className="px-8 py-3 bg-orange-600 text-white rounded-full font-bold whitespace-nowrap hover:scale-105 transition-transform"
                >
                    PREMIUMGA O'TISH
                </button>
            </div>
        </div>
    );
};
