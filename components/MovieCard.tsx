
import React from 'react';
import { Movie } from '../types';
import { StarIcon } from './icons/StarIcon';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  isActive: boolean;
}

const ImageWithFallback: React.FC<{src: string, alt: string, className: string}> = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = React.useState(src);
    const [error, setError] = React.useState(false);

    const onError = () => {
        if (!error) {
            setError(true);
            setImgSrc(`https://picsum.photos/seed/${alt.replace(/\s/g, '')}/400/600`);
        }
    };

    return <img src={imgSrc} alt={alt} className={className} onError={onError} loading="lazy" />;
};

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, isActive }) => {
  // Extract the first genre for the tag
  const mainGenre = movie.genre ? movie.genre.split(',')[0].trim() : 'Anime';

  return (
    <div 
        className={`group flex flex-col w-full cursor-pointer`}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${movie.title}`}
    >
      {/* Poster Section */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-gray-900 mb-3 shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
          <ImageWithFallback 
            src={movie.posterUrl} 
            alt={`${movie.title} posteri`} 
            className="w-full h-full object-cover"
          />
          
          {/* Dark Gradient from bottom for better contrast if needed */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>

          {/* Rating Badge - Top Right */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 z-10 border border-white/10">
              <StarIcon className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-bold text-white">{movie.rating.toFixed(1)}</span>
          </div>
      </div>
      
      {/* Info Section */}
      <div className="flex flex-col px-1">
          {/* Title */}
          <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors mb-1">
              {movie.title}
          </h3>
          
          {/* Year & Type */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
             <span>{movie.year}</span>
             <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
             <span className="text-purple-500 font-semibold">Serial</span>
          </div>
          
          {/* Genre Tag */}
          <div className="flex">
              <span className="inline-block bg-[#1a1a1a] text-gray-400 text-[10px] font-medium px-2 py-1 rounded-md border border-gray-800">
                  {mainGenre}
              </span>
          </div>
      </div>
    </div>
  );
};
