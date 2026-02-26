
import React, { useState, useEffect, useRef } from 'react';
import { 
    Video, Users, MessageSquare, Settings, Play, Square, 
    Send, Shield, Crown, User, MoreVertical, X,
    Volume2, VolumeX, Maximize, Minimize, ExternalLink,
    Heart, Pause, Circle, UserPlus, Share2, Download,
    Camera, Mic as MicIcon, Monitor, Minimize2, Maximize2, ChevronLeft, RefreshCw
} from 'lucide-react';
import { 
    LiveStream, LiveChatMessage, UserProfile, UserRole, FandubChannel 
} from './types';
import { 
    getLiveStreams, createLiveStream, updateLiveStream, endLiveStream,
    getLiveChatMessages, sendLiveChatMessage, getFandubChannel,
    likeLiveStream, inviteCoStreamer, getAllUsers, createNotification,
    getChannelFollowers
} from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';

interface LiveStreamPageProps {
    userProfile: UserProfile | null;
    onBack?: () => void;
    selectedStream: LiveStream | null;
    setSelectedStream: (stream: LiveStream | null) => void;
    isStreamerMode: boolean;
    setIsStreamerMode: (mode: boolean) => void;
    isMinimized: boolean;
    setIsMinimized: (minimized: boolean) => void;
}

