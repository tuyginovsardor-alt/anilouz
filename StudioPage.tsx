
import React, { useState, useEffect } from 'react';
import { 
    Mic, Star, ChevronRight, Film, TrendingUp, User, Play, Heart, Users, Eye, Plus, X, Search, CheckCircle, Bell
} from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { UserProfile, Movie, FandubChannel, FandubStory } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getMovies, getFandubChannels, getActiveStories, toggleFollowChannel } from './services/dbService';
import { MovieCard } from './components/MovieCard';
import { useNotification } from './hooks/useNotification';

export const StudioPage: React.FC<{ onMovieClick: (m: Movie) => void }> = ({ onMovieClick }) => {
    const [channels, setChannels] = useState<FandubChannel[]>([]);
    const [stories, setStories] = useState<FandubStory[]>([]);
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState<FandubChannel | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const { addNotification } = useNotification();

    useEffect(() => { 
        supabase.auth.getUser().then(({data}) => setCurrentUser(data.user));
        loadData(); 
    }, []);

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

    const handleFollow = async (ch: FandubChannel) => {
        if (!currentUser) return alert("Avval kiring");
        try {
            const isNowFollowing = await toggleFollowChannel(currentUser.id, ch.id);
            setChannels(prev => prev.map(c => c.id === ch.id ? { 
                ...c, 
                is_following: isNowFollowing, 
                subscriber_count: c.subscriber_count + (isNowFollowing ? 1 : -1) 
            } : c));
            if (selectedChannel?.id === ch.id) setSelectedChannel({ ...selectedChannel, is_following: isNowFollowing });
            addNotification({ type: 'success', title: isNowFollowing ? 'Obuna bo\'lindi' : 'Bekor qilindi', message: ch.name });
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 animate-fade-in font-sans">
            
            {/* 1. STORIES SECTION - IG STYLE */}
            <div className="w-full bg-[#0a0a0a] border-b border-white/5 py-8">
                <div className="container mx-auto px-4">
                    <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                        {/* Current Artist Action if logged as Fandubber */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 hover:border-orange-500 hover:text-orange-500 transition-all">
                                <Plus size={32}/>
                            </div>
                            <span className="text-[9px] font-black uppercase text-zinc-500">Mening Storyim</span>
                        </div>

                        {/* Stories Feed */}
                        {stories.map(story => (
                            <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
                                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-orange-600 via-pink-600 to-purple-600 shadow-xl group-active:scale-95 transition-all">
                                    <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden">
                                        <img src={story.profiles?.avatar_url || ''} className="w-full h-full object-cover" alt="" />
                                    </div>
                                </div>
                                <span className="text-[9px] font-black uppercase text-white truncate max-w-[70px]">{story.profiles?.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-12 space-y-20">
                
                {/* 2. CHANNELS HORIZONTAL LIST */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <span className="w-1.5 h-8 bg-orange-600 rounded-full"></span>
                            Top Studio Kanallar
                        </h2>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                        {channels.map(ch => (
                            <div key={ch.id} onClick={() => setSelectedChannel(ch)} className="flex-shrink-0 w-64 bg-zinc-900 border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center text-center cursor-pointer hover:border-orange-500/30 transition-all shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-orange-600/10 to-transparent"></div>
                                <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 border-2 border-zinc-800 shadow-xl relative z-10">
                                    <img src={ch.avatar_url || ''} className="w-full h-full object-cover" alt="" />
                                </div>
                                <h3 className="font-black text-white uppercase text-sm mb-1">{ch.name}</h3>
                                <p className="text-orange-500 text-[10px] font-bold mb-4 tracking-widest">@{ch.username}</p>
                                <div className="flex gap-4 mb-6">
                                    <div className="text-center"><p className="text-xs font-black">{ch.subscriber_count}</p><p className="text-[8px] text-zinc-500 font-bold">Muxlis</p></div>
                                    <div className="text-center"><p className="text-xs font-black">{ch.total_views}</p><p className="text-[8px] text-zinc-500 font-bold">Views</p></div>
                                </div>
                                <button onClick={(e)=>{e.stopPropagation(); handleFollow(ch)}} className={`w-full py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${ch.is_following ? 'bg-zinc-800 text-zinc-500' : 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 active:scale-95'}`}>
                                    {ch.is_following ? 'OBUNA BO\'LINGAN' : 'OBUNA BO\'LISH'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. COMBINED FANDUB FEED */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Barcha Fandub Loyihalar</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10">
                        {allMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </section>
            </div>

            {/* CHANNEL DETAIL OVERLAY - YOUTUBE STYLE */}
            {selectedChannel && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedChannel(null)}></div>
                    <div className="relative bg-[#050505] w-full max-w-5xl h-full md:h-[90vh] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border border-white/5 animate-slide-in-up">
                        {/* Banner */}
                        <div className="h-40 md:h-64 bg-zinc-900 relative flex-shrink-0">
                            <img src={selectedChannel.banner_url || 'https://i.imgur.com/8y9q1Xh.jpg'} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
                            <button onClick={() => setSelectedChannel(null)} className="absolute top-6 right-6 p-2 bg-black/50 rounded-full text-white hover:bg-black"><X size={24}/></button>
                        </div>

                        {/* Channel Info Header */}
                        <div className="px-6 md:px-12 flex flex-col md:flex-row gap-6 -mt-16 relative z-10">
                            <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] overflow-hidden p-1 bg-[#050505] shadow-2xl">
                                <img src={selectedChannel.avatar_url || ''} className="w-full h-full rounded-[2.3rem] object-cover border-4 border-zinc-900" alt="" />
                            </div>
                            <div className="flex-1 md:pt-20">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                    <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedChannel.name}</h2>
                                    <CheckCircle size={20} className="text-blue-500"/>
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                    <span>@{selectedChannel.username}</span>
                                    <span>• {selectedChannel.subscriber_count} obunachi</span>
                                    <span>• {selectedChannel.total_views} ko'rishlar</span>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl line-clamp-2">{selectedChannel.bio || 'Studio kanali haqida ma\'lumot yo\'q.'}</p>
                            </div>
                            <div className="md:pt-20">
                                <button onClick={() => handleFollow(selectedChannel)} className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${selectedChannel.is_following ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-black shadow-xl'}`}>
                                    {selectedChannel.is_following ? 'Obuna bo\'lingan' : 'Obuna bo\'lish'}
                                </button>
                            </div>
                        </div>

                        {/* Projects Content Grid */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                            <div className="border-b border-white/5 mb-10 flex gap-10">
                                <button className="pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 border-orange-600 text-orange-500">Loyihalar</button>
                                <button className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Hamjamiyat</button>
                            </div>
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
