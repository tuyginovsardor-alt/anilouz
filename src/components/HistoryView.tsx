import React from 'react';
import { History, Trash2, Play, Clock } from 'lucide-react';
import { WatchProgress, Anime } from '../types';

interface HistoryViewProps {
  history: WatchProgress[];
  animeList: Anime[];
  onPlayAnime: (anime: Anime, episodeNum?: number) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  animeList,
  onPlayAnime,
  onClearHistory,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Ko'rish Tarixi
            </h1>
            <p className="text-xs text-gray-400">
              Oxirgi ko'rilgan {history.length} ta epizod
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 text-xs font-medium transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Tarixni tozalash</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-[#14141E] border border-white/5 rounded-3xl space-y-3">
          <Clock className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Ko'rish tarixi bo'sh</h3>
          <p className="text-xs text-gray-400">
            Siz tomosha qilgan epizodlar avtomatik ushbu bo'limda saqlanadi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((item) => {
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
                key={`${item.animeId}-${item.episodeNumber}`}
                onClick={() => onPlayAnime(anime as Anime, item.episodeNumber)}
                className="group p-3 rounded-2xl bg-[#161622] hover:bg-[#1e1e2d] border border-white/5 hover:border-orange-500/40 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex gap-3 mb-3">
                  <img
                    src={item.posterImage}
                    alt={item.animeTitle}
                    className="w-20 h-28 object-cover rounded-xl bg-zinc-800 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition line-clamp-2">
                        {item.animeTitle}
                      </h4>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[11px] font-bold">
                        {item.episodeNumber}-qism
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400">
                      {item.progressPercentage}% ko'rib bo'lindi
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${item.progressPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
