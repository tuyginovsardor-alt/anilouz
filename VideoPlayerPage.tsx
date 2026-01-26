
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Movie, Episode } from './types';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { FullscreenEnterIcon } from './components/icons/FullscreenEnterIcon';
import { FullscreenExitIcon } from './components/icons/FullscreenExitIcon';
import { VolumeUpIcon } from './components/icons/VolumeUpIcon';
import { VolumeOffIcon } from './components/icons/VolumeOffIcon';
import { getMovieEpisodes, getSecuredUrl } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { Settings, X, Crown, ShieldAlert, Lock, Zap } from 'lucide-react';

interface VideoPlayerPageProps {
  movie: Movie;
  episode?: Episode | null;
  onBack: () => void;
}

export const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ movie, episode: initialEpisode, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(initialEpisode || null);
    const [playableSrc, setPlayableSrc] = useState<string>('');
    const [isResolving, setIsResolving] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFS = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    // --- INSTANT STATIC RESOLVER ---
    useEffect(() => {
        const resolveSource = async () => {
            setIsResolving(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const rawUrl = currentEpisode ? currentEpisode.source : movie.videoUrl;
                
                if (user) {
                    const masked = await getSecuredUrl(rawUrl, user.id);
                    
                    if (masked.startsWith('anilo-vault://')) {
                        // Vault Decryption: Un-reverse -> Base64 Decode -> Split
                        const encoded = masked.replace('anilo-vault://', '').split('').reverse().join('');
                        const decoded = atob(encoded);
                        const [url, key] = decoded.split('|');
                        
                        // "Security Checking Key" verification
                        if (key !== "ANILO_MASTER_V3_SECURE_KEY") {
                            throw new Error("Xavfsizlik kaliti xato");
                        }
                        setPlayableSrc(url);
                    } else {
                        setPlayableSrc(rawUrl);
                    }
                } else {
                    setPlayableSrc(rawUrl);
                }
            } catch (e) {
                console.error("Resolve error", e);
                setPlayableSrc('anilo-secured://access-denied');
            } finally {
                // Tezkor resolving
                setIsResolving(false);
            }
        };
        resolveSource();
    }, [currentEpisode, movie.videoUrl, movie.id]);

    const triggerControls = () => {
        setShowControls(true);
        const timer = window.setTimeout(() => isPlaying && setShowControls(false), 3000);
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

    const displayTitle = currentEpisode ? `${movie.title} - ${currentEpisode.title}` : movie.title;

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden select-none" onMouseMove={triggerControls}>
            {isResolving ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest animate-pulse">HIMOYALANGAN ALOQA...</p>
                </div>
            ) : playableSrc === 'anilo-secured://access-denied' ? (
                <div className="text-center p-10 max-w-sm">
                    <ShieldAlert size={64} className="text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-white uppercase mb-2">Kirish Rad Etildi</h2>
                    <p className="text-zinc-500 text-xs mb-8">Xavfsizlik kaliti tasdiqlanmadi yoki ruxsat yo'q.</p>
                    <button onClick={onBack} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Qaytish</button>
                </div>
            ) : (
                <>
                    <video 
                        ref={videoRef} src={playableSrc} className="w-full h-full object-contain" 
                        onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
                        onWaiting={() => setIsBuffering(true)} onPlaying={() => setIsBuffering(false)}
                        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                        playsInline autoPlay
                    />
                    
                    {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-20 pointer-events-none">
                            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    <div className={`absolute inset-0 z-30 flex flex-col justify-between transition-all duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex items-center justify-between p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
                            <div className="flex items-center gap-4">
                                <button onClick={onBack} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"><BackArrowIcon className="w-6 h-6"/></button>
                                <div>
                                    <h2 className="text-white font-bold text-sm sm:text-base leading-none">{displayTitle}</h2>
                                    <p className="text-orange-500 text-[9px] font-black uppercase tracking-widest mt-1">Anilo Secured Stream</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-zinc-800 to-zinc-900 border border-white/10 rounded-xl shadow-lg scale-90">
                                <Zap size={14} className="text-orange-500 fill-orange-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">VAULT V3</span>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-t from-black/95 via-black/40 to-transparent pb-10">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-[10px] font-mono font-bold text-zinc-400">{formatTime(currentTime)}</span>
                                <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }} className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none accent-orange-500 cursor-pointer overflow-hidden" />
                                <span className="text-[10px] font-mono font-bold text-zinc-400">{formatTime(duration)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <button onClick={togglePlay} className="text-white hover:text-orange-500 transition-all active:scale-90">{isPlaying ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10"/>}</button>
                                <button onClick={() => containerRef.current?.requestFullscreen()} className="p-2 text-zinc-400 hover:text-white transition-all"><FullscreenEnterIcon className="w-6 h-6"/></button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
