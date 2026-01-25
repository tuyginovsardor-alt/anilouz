
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Movie, Episode } from './types';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { FullscreenEnterIcon } from './components/icons/FullscreenEnterIcon';
import { FullscreenExitIcon } from './components/icons/FullscreenExitIcon';
import { VolumeUpIcon } from './components/icons/VolumeUpIcon';
import { VolumeOffIcon } from './components/icons/VolumeOffIcon';
import { getMovieEpisodes } from './services/dbService';
import { Settings, X, Crown, FastForward, Rewind, Check, ChevronDown } from 'lucide-react';

interface VideoPlayerPageProps {
  movie: Movie;
  episode?: Episode | null;
  onBack: () => void;
}

const playbackRates = [0.5, 1.0, 1.25, 1.5, 2.0];
const qualities = ['Avto', '1080p', '720p', '480p'];

export const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ movie, episode: initialEpisode, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Data State
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(initialEpisode || null);
    const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
    
    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isEpisodesOpen, setIsEpisodesOpen] = useState(false);
    
    // Settings State
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [quality, setQuality] = useState('Avto');

    // Gesture State
    const lastTap = useRef<{ time: number, side: 'left' | 'right' | null }>({ time: 0, side: null });
    const touchStartY = useRef<number | null>(null);
    const controlsTimeout = useRef<number | null>(null);

    useEffect(() => {
        getMovieEpisodes(movie.id!).then(setAllEpisodes);
        
        const handleFS = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, [movie.id]);

    // --- CONTROLS VISIBILITY ---
    const triggerControls = () => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        if (isPlaying && !isSettingsOpen && !isEpisodesOpen) {
            controlsTimeout.current = window.setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    // --- GESTURES (Double Tap & Swipe) ---
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        triggerControls();
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartY.current !== null) {
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchStartY.current - touchEndY;

            // Swipe Up (> 50px) - Open Episodes
            if (deltaY > 50) {
                setIsEpisodesOpen(true);
                setShowControls(false);
            }
            // Swipe Down (> 50px) - Close Episodes if open
            if (deltaY < -50 && isEpisodesOpen) {
                setIsEpisodesOpen(false);
            }
            touchStartY.current = null;
        }
    };

    const handleVideoClick = (e: React.MouseEvent) => {
        // Prevent click if settings/episodes are open
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }
        if (isEpisodesOpen) { setIsEpisodesOpen(false); return; }

        const now = Date.now();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        
        // Define zones: Left 30%, Right 30%
        const side = x < width * 0.3 ? 'left' : x > width * 0.7 ? 'right' : null;

        if (side && now - lastTap.current.time < 300 && lastTap.current.side === side) {
            // DOUBLE TAP
            if (videoRef.current) {
                videoRef.current.currentTime += side === 'right' ? 15 : -15;
            }
        } else {
            // SINGLE TAP
            if (!side) {
                // Center tap toggles Play/Pause ONLY if controls are hidden, otherwise just show controls
                if (showControls) {
                    togglePlay();
                } else {
                    triggerControls();
                }
            } else {
                triggerControls();
            }
        }
        lastTap.current = { time: now, side };
    };

    // --- PLAYER LOGIC ---
    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) videoRef.current.play();
            else videoRef.current.pause();
        }
    };

    const handleSpeedChange = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const displayTitle = currentEpisode ? `${movie.title} - ${currentEpisode.title}` : movie.title;
    const src = currentEpisode ? currentEpisode.source : movie.videoUrl;

    return (
        <div 
            ref={containerRef} 
            className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden font-sans select-none" 
            onMouseMove={triggerControls}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <video 
                ref={videoRef} 
                src={src} 
                className="w-full h-full object-contain" 
                onPlay={() => { setIsPlaying(true); triggerControls(); }}
                onPause={() => { setIsPlaying(false); setShowControls(true); }}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                playsInline
                autoPlay
            />

            {/* INTERACTION LAYER */}
            <div className="absolute inset-0 z-10" onClick={handleVideoClick}></div>

            {/* BUFFERING INDICATOR */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* --- CONTROLS OVERLAY --- */}
            <div className={`absolute inset-0 z-30 flex flex-col justify-between transition-opacity duration-300 ${showControls && !isEpisodesOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                
                {/* TOP BAR */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={onBack} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                            <BackArrowIcon className="w-6 h-6"/>
                        </button>
                        <h2 className="text-white font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">{displayTitle}</h2>
                    </div>
                    {/* PREMIUM BADGE (Rasmga mos) */}
                    <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full shadow-lg shadow-yellow-500/20">
                        <Crown size={14} className="text-black fill-black" />
                        <span className="text-[10px] font-black text-black uppercase tracking-widest">Premium • Reklamasiz</span>
                    </div>
                </div>

                {/* CENTER PLAY BUTTON (Rasmga mos) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {!isPlaying && (
                        <div className="w-20 h-20 rounded-full border-4 border-yellow-500 bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-pulse pointer-events-auto cursor-pointer" onClick={togglePlay}>
                            <PlayIcon className="w-10 h-10 text-yellow-500 fill-yellow-500 ml-1.5" />
                        </div>
                    )}
                </div>

                {/* BOTTOM BAR */}
                <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pb-8 sm:pb-6 space-y-2">
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 group/progress">
                        <input 
                            type="range" 
                            min="0" 
                            max={duration || 100} 
                            value={currentTime} 
                            onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }}
                            className="flex-1 h-1 bg-white/30 rounded-full appearance-none accent-yellow-500 cursor-pointer hover:h-1.5 transition-all"
                        />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* Play/Pause */}
                            <button onClick={togglePlay} className="text-white hover:text-yellow-500 transition-colors">
                                {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                            </button>

                            {/* Volume */}
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-gray-300 hidden sm:block">
                                {isMuted ? <VolumeOffIcon className="w-6 h-6"/> : <VolumeUpIcon className="w-6 h-6"/>}
                            </button>

                            {/* Time */}
                            <span className="text-xs font-mono font-medium text-gray-300">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Settings Toggle */}
                            <button 
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                                className={`text-white transition-transform ${isSettingsOpen ? 'rotate-90 text-yellow-500' : 'hover:text-gray-300'}`}
                            >
                                <Settings size={24} />
                            </button>

                            {/* Fullscreen */}
                            <button onClick={() => !document.fullscreenElement ? containerRef.current?.requestFullscreen() : document.exitFullscreen()} className="text-white hover:scale-110 transition-transform">
                                {isFullScreen ? <FullscreenExitIcon className="w-6 h-6"/> : <FullscreenEnterIcon className="w-6 h-6"/>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SETTINGS MENU (Rasmda ko'rinmagan, lekin so'ralgan) --- */}
            {isSettingsOpen && (
                <div className="absolute right-4 bottom-20 bg-black/90 border border-white/10 rounded-2xl p-4 w-64 backdrop-blur-xl z-40 animate-fade-in text-white shadow-2xl">
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                        <span className="font-bold text-sm uppercase text-gray-400">Sozlamalar</span>
                        <button onClick={() => setIsSettingsOpen(false)}><X size={16}/></button>
                    </div>
                    
                    {/* Speed */}
                    <div className="mb-4">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Tezlik</p>
                        <div className="flex justify-between bg-white/5 rounded-lg p-1">
                            {playbackRates.map(rate => (
                                <button 
                                    key={rate} 
                                    onClick={() => handleSpeedChange(rate)}
                                    className={`flex-1 py-1 text-xs rounded-md font-bold transition-all ${playbackRate === rate ? 'bg-yellow-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quality (Mock) */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Sifat</p>
                        <div className="grid grid-cols-2 gap-2">
                            {qualities.map(q => (
                                <button 
                                    key={q} 
                                    onClick={() => setQuality(q)}
                                    className={`py-1.5 text-xs rounded-lg font-bold border transition-all ${quality === q ? 'border-yellow-600 text-yellow-500 bg-yellow-900/20' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- EPISODES DRAWER (Swipe Up) --- */}
            <div 
                className={`absolute bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-xl border-t border-white/10 z-50 transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${isEpisodesOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ height: '60vh' }}
            >
                <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsEpisodesOpen(false)}>
                    <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
                </div>
                
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                    <h3 className="text-white font-black uppercase text-sm tracking-widest">Keyingi Qismlar</h3>
                    <button onClick={() => setIsEpisodesOpen(false)} className="bg-white/10 p-2 rounded-full text-white"><ChevronDown size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                        {allEpisodes.length > 0 ? allEpisodes.map((ep, i) => (
                            <div 
                                key={ep.id} 
                                onClick={() => { setCurrentEpisode(ep); setIsEpisodesOpen(false); }}
                                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${currentEpisode?.id === ep.id ? 'bg-yellow-900/20 border-yellow-600/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                            >
                                <div className="relative w-24 h-14 bg-black rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={movie.posterUrl} className="w-full h-full object-cover opacity-60" alt="" />
                                    {currentEpisode?.id === ep.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce mx-0.5"></div>
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75 mx-0.5"></div>
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150 mx-0.5"></div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${currentEpisode?.id === ep.id ? 'text-yellow-500' : 'text-white'}`}>{ep.title}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{i + 1}-QISM</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-gray-500 py-10">Qismlar topilmadi</div>
                        )}
                    </div>
                </div>
            </div>

            {/* HINT FOR SWIPE */}
            {!isEpisodesOpen && showControls && allEpisodes.length > 0 && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-[10px] font-bold uppercase tracking-widest animate-bounce pointer-events-none">
                    Tepaga torting
                </div>
            )}
        </div>
    );
};
