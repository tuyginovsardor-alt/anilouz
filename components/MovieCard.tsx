
import React from 'react';
import { Movie } from '../types';
import { Play, Star, Eye } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  isActive: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const posterSrc = movie.poster_url || movie.posterUrl || 'https://via.placeholder.com/400x600?text=No+Poster';
  
  // Use real view count from DB
  const viewCount = movie.view_count || 0;
  const isMega = movie.video_url?.includes('mega.nz') || movie.videoUrl?.includes('mega.nz');

  return (
    <div 
        className="group flex flex-col w-full cursor-pointer animate-fade"
        onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0a0a0a] mb-4 anime-card border border-white/5 group-hover:border-orange-500/50 transition-all duration-500 shadow-2xl">
          <img 
            src={posterSrc} 
            alt={movie.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy" 
          />
          
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
              <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
                  <Play fill="currentColor" size={24} className="ml-1" />
              </div>
          </div>

          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              <div className="bg-orange-600 px-2 py-0.5 rounded text-[7px] font-black text-white uppercase tracking-widest shadow-lg">
                  YANGI QISM
              </div>
          </div>
          
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 z-10">
              <Star size={10} className="text-orange-500 fill-orange-500" />
              <span className="text-[10px] font-black text-white">{movie.rating.toFixed(1)}</span>
          </div>
      </div>
      
      <div className="flex flex-col mt-2">
          <h3 className="text-white font-bold text-[12px] leading-tight mb-1 line-clamp-1 group-hover:text-orange-500 transition-colors uppercase tracking-tight">
              {movie.title}
          </h3>
          <p className="text-[10px] text-zinc-500 font-medium">
              {movie.status === 'ongoing' ? 'Davom etmoqda' : `${movie.year} - tugallangan`}
          </p>
      </div>
    </div>
  );
};
