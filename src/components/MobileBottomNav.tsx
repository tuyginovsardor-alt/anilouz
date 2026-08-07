import React from 'react';
import { Home, LayoutGrid, MessageSquare, Play, User } from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user?: UserProfile;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  user,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] bg-[#0E0E12]/98 backdrop-blur-2xl border-t border-white/10 px-2 pb-2 sm:pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <nav className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
        
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'home' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Bosh</span>
        </button>

        {/* Catalog (Genres) */}
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'catalog' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <LayoutGrid className={`w-6 h-6 ${activeTab === 'catalog' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Katalog</span>
        </button>

        {/* Messages */}
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-1 transition-all relative ${
            activeTab === 'messages' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <MessageSquare className={`w-6 h-6 ${activeTab === 'messages' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Chat</span>
          <span className="absolute top-0 right-1 w-2 h-2 bg-orange-500 rounded-full border border-[#0E0E12]" />
        </button>

        {/* Reels */}
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'reels' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Play className={`w-6 h-6 ${activeTab === 'reels' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">Reels</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'profile' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${
            activeTab === 'profile' ? 'border-orange-500 scale-110' : 'border-gray-500'
          }`}>
            <img 
              src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anilo"} 
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[10px] font-bold">Profil</span>
        </button>

      </nav>
    </div>
  );
};
