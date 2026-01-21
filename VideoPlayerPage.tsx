
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Movie, Ad } from './types';
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
import { CheckIcon } from './components/icons/CheckIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { supabase } from './services/supabaseClient';
import { getUserProfile, startFreeTrial, updateUserWatchTime, getAppConfig } from './services/dbService';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { CrownIcon } from './components/icons/CrownIcon';
import { LoadingSpinner } from './components/LoadingSpinner';

interface VideoPlayerPageProps {
  movie: Movie;
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

const getAdContainerClass = (location: Ad['location']): string => {
    switch (location) {
        case 'player_overlay_full':
            return 'inset-0 p-8 bg-black/80 flex items-center justify-center animate-fade-in';
        case 'player_overlay_large_banner':
            return 'bottom-24 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl animate-fade-in';
        case 'player_overlay_small_banner':
            return 'bottom-24 left-4 w-1/3 max-w-xs animate-fade-in';
        default:
            return '';
    }
};

// Custom Big Play Button Component
const AniloPlayButton = () => (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
        
        {/* Circle Container */}
        <div className="relative z-10 w-full h-full bg-black/60 backdrop-blur-sm border-2 border-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
             {/* The Triangle */}
             <div className="ml-2 w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-yellow-500 border-b-[12px] border-b-transparent sm:border-t-[16px] sm:border-l-[32px] sm:border-b-[16px]"></div>
        </div>
    </div>
);

export const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ movie, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);
    const shownAdsRef = useRef<Set<number>>(new Set());
    const trialCheckIntervalRef = useRef<number | null>(null);
    
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
    
    // Limit & Premium Logic
    const [isTimePremium, setIsTimePremium] = useState(false); // True = Unlimited Time (Any Premium)
    const [isAdFree, setIsAdFree] = useState(false); // True = No Ads (Only 1-year or Admin)
    const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const videoSrc = movie.videoUrl;

    useEffect(() => {
        const initPlayer = async () => {
            // 1. Load Ads using new async service
            try {
                const ads = await getPlayerAds();
                setPlayerAds(ads);
            } catch(e) {
                console.error("Error loading player ads", e);
            }

            // 2. Check User & Permissions
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
         // Fetch config for trial duration first
         let trialLimitMs = 60 * 60 * 1000; // Default: 1 hour
         try {
             const config = await getAppConfig();
             if (config['free_trial_minutes']) {
                 trialLimitMs = Number(config['free_trial_minutes']) * 60 * 1000;
             }
         } catch(e) { console.error("Config fetch error, using default 1h", e); }

         const profile = await getUserProfile(uid);
                
         if (profile) {
            // Role Checks
            const isAdminOrOwner = ['admin', 'owner', 'manager'].includes(profile.role);
            const isPremiumRole = profile.role === 'premium';
            const hasValidSubscription = profile.subscription_end_at && new Date(profile.subscription_end_at) > new Date();
            
            // 1. Time Limit Check (Any valid subscription OR premium role OR admin removes limit)
            const hasUnlimitedTime = !!(isAdminOrOwner || hasValidSubscription || isPremiumRole);
            setIsTimePremium(hasUnlimitedTime);

            // 2. No Ads Check (Only 1-Year plan OR Admin removes ads)
            // Boshqa planlarda (1-oy, 3-oy) REKLAMA BO'LADI.
            const is1YearPlan = profile.subscription_plan === '1-yil';
            const hasNoAds = !!(isAdminOrOwner || (hasValidSubscription && is1YearPlan));
            
            setIsAdFree(hasNoAds);

            // Free Trial Logic
            if (!hasUnlimitedTime) {
                // Check if trial started. If not, start now.
                let startTimeStr = profile.free_trial_started_at;
                
                if (!startTimeStr) {
                    try {
                        startTimeStr = await startFreeTrial(uid);
                    } catch (e) {
                        console.error("Failed to start trial", e);
                    }
                }

                if (startTimeStr) {
                    const startTime = new Date(startTimeStr).getTime();
                    
                    // Start Interval to countdown REAL time (regardless of play/pause)
                    trialCheckIntervalRef.current = window.setInterval(() => {
                        const now = Date.now();
                        const elapsed = now - startTime;
                        const left = Math.max(0, trialLimitMs - elapsed);
                        
                        setRemainingTimeMs(left);

                        if (left <= 0) {
                            if (videoRef.current) {
                                videoRef.current.pause();
                                setIsPlaying(false);
                            }
                            setShowPremiumModal(true);
                            if (trialCheckIntervalRef.current) clearInterval(trialCheckIntervalRef.current);
                        }
                    }, 1000);
                }
            } else {
                // AGAR PREMIUM BO'LSA:
                setRemainingTimeMs(Infinity); // Unlimited
                if (trialCheckIntervalRef.current) {
                    clearInterval(trialCheckIntervalRef.current); // Mavjud taymerni o'chiramiz
                }
                setShowPremiumModal(false); // Modalni majburan yopamiz
            }
        }
    }

    // Save simple watch analytics (separate from trial limit)
    useEffect(() => {
        let interval: number;
        if (isPlaying && userId) {
            interval = window.setInterval(() => {
                updateUserWatchTime(userId, 30);
            }, 30000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, userId]);

    const showControls = useCallback(() => {
        setAreControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
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
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            setIsPlaying(true);
                            setIsPausedByAd(false);
                            showControls();
                        })
                        .catch(error => {
                            console.error("Play error:", error);
                        });
                }
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [showControls, showPremiumModal, videoError]);

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        showControls();
        if (videoRef.current) {
            const newTime = Number(e.target.value);
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        showControls();
        if (videoRef.current) {
            const newVolume = Number(e.target.value);
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    };

    const toggleMute = () => {
        showControls();
        if (videoRef.current) {
            const newMutedState = !isMuted;
            videoRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
            if (!newMutedState && volume === 0) {
              setVolume(0.5);
              videoRef.current.volume = 0.5;
            }
        }
    };
    
    const toggleFullScreen = () => {
        showControls();
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handlePlaybackRateChange = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
        setSettingsView('main');
    };

    const handleQualityChange = (q: string) => {
        setQuality(q);
        setSettingsView('main');
    };

    const toggleSettings = (e: React.MouseEvent) => {
        e.stopPropagation();
        showControls();
        setSettingsView('main');
        setIsSettingsOpen(prev => !prev);
    };
    
    const handleCloseOverlayAd = () => {
        if (isPausedByAd && videoRef.current) {
            videoRef.current.play();
        }
        setIsPausedByAd(false);
        setOverlayAd(null);
    };

    const handleVideoError = () => {
        setIsBuffering(false);
        if (videoRef.current && videoRef.current.error) {
            const code = videoRef.current.error.code;
            let msg: React.ReactNode = "Video ijro etishda noma'lum xatolik.";
            
            if (code === 1) msg = "Video yuklash bekor qilindi.";
            if (code === 2) msg = "Tarmoq xatoligi. Internetni tekshiring.";
            if (code === 3) msg = "Video formati qo'llab-quvvatlanmaydi (Format error).";
            if (code === 4) {
                msg = (
                    <div className="text-left text-sm">
                        <p className="font-bold text-red-400 mb-2">Video manbasi ochilmadi (404/403).</p>
                        <p className="mb-2">Sabablari:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                            <li>Havola eskirgan yoki noto'g'ri.</li>
                            <li>Tashqi server (Google Drive, YouTube) ruxsat bermayapti.</li>
                            <li>Fayl .mp4 yoki .m3u8 formatida emas.</li>
                        </ul>
                    </div>
                );
            }
            setVideoError(msg);
        } else {
            setVideoError("Video manbasi noto'g'ri.");
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onLoadedMetadata = () => {
            setDuration(video.duration);
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setIsPlaying(false);
                });
            }
        };
        const onWaiting = () => setIsBuffering(true);
        const onCanPlay = () => setIsBuffering(false);
        const onPlaying = () => setIsBuffering(false);

        const onTimeUpdate = () => {
            const time = video.currentTime;
            setCurrentTime(time);

            // Reklama mantig'i: Agar AdFree bo'lmasa (1 yillik yoki admin), reklamalarni ko'rsatish
            if (!isAdFree) {
                const adTriggers = [
                    { time: 15, location: 'player_overlay_small_banner' },
                    { time: 30, location: 'player_overlay_large_banner' },
                    { time: 45, location: 'player_overlay_full' },
                ];

                for (const trigger of adTriggers) {
                    const ad = playerAds.find(a => a.location === trigger.location);
                    if (ad && !shownAdsRef.current.has(ad.id) && time >= trigger.time) {
                        setOverlayAd(ad);
                        shownAdsRef.current.add(ad.id);
                        if (ad.location !== 'player_overlay_small_banner') {
                            if (!video.paused) {
                                video.pause();
                                setIsPausedByAd(true);
                            }
                        }
                        break;
                    }
                }
            }
        };

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('error', handleVideoError);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (overlayAd || showPremiumModal || videoError) return; 
            showControls();
            if (e.target instanceof HTMLInputElement) return;
            if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
            if (e.code === 'KeyF') { toggleFullScreen(); }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('error', handleVideoError);
            window.removeEventListener('keydown', handleKeyDown);
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [togglePlay, showControls, playerAds, overlayAd, isAdFree, showPremiumModal, videoError]);
    
    const SettingsMenu = () => (
        <div 
            className="absolute bottom-14 right-4 bg-black/80 backdrop-blur-md rounded-lg w-60 text-white text-sm"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={showControls}
        >
            {settingsView === 'main' && (
                <ul className="py-2">
                    <li onClick={() => setSettingsView('quality')} className="flex justify-between items-center px-4 py-2 hover:bg-white/10 cursor-pointer">
                        <span>Sifat</span>
                        <span className="text-gray-400">{quality} &gt;</span>
                    </li>
                    <li onClick={() => setSettingsView('speed')} className="flex justify-between items-center px-4 py-2 hover:bg-white/10 cursor-pointer">
                        <span>Tezlik</span>
                        <span className="text-gray-400">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`} &gt;</span>
                    </li>
                </ul>
            )}
            {settingsView !== 'main' && (
                <div>
                     <div onClick={() => setSettingsView('main')} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer border-b border-white/10">
                        <ChevronLeftIcon className="w-4 h-4" />
                        <span>{settingsView === 'quality' ? 'Sifat' : 'Tezlik'}</span>
                    </div>
                    <ul className="py-2">
                         {settingsView === 'quality' && qualities.map(q => (
                             <li key={q} onClick={() => handleQualityChange(q)} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer">
                                 {quality === q && <CheckIcon className="w-4 h-4 text-orange-400" />}
                                 <span className={quality !== q ? 'ml-6' : ''}>{q}</span>
                            </li>
                         ))}
                         {settingsView === 'speed' && playbackRates.map(rate => (
                            <li key={rate} onClick={() => handlePlaybackRateChange(rate)} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer">
                                {playbackRate === rate && <CheckIcon className="w-4 h-4 text-orange-400" />}
                                <span className={playbackRate !== rate ? 'ml-6' : ''}>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                            </li>
                         ))}
                    </ul>
                </div>
            )}
        </div>
    );

    // Calculate time parts for display
    const ms = remainingTimeMs || 0;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);

    if (!videoSrc) {
        return (
            <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-center p-6">
                <div className="mb-6 bg-red-500/10 p-6 rounded-full">
                    <PlayIcon className="w-16 h-16 text-red-500 opacity-50" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Video topilmadi</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    Ushbu film uchun video fayl (URL) bazada mavjud emas.
                </p>
                <button onClick={onBack} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <BackArrowIcon className="w-5 h-5" /> Orqaga
                </button>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            className="w-full h-screen bg-black flex items-center justify-center relative group overflow-hidden" 
            onMouseMove={showControls}
            onClick={() => { if (areControlsVisible && !overlayAd && !showPremiumModal) setIsSettingsOpen(false) }}
        >
            {/* VIDEO ELEMENT */}
            <video 
                ref={videoRef} 
                src={videoSrc} 
                className="w-full h-full object-contain" 
                onClick={overlayAd || showPremiumModal ? undefined : togglePlay}
                playsInline
                // crossOrigin="anonymous" olib tashlandi, tashqi havolalar ishlashi uchun
                controlsList="nodownload" 
                onContextMenu={(e) => e.preventDefault()} 
            >
                Sizning brauzeringiz video formatini qo'llab-quvvatlamaydi.
            </video>

            {/* ERROR DISPLAY */}
            {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
                        <CloseIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Videoni ijro etishda xatolik</h3>
                    <div className="text-gray-400 max-w-lg mb-6 bg-gray-800 p-4 rounded border border-gray-700 shadow-lg">
                        {videoError}
                    </div>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors font-semibold">
                        Qayta urinish
                    </button>
                </div>
            )}

            {/* BUFFERING SPINNER */}
            {isBuffering && !videoError && !showPremiumModal && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <LoadingSpinner />
                </div>
            )}

            {/* CENTER PLAY BUTTON OVERLAY - Shows when PAUSED (and not buffering/error) */}
            {!isPlaying && !isBuffering && !videoError && !showPremiumModal && (
                <div 
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 cursor-pointer"
                    onClick={togglePlay}
                >
                    <AniloPlayButton />
                </div>
            )}
            
            {/* PREMIUM LIMIT MODAL - Double Safety: !isTimePremium */}
            {showPremiumModal && !isTimePremium && (
                <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-fade-in">
                    <div className="bg-gray-900 border border-yellow-500/50 p-8 rounded-2xl max-w-4xl w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-orange-500 to-red-500"></div>
                        
                        <CrownIcon className="w-20 h-20 text-yellow-400 mx-auto mb-6 drop-shadow-lg" />
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Bepul vaqt tugadi!</h2>
                        <p className="text-gray-300 mb-8 max-w-lg mx-auto text-lg">
                            Sizga berilgan bepul sinov muddati o'z nihoyasiga yetdi. Davom ettirish uchun Premium obunani faollashtiring.
                        </p>
                        
                        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-gray-700 bg-black/20 p-4">
                             <SubscriptionPlans />
                        </div>
                        
                        <button 
                            onClick={() => {
                                window.location.reload();
                            }} 
                            className="mt-8 text-gray-500 hover:text-white transition-colors text-sm underline"
                        >
                            Bosh sahifaga qaytish
                        </button>
                    </div>
                </div>
            )}

            {/* Overlay Ad */}
            {overlayAd && !showPremiumModal && (
                 <div className={`absolute z-20 ${getAdContainerClass(overlayAd.location)}`}>
                    <div className="relative group/ad shadow-lg">
                        <a href={overlayAd.targetUrl} target="_blank" rel="noopener noreferrer">
                            <img src={overlayAd.contentUrl} alt={overlayAd.name} className="w-full h-full object-contain rounded-md" />
                        </a>
                        <button onClick={handleCloseOverlayAd} className="absolute -top-2 -right-2 p-1 bg-gray-900/80 rounded-full text-white hover:bg-gray-700 transition-colors">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className={`absolute inset-0 transition-opacity duration-300 ${areControlsVisible && !overlayAd && !showPremiumModal && !videoError ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Top Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors">
                            <BackArrowIcon className="w-6 h-6 text-white" />
                        </button>
                        <h1 className="text-lg sm:text-xl font-bold text-white truncate">{movie.title}</h1>
                        
                        {isTimePremium ? (
                            <div className="ml-auto flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-4 py-1.5 rounded-full">
                                <CrownIcon className="w-4 h-4 text-yellow-400 animate-pulse" />
                                <span className="text-xs font-bold text-yellow-400 tracking-wide">
                                    {isAdFree ? 'PREMIUM - REKLAMASIZ' : 'PREMIUM (STANDART)'}
                                </span>
                            </div>
                        ) : (
                            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-mono border flex items-center gap-2 ${ms < 300000 ? 'bg-red-900/80 text-red-200 border-red-700 animate-pulse' : 'bg-gray-800/80 text-gray-300 border-gray-700'}`}>
                                <span>Bepul Vaqt:</span>
                                <span className="font-bold">
                                    {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleProgressChange}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-orange-500"
                    />
                    <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button onClick={togglePlay} className="text-white p-1">
                                {isPlaying ? <PauseIcon className="w-7 h-7 sm:w-8 sm:h-8"/> : <PlayIcon className="w-7 h-7 sm:w-8 sm:h-8"/>}
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={toggleMute} className="text-white p-1">
                                    {isMuted || volume === 0 ? <VolumeOffIcon className="w-5 h-5 sm:w-6 sm:h-6"/> : <VolumeUpIcon className="w-5 h-5 sm:w-6 sm:h-6"/>}
                                </button>
                                <input 
                                  type="range" 
                                  min="0" max="1" 
                                  step="0.05" 
                                  value={isMuted ? 0 : volume} 
                                  onChange={handleVolumeChange} 
                                  className="w-16 sm:w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-white"
                                />
                            </div>
                            <span className="text-white text-xs sm:text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button onClick={toggleSettings} className="text-white p-1 relative">
                                <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                            </button>
                            <button onClick={toggleFullScreen} className="text-white p-1">
                                {isFullScreen ? <FullscreenExitIcon className="w-6 h-6 sm:w-7 sm:h-7"/> : <FullscreenEnterIcon className="w-6 h-6 sm:w-7 sm:h-7"/>}
                            </button>
                        </div>
                    </div>
                </div>
                 {isSettingsOpen && <SettingsMenu />}
            </div>
        </div>
    );
};
