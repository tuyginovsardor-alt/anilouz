
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Movie, Ad, Episode } from './types';
import { getPlayerAds } from './services/adService';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { VolumeUpIcon } from './components/icons/VolumeUpIcon';
import { VolumeOffIcon } from './components/icons/VolumeOffIcon';
import { FullscreenEnterIcon } from './components/icons/FullscreenEnterIcon';
import { FullscreenExitIcon } from './components/icons/FullscreenExitIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from './components/icons/ChevronRightIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { supabase } from './services/supabaseClient';
import { getUserProfile, startFreeTrial, updateUserWatchTime, getAppConfig, getMovieEpisodes } from './services/dbService';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { CrownIcon } from './components/icons/CrownIcon';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SkipBack, SkipForward, FastForward, Rewind } from 'lucide-react';

interface VideoPlayerPageProps {
  movie: Movie;
  episode?: Episode | null;
  onBack: () => void;
}

const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
const qualities = ['Avto', '1080p', '720p', '480p', '360p'];

export const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ movie, episode: initialEpisode, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);
    const shownAdsRef = useRef<Set<number>>(new Set());
    const trialCheckIntervalRef = useRef<number | null>(null);
    
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(initialEpisode || null);
    const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [videoError, setVideoError] = useState<React.ReactNode | null>(null);
    const [isPausedByAd, setIsPausedByAd] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [areControlsVisible, setAreControlsVisible] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsView, setSettingsView] = useState<'main' | 'speed' | 'quality'>('main');
    const [playbackRate, setPlaybackRate] = useState(1);
    const [quality, setQuality] = useState('Avto');
    const [overlayAd, setOverlayAd] = useState<Ad | null>(null);
    const [playerAds, setPlayerAds] = useState<Ad[]>([]);
    
    const [seekFeedback, setSeekFeedback] = useState<{ show: boolean, direction: 'fwd' | 'back' }>({ show: false, direction: 'fwd' });

    const [isTimePremium, setIsTimePremium] = useState(false);
    const [isAdFree, setIsAdFree] = useState(false);
    const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const videoSrc = currentEpisode ? currentEpisode.source : movie.videoUrl;
    const displayTitle = currentEpisode ? `${movie.title} - ${currentEpisode.title}` : movie.title;

    useEffect(() => {
        const initPlayer = async () => {
            try {
                const [ads, eps] = await Promise.all([
                    getPlayerAds(),
                    getMovieEpisodes(movie.id!)
                ]);
                setPlayerAds(ads);
                setAllEpisodes(eps);
                
                // Agar boshida epizod berilmagan bo'lsa va serial bo'lsa, 1-sini tanlash
                if (!currentEpisode && eps.length > 0) {
                    setCurrentEpisode(eps[0]);
                }
            } catch(e) { console.error(e); }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                checkPremiumStatus(user.id);
            }
        };
        initPlayer();
        return () => {
            if (trialCheckIntervalRef.current) clearInterval(trialCheckIntervalRef.current);
        };
    }, []);

    const checkPremiumStatus = async (uid: string) => {
         let trialLimitMs = 60 * 60 * 1000;
         try {
             const config = await getAppConfig();
             if (config['free_trial_minutes']) {
                 trialLimitMs = Number(config['free_trial_minutes']) * 60 * 1000;
             }
         } catch(e) {}

         const profile = await getUserProfile(uid);
         if (profile) {
            const isAdminOrOwner = ['admin', 'owner', 'manager'].includes(profile.role);
            const hasValidSubscription = profile.subscription_end_at && new Date(profile.subscription_end_at) > new Date();
            const hasUnlimitedTime = !!(isAdminOrOwner || hasValidSubscription || profile.role === 'premium');
            setIsTimePremium(hasUnlimitedTime);

            const is1YearPlan = profile.subscription_plan === '1-yil';
            const hasNoAds = !!(isAdminOrOwner || (hasValidSubscription && is1YearPlan));
            setIsAdFree(hasNoAds);

            if (!hasUnlimitedTime) {
                let startTimeStr = profile.free_trial_started_at;
                if (!startTimeStr) {
                    try { startTimeStr = await startFreeTrial(uid); } catch (e) {}
                }
                if (startTimeStr) {
                    const startTime = new Date(startTimeStr).getTime();
                    trialCheckIntervalRef.current = window.setInterval(() => {
                        const now = Date.now();
                        const elapsed = now - startTime;
                        const left = Math.max(0, trialLimitMs - elapsed);
                        setRemainingTimeMs(left);
                        if (left <= 0) {
                            videoRef.current?.pause();
                            setIsPlaying(false);
                            setShowPremiumModal(true);
                            if (trialCheckIntervalRef.current) clearInterval(trialCheckIntervalRef.current);
                        }
                    }, 1000);
                }
            } else {
                setRemainingTimeMs(Infinity);
                if (trialCheckIntervalRef.current) clearInterval(trialCheckIntervalRef.current);
                setShowPremiumModal(false);
            }
        }
    }

    const showControls = useCallback(() => {
        setAreControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying && !showPremiumModal) {
             controlsTimeoutRef.current = window.setTimeout(() => {
                setAreControlsVisible(false);
                setIsSettingsOpen(false);
            }, 3000);
        }
    }, [isPlaying, showPremiumModal]);

    const togglePlay = useCallback(() => {
        if (showPremiumModal || videoError) return;
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().then(() => {
                    setIsPlaying(true);
                    setIsPausedByAd(false);
                    showControls();
                }).catch(e => console.error(e));
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [showControls, showPremiumModal, videoError]);

    const handleSeek = (amount: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime += amount;
        showControls();
        setSeekFeedback({ show: true, direction: amount > 0 ? 'fwd' : 'back' });
        setTimeout(() => setSeekFeedback(prev => ({ ...prev, show: false })), 600);
    };

    const handleNextEpisode = () => {
        if (!currentEpisode || allEpisodes.length === 0) return;
        const currentIndex = allEpisodes.findIndex(e => e.id === currentEpisode.id);
        if (currentIndex < allEpisodes.length - 1) {
            setCurrentEpisode(allEpisodes[currentIndex + 1]);
            setVideoError(null);
            setIsBuffering(true);
        }
    };

    const handlePrevEpisode = () => {
        if (!currentEpisode || allEpisodes.length === 0) return;
        const currentIndex = allEpisodes.findIndex(e => e.id === currentEpisode.id);
        if (currentIndex > 0) {
            setCurrentEpisode(allEpisodes[currentIndex - 1]);
            setVideoError(null);
            setIsBuffering(true);
        }
    };

    const toggleFullScreen = () => {
        showControls();
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            if (!isAdFree) {
                const adTriggers = [
                    { time: 15, location: 'player_overlay_small_banner' },
                    { time: 30, location: 'player_overlay_large_banner' }
                ];
                for (const trigger of adTriggers) {
                    const ad = playerAds.find(a => a.location === trigger.location);
                    if (ad && !shownAdsRef.current.has(ad.id) && video.currentTime >= trigger.time) {
                        setOverlayAd(ad);
                        shownAdsRef.current.add(ad.id);
                        break;
                    }
                }
            }
        };

        const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('loadedmetadata', () => { setDuration(video.duration); video.play().catch(()=>{}); });
        video.addEventListener('waiting', () => setIsBuffering(true));
        video.addEventListener('playing', () => setIsBuffering(false));
        video.addEventListener('error', () => { setIsBuffering(false); setVideoError("Video manbasi yuklanmadi."); });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (overlayAd || showPremiumModal || videoError) return;
            showControls();
            if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
            if (e.code === 'ArrowRight') handleSeek(15);
            if (e.code === 'ArrowLeft') handleSeek(-15);
            if (e.code === 'KeyF') toggleFullScreen();
            if (e.code === 'KeyN') handleNextEpisode();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            video.removeEventListener('timeupdate', onTimeUpdate);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [togglePlay, showControls, playerAds, isAdFree, currentEpisode, allEpisodes]);

    const currentIndex = allEpisodes.findIndex(e => e.id === currentEpisode?.id);
    const hasNext = currentIndex !== -1 && currentIndex < allEpisodes.length - 1;
    const hasPrev = currentIndex !== -1 && currentIndex > 0;

    return (
        <div ref={containerRef} className="w-full h-screen bg-black flex items-center justify-center relative group overflow-hidden" onMouseMove={showControls}>
            <video ref={videoRef} src={videoSrc} className="w-full h-full object-contain" onClick={togglePlay} playsInline />

            {/* Tap to Seek Areas */}
            <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSeek(-15); }}></div>
            <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSeek(15); }}></div>

            {/* Seek Feedback Visual */}
            {seekFeedback.show && (
                <div className={`absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none animate-ping ${seekFeedback.direction === 'fwd' ? 'right-1/4' : 'left-1/4'}`}>
                    {seekFeedback.direction === 'fwd' ? <FastForward size={48} className="text-white fill-white"/> : <Rewind size={48} className="text-white fill-white"/>}
                    <span className="text-white font-black text-xl">{seekFeedback.direction === 'fwd' ? '+15' : '-15'}</span>
                </div>
            )}

            {isBuffering && !videoError && !showPremiumModal && (
                <div className="absolute inset-0 flex items-center justify-center z-10"><LoadingSpinner /></div>
            )}

            {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-4 text-center">
                    <XCircle size={48} className="text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{videoError}</h3>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 rounded-lg text-white font-bold mt-4">Qayta urinish</button>
                </div>
            )}

            <div className={`absolute inset-0 transition-opacity duration-300 bg-gradient-to-t from-black/80 via-transparent to-black/80 ${areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><BackArrowIcon className="w-6 h-6 text-white"/></button>
                        <h1 className="text-white font-bold truncate max-w-xs md:max-w-md">{displayTitle}</h1>
                    </div>
                    {isTimePremium && <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-yellow-500/20"><CrownIcon className="w-3 h-3"/> Premium</div>}
                </div>

                {/* Center Controls */}
                <div className="absolute inset-0 flex items-center justify-center gap-12 md:gap-24">
                    <button onClick={handlePrevEpisode} disabled={!hasPrev} className={`p-4 rounded-full transition-all ${hasPrev ? 'text-white hover:bg-white/10' : 'text-zinc-700'}`}><SkipBack size={32}/></button>
                    <button onClick={togglePlay} className="p-8 bg-white text-black rounded-full hover:scale-110 transition-all shadow-2xl">{isPlaying ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10 ml-1"/>}</button>
                    <button onClick={handleNextEpisode} disabled={!hasNext} className={`p-4 rounded-full transition-all ${hasNext ? 'text-white hover:bg-white/10' : 'text-zinc-700'}`}><SkipForward size={32}/></button>
                </div>

                {/* Bottom Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 space-y-4">
                    <div className="flex items-center gap-4 group/progress">
                        <span className="text-white text-xs font-mono">{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e)=> { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }} className="flex-1 h-1 bg-white/20 rounded-full appearance-none accent-orange-600 cursor-pointer group-hover/progress:h-2 transition-all"/>
                        <span className="text-white text-xs font-mono">{formatTime(duration)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsMuted(!isMuted)} className="text-white">{isMuted || volume === 0 ? <VolumeOffIcon className="w-6 h-6"/> : <VolumeUpIcon className="w-6 h-6"/>}</button>
                                <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={(e)=> { setVolume(Number(e.target.value)); if(videoRef.current) videoRef.current.volume = Number(e.target.value); }} className="w-20 h-1 accent-white"/>
                            </div>
                            <span className="bg-white/10 px-2 py-1 rounded text-[10px] text-white font-black uppercase tracking-widest">{quality}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={toggleFullScreen} className="text-white hover:scale-110 transition-all">{isFullScreen ? <FullscreenExitIcon className="w-7 h-7"/> : <FullscreenEnterIcon className="w-7 h-7"/>}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
