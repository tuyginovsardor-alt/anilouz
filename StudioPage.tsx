
import React, { useState, useEffect } from 'react';
import { Mic, Search, Star, ChevronRight, Film, TrendingUp, Sparkles, User, Play, Heart, Users, Eye } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { UserProfile, Movie, FandubChannel, FandubStory } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getMovies, getFandubChannels, getActiveStories, toggleFollowChannel } from './services/dbService';
import { MovieCard } from './components/MovieCard';
import { useNotification } from './hooks/useNotification';

export const StudioPage: React.FC<{ onArtistClick: (id: string) => void, onMovieClick: (m: Movie) => void }> = ({ onArtistClick, onMovieClick }) => {
    const [channels, setChannels] = useState<FandubChannel[]>([]);
    const [stories, setStories] = useState<any[]>([]);
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState<FandubChannel | null>(null);
    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const [c, s, m] = await Promise.all([
                getFandubChannels(user?.id),
                getActiveStories(),
                getMovies()
            ]);
            setChannels(c);
            setStories(s);
            setAllMovies(m.filter(movie => movie.is_fandub));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleFollow = async (e: React.MouseEvent, ch: FandubChannel) => {
        e.stopPropagation();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("Kirish kerak");
        try {
            const isNowFollowing = await toggleFollowChannel(user.id, ch.id);
            setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, is_following: isNowFollowing, subscriber_count: c.subscriber_count + (isNowFollowing ? 1 : -1) } : c));
            if (selectedChannel?.id === ch.id) setSelectedChannel({ ...selectedChannel, is_following: isNowFollowing });
            addNotification({ type: 'success', title: isNowFollowing ? 'Obuna bo\'lindi' : 'Obuna bekor qilindi', message: ch.name });
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 animate-fade-in font-sans">
            
            {/* 1. STORIES SECTION (Creator Avatars) */}
            <div className="container mx-auto px-6 pt-10 mb-12">
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                    {/* Your Story or Add Action */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 hover:border-purple-600 hover:text-purple-600 transition-all">
                            <Plus size={32}/>
                        </div>
                        <span className="text-[10px] font-black uppercase text-zinc-600">Mening Storyim</span>
                    </div>

                    {stories.map(story => (
                        <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
                            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-600 shadow-xl group-active:scale-95 transition-transform">
                                <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden">
                                    <img src={story.profiles?.avatar_url} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase text-white truncate max-w-[80px]">{story.profiles?.username}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6 space-y-20">
                
                {/* 2. CHANNELS LIST */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-purple-600 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.5)]"></div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Ommabop Kanallar</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {channels.map(ch => (
                            <div 
                                key={ch.id} 
                                onClick={() => setSelectedChannel(ch)}
                                className="group relative bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-purple-500/30 transition-all shadow-2xl"
                            >
                                {/* Channel Banner */}
                                <div className="h-32 bg-zinc-800 relative">
                                    <img src={ch.banner_url || 'https://i.imgur.com/8y9q1Xh.jpg'} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                                </div>

                                <div className="p-8 pt-0 flex flex-col items-center -mt-12 relative z-10">
                                    <div className="w-24 h-24 rounded-[2rem] p-1 bg-zinc-900 mb-4 shadow-2xl">
                                        <div className="w-full h-full rounded-[1.8rem] bg-black border-2 border-zinc-800 overflow-hidden">
                                            <img src={ch.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{ch.name}</h3>
                                    <p className="text-purple-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">@{ch.username}</p>
                                    
                                    <div className="flex gap-6 mb-6">
                                        <div className="text-center">
                                            <p className="text-sm font-black">{ch.subscriber_count}</p>
                                            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">A'zolar</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black">{ch.total_views}</p>
                                            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Ko'rishlar</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={(e) => handleFollow(e, ch)}
                                        className={`w-full py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${ch.is_following ? 'bg-zinc-800 text-zinc-400' : 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 active:scale-95'}`}
                                    >
                                        {ch.is_following ? 'Obuna bo\'lindi' : 'Obuna bo\'lish'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. FANDUB PROJECTS GRID */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Barcha Fandublar</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                        {allMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </section>
            </div>

            {/* CHANNEL DETAIL OVERLAY (MODAL) */}
            {selectedChannel && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedChannel(null)}></div>
                    <div className="relative bg-zinc-900 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-slide-in-up max-h-[90vh] flex flex-col border border-white/5">
                        {/* Header Banner */}
                        <div className="h-56 bg-zinc-800 relative flex-shrink-0">
                            <img src={selectedChannel.banner_url || 'https://i.imgur.com/8y9q1Xh.jpg'} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                            <button onClick={() => setSelectedChannel(null)} className="absolute top-6 right-6 p-2 bg-black/50 rounded-full text-white hover:bg-black transition-colors"><X size={24}/></button>
                        </div>

                        {/* Profile Info */}
                        <div className="px-10 pb-8 flex flex-col md:flex-row gap-8 -mt-20 relative z-10 flex-shrink-0">
                            <div className="w-40 h-40 rounded-[2.5rem] p-1.5 bg-zinc-900 shadow-2xl">
                                <img src={selectedChannel.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full rounded-[2.3rem] object-cover border-4 border-zinc-800" />
                            </div>
                            <div className="flex-1 md:pt-20">
                                <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">{selectedChannel.name}</h2>
                                <p className="text-purple-500 font-bold text-sm mb-4">@{selectedChannel.username}</p>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">{selectedChannel.bio || 'Bu kanal haqida ma\'lumot kiritilmagan.'}</p>
                            </div>
                            <div className="md:pt-20 flex flex-col gap-4">
                                <button onClick={(e) => handleFollow(e, selectedChannel)} className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${selectedChannel.is_following ? 'bg-zinc-800 text-zinc-500' : 'bg-purple-600 text-white shadow-xl shadow-purple-600/20'}`}>
                                    {selectedChannel.is_following ? 'Obuna bo\'lindi' : 'Obuna bo\'lish'}
                                </button>
                                <div className="flex justify-center gap-8 text-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                    <div><p className="font-black">{selectedChannel.subscriber_count}</p><p className="text-[8px] text-zinc-500 font-bold uppercase">Muxlislar</p></div>
                                    <div><p className="font-black">{selectedChannel.total_views}</p><p className="text-[8px] text-zinc-500 font-bold uppercase">Tomoshalar</p></div>
                                </div>
                            </div>
                        </div>

                        {/* Projects from this channel */}
                        <div className="flex-1 overflow-y-auto p-10 pt-4 custom-scrollbar">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 flex items-center gap-2"> <Film size={14}/> Loyihalar Katalogi</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                {allMovies.filter(m => m.channel_id === selectedChannel.id).map(movie => (
                                    <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const X = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
