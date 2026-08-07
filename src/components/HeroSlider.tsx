import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, ChevronLeft, ChevronRight, Star, Flame, Info } from 'lucide-react';
import { Anime } from '../types';

interface HeroSliderProps {
  animeList: Anime[];
  onPlayAnime: (anime: Anime) => void;
  onOpenDetail?: (anime: Anime) => void;
  onToggleFavorite: (animeId: string) => void;
  isFavorite: (animeId: string) => boolean;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  animeList,
  onPlayAnime,
  onOpenDetail,
  onToggleFavorite,
  isFavorite,
}) => {
  const trendingAnime = animeList.filter(a => a.isTrending || a.rating >= 8.8).slice(0, 6);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentAnime = trendingAnime[currentIndex] || animeList[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingAnime.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [trendingAnime.length]);

  if (!currentAnime) return null;

  const favorited = isFavorite(currentAnime.id);

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#16161E] group">
      
      {/* Background Banner Image - Taller height on mobile for breathing room */}
      <div className="relative w-full h-[360px] xs:h-[400px] sm:h-[450px] md:h-[500px]">
        <img
          src={currentAnime.bannerImage}
          alt={currentAnime.title}
          className="w-full h-full object-cover object-center transition-all duration-700 scale-100 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = currentAnime.posterImage;
          }}
        />

        {/* Multi-directional Gradients for max legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E12] via-[#0E0E12]/80 to-transparent w-full md:w-3/4" />
      </div>

      {/* Pagination Controls - Positioned safely so they NEVER overlap buttons on mobile */}
      <div className="absolute top-3 right-3 sm:top-auto sm:bottom-6 sm:right-6 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/15 shadow-xl">
          {trendingAnime.map((a, idx) => (
            <button
              key={a.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx ? 'w-6 sm:w-8 bg-orange-500' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              title={a.title}
            />
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + trendingAnime.length) % trendingAnime.length)}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white transition shadow-md active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % trendingAnime.length)}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white transition shadow-md active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8 md:p-12 z-10 max-w-2xl pr-4">
        
        {/* Badges Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-orange-600 text-white font-black text-[10px] sm:text-[11px] tracking-wider uppercase shadow-md shadow-orange-600/30 flex items-center gap-1">
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
            TRENDDA
          </span>
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/40 text-amber-400 font-black text-[10px] sm:text-xs flex items-center gap-1 shadow-md">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
            {currentAnime.rating}
          </span>
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] sm:text-xs font-bold">
            16:9 HD
          </span>
          {currentAnime.isNew && (
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-600 text-white font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider shadow-md">
              YANGI
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-1 sm:mb-2 drop-shadow-xl font-sans line-clamp-1 sm:line-clamp-none">
          {currentAnime.title}
        </h1>

        {/* Metadata info */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm text-gray-300 mb-2 sm:mb-4 flex-wrap font-semibold">
          <span className="text-orange-400 font-bold">
            {currentAnime.genres.slice(0, 3).join(', ')}
          </span>
          <span>•</span>
          <span className="text-gray-300">{currentAnime.episodeCount || `${currentAnime.totalEpisodes} qism`}</span>
        </div>

        {/* Description */}
        <p className="text-[11px] sm:text-sm text-gray-200/90 line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-6 max-w-xl leading-relaxed drop-shadow hidden xs:block">
          {currentAnime.description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap pt-1">
          <button
            onClick={() => onPlayAnime(currentAnime)}
            className="flex items-center gap-2 px-4 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-black font-extrabold text-xs sm:text-base tracking-wide shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
            <span>Tomosha qilish</span>
          </button>

          {onOpenDetail && (
            <button
              onClick={() => onOpenDetail(currentAnime)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all shadow-md"
            >
              <Info className="w-4 h-4 text-orange-400" />
              <span>Batafsil</span>
            </button>
          )}

          <button
            onClick={() => onToggleFavorite(currentAnime.id)}
            className={`hidden sm:flex items-center gap-2 px-6 py-3.5 rounded-2xl border text-sm font-bold backdrop-blur-md transition-all shadow-md ${
              favorited
                ? 'bg-orange-500/20 border-orange-500/60 text-orange-400'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
          >
            {favorited ? (
              <>
                <Check className="w-4 h-4 text-orange-400" />
                <span>Ro'yxatda</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Ro'yxatga qo'shish</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
