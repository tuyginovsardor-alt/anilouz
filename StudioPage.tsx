
import React, { useState, useEffect } from 'react';
import { Mic, Search, Star, ChevronRight, Film, TrendingUp, Sparkles, User, Play } from 'lucide-react';
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
                // Fetch users with 'dub' role
                const { data: artistsData } = await supabase.from('profiles').select('*').eq('role', 'dub');
                const moviesRes = await getMovies();
                setArtists((artistsData || []) as UserProfile[]);
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
        <div className="bg-[#050505] min-h-screen text-white pb-32 animate-fade-in font-sans">
            {/* STUDIO HEADER */}
            <div className="relative h-[300px] flex items-center bg-[#0a0a0a] border-b border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://i.imgur.com/8y9q1Xh.jpg')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                
                <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full border border-purple-600/30 text-[10px] font-black uppercase tracking-widest mb-4">
                            <Mic size={14} /> Professional Dublyaj
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-2">
                            Fundublar <span className="text-purple-600">Studio</span>
                        </h1>
                        <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-xs">O'zbek tilidagi eng sara ovozlar</p>
                    </div>
                    
                    {/* Search Artists Widget */}
                    <div className="bg-black/50 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] w-full md:w-96 shadow-2xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input 
                                type="text" 
                                value={artistSearch}
                                onChange={e => setArtistSearch(e.target.value)}
                                placeholder="Dublyaj ustasini qidirish..."
                                className="w-full bg-[#151515] border border-white/10 py-4 pl-12 pr-6 rounded-xl text-white text-sm focus:border-purple-500 outline-none transition-all placeholder:text-zinc-600 font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-16 space-y-20">
                
                {/* ARTISTS GRID */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                            <User size={20} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Bizning Jamoa</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredArtists.length === 0 && (
                            <div className="col-span-full py-10 text-center text-zinc-500 text-sm font-bold uppercase">Hozircha artistlar yo'q</div>
                        )}
                        {filteredArtists.map(artist => (
                            <div 
                                key={artist.id}
                                onClick={() => onArtistClick(artist.id)}
                                className="group relative bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all hover:-translate-y-2 shadow-xl"
                            >
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
                                <div className="p-8 flex flex-col items-center text-center relative z-10">
                                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-blue-500 mb-4 shadow-xl">
                                        <div className="w-full h-full rounded-full bg-black overflow-hidden p-1">
                                            {artist.avatar_url ? (
                                                <img src={artist.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600"><User size={32}/></div>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{artist.full_name}</h3>
                                    <p className="text-purple-500 text-[10px] font-bold uppercase tracking-widest">@{artist.username}</p>
                                    
                                    <div className="mt-6 flex items-center gap-4 text-xs font-bold text-zinc-500 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                                        <div className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500"/> 4.9</div>
                                        <div className="w-1 h-3 bg-zinc-700 rounded-full"></div>
                                        <div>{artist.fans_count || 0} Fans</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* WORK CATALOGUE */}
                <section>
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                                <Play size={20} fill="white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Dublyaj Katalogi</h2>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Studiya tomonidan tayyorlangan</p>
                            </div>
                        </div>
                        
                        <input 
                            type="text" 
                            value={movieSearch}
                            onChange={e => setMovieSearch(e.target.value)}
                            placeholder="Katalogni qidirish..."
                            className="w-full md:w-64 bg-[#0f0f0f] border border-zinc-800 py-3 px-6 rounded-full text-white text-xs font-bold focus:border-blue-500 outline-none"
                        />
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
                    </div>
                </section>
            </div>
        </div>
    );
};
