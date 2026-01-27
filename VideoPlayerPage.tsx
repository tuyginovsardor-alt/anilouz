
import React, { useState, useRef, useEffect } from 'react';
import { Movie, Episode } from './types';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { FullscreenEnterIcon } from './components/icons/FullscreenEnterIcon';
import { getMovieEpisodes } from './services/dbService';
import { Settings, X, Zap, Layers, Monitor, ChevronRight, Check, AlertCircle } from 'lucide-react';

interface VideoPlayerPageProps {
  movie: Movie;
  episode?: Episode | null;
  onBack: () => void;
}

export const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ movie, episode: initialEpisode, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Data State
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(initialEpisode || null);
    const [playableSrc, setPlayableSrc] = useState<string>('');
    
    // Player State
    const [isResolving, setIsResolving] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    
    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [showEpisodesList, setShowEpisodesList] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [resizeMode, setResizeMode] = useState<'contain' | 'cover'>('contain');
    
    // Touch State for Swipe
    const [touchStartY, setTouchStartY] = useState<number | null>(null);

    useEffect(() => {
        const fetchEpisodes = async () => {
            if (movie.id) {
                const eps = await getMovieEpisodes(movie.id);
                setEpisodes(eps);
                // Agar serial bo'lsa va epizod tanlanmagan bo'lsa, birinchisini olamiz
                if (!currentEpisode && eps.length > 0) {
                    setCurrentEpisode(eps[0]);
                }
            }
        };
        fetchEpisodes();
    }, [movie.id]);

    useEffect(() => {
        const resolveSource = async () => {
            setIsResolving(true);
            try {
                // Agar epizod tanlangan bo'lsa o'sha, bo'lmasa kino o'zi
                const rawUrl = currentEpisode ? currentEpisode.source : movie.videoUrl;
                setPlayableSrc(rawUrl || '');
            } catch (e) {
                console.error("Resolve error", e);
                setPlayableSrc('');
            } finally {
                setIsResolving(false);
            }
        };
        resolveSource();
    }, [currentEpisode, movie.videoUrl, movie.id]);

    // Handle Playback Speed
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    const triggerControls = () => {
        setShowControls(true);
        const timer = window.setTimeout(() => isPlaying && !showSettings && !showEpisodesList && setShowControls(false), 3000);
        return () => clearTimeout(timer);
    };

    const togglePlay = () => {
        if (videoRef.current?.paused) videoRef.current.play();
        else videoRef.current?.pause();
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleEpisodeChange = (ep: Episode) => {
        setCurrentEpisode(ep);
        setShowEpisodesList(false);
        setIsPlaying(true); // Auto play next
    };

    // --- GESTURE HANDLERS ---
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchStartY(e.touches[0].clientY);
        triggerControls();
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartY === null) return;
        const touchEndY = e.changedTouches[0].clientY;
        const diffY = touchStartY - touchEndY;

        // Swipe UP (> 50px) -> Show Episodes
        if (diffY > 50) {
            setShowEpisodesList(true);
            setShowSettings(false);
        }
        // Swipe DOWN (< -50px) -> Hide Episodes/Settings
        if (diffY < -50) {
            setShowEpisodesList(false);
            setShowSettings(false);
        }
        setTouchStartY(null);
    };

    const displayTitle = currentEpisode ? `${movie.title} - ${currentEpisode.title}` : movie.title;

    return (
        <div 
            ref={containerRef} 
            className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden select-none" 
            onMouseMove={triggerControls}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {isResolving ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest animate-pulse">ALOQA O'RNATILMOQDA...</p>
                </div>
            ) : !playableSrc ? (
                <div className="text-center p-10 max-w-sm">
                    <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-white uppercase mb-2">Video Topilmadi</h2>
                    <p className="text-zinc-500 text-xs mb-8">Ushbu anime uchun video manzili mavjud emas.</p>
                    <button onClick={onBack} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Qaytish</button>
                </div>
            ) : (
                <>
                    <video 
                        ref={videoRef} 
                        src={playableSrc} 
                        className={`w-full h-full transition-all duration-300 ${resizeMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                        onPlay={() => setIsPlaying(true)} 
                        onPause={() => setIsPlaying(false)}
                        onWaiting={() => setIsBuffering(true)} 
                        onPlaying={() => setIsBuffering(false)}
                        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                        playsInline 
                        autoPlay
                    />
                    
                    {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-20 pointer-events-none">
                            <div className="w-12 h-12 border-4 border-white/20 border-t-orange-500 rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* OVERLAY CONTROLS */}
                    <div className={`absolute inset-0 z-30 flex flex-col justify-between transition-all duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        
                        {/* Top Bar */}
                        <div className="flex items-center justify-between p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
                            <div className="flex items-center gap-4">
                                <button onClick={onBack} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90 backdrop-blur-md">
                                    <BackArrowIcon className="w-6 h-6"/>
                                </button>
                                <div>
                                    <h2 className="text-white font-bold text-sm sm:text-base leading-none shadow-black drop-shadow-md">{displayTitle}</h2>
                                    {episodes.length > 0 && <p className="text-zinc-400 text-[10px] font-bold mt-1">Tepaga suring: Qismlar</p>}
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md">
                                    <Zap size={14} className="text-orange-500 fill-orange-500" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE</span>
                                </div>
                                <button onClick={() => { setShowSettings(!showSettings); setShowEpisodesList(false); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md">
                                    <Settings size={20} className="text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Center Play Button (only when paused/showControls) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {!isPlaying && (
                                <div className="w-20 h-20 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={togglePlay}>
                                    <PlayIcon className="w-8 h-8 text-white ml-1"/>
                                </div>
                            )}
                        </div>

                        {/* Bottom Bar */}
                        <div className="p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent pb-10">
                            {/* Progress Bar */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-[10px] font-mono font-bold text-zinc-300 w-10 text-right">{formatTime(currentTime)}</span>
                                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative cursor-pointer group">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-orange-600 rounded-full" 
                                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                    ></div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={duration || 100} 
                                        value={currentTime} 
                                        onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-zinc-300 w-10">{formatTime(duration)}</span>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between">
                                <div className="flex gap-6">
                                    <button onClick={togglePlay} className="text-white hover:text-orange-500 transition-all active:scale-90">
                                        {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                                    </button>
                                    {episodes.length > 0 && (
                                        <button onClick={() => setShowEpisodesList(!showEpisodesList)} className="text-zinc-300 hover:text-white flex items-center gap-2 transition-all">
                                            <Layers size={24} />
                                            <span className="text-[10px] font-bold uppercase hidden sm:inline">Qismlar</span>
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => containerRef.current?.requestFullscreen()} className="text-zinc-300 hover:text-white transition-all active:scale-90">
                                    <FullscreenEnterIcon className="w-6 h-6"/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SETTINGS DRAWER (Right Side) */}
                    {showSettings && (
                        <div className="absolute right-0 top-0 bottom-0 w-64 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-6 animate-slide-in-right">
                            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                                <h3 className="text-white font-bold uppercase tracking-widest text-sm">Sozlamalar</h3>
                                <button onClick={() => setShowSettings(false)}><X size={20} className="text-zinc-400 hover:text-white"/></button>
                            </div>

                            {/* Speed Control */}
                            <div className="mb-8">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Zap size={12}/> Tezlik
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[0.5, 1.0, 1.25, 1.5, 2.0].map(speed => (
                                        <button 
                                            key={speed}
                                            onClick={() => setPlaybackRate(speed)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${playbackRate === speed ? 'bg-orange-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Aspect Ratio */}
                            <div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Monitor size={12}/> Format
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => setResizeMode('contain')}
                                        className={`flex justify-between items-center px-4 py-3 rounded-xl text-xs font-bold transition-all ${resizeMode === 'contain' ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-zinc-500'}`}
                                    >
                                        <span>Sig'dirish (Original)</span>
                                        {resizeMode === 'contain' && <Check size={14} className="text-orange-500"/>}
                                    </button>
                                    <button 
                                        onClick={() => setResizeMode('cover')}
                                        className={`flex justify-between items-center px-4 py-3 rounded-xl text-xs font-bold transition-all ${resizeMode === 'cover' ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-zinc-500'}`}
                                    >
                                        <span>To'ldirish (Zoom)</span>
                                        {resizeMode === 'cover' && <Check size={14} className="text-orange-500"/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EPISODES DRAWER (Bottom) */}
                    <div className={`absolute bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 z-50 transition-transform duration-300 rounded-t-[2rem] flex flex-col max-h-[70vh] ${showEpisodesList ? 'translate-y-0' : 'translate-y-full'}`}>
                        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
                            <div>
                                <h3 className="text-white font-bold uppercase tracking-tight text-lg">Qismlar</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{episodes.length} ta epizod</p>
                            </div>
                            <button onClick={() => setShowEpisodesList(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all"><ChevronRight size={20} className="rotate-90"/></button>
                        </div>
                        
                        <div className="overflow-y-auto p-4 custom-scrollbar">
                            {episodes.length === 0 ? (
                                <p className="text-center text-zinc-500 py-10 text-xs uppercase font-bold">Qismlar topilmadi</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {episodes.map((ep, i) => (
                                        <button 
                                            key={ep.id}
                                            onClick={() => handleEpisodeChange(ep)}
                                            className={`flex items-center gap-4 p-3 rounded-xl text-left transition-all border ${currentEpisode?.id === ep.id ? 'bg-orange-600/20 border-orange-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-zinc-500 font-black text-sm flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-xs font-bold truncate ${currentEpisode?.id === ep.id ? 'text-orange-400' : 'text-white'}`}>{ep.title}</p>
                                                {currentEpisode?.id === ep.id && <p className="text-[9px] text-orange-500/70 font-black uppercase tracking-wider mt-0.5">O'ynamoqda</p>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
