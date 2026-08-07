import React from 'react';
import { Heart, Trash2, Play } from 'lucide-react';
import { Anime } from '../types';
import { AnimeCard } from './AnimeCard';

interface FavoritesViewProps {
  favorites: Anime[];
  onPlayAnime: (anime: Anime) => void;
  onOpenDetail?: (anime: Anime) => void;
  onToggleFavorite: (animeId: string) => void;
  onClearFavorites: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onPlayAnime,
  onOpenDetail,
  onToggleFavorite,
  onClearFavorites,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-orange-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Sevimli Animelar
            </h1>
            <p className="text-xs text-gray-400">
              Siz saqlab qo'ygan {favorites.length} ta anime
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={onClearFavorites}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 text-xs font-medium transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Barchasini tozalash</span>
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-[#14141E] border border-white/5 rounded-3xl space-y-3">
          <Heart className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Sevimli animelar yo'q</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Anime kartochkasidagi <Heart className="w-3.5 h-3.5 inline text-orange-400" /> tugmasini bosib o'zingizga yoqqan animelarni saqlab qo'yishingiz mumkin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {favorites.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              onPlayAnime={onPlayAnime}
              onOpenDetail={onOpenDetail}
              onToggleFavorite={onToggleFavorite}
              isFavorite={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
