
import React, { useState, useEffect } from 'react';
import { 
    Mic, Star, ChevronRight, Film, TrendingUp, User, Play, Heart, Users, Eye, Plus, X, Search, CheckCircle, Bell, ChevronLeft
} from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { Movie, FandubChannel, FandubStory } from './types';
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
    const [activeStoryView, setActiveStoryView] = useState<FandubStory | null>(null);
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
            setChannels(c || []);
            setStories(s || []);
            setAllMovies((m || []).filter(movie => movie.is_fandub));
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
            
            <div className="w-full bg-[#0a0a0a]/50 border-b border-white/5 py-8">
                <div className="container mx-auto px-4">
                    <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-purple-600 hover:text-purple-600 transition-all duration-500 active:scale-95 bg-black">
                                <Plus size={32}/>
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Sizniki</span>
                        </div>

                        {stories.map((story, i) => (
                            <div key={story.id} onClick={() => setActiveStoryView(story)} className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 shadow-2xl group-active:scale-95 transition-all duration-300">
                                    <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden">
                                        <img src={story.profiles?.avatar_url || ''} className="w-full h-full object-cover" alt="" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase text-white truncate max-w-[80px] tracking-widest">{story.profiles?.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-16 space-y-24">
                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-1.5 h-8 bg-purple-600 rounded-full shadow-[0_0_20px_rgba(147,51,234,0.5)]"></div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Ommabop Kanallar</h2>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide px-2">
                        {channels.map(ch => (
                            <div 
                                key={ch.id} 
                                onClick={() => setSelectedChannel(ch)}
                                className="flex-shrink-0 w-72 bg-zinc-900 border border-white/5 rounded-[3rem] p-8 flex flex-col items-center text-center cursor-pointer hover:border-purple-500/30 transition-all shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-purple-600/10 to-transparent"></div>
                                <div className="w-24 h-24 rounded-[2rem] overflow-hidden mb-5 border-4 border-zinc-800 shadow-2xl relative z-10">
                                    <img src={ch.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                                </div>
                                <h3 className="font-black text-white uppercase text-base mb-1 tracking-tight">{ch.name}</h3>
                                <p className="text-purple-500 text-[10px] font-black mb-6 tracking-[0.2em]">@{ch.username}</p>
                                
                                <div className="flex gap-8 mb-8">
                                    <div className="text-center"><p className="text-sm font-black text-white">{ch.subscriber_count}</p><p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Muxlis</p></div>
                                    <div className="text-center"><p className="text-sm font-black text-white">{ch.total_views}</p><p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Views</p></div>
                                </div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleFollow(ch); }}
                                    className={`w-full py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl ${ch.is_following ? 'bg-zinc-800 text-zinc-500' : 'bg-purple-600 text-white shadow-purple-900/20 active:scale-95 hover:bg-purple-500'}`}
                                >
                                    {ch.is_following ? 'OBUNA BO\'LINGAN' : 'OBUNA BO\'LISH'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-1.5 h-8 bg-orange-600 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.5)]"></div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Barcha Fandub Loyihalar</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-12">
                        {allMovies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </section>
            </div>

            {selectedChannel && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 lg:p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" onClick={() => setSelectedChannel(null)}></div>
                    <div className="relative bg-[#050505] w-full max-w-5xl h-full lg:h-[90vh] lg:rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col border border-white/5 animate-slide-in-up">
                        <div className="h-44 lg:h-72 bg-zinc-900 relative flex-shrink-0">
                            <img src={selectedChannel.banner_url || 'https://i.imgur.com/8y9q1Xh.jpg'} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                            <button onClick={() => setSelectedChannel(null)} className="absolute top-6 right-6 p-3 bg-black/60 hover:bg-black rounded-full text-white transition-all active:scale-90"><X size={24}/></button>
                        </div>

                        <div className="px-6 lg:px-16 flex flex-col lg:flex-row gap-6 lg:gap-10 -mt-20 lg:-mt-24 relative z-10 flex-shrink-0">
                            <div className="w-36 h-36 lg:w-48 lg:h-48 rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden p-1.5 bg-[#050505] shadow-2xl">
                                <img src={selectedChannel.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full rounded-[2.3rem] lg:rounded-[2.8rem] object-cover border-4 border-zinc-900" alt="" />
                            </div>
                            <div className="flex-1 lg:pt-24">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter">{selectedChannel.name}</h2>
                                    <CheckCircle size={20} className="text-blue-500 fill-blue-500/10"/>
                                </div>
                                <div className="flex flex-wrap gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-5">
                                    <span>@{selectedChannel.username}</span>
                                    <span>•</span>
                                    <span>{selectedChannel.subscriber_count} obunachi</span>
                                    <span>•</span>
                                    <span>{allMovies.filter(m => m.channel_id === selectedChannel.id).length} loyiha</span>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl line-clamp-2">{selectedChannel.bio || 'Bu studio kanali uchun tavsif kiritilmagan.'}</p>
                            </div>
                            <div className="lg:pt-24 pb-6 lg:pb-0">
                                <button onClick={() => handleFollow(selectedChannel)} className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 shadow-2xl ${selectedChannel.is_following ? 'bg-zinc-900 text-zinc-500 border border-white/5' : 'bg-white text-black shadow-white/10 hover:bg-gray-200'}`}>
                                    {selectedChannel.is_following ? 'OBUNA BO\'LINGAN' : 'OBUNA BO\'LISH'}
                                </button>
                            </div>
                        </div>

                        <div className="px-6 lg:px-16 mt-8 lg:mt-12 flex-1 overflow-hidden flex flex-col">
                            <div className="flex gap-10 border-b border-white/5 mb-10 flex-shrink-0">
                                <button className="pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 border-purple-600 text-purple-500 transition-all">Loyihalar</button>
                                <button className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all">Hamjamiyat</button>
                                <button className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all">Haqida</button>
                            </div>
                            <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                                    {allMovies.filter(m => m.channel_id === selectedChannel.id).map(movie => (
                                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                    ))}
                                    {allMovies.filter(m => m.channel_id === selectedChannel.id).length === 0 && (
                                        <div className="col-span-full py-20 text-center text-zinc-700 uppercase font-black text-xs tracking-widest">Loyihalar yuklanmagan</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
