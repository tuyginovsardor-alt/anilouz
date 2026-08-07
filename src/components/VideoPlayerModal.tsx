import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  Heart, 
  Share2, 
  Download, 
  MessageSquare, 
  Star, 
  Check, 
  Sparkles, 
  ChevronRight, 
  ThumbsUp, 
  Send,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Anime, Episode, Comment } from '../types';
import { INITIAL_COMMENTS } from '../data/animeData';

interface VideoPlayerModalProps {
  anime: Anime | null;
  initialEpisodeNum?: number;
  onClose: () => void;
  onToggleFavorite: (animeId: string) => void;
  isFavorite: boolean;
  onUpdateWatchProgress: (animeId: string, episodeNum: number, percentage: number) => void;
  onOpenPremium: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  anime,
  initialEpisodeNum = 1,
  onClose,
  onToggleFavorite,
  isFavorite,
  onUpdateWatchProgress,
  onOpenPremium,
}) => {
  if (!anime) return null;

  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(initialEpisodeNum);
  const [selectedDub, setSelectedDub] = useState<string>(anime.voiceovers[0] || "Anilo Studio (O'zbekcha)");
  const [quality, setQuality] = useState<string>('1080p');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'comments' | 'details'>('episodes');

  // Comments state
  const [comments, setComments] = useState<Comment[]>(
    INITIAL_COMMENTS.filter(c => c.animeId === anime.id)
  );
  const [newCommentText, setNewCommentText] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  const currentEpisode: Episode = anime.episodes.find(e => e.number === currentEpisodeNum) || {
    id: `${anime.id}-ep-${currentEpisodeNum}`,
    number: currentEpisodeNum,
    title: `${currentEpisodeNum}-qism`,
    duration: '24:00',
    videoUrl: anime.videoUrl,
    thumbnail: anime.bannerImage
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentEpisodeNum, selectedDub, quality]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setCurrentTime(cur);
      setDuration(dur);
      const pct = Math.floor((cur / dur) * 100);
      setProgress(pct);

      if (pct > 0 && pct % 5 === 0) {
        onUpdateWatchProgress(anime.id, currentEpisodeNum, pct);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      setProgress(parseFloat(e.target.value));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      animeId: anime.id,
      episodeNumber: currentEpisodeNum,
      userName: 'Siz (Foydalanuvchi)',
      userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=User123',
      text: newCommentText.trim(),
      date: 'Hozirgina',
      likes: 0
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  const handleLikeComment = (id: string) => {
    setComments(comments.map(c => {
      if (c.id === id) {
        const isLiked = !c.isLiked;
        return {
          ...c,
          isLiked,
          likes: isLiked ? c.likes + 1 : c.likes - 1
        };
      }
      return c;
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full min-h-screen lg:min-h-0 lg:max-w-7xl lg:max-h-[92vh] bg-[#0E0E12] border border-white/10 lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#121218]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-orange-600 text-white font-bold text-xs">
              {currentEpisodeNum}-QISM
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
              {anime.title} — <span className="text-gray-400 font-normal">{currentEpisode.title}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(anime.id)}
              className={`p-2 rounded-xl border transition ${
                isFavorite
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
              }`}
              title="Sevimliklar"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-orange-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-y-auto custom-scrollbar">
          
          {/* Left / Center 2 Cols: Player & Metadata */}
          <div className="lg:col-span-2 flex flex-col p-4 sm:p-6 space-y-4 border-r border-white/5">
            
            {/* Custom Video Player Container */}
            <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
              <video
                ref={videoRef}
                src={currentEpisode.videoUrl}
                poster={anime.bannerImage}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  setIsPlaying(false);
                  if (currentEpisodeNum < anime.episodes.length) {
                    setCurrentEpisodeNum(prev => prev + 1);
                  }
                }}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
              />

              {/* Watermark Logo */}
              <div className="absolute top-4 left-4 pointer-events-none opacity-60">
                <span className="text-xs font-black tracking-widest text-orange-500 bg-black/60 px-2 py-1 rounded backdrop-blur border border-white/10">
                  ANILO.UZ
                </span>
              </div>

              {/* Player Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 pointer-events-none group-hover:pointer-events-auto">
                <div />

                {/* Center Play Big Icon */}
                <div className="self-center">
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-orange-600/90 hover:bg-orange-500 text-white flex items-center justify-center shadow-xl shadow-orange-600/40 transform hover:scale-110 transition"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                  </button>
                </div>

                {/* Bottom Controls Bar */}
                <div className="space-y-2">
                  {/* Progress Seek Bar */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress || 0}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-white/30 hover:h-2 accent-orange-500 rounded-lg cursor-pointer transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="hover:text-orange-400">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>

                      <button onClick={toggleMute} className="hover:text-orange-400">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="font-mono text-[11px] text-gray-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quality selector */}
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-orange-400">
                        {quality}
                      </span>

                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="hover:text-orange-400 relative"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      <button onClick={toggleFullscreen} className="hover:text-orange-400">
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Controls Row: Dubbing & Quality Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#14141C] border border-white/5 rounded-2xl">
              
              {/* Dubbing Selector */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold text-gray-300">Ovozalash:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {anime.voiceovers.map((dub) => (
                    <button
                      key={dub}
                      onClick={() => setSelectedDub(dub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedDub === dub
                          ? 'bg-orange-500 text-black font-bold shadow'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {dub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality & Download */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                  {['1080p', '720p', '480p'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        quality === q ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onOpenPremium}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:scale-105 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Yuklab olish</span>
                </button>
              </div>

            </div>

            {/* Anime Info & Meta */}
            <div className="p-4 bg-[#14141C] border border-white/5 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
                    {anime.title}
                  </h1>
                  <p className="text-xs text-orange-400 font-medium">
                    {anime.titleOriginal} • {anime.studio} • {anime.releaseYear}
                  </p>
                </div>

                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{anime.rating}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {anime.genres.map(g => (
                  <span key={g} className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/5">
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {anime.description}
              </p>
            </div>

          </div>

          {/* Right Col: Episode Selector & Comments Tabs */}
          <div className="flex flex-col bg-[#111117] h-full max-h-[600px] lg:max-h-none border-t lg:border-t-0 border-white/10">
            
            {/* Tabs Header */}
            <div className="flex items-center border-b border-white/10 bg-[#15151F]">
              <button
                onClick={() => setActiveTab('episodes')}
                className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
                  activeTab === 'episodes'
                    ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Qismlar ({anime.episodes.length})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
                  activeTab === 'comments'
                    ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Izohlar ({comments.length})
              </button>
            </div>

            {/* Tab 1: Episodes Grid */}
            {activeTab === 'episodes' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-2 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {anime.episodes.map((ep) => {
                    const isActive = ep.number === currentEpisodeNum;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => setCurrentEpisodeNum(ep.number)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          isActive
                            ? 'bg-gradient-to-br from-orange-600 to-amber-600 border-orange-400 text-white shadow-lg shadow-orange-600/30'
                            : 'bg-[#181822] border-white/5 text-gray-300 hover:bg-[#222230] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs">
                            {ep.number}-qism
                          </span>
                          {isActive && <Play className="w-3 h-3 fill-white" />}
                        </div>
                        <span className="text-[10px] text-gray-300/80 truncate">
                          {ep.duration}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Comments Section */}
            {activeTab === 'comments' && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col custom-scrollbar space-y-4">
                
                {/* Add comment form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Izoh qoldiring..."
                    className="flex-1 px-3 py-2 bg-[#181822] border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Comment list */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">
                      Hali izohlar yo'q. Birinchi bo'lib fikringizni bildiring!
                    </p>
                  ) : (
                    comments.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-[#161620] border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={item.userAvatar}
                              alt={item.userName}
                              className="w-6 h-6 rounded-full border border-orange-500/40"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-xs font-bold text-white">{item.userName}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{item.date}</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed pl-8">
                          {item.text}
                        </p>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleLikeComment(item.id)}
                            className={`flex items-center gap-1 text-[11px] transition ${
                              item.isLiked ? 'text-orange-400 font-bold' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{item.likes}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
