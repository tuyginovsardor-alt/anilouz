import React, { useState } from 'react';
import { Star, Play, Heart, Check, Info, X, Tv, Sparkles, Volume2 } from 'lucide-react';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  onPlayAnime: (anime: Anime, episodeNum?: number) => void;
  onOpenDetail?: (anime: Anime) => void;
  onToggleFavorite: (animeId: string) => void;
  isFavorite: boolean;
  variant?: 'poster' | 'widescreen';
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  onPlayAnime,
  onOpenDetail,
  onToggleFavorite,
  isFavorite,
  variant = 'poster',
}) => {
  const [showHiddenInfo, setShowHiddenInfo] = useState(false);

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(anime);
    } else {
      onPlayAnime(anime);
    }
  };

  const isWidescreen = variant === 'widescreen';
  const displayImage = isWidescreen ? (anime.bannerImage || anime.posterImage) : anime.posterImage;

  return (
    <div className="relative group flex flex-col w-full">
      {/* Main Card Container */}
      <article 
        onClick={handleCardClick}
        className="flex flex-col gap-2.5 w-full group cursor-pointer select-none"
      >
        {/* Image Wrapper - Aspect Ratio 16:9 or 2:3 */}
        <div className={`relative rounded-2xl overflow-hidden ${
          isWidescreen ? 'aspect-video' : 'aspect-[2/3]'
        } shadow-[0_6px_28px_rgba(0,0,0,0.6)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_36px_rgba(255,140,0,0.25)] bg-[#1a1a24] border border-white/10`}>
          <img
            src={displayImage}
            alt={anime.title}
            className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = anime.posterImage || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop';
            }}
          />

          {/* Top Left Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10 max-w-[55%] flex-wrap overflow-hidden">
            <span className={`text-white font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-md ${
              anime.isNew 
                ? 'bg-[#6C5CE7]' 
                : anime.isPopular || anime.status === 'Ongoing'
                  ? 'bg-[#FF4500]'
                  : 'bg-orange-500'
            }`}>
              {anime.isNew ? "Yangi" : anime.isPopular ? "Top" : "HD"}
            </span>
            {isWidescreen && (
              <span className="text-white bg-black/70 backdrop-blur-md text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border border-white/10 font-semibold hidden xs:inline-block">
                16:9
              </span>
            )}
          </div>

          {/* Top Right Buttons */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(anime.id);
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors shadow-md text-white"
              title={isFavorite ? "Sevimliklardan chiqarish" : "Sevimliklarga qo'shish"}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isFavorite ? 'text-orange-500 fill-orange-500' : 'text-white'}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenDetail) {
                  onOpenDetail(anime);
                } else {
                  setShowHiddenInfo(true);
                }
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors shadow-md text-white"
              title="Batafsil ma'lumot"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Glassmorphic Play Overlay */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onPlayAnime(anime);
            }}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity duration-300 flex items-center justify-center z-10"
          >
            <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_0_24px_rgba(255,140,0,0.8)] transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Bottom Gradient & Rating */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0f0f18]/95 via-[#0f0f18]/50 to-transparent z-0" />
          
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-10 text-[10px] sm:text-[11px]">
            <div className="bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
              <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
              <span className="font-bold text-white pt-0.5">{anime.rating}</span>
            </div>

            <div className="font-semibold text-white bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10 truncate max-w-[55%]">
              {anime.season || anime.episodeCount || `${anime.totalEpisodes || 12}-qism`}
            </div>
          </div>
        </div>

        {/* Content Below Thumbnail */}
        <div className="flex flex-col px-1">
          <h3 className="font-bold text-sm sm:text-base text-white truncate transition-colors duration-200 group-hover:text-orange-400">
            {anime.title}
          </h3>
          <p className="text-xs text-gray-400 truncate mt-0.5 font-medium">
            {anime.genres.slice(0, 2).join(', ')} • {anime.releaseYear || anime.year}
          </p>
        </div>
      </article>

      {/* Quick Details Modal (When clicking info icon) */}
      {showHiddenInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowHiddenInfo(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#181824] border border-orange-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden space-y-4"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowHiddenInfo(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Poster & Details */}
            <div className="flex gap-4">
              <div className="w-24 h-36 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/10 shadow-md">
                <img
                  src={anime.posterImage}
                  alt={anime.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-extrabold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {anime.rating}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-300 text-xs font-medium">
                    {anime.releaseYear || anime.year}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold">
                    {anime.status}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-white leading-tight">
                  {anime.title}
                </h2>

                <div className="text-xs text-gray-300 space-y-1 pt-1">
                  <p className="flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-gray-400" />
                    <span>Epizodlar: <strong className="text-white">{anime.episodeCount}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                    <span>Studiya: <strong className="text-white">{anime.studio || 'MAPPA'}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>Ovoz: <strong className="text-white">{anime.voiceovers?.[0] || 'Anilo Studio'}</strong></span>
                  </p>
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5">
              {anime.genres.map((g) => (
                <span key={g} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300">
                  {g}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="bg-[#12121A] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Tavsif va Syujet:
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                {anime.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowHiddenInfo(false);
                  onPlayAnime(anime, 1);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-extrabold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>1-qismni tomosha qilish</span>
              </button>

              <button
                onClick={() => onToggleFavorite(anime.id)}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                  isFavorite
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-orange-400' : ''}`} />
                <span>{isFavorite ? 'Sevimli' : "Qo'shish"}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
