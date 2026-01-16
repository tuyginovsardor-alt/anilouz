import React, { useState, useEffect } from 'react';
import { Mic, Search, Star, ChevronRight, Film, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { UserProfile, Movie } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getMovies } from './services/dbService';
import { MovieCard } from './components/MovieCard';

interface StudioPageProps {
    onArtistClick: (userId: string) => void;
    onMovieClick: (movie: Movie) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({ onArtistClick, onMovieClick }) => {
    const [artists, setArtists] = useState<UserProfile[]>([]);
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [artistSearch, setArtistSearch] = useState('');
    const [movieSearch, setMovieSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [artistsRes, moviesRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('role', 'dub'),
                    getMovies()
                ]);
                setArtists((artistsRes.data || []) as UserProfile[]);
                setAllMovies(moviesRes);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredArtists = artists.filter(a => 
        a.full_name?.toLowerCase().includes(artistSearch.toLowerCase()) || 
        a.username?.toLowerCase().includes(artistSearch.toLowerCase())
    );

    const filteredMovies = allMovies.filter(m => 
        m.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
        m.translator?.toLowerCase().includes(movieSearch.toLowerCase())
    );

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="bg-[#050505] min-h-screen text-white pb-32 animate-fade-in">
            {/* HERO SECTION - SOLID & BOLD */}
            <div className="bg-zinc-900 border-b border-zinc-800 py-16 md:py-24 px-6 mb-16">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Sparkles size={14} /> Creative Community
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                            ANILO <span className="text-orange-600">STUDIO</span>
                        </h1>
                        <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-xs">O'zbek dublyaj ustalari va ijodkorlar maskani</p>
                    </div>

                    <div className="w-full md:w-96 bg-black border border-zinc-700 p-8 rounded-3xl shadow-2xl">
                        <p className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Ustalarni qidiring</p>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                            <input 
                                type="text" 
                                value={artistSearch}
                                onChange={e => setArtistSearch(e.target.value)}
                                placeholder="Ism yoki username..."
                                className="w-full bg-zinc-900 border border-zinc-800 py-4 pl-12 pr-6 rounded-2xl text-white focus:border-orange-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 space-y-24">
                
                {/* ARTISTS LIST */}
                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-1.5 h-10 bg-orange-600 rounded-full"></div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Ovoz Ustalarimiz</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredArtists.map(artist => (
                            <div 
                                key={artist.id}
                                onClick={() => onArtistClick(artist.id)}
                                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-orange-600/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 overflow-hidden group-hover:scale-105 transition-transform">
                                        {artist.avatar_url ? (
                                            <img src={artist.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Mic className="text-zinc-600"/></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-white uppercase tracking-tight truncate">{artist.full_name}</h3>
                                        <p className="text-orange-500 text-xs font-bold">@{artist.username}</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">4.9</span>
                                    </div>
                                    <ChevronRight size={18} className="text-zinc-700 group-hover:text-orange-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* DUBBED CONTENT CATALOGUE */}
                <section id="catalogue" className="pb-20">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Dublyaj Katalogi</h2>
                            </div>
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">Barcha o'zbek tilidagi animelar</p>
                        </div>

                        <div className="relative w-full md:w-80">
                            <input 
                                type="text" 
                                value={movieSearch}
                                onChange={e => setMovieSearch(e.target.value)}
                                placeholder="Katalogni qidirish..."
                                className="w-full bg-zinc-900 border border-zinc-800 py-3 px-12 rounded-full text-sm focus:border-blue-500 outline-none transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                        {filteredMovies.map(movie => (
                            <MovieCard 
                                key={movie.id} 
                                movie={movie} 
                                isActive={true} 
                                onClick={() => onMovieClick(movie)} 
                            />
                        ))}
                        {filteredMovies.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-800">
                                <Film size={48} className="mx-auto text-zinc-800 mb-4" />
                                <p className="text-zinc-600 font-black uppercase tracking-widest">Hech nima topilmadi</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};