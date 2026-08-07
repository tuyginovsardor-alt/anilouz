import React from 'react';
import { Home, Search, Heart, Download, User } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onOpenPremium: () => void;
  favoritesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenPremium,
  favoritesCount,
}) => {
  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-50 pointer-events-auto">
      <nav className="bg-[#14141f]/80 backdrop-blur-xl border border-white/15 h-16 rounded-[32px] flex items-center justify-around px-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
        
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex flex-col items-center gap-0.5 transition"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'home' 
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_18px_rgba(255,107,0,0.5)] scale-110' 
              : 'text-gray-400 hover:text-white'
          }`}>
            <Home className="w-5 h-5" />
          </div>
          <span className={`text-[9px] font-bold ${activeTab === 'home' ? 'text-orange-400' : 'text-gray-400'}`}>
            Bosh sahifa
          </span>
        </button>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white transition"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-medium text-gray-400">Qidirish</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => setActiveTab('favorites')}
          className="relative flex flex-col items-center gap-0.5 transition"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'favorites' 
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_18px_rgba(255,107,0,0.5)] scale-110' 
              : 'text-gray-400 hover:text-white'
          }`}>
            <Heart className="w-5 h-5" />
            {favoritesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-extrabold flex items-center justify-center border border-black">
                {favoritesCount}
              </span>
            )}
          </div>
          <span className={`text-[9px] font-bold ${activeTab === 'favorites' ? 'text-orange-400' : 'text-gray-400'}`}>
            Sevimli
          </span>
        </button>

        {/* Premium / Downloads */}
        <button
          onClick={onOpenPremium}
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white transition"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-medium text-gray-400">Yuklab olish</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => setActiveTab('profile')}
          className="flex flex-col items-center gap-0.5 transition"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'profile' 
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_18px_rgba(255,107,0,0.5)] scale-110' 
              : 'text-gray-400 hover:text-white'
          }`}>
            <User className="w-5 h-5" />
          </div>
          <span className={`text-[9px] font-bold ${activeTab === 'profile' ? 'text-orange-400' : 'text-gray-400'}`}>
            Profil
          </span>
        </button>

      </nav>
    </div>
  );
};
