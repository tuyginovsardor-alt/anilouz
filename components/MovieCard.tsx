
import React from 'react';
import { Movie } from '../types';
import { Star, PlayCircle } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  isActive: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const mainGenre = movie.genre ? movie.genre.split(',')[0].trim() : 'Anime';

  return (
    <div 
        className="group flex flex-col w-full cursor-pointer animate-fade-in"
        onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gray-900 mb-3 anime-card-hover shadow-lg">
          <img 
            src={movie.posterUrl} 
            alt={movie.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy" 
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <div className="flex items-center gap-2 text-white">
                  <PlayCircle size={32} className="text-orange-500" />
                  <span className="font-black text-sm uppercase tracking-wider">Tomosha</span>
              </div>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-3 left-3 glass-effect px-2.5 py-1 rounded-xl flex items-center gap-1.5 z-10 border border-white/10">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[11px] font-black text-white">{movie.rating.toFixed(1)}</span>
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 right-3 bg-blue-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg backdrop-blur-sm">HD</div>
      </div>
      
      <div className="flex flex-col px-1">
          <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors mb-1">
              {movie.title}
          </h3>
          <div className="flex items-center justify-between text-gray-500">
              <span className="text-[11px] font-medium">{mainGenre} • {movie.year}</span>
              <span className="text-[10px] text-orange-500/80 font-black uppercase tracking-tighter">Series</span>
          </div>
      </div>
    </div>
  );
};
