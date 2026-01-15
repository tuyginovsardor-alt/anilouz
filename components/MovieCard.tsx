import React from 'react';
import { Movie } from '../types';
import { Play } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  isActive: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  return (
    <div 
        className="group flex flex-col w-full cursor-pointer animate-fade"
        onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gray-900 mb-4 anime-card shadow-xl border border-white/5">
          <img 
            src={movie.posterUrl} 
            alt={movie.title} 
            className="w-full h-full object-cover"
            loading="lazy" 
          />
          
          {/* Subtle Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-center justify-center">
              <div className="w-14 h-14 bg-rose-600 rounded-full flex items-center justify-center text-white transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
                  <Play fill="white" size={24} className="ml-1" />
              </div>
          </div>

          {/* Top Info */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black text-white border border-white/10">
              {movie.rating.toFixed(1)}
          </div>
          
          <div className="absolute top-3 right-3 bg-rose-600 px-2 py-0.5 rounded text-[9px] font-black text-white shadow-lg">
              {movie.quality}
          </div>
      </div>
      
      <div className="flex flex-col px-1">
          <h3 className="text-white font-black text-[16px] leading-tight line-clamp-2 group-hover:text-rose-500 transition-colors">
              {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-gray-500 mt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">{movie.year}</span>
              <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">{movie.genre.split(',')[0]}</span>
          </div>
      </div>
    </div>
  );
};