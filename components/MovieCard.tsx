
import React from 'react';
import { Movie } from '../types';
import { Star } from 'lucide-react';

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
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gray-900 mb-3 anime-card-hover">
          <img 
            src={movie.posterUrl} 
            alt={movie.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy" 
          />
          
          {/* Overlay info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <span className="text-[10px] text-gray-300 font-bold bg-orange-600/80 w-max px-2 py-0.5 rounded-md mb-2">{movie.year}</span>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-2 left-2 glass-effect px-2 py-1 rounded-lg flex items-center gap-1 z-10">
              <Star size={12} className="text-orange-500 fill-orange-500" />
              <span className="text-[10px] font-black text-white">{movie.rating.toFixed(1)}</span>
          </div>

          {/* New/HD Badge */}
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg">HD</div>
      </div>
      
      <div className="flex flex-col px-1">
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors mb-1">
              {movie.title}
          </h3>
          <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-medium">{mainGenre}</span>
              <span className="text-[10px] text-orange-500 font-bold">SERIAL</span>
          </div>
      </div>
    </div>
  );
};