export const LiveStreamPage: React.FC<LiveStreamPageProps> = ({ 
    userProfile, onBack, 
    selectedStream, setSelectedStream,
    isStreamerMode, setIsStreamerMode,
    isMinimized, setIsMinimized
}) => {
    const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
    const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [myChannel, setMyChannel] = useState<FandubChannel | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [devices, setDevices] = useState<{video: MediaDeviceInfo[], audio: MediaDeviceInfo[]}>({video: [], audio: []});
    const [selectedVideoId, setSelectedVideoId] = useState('');
    const [selectedAudioId, setSelectedAudioId] = useState('');
    
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    
    // Streamer form
    const [streamTitle, setStreamTitle] = useState('');
    const [streamDesc, setStreamDesc] = useState('');
    const [isAniloOfficial, setIsAniloOfficial] = useState(false);

    // Live features
    const [isPaused, setIsPaused] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [videoFilter, setVideoFilter] = useState('none');
    const [likes, setLikes] = useState(0);
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const { addNotification } = useNotification();

    const canStream = userProfile?.role === 'admin' || userProfile?.role === 'owner' || userProfile?.role === 'fandub';

    useEffect(() => {
        loadStreams();
        if (canStream) {
            if (userProfile?.role === 'fandub') loadMyChannel();
            loadAllUsers();
            loadDevices();
        }

        // Real-time subscription for streams list
        const streamsSub = supabase
            .channel('live_streams_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, () => {
                loadStreams();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(streamsSub);
        };
    }, [userProfile]);

    const loadDevices = async () => {
        try {
            const devs = await navigator.mediaDevices.enumerateDevices();
            setDevices({
                video: devs.filter(d => d.kind === 'videoinput'),
                audio: devs.filter(d => d.kind === 'audioinput')
            });
        } catch (e) {
            console.error("Device load error:", e);
        }
    };

    useEffect(() => {
        if (selectedStream) {
            setLikes(selectedStream.likes_count || 0);
            loadChat(selectedStream.id);
            
            const chatSub = supabase
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

            const streamSub = supabase
                .channel(`live_stream_updates_${selectedStream.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'live_streams',
                    filter: `id=eq.${selectedStream.id}`
                }, payload => {
                    const updated = payload.new as LiveStream;
                    setLikes(updated.likes_count || 0);
                    setSelectedStream({ ...selectedStream, ...updated });
                })
                .on('broadcast', { event: 'reaction' }, payload => {
                    const newHearts = Array.from({ length: 3 }).map((_, i) => ({
                        id: Date.now() + i + Math.random(),
                        x: Math.random() * 100 - 50
                    }));
                    setFloatingHearts(prev => [...prev, ...newHearts]);
                    setTimeout(() => {
                        setFloatingHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
                    }, 3000);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(chatSub);
                supabase.removeChannel(streamSub);
            };
        }
    }, [selectedStream?.id]);

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

    const loadAllUsers = async () => {
        const users = await getAllUsers();
        setAllUsers(users.filter(u => u.id !== userProfile?.id));
    };

    const loadChat = async (streamId: string) => {
        const messages = await getLiveChatMessages(streamId);
        setChatMessages(messages);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const currentPage = params.get('page');

        if (selectedStream) {
            // Use full URL with origin to ensure it's a valid sharing link
            const newUrl = `${window.location.origin}/?page=live&live_id=${selectedStream.id}`;
            window.history.replaceState({ live_id: selectedStream.id }, '', newUrl);
        } else if (currentPage === 'live' && !selectedStream) {
            window.history.replaceState({}, '', `${window.location.origin}/?page=live`);
        }
    }, [selectedStream]);

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
                likes_count: 0,
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
            
            // Refresh list
            loadStreams();

            // Notify followers
            if (myChannel) {
                const followers = await getChannelFollowers(myChannel.id);
                followers.forEach(fId => {
                    createNotification(fId, 'Jonli Efir Boshlandi', `${myChannel.name} kanali jonli efirni boshladi!`, 'live', { stream_id: newStream.id });
                });
            }
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

    const handleLike = async () => {
        if (!selectedStream) return;
        try {
            setShowHeartAnim(true);
            setTimeout(() => setShowHeartAnim(false), 1000);
            
            // Broadcast reaction to others
            supabase.channel(`live_stream_updates_${selectedStream.id}`).send({
                type: 'broadcast',
                event: 'reaction',
                payload: { timestamp: Date.now() }
            });

            // Add floating hearts locally immediately
            const newHearts = Array.from({ length: 5 }).map((_, i) => ({
                id: Date.now() + i,
                x: Math.random() * 100 - 50
            }));
            setFloatingHearts(prev => [...prev, ...newHearts]);
            setTimeout(() => {
                setFloatingHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
            }, 3000);

            await likeLiveStream(selectedStream.id);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (isStreamerMode && selectedStream) {
            startMedia();
        } else {
            stopMedia();
        }
        return () => stopMedia();
    }, [isStreamerMode, selectedVideoId, selectedAudioId, isCameraOn, isMicOn]);

    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
            videoRef.current.play().catch(console.error);
        }
    }, [localStream, isStreamerMode]);

    const VIDEO_FILTERS = [
        { id: 'none', name: 'Original', filter: 'none' },
        { id: 'beauty', name: 'Beauty', filter: 'brightness(1.1) contrast(1.05) saturate(1.1) blur(0.4px)' },
        { id: 'vibrant', name: 'Vibrant', filter: 'saturate(1.5) contrast(1.1)' },
        { id: 'clarity', name: 'Clarity', filter: 'contrast(1.2) brightness(1.1) saturate(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.1))' },
        { id: 'warm', name: 'Warm', filter: 'sepia(0.2) saturate(1.2) hue-rotate(-10deg)' },
        { id: 'cool', name: 'Cool', filter: 'hue-rotate(180deg) saturate(1.2)' },
        { id: 'grayscale', name: 'B&W', filter: 'grayscale(1)' },
        { id: 'sepia', name: 'Vintage', filter: 'sepia(0.8)' },
        { id: 'sharp', name: 'Sharp', filter: 'contrast(1.3) brightness(1.1)' },
        { id: 'snap', name: 'Snap', filter: 'brightness(1.2) saturate(1.4) contrast(1.1) hue-rotate(5deg)' }
    ];

    const startMedia = async () => {
        try {
            stopMedia();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isCameraOn ? (selectedVideoId ? { deviceId: selectedVideoId } : true) : false,
                audio: isMicOn ? (selectedAudioId ? { deviceId: selectedAudioId } : true) : false
            });
            streamRef.current = stream;
            setLocalStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.error("Media start error:", e);
            addNotification({ type: 'error', title: 'Media xatoligi', message: 'Kamera yoki mikrofonni yoqib bo\'lmadi. Iltimos, ruxsat berilganini tekshiring.' });
        }
    };

    const stopMedia = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setLocalStream(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const handleToggleCamera = async () => {
        const newState = !isCameraOn;
        setIsCameraOn(newState);
        
        addNotification({ 
            type: 'info', 
            title: newState ? 'Kamera yoqildi' : 'Kamera o\'chirildi', 
            message: newState ? 'Video oqimi boshlandi.' : 'Video oqimi to\'xtatildi.' 
        });
    };

    const handleToggleMic = () => {
        const newState = !isMicOn;
        setIsMicOn(newState);
        
        addNotification({ 
            type: 'info', 
            title: newState ? 'Mikrofon yoqildi' : 'Mikrofon o\'chirildi', 
            message: newState ? 'Ovoz uzatish boshlandi.' : 'Ovoz uzatish to\'xtatildi.' 
        });
    };

    const handleToggleScreenShare = () => {
        setIsScreenSharing(!isScreenSharing);
        addNotification({ 
            type: 'info', 
            title: isScreenSharing ? 'Ekran ulash to\'xtatildi' : 'Ekran ulash boshlandi', 
            message: isScreenSharing ? 'Asosiy oqimga qaytildi.' : 'Ekraningiz tomoshabinlarga ko\'rinmoqda.' 
        });
    };

    const handleTogglePause = () => {
        setIsPaused(!isPaused);
        addNotification({ 
            type: 'info', 
            title: isPaused ? 'Efir davom etmoqda' : 'Efir to\'xtatildi', 
            message: isPaused ? 'Efir qayta boshlandi.' : 'Efir vaqtincha to\'xtatildi.' 
        });
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            setRecordingTime(0);
            addNotification({ type: 'success', title: 'Yozib olish tugadi', message: 'Video galereyaga saqlandi.' });
        } else {
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            addNotification({ type: 'info', title: 'Yozib olish boshlandi', message: 'Efir yozib olinmoqda...' });
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleInviteCoStreamer = async (user: UserProfile) => {
        if (!selectedStream) return;
        try {
            await inviteCoStreamer(selectedStream.id, user.id, user.username || user.full_name || 'User');
            await createNotification(user.id, 'Efirga Taklif', `${userProfile?.username || 'Kimdir'} sizni jonli efirga mehmon sifatida taklif qildi!`, 'invite', { stream_id: selectedStream.id });
            addNotification({ type: 'success', title: 'Taklif yuborildi', message: `${user.username} ga taklif yuborildi.` });
            setIsInviteOpen(false);
        } catch (e) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Taklif yuborishda xatolik.' });
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedStream || !userProfile || isSending) return;

        setIsSending(true);
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

            // Handle mentions
            const mentions = newMessage.match(/@(\w+)/g);
            if (mentions) {
                mentions.forEach(async (mention) => {
                    const username = mention.substring(1);
                    const { data: mentionedUser } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
                    if (mentionedUser && mentionedUser.id !== userProfile.id) {
                        createNotification(mentionedUser.id, 'Sizni eslashdi', `${userProfile.username} sizni jonli efir chatida eslab o'tdi!`, 'mention', { stream_id: selectedStream.id });
                    }
                });
            }

            setNewMessage('');
        } catch (e: any) {
            console.error("Chat yuborishda xatolik:", e);
            addNotification({ 
                type: 'error', 
                title: 'Xatolik', 
                message: e.message || 'Xabar yuborib bo\'lmadi.' 
            });
        } finally {
            setIsSending(false);
        }
    };

    if (selectedStream) {
        if (isMinimized) {
            return (
                <div 
                    onClick={() => setIsMinimized(false)}
                    className="fixed bottom-24 right-4 w-64 aspect-video bg-gray-900 rounded-2xl border-2 border-orange-600 shadow-2xl z-[200] overflow-hidden cursor-pointer group animate-scale-in"
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="text-orange-500 w-8 h-8 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-white" />
                    </div>
                    <div className="absolute top-2 left-2 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Live</div>
                    <div className="absolute bottom-2 left-2 right-2 truncate">
                        <p className="text-[10px] text-white font-bold">{selectedStream.title}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 bg-black z-[150] flex flex-col md:flex-row overflow-hidden">
                {/* Video Area */}
                <div className="flex-1 relative bg-gray-900 flex items-center justify-center group overflow-hidden">
                    {isStreamerMode ? (
                        <video 
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1] transition-all duration-500"
                            style={{ filter: VIDEO_FILTERS.find(f => f.id === videoFilter)?.filter || 'none' }}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center animate-pulse">
                                <Video className="text-orange-500 w-12 h-12" />
                            </div>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Jonli efir yuklanmoqda...</p>
                        </div>
                    )}

                    {/* Overlay for status messages */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 pointer-events-none z-10">
                        {selectedStream.status === 'ended' && (
                            <div className="flex flex-col items-center gap-4 bg-black/80 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl animate-scale-in">
                                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                    <X className="w-12 h-12 text-red-500" />
                                </div>
                                <h2 className="text-white text-2xl font-black uppercase tracking-tighter">Efir Yakunlandi</h2>
                                <p className="text-zinc-400 text-sm">Bu jonli efir streamer tomonidan tugatilgan.</p>
                                <button 
                                    onClick={() => setSelectedStream(null)}
                                    className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all pointer-events-auto"
                                >
                                    Boshqa efirlarni ko'rish
                                </button>
                            </div>
                        )}
                        {isPaused && selectedStream.status !== 'ended' && (
                            <div className="flex flex-col items-center gap-4 bg-black/40 backdrop-blur-sm p-8 rounded-3xl">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                    <Pause className="w-12 h-12 text-white" />
                                </div>
                                <p className="text-white font-black uppercase tracking-widest text-sm">Efir To'xtatildi</p>
                            </div>
                        )}
                        {!isPaused && isScreenSharing && (
                            <div className="flex flex-col items-center gap-4 bg-black/40 backdrop-blur-sm p-8 rounded-3xl">
                                <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 animate-pulse">
                                    <Monitor className="w-12 h-12 text-orange-500" />
                                </div>
                                <p className="text-orange-500 font-black uppercase tracking-widest text-sm">Ekran Ulash Faol</p>
                            </div>
                        )}
                        {!isPaused && !isScreenSharing && !isCameraOn && isStreamerMode && (
                            <div className="flex flex-col items-center gap-4 bg-black/40 backdrop-blur-sm p-8 rounded-3xl">
                                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                    <Camera className="w-12 h-12 text-gray-600" />
                                </div>
                                <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Kamera O'chirilgan</p>
                            </div>
                        )}
                    </div>

                    {/* Co-streamer placeholder */}
                    {selectedStream.co_streamer_id && (
                        <div className="absolute bottom-20 right-4 w-48 aspect-video bg-black/80 rounded-xl border border-white/10 overflow-hidden shadow-2xl z-20">
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <User className="text-blue-500" size={20} />
                                </div>
                                <p className="text-[10px] text-white font-bold uppercase">{selectedStream.co_streamer_username}</p>
                            </div>
                            <div className="absolute top-2 left-2 bg-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Guest</div>
                        </div>
                    )}

                    {/* Heart Animation */}
                    {showHeartAnim && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                            <Heart className="text-red-500 w-32 h-32 animate-ping fill-red-500" />
                        </div>
                    )}

                    {/* Floating Hearts */}
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-40">
                        {floatingHearts.map(heart => (
                            <div 
                                key={heart.id}
                                className="absolute animate-float-up opacity-0"
                                style={{ left: `${heart.x}px` }}
                            >
                                <Heart className="text-red-500 fill-red-500" size={24} />
                            </div>
                        ))}
                    </div>

                    {/* Overlay Controls */}
                    <div className="absolute top-0 left-0 right-0 p-6 pt-12 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-50 pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">Live</div>
                                    {isStreamerMode && <AudioVisualizer stream={localStream} />}
                                </div>
                                <div>
                                    <h1 className="text-white font-bold text-lg leading-tight flex items-center gap-2">
                                        {selectedStream.title}
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-400 font-mono">ID: {selectedStream.id.split('-')[0]}</span>
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-gray-300 text-[10px] flex items-center gap-1 font-bold uppercase">
                                            <Users size={12} /> {selectedStream.viewer_count}
                                        </p>
                                        <p className="text-red-400 text-[10px] flex items-center gap-1 font-bold uppercase">
                                            <Heart size={12} fill="currentColor" /> {likes}
                                        </p>
                                        <p className="text-zinc-500 text-[10px] font-bold uppercase border-l border-white/10 pl-3">
                                            Host: {selectedStream.profiles?.username || 'Anonymous'}
                                        </p>
                                        {isStreamerMode && (
                                            <div className="flex items-center gap-2 ml-2 border-l border-white/10 pl-3">
                                                {isCameraOn ? <Camera size={12} className="text-green-500" /> : <Camera size={12} className="text-red-500" />}
                                                {isMicOn ? <MicIcon size={12} className="text-green-500" /> : <MicIcon size={12} className="text-red-500" />}
                                                {isScreenSharing && <Monitor size={12} className="text-orange-500 animate-pulse" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pointer-events-auto">
                                <button 
                                    onClick={() => {
                                        const url = `${window.location.origin}/?page=live&live_id=${selectedStream.id}`;
                                        navigator.clipboard.writeText(url);
                                        addNotification({ type: 'success', title: 'Havola nusxalandi', message: 'Efir havolasi buferga saqlandi.' });
                                    }}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors pointer-events-auto"
                                    title="Ulashish"
                                >
                                    <Share2 size={20} />
                                </button>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent z-30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                {isStreamerMode ? (
                                    <>
                                        <button 
                                            onClick={handleTogglePause}
                                            className={`p-3 rounded-full transition-all ${isPaused ? 'bg-orange-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                            title={isPaused ? "Davom ettirish" : "Pauza"}
                                        >
                                            {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                                        </button>
                                        <button 
                                            onClick={handleToggleCamera}
                                            className={`p-3 rounded-full transition-all ${!isCameraOn ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                            title={isCameraOn ? "Kamerani o'chirish" : "Kamerani yoqish"}
                                        >
                                            {isCameraOn ? <Camera size={24} /> : <Video size={24} className="opacity-50" />}
                                        </button>
                                        <button 
                                            onClick={handleToggleMic}
                                            className={`p-3 rounded-full transition-all ${!isMicOn ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                            title={isMicOn ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
                                        >
                                            {isMicOn ? <MicIcon size={24} /> : <MicIcon size={24} className="opacity-50" />}
                                        </button>
                                        <button 
                                            onClick={handleToggleRecording}
                                            className={`p-3 rounded-full transition-all flex items-center gap-2 ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                            title={isRecording ? "Yozishni to'xtatish" : "Yozib olish"}
                                        >
                                            <Circle size={24} fill={isRecording ? "currentColor" : "none"} />
                                            {isRecording && <span className="text-xs font-black">{formatTime(recordingTime)}</span>}
                                        </button>
                                        <button 
                                            onClick={() => setIsInviteOpen(true)}
                                            className="p-3 bg-white/10 hover:bg-blue-600 rounded-full text-white transition-colors"
                                            title="Mehmon chaqirish"
                                        >
                                            <UserPlus size={24} />
                                        </button>
                                        <button 
                                            onClick={handleToggleScreenShare}
                                            className={`p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-orange-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                            title="Ekran ulash"
                                        >
                                            <Monitor size={24} />
                                        </button>
                                        <button 
                                            onClick={() => startMedia()}
                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                                            title="Media qayta yuklash"
                                        >
                                            <RefreshCw size={24} />
                                        </button>
                                        <button 
                                            onClick={() => setIsSettingsOpen(true)}
                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                                            title="Sozlamalar"
                                        >
                                            <Settings size={24} />
                                        </button>
                                        
                                        {/* Filter Selector */}
                                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 overflow-x-auto max-w-[200px] no-scrollbar">
                                            {VIDEO_FILTERS.map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setVideoFilter(f.id)}
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${videoFilter === f.id ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    {f.name}
                                                </button>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => setIsMinimized(true)}
                                            className="p-3 bg-orange-600 hover:bg-orange-700 rounded-full text-white transition-all shadow-lg"
                                            title="Kichraytirish"
                                        >
                                            <Minimize2 size={24} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (isStreamerMode) handleEndStream();
                                                else setSelectedStream(null);
                                            }}
                                            className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all shadow-lg"
                                            title="Yopish"
                                        >
                                            <X size={24} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={handleLike}
                                            className="p-3 bg-red-600/20 hover:bg-red-600 rounded-full text-red-500 hover:text-white transition-all active:scale-90"
                                        >
                                            <Heart size={24} fill="currentColor" />
                                        </button>
                                        <button 
                                            onClick={() => setIsMinimized(true)}
                                            className="p-3 bg-orange-600 hover:bg-orange-700 rounded-full text-white transition-all shadow-lg"
                                            title="Kichraytirish"
                                        >
                                            <Minimize2 size={24} />
                                        </button>
                                        <button 
                                            onClick={() => setSelectedStream(null)}
                                            className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all shadow-lg"
                                            title="Yopish"
                                        >
                                            <X size={24} />
                                        </button>
                                    </>
                                )}
                                <div className="flex items-center gap-4">
                                    <button className="text-white hover:text-orange-500 transition-colors"><Volume2 size={24} /></button>
                                    <div className="h-1 w-24 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-orange-500"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => {
                                        const el = videoRef.current;
                                        if (el) {
                                            if (el.requestFullscreen) el.requestFullscreen();
                                        }
                                    }}
                                    className="text-white hover:text-orange-500 transition-colors"
                                    title="To'liq ekran"
                                >
                                    <Maximize size={24} />
                                </button>
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
                                disabled={isSending}
                                placeholder={isSending ? "Yuborilmoqda..." : "Xabar yozing..."}
                                className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none pr-12 transition-all disabled:opacity-50"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className="absolute right-1.5 top-1.5 p-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white rounded-full transition-all"
                            >
                                {isSending ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
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
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Qurilmalar</h4>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Kamera</label>
                                        <select 
                                            value={selectedVideoId}
                                            onChange={e => setSelectedVideoId(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
                                        >
                                            <option value="">Standart Kamera</option>
                                            {devices.video.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${d.deviceId.slice(0,5)}`}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Mikrofon</label>
                                        <select 
                                            value={selectedAudioId}
                                            onChange={e => setSelectedAudioId(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
                                        >
                                            <option value="">Standart Mikrofon</option>
                                            {devices.audio.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mikrofon ${d.deviceId.slice(0,5)}`}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Xavfsizlik & Yozib olish</h4>
                                    <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-xl">
                                        <p className="text-xs text-red-400 font-bold mb-1">Xavfsizlik uchun dalil</p>
                                        <p className="text-[10px] text-red-400/60 leading-tight">Efir yozib olinishi xavfsizlik va keyinchalik dalil sifatida foydalanish uchun tavsiya etiladi.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Umumiy</h4>
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

                {/* Invite Modal */}
                {isInviteOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden animate-scale-in flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <UserPlus className="text-blue-500" />
                                    Mehmon Chaqirish
                                </h3>
                                <button onClick={() => setIsInviteOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {allUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                                                {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-500" />}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">{user.username || user.full_name}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase font-black">{user.role}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleInviteCoStreamer(user)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg transition-all"
                                        >
                                            Taklif
                                        </button>
                                    </div>
                                ))}
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
                <div className="mb-8">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
                    >
                        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Orqaga</span>
                    </button>
                </div>

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
                                        <div className="absolute bottom-3 right-3 bg-red-600/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                            <Heart size={10} fill="currentColor" />
                                            {stream.likes_count || 0}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                                <Play size={24} fill="white" className="ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex-shrink-0 overflow-hidden">
                                            {stream.profiles?.avatar_url ? (
                                                <img src={stream.profiles.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-full h-full p-2 text-gray-500" />
                                            )}
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

const AudioVisualizer: React.FC<{ stream: MediaStream | null }> = ({ stream }) => {
    const [level, setLevel] = useState(0);
    const requestRef = useRef<number>();
    const analyserRef = useRef<AnalyserNode>();

    useEffect(() => {
        if (!stream || stream.getAudioTracks().length === 0) {
            setLevel(0);
            return;
        }

        let audioContext: AudioContext | null = null;
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const update = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setLevel(average);
                requestRef.current = requestAnimationFrame(update);
            };
            update();
        } catch (e) {
            console.error("Audio visualizer error:", e);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (audioContext) audioContext.close();
        };
    }, [stream]);

    return (
        <div className="flex items-end gap-0.5 h-3 w-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div 
                    key={i} 
                    className="w-1 bg-orange-500 transition-all duration-75 rounded-full"
                    style={{ height: `${Math.max(20, Math.min(100, (level / 128) * 100 * (0.6 + Math.random() * 0.4)))}%` }}
                />
            ))}
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
