
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Movie, Episode } from './types';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { FullscreenEnterIcon } from './components/icons/FullscreenEnterIcon';
import { FullscreenExitIcon } from './components/icons/FullscreenExitIcon';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { getMovieEpisodes, getAppConfig } from './services/dbService';
import { SkipBack, SkipForward, XCircle } from 'lucide-react';

interface VideoPlayerPageProps {
  movie: Movie;
  episode?: Episode | null;
  onBack: () => void;
}

export const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ movie, episode: initialEpisode, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(initialEpisode || null);
    const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    
    const controlsTimeout = useRef<number | null>(null);
    const lastTap = useRef<{ time: number, side: 'left' | 'right' | null }>({ time: 0, side: null });

    useEffect(() => {
        getAppConfig().then(cfg => setCustomLogo(cfg['site_logo']));
        getMovieEpisodes(movie.id!).then(setAllEpisodes);
        
        const handleFS = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, [movie.id]);

    const handleVideoClick = (e: React.MouseEvent) => {
        const now = Date.now();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const side = x < rect.width / 3 ? 'left' : x > (rect.width * 2) / 3 ? 'right' : null;

        if (side && now - lastTap.current.time < 300 && lastTap.current.side === side) {
            // Double Tap detected
            if (videoRef.current) {
                videoRef.current.currentTime += side === 'right' ? 15 : -15;
            }
        } else {
            // Single Tap: Toggle Controls/Play
            if (!side) {
                if (videoRef.current?.paused) videoRef.current.play();
                else videoRef.current?.pause();
            }
            triggerControls();
        }
        lastTap.current = { time: now, side };
    };

    const triggerControls = () => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = window.setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const handleNext = () => {
        const idx = allEpisodes.findIndex(e => e.id === currentEpisode?.id);
        if (idx !== -1 && idx < allEpisodes.length - 1) setCurrentEpisode(allEpisodes[idx + 1]);
    };

    const handlePrev = () => {
        const idx = allEpisodes.findIndex(e => e.id === currentEpisode?.id);
        if (idx > 0) setCurrentEpisode(allEpisodes[idx - 1]);
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const src = currentEpisode ? currentEpisode.source : movie.videoUrl;

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden" onMouseMove={triggerControls}>
            <video 
                ref={videoRef} 
                src={src} 
                className="w-full h-full" 
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onError={() => setVideoError("Video yuklanmadi")}
                autoPlay
                playsInline
            />

            {/* Tap Zones & Interaction */}
            <div className="absolute inset-0 z-10" onClick={handleVideoClick}></div>

            {/* Loading / Buffering with Logo */}
            {isBuffering && !videoError && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-2 rounded-full overflow-hidden bg-black flex items-center justify-center">
                            {customLogo ? <img src={customLogo} className="w-full h-full object-cover opacity-50" /> : <UzumakiLogo className="w-8 h-8 opacity-50" />}
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className={`absolute inset-0 z-30 transition-opacity duration-500 flex flex-col justify-between p-6 bg-gradient-to-t from-black/80 via-transparent to-black/80 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"><BackArrowIcon className="w-6 h-6"/></button>
                    <h2 className="text-white font-bold truncate max-w-xs">{currentEpisode ? `${movie.title} - ${currentEpisode.title}` : movie.title}</h2>
                    <div className="w-10"></div>
                </div>

                <div className="flex items-center justify-center gap-12 md:gap-24">
                    <button onClick={handlePrev} className="text-white/50 hover:text-white transition-colors"><SkipBack size={40}/></button>
                    <button onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()} className="bg-white text-black p-6 rounded-full shadow-2xl scale-125 transition-transform active:scale-110">
                        {isPlaying ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10 ml-1"/>}
                    </button>
                    <button onClick={handleNext} className="text-white/50 hover:text-white transition-colors"><SkipForward size={40}/></button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-white/70">{formatTime(currentTime)}</span>
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full relative overflow-hidden group/bar">
                            <div className="absolute h-full bg-orange-600" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                            <input 
                                type="range" min="0" max={duration} value={currentTime} 
                                onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            />
                        </div>
                        <span className="text-[10px] font-mono text-white/70">{formatTime(duration)}</span>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={() => !document.fullscreenElement ? containerRef.current?.requestFullscreen() : document.exitFullscreen()} className="text-white">
                            {isFullScreen ? <FullscreenExitIcon className="w-6 h-6"/> : <FullscreenEnterIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>
            </div>

            {videoError && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6 text-center">
                    <XCircle size={64} className="text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{videoError}</h3>
                    <button onClick={onBack} className="mt-4 px-8 py-2 bg-orange-600 rounded-lg text-white font-bold">Orqaga qaytish</button>
                </div>
            )}
        </div>
    );
};
