import React from 'react';
import { 
  Home, 
  Tv, 
  Clapperboard, 
  Film, 
  Grid, 
  Sparkles, 
  Flame, 
  PlayCircle,
  Crown,
  X,
  Compass,
  Drama as DramaIcon,
  Rocket,
  Heart,
  Smile,
  Ghost,
  GraduationCap,
  User,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab, Genre, UserProfile } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
  genres: Genre[];
  onOpenPremium: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  user?: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedGenre,
  onSelectGenre,
  genres,
  onOpenPremium,
  isOpenMobile,
  onCloseMobile,
  user,
}) => {
  const navItems = [
    { id: 'home', label: 'Bosh sahifa', icon: Home },
    { id: 'anime', label: 'Animelar', icon: Tv },
    { id: 'series', label: 'Seriallar', icon: Clapperboard },
    { id: 'movies', label: 'Filmlar', icon: Film },
    { id: 'genres', label: 'Janrlar', icon: Grid },
    { id: 'new', label: 'Yangi chiqdi', icon: Sparkles },
    { id: 'popular', label: 'Mashhur', icon: Flame },
    { id: 'ongoing', label: 'Ongoing', icon: PlayCircle },
    { id: 'community', label: 'Jamiyat Chat', icon: MessageSquare },
    { id: 'profile', label: 'Profilim', icon: User },
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

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
      default: return Sparkles;
    }
  };

  const content = (
    <div className="flex flex-col h-full py-4 px-3 space-y-6 overflow-y-auto custom-scrollbar">
      
      {/* Brand Logo Header */}
      <div 
        onClick={() => {
          setActiveTab('home');
          onSelectGenre(null);
          if (onCloseMobile) onCloseMobile();
        }}
        className="flex items-center gap-3 px-2 py-1 cursor-pointer group select-none"
      >
        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-orange-500/80 shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform bg-[#181820] flex-shrink-0">
          <img 
            src="https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg" 
            alt="ANILO.UZ Logo" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = '/logo.jpg';
            }}
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-white group-hover:text-orange-400 transition-colors font-sans tracking-tight">
            ANILO<span className="text-orange-500 font-extrabold text-sm">.UZ</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
            Anime Platform
          </p>
        </div>
      </div>

      {/* Mobile Close Button */}
      {isOpenMobile && (
        <div className="flex items-center justify-between pb-2 border-b border-white/10 lg:hidden">
          <span className="text-sm font-bold text-gray-300">Bo'limlar</span>
          <button 
            onClick={onCloseMobile}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Nav Items */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !selectedGenre;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as ActiveTab);
                onSelectGenre(null);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <hr className="border-white/5" />

      {/* Top Janrlar List */}
      <div>
        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Top janrlar
        </h3>
        <div className="space-y-0.5">
          {genres.slice(0, 8).map((genre) => {
            const Icon = getGenreIcon(genre.name);
            const isSelected = selectedGenre === genre.name;
            return (
              <button
                key={genre.id}
                onClick={() => {
                  if (isSelected) {
                    onSelectGenre(null);
                  } else {
                    onSelectGenre(genre.name);
                    setActiveTab('genres');
                  }
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                  isSelected
                    ? 'bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 opacity-75" />
                  <span>{genre.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono font-normal">
                  {genre.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Premium Card (Matching Screenshot 2) */}
      <div className="mt-auto pt-4">
        <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#1F1914] to-[#151210] border border-amber-500/30 text-center shadow-lg group overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
          <Crown className="w-7 h-7 text-amber-400 mx-auto mb-2 drop-shadow" />
          <h4 className="text-xs font-bold text-amber-300 mb-1">
            Reklamasiz tomosha qiling!
          </h4>
          <p className="text-[11px] text-gray-400 leading-tight mb-3">
            Premium obuna bilan barcha imkoniyatlardan va 4K sifatdan foydalaning.
          </p>
          <button
            onClick={() => {
              onOpenPremium();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs tracking-wide shadow-md shadow-orange-500/20 transition active:scale-95"
          >
            PREMIUMGA O'TING
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-white/5 bg-[#0E0E12]/80 sticky top-[72px] h-[calc(100vh-72px)]">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-full bg-[#121218] h-full shadow-2xl z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
