
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

interface StudioPageProps {
    onMovieClick: (movie: Movie) => void;
    onArtistClick?: (userId: string) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({ onMovieClick, onArtistClick }) => {
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
                                    <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden relative">
                                        {/* Use media_url for story thumbnail if type is image, else use avatar */}
                                        {story.media_type === 'image' ? (
                                            <img src={story.media_url} className="w-full h-full object-cover" alt="" onError={(e) => (e.target as HTMLImageElement).src = story.profiles?.avatar_url || ''} />
                                        ) : (
                                            <video src={story.media_url} className="w-full h-full object-cover" muted />
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase text-white truncate max-w-[80px] tracking-widest">{story.profiles?.username || 'user'}</span>
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

                    <div className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide px-2">
                        {channels.map(ch => (
                            <div 
                                key={ch.id} 
                                onClick={() => setSelectedChannel(ch)}
                                className="flex-shrink-0 w-80 h-96 relative rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-2xl transition-all duration-500 hover:scale-105"
                            >
                                {/* Background Banner */}
                                <img 
                                    src={ch.banner_url || 'https://i.imgur.com/8y9q1Xh.jpg'} 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>

                                {/* Content */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-end items-center text-center z-10">
                                    <div className="relative mb-4">
                                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-pink-500 shadow-xl shadow-purple-900/50">
                                            <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black">
                                                {ch.avatar_url ? (
                                                    <img src={ch.avatar_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600 font-black text-2xl">{ch.name.charAt(0)}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-black border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Star size={10} className="text-yellow-500 fill-yellow-500"/>
                                            <span className="text-[10px] font-bold text-white">4.9</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{ch.name}</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">@{ch.username} • {ch.subscriber_count} Muxlis</p>

                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleFollow(ch); }}
                                        className={`w-full py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl backdrop-blur-md border ${ch.is_following ? 'bg-white/10 text-white border-white/20' : 'bg-purple-600 text-white border-purple-500 hover:bg-purple-500'}`}
                                    >
                                        {ch.is_following ? 'OBUNA BO\'LINGAN' : 'OBUNA BO\'LISH'}
                                    </button>
                                </div>
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

            {/* CHANNEL DETAIL MODAL */}
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
                                {selectedChannel.avatar_url ? (
                                    <img src={selectedChannel.avatar_url} className="w-full h-full rounded-[2.3rem] lg:rounded-[2.8rem] object-cover border-4 border-zinc-900" alt="" />
                                ) : (
                                    <div className="w-full h-full rounded-[2.3rem] lg:rounded-[2.8rem] bg-purple-900 flex items-center justify-center text-white font-black text-4xl border-4 border-zinc-900">{selectedChannel.name.charAt(0)}</div>
                                )}
                            </div>
                            <div className="flex-1 lg:pt-24">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white">{selectedChannel.name}</h2>
                                    <CheckCircle size={20} className="text-blue-500 fill-blue-500/10"/>
                                </div>
                                <div className="flex flex-wrap gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-5">
                                    <span className="text-purple-500">@{selectedChannel.username}</span>
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

            {/* STORY VIEWER */}
            {activeStoryView && (
                <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
                    <div className="relative w-full h-full md:w-[400px] md:h-[80vh] bg-zinc-900 md:rounded-3xl overflow-hidden shadow-2xl">
                        {/* Media */}
                        {activeStoryView.media_type === 'video' ? (
                            <video src={activeStoryView.media_url} className="w-full h-full object-cover" autoPlay playsInline controls={false} 
                                onEnded={() => setActiveStoryView(null)} // Close on end
                            />
                        ) : (
                            <img src={activeStoryView.media_url} className="w-full h-full object-cover" alt="" />
                        )}
                        
                        {/* Progress Bar (Mock) */}
                        <div className="absolute top-2 left-2 right-2 flex gap-1">
                            <div className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
                                <div className="h-full bg-white animate-[width_5s_linear_forwards]"></div>
                            </div>
                        </div>

                        {/* Header */}
                        <div className="absolute top-6 left-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black border border-white/20 overflow-hidden">
                                <img src={activeStoryView.profiles?.avatar_url || ''} className="w-full h-full object-cover"/>
                            </div>
                            <span className="text-white font-bold text-sm shadow-black drop-shadow-md">{activeStoryView.profiles?.username}</span>
                        </div>

                        {/* Close */}
                        <button onClick={() => setActiveStoryView(null)} className="absolute top-6 right-4 text-white drop-shadow-md"><X size={24}/></button>
                    </div>
                </div>
            )}
        </div>
    );
};
