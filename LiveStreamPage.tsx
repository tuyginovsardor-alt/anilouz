
import React, { useState, useEffect, useRef } from 'react';
import { 
    Video, Users, MessageSquare, Settings, Play, Square, 
    Send, Shield, Crown, User, MoreVertical, X,
    Volume2, VolumeX, Maximize, Minimize, ExternalLink
} from 'lucide-react';
import { 
    LiveStream, LiveChatMessage, UserProfile, UserRole, FandubChannel 
} from './types';
import { 
    getLiveStreams, createLiveStream, updateLiveStream, endLiveStream,
    getLiveChatMessages, sendLiveChatMessage, getFandubChannel
} from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';

interface LiveStreamPageProps {
    userProfile: UserProfile | null;
    onBack?: () => void;
}

export const LiveStreamPage: React.FC<LiveStreamPageProps> = ({ userProfile, onBack }) => {
    const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
    const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
    const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isStreamerMode, setIsStreamerMode] = useState(false);
    const [myChannel, setMyChannel] = useState<FandubChannel | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Streamer form
    const [streamTitle, setStreamTitle] = useState('');
    const [streamDesc, setStreamDesc] = useState('');
    const [isAniloOfficial, setIsAniloOfficial] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const { addNotification } = useNotification();

    const canStream = userProfile?.role === 'admin' || userProfile?.role === 'owner' || userProfile?.role === 'fandub';

    useEffect(() => {
        loadStreams();
        if (canStream && userProfile?.role === 'fandub') {
            loadMyChannel();
        }
    }, [userProfile]);

    useEffect(() => {
        if (selectedStream) {
            loadChat(selectedStream.id);
            const subscription = supabase
                .channel(`live_chat_${selectedStream.id}`)
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'live_chat_messages',
                    filter: `stream_id=eq.${selectedStream.id}`
                }, payload => {
                    setChatMessages(prev => [...prev, payload.new as LiveChatMessage]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [selectedStream]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const loadStreams = async () => {
        setIsLoading(true);
        try {
            const streams = await getLiveStreams();
            setActiveStreams(streams);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMyChannel = async () => {
        if (userProfile) {
            const channel = await getFandubChannel(userProfile.id);
            setMyChannel(channel);
        }
    };

    const loadChat = async (streamId: string) => {
        const messages = await getLiveChatMessages(streamId);
        setChatMessages(messages);
    };

    const handleStartStream = async () => {
        if (!userProfile) return;
        try {
            const streamData: Partial<LiveStream> = {
                streamer_id: userProfile.id,
                channel_id: myChannel?.id,
                title: streamTitle || `${userProfile.username || 'User'}'s Live Stream`,
                description: streamDesc,
                status: 'live',
                viewer_count: 0,
                started_at: new Date().toISOString(),
                is_anilo_official: userProfile.role === 'admin' || userProfile.role === 'owner' ? isAniloOfficial : false,
                settings: {
                    chat_enabled: true,
                    subscriber_only: false
                }
            };
            const newStream = await createLiveStream(streamData);
            setSelectedStream(newStream);
            setIsStreamerMode(true);
            addNotification({ type: 'success', title: 'Jonli efir boshlandi', message: 'Efir muvaffaqiyatli boshlandi!' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Efirni boshlab bo\'lmadi.' });
        }
    };

    const handleEndStream = async () => {
        if (!selectedStream) return;
        if (!window.confirm("Efirni tugatmoqchimisiz?")) return;
        try {
            await endLiveStream(selectedStream.id);
            setSelectedStream(null);
            setIsStreamerMode(false);
            loadStreams();
            addNotification({ type: 'info', title: 'Efir tugadi', message: 'Jonli efir yakunlandi.' });
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Efirni tugatib bo\'lmadi.' });
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedStream || !userProfile) return;

        try {
            const msg: Partial<LiveChatMessage> = {
                stream_id: selectedStream.id,
                user_id: userProfile.id,
                username: userProfile.username || userProfile.full_name || 'Anonim',
                avatar_url: userProfile.avatar_url || undefined,
                message: newMessage.trim(),
                role: userProfile.role
            };
            await sendLiveChatMessage(msg);
            setNewMessage('');
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Xabar yuborib bo\'lmadi.' });
        }
    };

    if (selectedStream) {
        return (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col md:flex-row overflow-hidden">
                {/* Video Area */}
                <div className="flex-1 relative bg-gray-900 flex items-center justify-center group">
                    {/* Placeholder for real video stream */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
                            <Video className="w-10 h-10 text-orange-500" />
                        </div>
                        <p className="text-gray-400 font-medium">Video oqimi yuklanmoqda...</p>
                    </div>

                    {/* Overlay Controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">Live</div>
                            <div>
                                <h1 className="text-white font-bold text-lg leading-tight">{selectedStream.title}</h1>
                                <p className="text-gray-300 text-xs flex items-center gap-1">
                                    <Users size={12} /> {selectedStream.viewer_count} tomoshabin
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isStreamerMode && (
                                <button 
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <Settings size={20} />
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    if (isStreamerMode) handleEndStream();
                                    else setSelectedStream(null);
                                }}
                                className="p-2 bg-white/10 hover:bg-red-600 rounded-full text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button className="text-white hover:text-orange-500 transition-colors"><Volume2 size={24} /></button>
                                <div className="h-1 w-24 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 bg-orange-500"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="text-white hover:text-orange-500 transition-colors"><Maximize size={24} /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-full md:w-80 lg:w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
                    <div className="p-4 border-bottom border-gray-800 flex items-center justify-between">
                        <h2 className="text-white font-bold flex items-center gap-2">
                            <MessageSquare size={18} className="text-orange-500" />
                            Jonli Chat
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className="flex gap-3 items-start animate-fade-in">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden border border-gray-700">
                                    {msg.avatar_url ? (
                                        <img src={msg.avatar_url} alt={msg.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                                            <User size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-xs font-bold text-orange-400 truncate">{msg.username}</span>
                                        {msg.role === 'admin' || msg.role === 'owner' ? (
                                            <Crown size={10} className="text-yellow-500" />
                                        ) : msg.role === 'fandub' ? (
                                            <Shield size={10} className="text-blue-400" />
                                        ) : null}
                                    </div>
                                    <p className="text-sm text-gray-200 break-words leading-relaxed">{msg.message}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Xabar yozing..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none pr-12 transition-all"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="absolute right-1.5 top-1.5 p-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white rounded-full transition-all"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Settings Modal */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden animate-scale-in">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Settings className="text-orange-500" />
                                    Efir Sozlamalari
                                </h3>
                                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Chatni yoqish</p>
                                            <p className="text-xs text-gray-400">Tomoshabinlar chatda yozishlari mumkin</p>
                                        </div>
                                        <div className="w-12 h-6 bg-orange-600 rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Faqat obunachilar</p>
                                            <p className="text-xs text-gray-400">Faqat kanal a'zolari chatda yozishlari mumkin</p>
                                        </div>
                                        <div className="w-12 h-6 bg-gray-700 rounded-full relative cursor-pointer">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleEndStream}
                                    className="w-full py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Square size={18} />
                                    Efirni Tugatish
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] pb-20">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                            <Video className="text-orange-500 w-10 h-10" />
                            JONLI EFIRLAR
                        </h1>
                        <p className="text-gray-400">Hozirda jonli efirda bo'lgan kanallar va adminlar</p>
                    </div>
                    
                    {canStream && (
                        <button 
                            onClick={() => setIsStreamerMode(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-600/20 active:scale-95"
                        >
                            <Play size={20} fill="currentColor" />
                            EFIRNI BOSHLASH
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <LoadingSpinner />
                        <p className="text-gray-500 mt-4">Jonli efirlar qidirilmoqda...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeStreams.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <WifiOff className="text-gray-600 w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-400">Hozircha hech kim jonli efirda emas</h3>
                                <p className="text-gray-600 mt-2">Keyinroq qaytib ko'ring yoki o'zingiz efir boshlang!</p>
                            </div>
                        ) : (
                            activeStreams.map(stream => (
                                <div 
                                    key={stream.id} 
                                    onClick={() => setSelectedStream(stream)}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-800 mb-3 border border-white/5 group-hover:border-orange-500/50 transition-all">
                                        {stream.cover_url ? (
                                            <img src={stream.cover_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                <Video className="w-12 h-12 text-gray-700 group-hover:text-orange-500/50 transition-colors" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                            Live
                                        </div>
                                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                            <Users size={10} />
                                            {stream.viewer_count}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                                <Play size={24} fill="white" className="ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex-shrink-0 overflow-hidden">
                                            <User className="w-full h-full p-2 text-gray-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-bold truncate group-hover:text-orange-500 transition-colors">{stream.title}</h3>
                                            <p className="text-gray-500 text-xs truncate flex items-center gap-1">
                                                {stream.is_anilo_official ? 'Anilo Official' : stream.channel_id ? 'Fandub Channel' : 'User'}
                                                {stream.is_anilo_official && <Shield size={10} className="text-orange-500" />}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Start Stream Modal */}
            {isStreamerMode && !selectedStream && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/5 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
                        <div className="relative h-48 bg-gradient-to-br from-orange-600 to-orange-900 flex items-center justify-center">
                            <button 
                                onClick={() => setIsStreamerMode(false)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                            <div className="text-center">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/20">
                                    <Video size={40} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-wider">Efirni Sozlash</h2>
                            </div>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Efir Sarlavhasi</label>
                                    <input 
                                        type="text" 
                                        value={streamTitle}
                                        onChange={e => setStreamTitle(e.target.value)}
                                        placeholder="Masalan: Naruto 500-qism muhokamasi!"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 text-white focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tavsif (Ixtiyoriy)</label>
                                    <textarea 
                                        value={streamDesc}
                                        onChange={e => setStreamDesc(e.target.value)}
                                        placeholder="Efir haqida qisqacha ma'lumot..."
                                        rows={3}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 text-white focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>

                                {(userProfile?.role === 'admin' || userProfile?.role === 'owner') && (
                                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                                                <Shield size={20} className="text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">Anilo Rasmiy Efiri</p>
                                                <p className="text-xs text-gray-500">Sayt nomidan jonli efir qilish</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setIsAniloOfficial(!isAniloOfficial)}
                                            className={`w-14 h-7 rounded-full relative transition-all ${isAniloOfficial ? 'bg-orange-600' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isAniloOfficial ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button 
                                    onClick={() => setIsStreamerMode(false)}
                                    className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all"
                                >
                                    Bekor Qilish
                                </button>
                                <button 
                                    onClick={handleStartStream}
                                    className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/20"
                                >
                                    EFIRNI BOSHLASH
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WifiOff = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <line x1="2" y1="2" x2="22" y2="22"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
);
