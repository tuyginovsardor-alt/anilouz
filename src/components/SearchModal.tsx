import React, { useState, useEffect } from 'react';
import { Search, X, Star, Flame, Filter, SlidersHorizontal } from 'lucide-react';
import { Anime, Genre } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeList: Anime[];
  genres: Genre[];
  onPlayAnime: (anime: Anime) => void;
  onOpenDetail?: (anime: Anime) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  animeList,
  genres,
  onPlayAnime,
  onOpenDetail,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'year' | 'popular'>('popular');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredAnime = animeList.filter((anime) => {
    const matchesQuery =
      anime.title.toLowerCase().includes(query.toLowerCase()) ||
      (anime.titleOriginal && anime.titleOriginal.toLowerCase().includes(query.toLowerCase())) ||
      anime.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()));

    const matchesGenre = selectedGenre ? anime.genres.includes(selectedGenre) : true;

    return matchesQuery && matchesGenre;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'year') return b.year - a.year;
    return (b.views ? parseFloat(b.views) : 0) - (a.views ? parseFloat(a.views) : 0);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-[#121218] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Top Search Field */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-[#161622]">
          <Search className="w-5 h-5 text-orange-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish... (Masalan: Naruto, Solo Leveling, Aksiya)..."
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-gray-400 hover:text-white"
            >
              Tozalash
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-white/5 bg-[#14141C] text-xs">
          {/* Genres row */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-3 py-1 rounded-full font-semibold transition ${
                selectedGenre === null
                  ? 'bg-orange-500 text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Barchasi
            </button>
            {genres.slice(0, 6).map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(selectedGenre === g.name ? null : g.name)}
                className={`px-3 py-1 rounded-full font-medium transition whitespace-nowrap ${
                  selectedGenre === g.name
                    ? 'bg-orange-500 text-black font-bold'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#181824] text-gray-300 border border-white/10 rounded-lg px-2 py-1 focus:outline-none text-xs"
            >
              <option value="popular">Ommaboplik</option>
              <option value="rating">Reyting bo'yicha</option>
              <option value="year">Yili bo'yicha</option>
            </select>
          </div>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {filteredAnime.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm">Hech qanday anime topilmadi.</p>
              <p className="text-xs text-gray-400 mt-1">
                Qidiruv so'zini o'zgartirib ko'ring yoki boshqa janrni tanlang.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAnime.map((anime) => (
                <div
                  key={anime.id}
                  onClick={() => {
                    if (onOpenDetail) {
                      onOpenDetail(anime);
                    } else {
                      onPlayAnime(anime);
                    }
                    onClose();
                  }}
                  className="flex gap-3 p-3 rounded-2xl bg-[#161622] hover:bg-[#1f1f30] border border-white/5 hover:border-orange-500/40 cursor-pointer transition group"
                >
                  <img
                    src={anime.posterImage}
                    alt={anime.title}
                    className="w-16 h-22 object-cover rounded-xl bg-zinc-800 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col justify-between flex-1 py-0.5">
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition line-clamp-1">
                        {anime.title}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        {anime.year} • {anime.genres.slice(0, 2).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-[11px] text-orange-400 font-semibold">
                        {anime.episodeCount}
                      </span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {anime.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
