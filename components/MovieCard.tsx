import React from 'react';
import { Movie } from '../types';
import { Play, Star } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  isActive: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  // Rasm URL manzili mavjudligini va to'g'riligini tekshiramiz
  const posterSrc = movie.posterUrl || 'https://via.placeholder.com/400x600?text=No+Poster';

  return (
    <div 
        className="group flex flex-col w-full cursor-pointer animate-fade"
        onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#16161a] mb-5 anime-card shadow-2xl border border-white/5">
          <img 
            src={posterSrc} 
            alt={movie.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy" 
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/400x600?text=Yuklanmadi';
            }}
          />
          
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
                  <Play fill="black" size={20} className="ml-1" />
              </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
              <Star size={10} className="text-orange-500 fill-orange-500" />
              <span className="text-[10px] font-black text-white">{movie.rating.toFixed(1)}</span>
          </div>
          
          <div className="absolute bottom-3 right-3 bg-orange-600 px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-wider">
              {movie.quality}
          </div>
      </div>
      
      <div className="flex flex-col px-1">
          <h3 className="text-gray-100 font-bold text-sm leading-snug line-clamp-1 group-hover:text-orange-500 transition-colors">
              {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-gray-500 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest">{movie.year}</span>
              <span className="w-1 h-1 bg-gray-800 rounded-full"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest truncate">{movie.genre.split(',')[0]}</span>
          </div>
      </div>
    </div>
  );
};