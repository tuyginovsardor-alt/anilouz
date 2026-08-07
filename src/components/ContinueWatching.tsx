import React from 'react';
import { Play, ChevronRight, Clock } from 'lucide-react';
import { WatchProgress, Anime } from '../types';

interface ContinueWatchingProps {
  progressList: WatchProgress[];
  animeList: Anime[];
  onPlayAnime: (anime: Anime, episodeNum?: number) => void;
  variant?: 'vertical' | 'grid';
}

export const ContinueWatching: React.FC<ContinueWatchingProps> = ({
  progressList,
  animeList,
  onPlayAnime,
}) => {
  if (!progressList || progressList.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
          <span className="w-2 h-5 bg-orange-500 rounded-full inline-block" />
          Davom etayotgan
        </h2>
        <span className="text-xs text-orange-400 font-bold hover:underline cursor-pointer">
          Barchasi ({progressList.length})
        </span>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
        {progressList.map((item) => {
          const anime = animeList.find((a) => a.id === item.animeId) || {
            id: item.animeId,
            title: item.animeTitle,
            posterImage: item.posterImage,
            bannerImage: item.posterImage,
            videoUrl: '',
            year: 2024,
            rating: 9.0,
            genres: ['Aksiya'],
            episodeCount: `${item.episodeNumber}-qism`,
            totalEpisodes: 100,
            description: '',
            status: 'Ongoing' as const,
            studio: 'Studio',
            voiceovers: ['Anilo Studio'],
            releaseYear: 2024,
            episodes: []
          };

          return (
            <div
              key={item.animeId}
              onClick={() => onPlayAnime(anime as Anime, item.episodeNumber)}
              className="flex-shrink-0 w-36 sm:w-44 snap-start group cursor-pointer select-none"
            >
              {/* Card Image Wrapper with 16:9 or 3:4 aspect ratio */}
              <div className="relative w-full aspect-video sm:aspect-[16/10] rounded-2xl overflow-hidden bg-[#181824] border border-white/10 shadow-lg group-hover:border-orange-500/50 transition duration-300">
                <img
                  src={item.posterImage}
                  alt={item.animeTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />

                {/* Glassmorphic Play Icon Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-orange-500/90 text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.6)] group-hover:scale-110 transition">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black ml-0.5" />
                  </div>
                </div>

                {/* Bottom Gradient with Episode Info & Progress */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <p className="text-[11px] font-bold text-white truncate drop-shadow">
                    {item.animeTitle}
                  </p>
                  
                  <div className="flex justify-between items-center text-[9px] font-semibold text-gray-300 mt-0.5 mb-1">
                    <span>{item.episodeNumber}-qism</span>
                    <span className="text-orange-400 font-extrabold">{item.progressPercentage}%</span>
                  </div>

                  {/* Orange Progress Bar */}
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${item.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
