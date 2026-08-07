import React from 'react';
import { 
  Play, Heart, Star, ArrowLeft, Clock, Calendar, Tv, Sparkles, 
  ChevronRight, Volume2, UserCheck, Layers, Check
} from 'lucide-react';
import { Anime, Episode } from '../types';
import { AnimeCard } from './AnimeCard';

interface AnimeDetailViewProps {
  anime: Anime;
  allAnime: Anime[];
  onPlayAnime: (anime: Anime, episodeNum?: number) => void;
  onOpenDetail?: (anime: Anime) => void;
  onToggleFavorite: (animeId: string) => void;
  isFavorite: boolean;
  onBack: () => void;
}

export const AnimeDetailView: React.FC<AnimeDetailViewProps> = ({
  anime,
  allAnime,
  onPlayAnime,
  onOpenDetail,
  onToggleFavorite,
  isFavorite,
  onBack,
}) => {
  // Similar anime filtered by genres
  const similarAnime = allAnime
    .filter((a) => a.id !== anime.id && a.genres.some((g) => anime.genres.includes(g)))
    .slice(0, 6);

  // Cast members sample list if not explicitly provided
  const castList = anime.cast || [
    {
      name: 'Junya Enoki',
      role: 'Bosh Qahramon (Ovoz)',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop',
    },
    {
      name: 'Yuichi Nakamura',
      role: 'Ustoz / Sehrgar',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop',
    },
    {
      name: 'Yuma Uchida',
      role: 'Hamroh / Rivojlantiruvchi',
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=200&auto=format&fit=crop',
    },
    {
      name: 'Anilo Studio Dub',
      role: "Rasmiy O'zbekcha Ovoz",
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=200&auto=format&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white pb-24 animate-fadeIn">
      {/* Cinematic Hero Section (Mobile Optimized Height) */}
      <section className="relative h-[55vh] sm:h-[75vh] w-full overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transform scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('${anime.bannerImage || anime.posterImage}')`
          }}
        />
        
        {/* Hero Vignette Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-[#0F0F13]/70 to-[#0F0F13]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F13] via-transparent to-[#0F0F13]/40" />

        {/* Top Back Navigation Button */}
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-black/60 hover:bg-orange-500 text-white hover:text-black font-extrabold text-[10px] sm:text-xs tracking-wider backdrop-blur-md border border-white/10 shadow-xl transition active:scale-95 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
            <span>ORQAGA</span>
          </button>
        </div>

        {/* Hero Bottom Content */}
        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8 lg:p-12 z-20 flex flex-col justify-end">
          <div className="max-w-4xl space-y-4 sm:space-y-6">
            
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 backdrop-blur-md rounded-full border border-amber-500/40 text-amber-400 font-extrabold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{anime.rating}</span>
              </div>
              <span className="text-gray-300 font-medium">
                {anime.releaseYear || anime.year} • {anime.season || 'To\'liq serial'} • {anime.episodeCount || `${anime.totalEpisodes || 12}-qism`}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase">
                {anime.status}
              </span>
            </div>

            {/* Title (Mobile Responsive) */}
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-[1.1] sm:leading-none">
              {anime.title}
            </h1>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((genre) => (
                <span 
                  key={genre}
                  className="px-3.5 py-1.5 bg-[#1C1C28] rounded-full text-xs font-bold uppercase tracking-wider text-gray-300 border border-white/10 shadow-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Action Buttons (Mobile Grid) */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => onPlayAnime(anime, 1)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs sm:text-sm tracking-widest shadow-2xl shadow-orange-500/30 active:scale-95"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                <span>TOMOSHA QILISH</span>
              </button>

              <button
                onClick={() => onToggleFavorite(anime.id)}
                className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 transition-all font-bold text-xs sm:text-sm backdrop-blur-md border ${
                  isFavorite
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-orange-400 text-orange-400' : ''}`} />
                <span className="truncate">{isFavorite ? 'SAQLANGAN' : 'SEVIMLIKLAR'}</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Details & Cast (Spans 7-8) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Annotatsiya / Synopsis */}
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-white border-l-4 border-orange-500 pl-4 tracking-wide">
              Annotatsiya
            </h3>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base font-medium">
              {anime.description}
            </p>
          </div>

          {/* Quick Specifications Info Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#161622] border border-white/10">
            <div>
              <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Studiya</span>
              <span className="text-sm font-bold text-white mt-1 block">{anime.studio || 'MAPPA'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Status</span>
              <span className="text-sm font-bold text-orange-400 mt-1 block">{anime.status}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Chaqirilgan fasl</span>
              <span className="text-sm font-bold text-white mt-1 block">{anime.releaseYear || anime.year}-yil</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Ovoza / Dublyaj</span>
              <span className="text-sm font-bold text-amber-400 mt-1 block">{anime.voiceovers?.[0] || 'Anilo Studio'}</span>
            </div>
          </div>

          {/* Rollarda / Cast Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-wide">
              Rollarda (Aktyorlar va Dublyaj)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {castList.map((member, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3.5 bg-[#161622] p-3 rounded-2xl border border-white/5 hover:border-orange-500/30 transition shadow-md"
                >
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border border-orange-500/30 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{member.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Episodes List (Spans 4-5) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              Epizodlar va Qismlar
            </h3>
            <span className="text-xs text-gray-400 font-mono font-semibold">
              Jami {anime.episodes?.length || anime.totalEpisodes || 12} ta
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1.5 custom-scrollbar">
            {(anime.episodes && anime.episodes.length > 0 ? anime.episodes : Array.from({ length: anime.totalEpisodes || 12 }, (_, i) => ({
              id: `ep-${i + 1}`,
              number: i + 1,
              title: `${i + 1}-qism: Yangi bosqich`,
              duration: '24:00',
              videoUrl: anime.videoUrl,
              thumbnail: anime.bannerImage || anime.posterImage
            }))).map((ep: Episode) => (
              <div 
                key={ep.id}
                onClick={() => onPlayAnime(anime, ep.number)}
                className="group flex gap-3.5 p-3 bg-[#161622] border border-white/5 hover:border-orange-500/40 rounded-2xl cursor-pointer hover:bg-white/5 transition-all shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative w-28 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                  <img 
                    src={ep.thumbnail || anime.posterImage} 
                    alt={ep.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition">
                    <div className="w-8 h-8 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                    {ep.number}-qism: {ep.title.replace(/^\d+-qism:\s*/, '')}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">
                    {ep.duration || '24 min'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* O'xshash animelar Section */}
      {similarAnime.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <h3 className="text-xl font-extrabold text-white tracking-wide">
                O'xshash animelar
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {similarAnime.map((simAnime) => (
              <AnimeCard
                key={simAnime.id}
                anime={simAnime}
                onPlayAnime={onPlayAnime}
                onOpenDetail={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
