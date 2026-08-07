import React from 'react';
import { Genre } from '../types';
import { 
  Flame, 
  Compass, 
  Drama as DramaIcon, 
  Rocket, 
  Heart, 
  Smile, 
  Ghost, 
  GraduationCap, 
  Sparkles, 
  Wand2 
} from 'lucide-react';

interface GenrePillsProps {
  genres: Genre[];
  selectedGenre: string | null;
  onSelectGenre: (genreName: string | null) => void;
}

export const GenrePills: React.FC<GenrePillsProps> = ({
  genres,
  selectedGenre,
  onSelectGenre,
}) => {
  const getGenreIcon = (name: string) => {
    switch (name) {
      case 'Aksiya': return Flame;
      case 'Sarguzasht': return Compass;
      case 'Drama': return DramaIcon;
      case 'Fantastika': return Rocket;
      case 'Romantika': return Heart;
      case 'Komediya': return Smile;
      case "Qorong'u": return Ghost;
      case 'Maktab': return GraduationCap;
      case 'Isekai': return Sparkles;
      default: return Wand2;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white tracking-wide">Janrlar</h2>
        {selectedGenre && (
          <button
            onClick={() => onSelectGenre(null)}
            className="text-xs text-orange-400 hover:underline font-semibold"
          >
            Filtrni tozash
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        <button
          onClick={() => onSelectGenre(null)}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            selectedGenre === null
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md shadow-orange-500/20'
              : 'bg-[#181820] text-gray-300 hover:bg-[#22222e] hover:text-white border border-white/5'
          }`}
        >
          <span>Barchasi</span>
        </button>

        {genres.map((genre) => {
          const Icon = getGenreIcon(genre.name);
          const isSelected = selectedGenre === genre.name;
          return (
            <button
              key={genre.id}
              onClick={() => onSelectGenre(isSelected ? null : genre.name)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 border border-orange-400/30'
                  : 'bg-[#181820] text-gray-300 hover:bg-[#22222e] hover:text-white border border-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-400'}`} />
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
