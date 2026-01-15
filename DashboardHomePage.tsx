
import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { getMovies } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GenreSection } from './components/GenreSection';
import { Gift, TrendingUp, Sparkles, Search as SearchIcon } from 'lucide-react';
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

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onMovieClick, onNavigate, onSearch }) => {
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
        <div className="space-y-12 pb-10">
            {/* Featured Hero Banner */}
            <div 
                className="relative h-[45vh] md:h-[65vh] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-2xl border border-white/5"
                onClick={() => onNavigate && onNavigate('aniconcurs')}
            >
                <img src="https://images.unsplash.com/photo-1541562232579-512a21359920?auto=format&fit=crop&w=1600&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/40 to-transparent"></div>
                
                <div className="absolute bottom-8 left-8 md:bottom-16 md:left-16 max-w-2xl p-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">New Event</div>
                        <span className="text-white font-bold flex items-center gap-1.5"><TrendingUp size={16} className="text-orange-500" /> Trendda</span>
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black text-white mb-4 leading-none tracking-tighter">ANICONCURS <br/>2025</h2>
                    <p className="text-gray-300 text-sm md:text-lg mb-8 line-clamp-2 font-medium opacity-90">
                        Sevimli animelaringizni tomosha qiling va real pul yutuqlariga ega bo'ling. Har bir ko'rish sizni ARK hamyoningizni boyitadi!
                    </p>
                    <div className="flex gap-4">
                        <button className="px-10 py-4 bg-white text-black rounded-2xl font-black flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all transform active:scale-95 shadow-xl">
                            <Gift size={22} /> HOZIR QATNASHISH
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-12">
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

            {/* Premium CTA Row */}
            <div className="glass-effect p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-10 border-orange-500/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl group-hover:bg-orange-600/20 transition-all"></div>
                <div className="relative z-10">
                   <h3 className="text-3xl md:text-4xl font-black mb-3 flex items-center gap-3 text-white"><Sparkles className="text-orange-500" /> Premium Olami</h3>
                   <p className="text-gray-400 text-lg max-w-lg">Reklamasiz, 4K sifat va barcha konkurslarda cheksiz qatnashish imkoniyatini qo'lga kiriting.</p>
                </div>
                <button 
                  onClick={() => onNavigate?.('dashboard')}
                  className="px-12 py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-black text-xl whitespace-nowrap hover:scale-105 transition-transform shadow-2xl shadow-orange-600/20"
                >
                    OBUNA BO'LISH
                </button>
            </div>
        </div>
    );
};
