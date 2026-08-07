import React, { useState } from 'react';
import { 
  User, Edit3, Crown, Wallet, Bookmark, History, Settings, 
  MessageSquare, Mic, HelpCircle, ChevronRight, Check, X,
  ShieldCheck, Sparkles, Send, Bot, Image as ImageIcon, Palette, CheckCircle2,
  LogOut, ShieldAlert
} from 'lucide-react';
import { UserProfile, ActiveTab, Anime } from '../types';
import { supabase } from '../lib/supabase';
import { AdminView } from './AdminView';

export const PROFILE_BACKGROUNDS = [
  { id: '1', title: '1. Crimson Horizon', ibbUrl: 'https://i.ibb.co/FbKPfwPw/photo-1-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/FbKPfwPw/photo-1-2026-08-05-22-37-08.jpg' },
  { id: '2', title: '2. Cyberpunk Red City', ibbUrl: 'https://i.ibb.co/JRq1gBGk/photo-3-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/JRq1gBGk/photo-3-2026-08-05-22-37-08.jpg' },
  { id: '3', title: '3. Gojo Satoru Six Eyes', ibbUrl: 'https://i.ibb.co/SXHt559P/photo-2-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/SXHt559P/photo-2-2026-08-05-22-37-08.jpg' },
  { id: '4', title: '4. Neon Anime Warrior', ibbUrl: 'https://i.ibb.co/bM7wBcjr/photo-5-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/bM7wBcjr/photo-5-2026-08-05-22-37-08.jpg' },
  { id: '5', title: '5. Dark Demon Slayer Flame', ibbUrl: 'https://i.ibb.co/3y55hyRV/photo-4-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/3y55hyRV/photo-4-2026-08-05-22-37-08.jpg' },
  { id: '6', title: '6. Naruto Kurama Chakra', ibbUrl: 'https://i.ibb.co/JRd5S8kx/photo-8-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/JRd5S8kx/photo-8-2026-08-05-22-37-08.jpg' },
  { id: '7', title: '7. Purple Samurai Spirit', ibbUrl: 'https://i.ibb.co/p6tqF3JK/photo-7-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/p6tqF3JK/photo-7-2026-08-05-22-37-08.jpg' },
  { id: '8', title: '8. Sung Jinwoo Shadow Monarch', ibbUrl: 'https://i.ibb.co/27cmcJbg/photo-6-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/27cmcJbg/photo-6-2026-08-05-22-37-08.jpg' },
  { id: '9', title: '9. Fire Katana Swordmaster', ibbUrl: 'https://i.ibb.co/Pz5SmWpV/photo-10-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/Pz5SmWpV/photo-10-2026-08-05-22-37-09.jpg' },
  { id: '10', title: '10. Sunset Sakura Temple', ibbUrl: 'https://i.ibb.co/FL4zcQ9t/photo-11-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/FL4zcQ9t/photo-11-2026-08-05-22-37-09.jpg' },
  { id: '11', title: '11. Red Masked Anbu Assassin', ibbUrl: 'https://i.ibb.co/GfZwbfYn/photo-9-2026-08-05-22-37-08.jpg', url: 'https://i.ibb.co/GfZwbfYn/photo-9-2026-08-05-22-37-08.jpg' },
  { id: '12', title: '12. Eren Yeager Titan Form', ibbUrl: 'https://i.ibb.co/rG6nnspX/photo-14-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/rG6nnspX/photo-14-2026-08-05-22-37-09.jpg' },
  { id: '13', title: '13. Dark Dragon Armor Knight', ibbUrl: 'https://i.ibb.co/QjpfGmpX/photo-13-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/QjpfGmpX/photo-13-2026-08-05-22-37-09.jpg' },
  { id: '14', title: '14. Itachi Uchiha Tsukuyomi', ibbUrl: 'https://i.ibb.co/6RFG8TJv/photo-12-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/6RFG8TJv/photo-12-2026-08-05-22-37-09.jpg' },
  { id: '15', title: '15. Cyber City Golden Night', ibbUrl: 'https://i.ibb.co/4Z8GDBZL/photo-17-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/4Z8GDBZL/photo-17-2026-08-05-22-37-09.jpg' },
  { id: '16', title: '16. Luffy Gear 5 Joyboy', ibbUrl: 'https://i.ibb.co/FLP0xWX8/photo-16-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/FLP0xWX8/photo-16-2026-08-05-22-37-09.jpg' },
  { id: '17', title: '17. Goku Mastered Ultra Instinct', ibbUrl: 'https://i.ibb.co/7mFRQSh/photo-15-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/7mFRQSh/photo-15-2026-08-05-22-37-09.jpg' },
  { id: '18', title: '18. Ryomen Sukuna Malevolent Shrine', ibbUrl: 'https://i.ibb.co/YFN42NsC/photo-20-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/YFN42NsC/photo-20-2026-08-05-22-37-09.jpg' },
  { id: '19', title: '19. Synthwave Highway Drive', ibbUrl: 'https://i.ibb.co/HL5bPDvH/photo-19-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/HL5bPDvH/photo-19-2026-08-05-22-37-09.jpg' },
  { id: '20', title: '20. Ichigo Kurosaki Final Getsuga', ibbUrl: 'https://i.ibb.co/cXYG7v3h/photo-18-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/cXYG7v3h/photo-18-2026-08-05-22-37-09.jpg' },
  { id: '21', title: '21. Chainsaw Devil Denji', ibbUrl: 'https://i.ibb.co/Psm79QzV/photo-21-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/Psm79QzV/photo-21-2026-08-05-22-37-09.jpg' },
  { id: '22', title: '22. Kyojuro Rengoku Flame Heart', ibbUrl: 'https://i.ibb.co/Lzm3VqB7/photo-22-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/Lzm3VqB7/photo-22-2026-08-05-22-37-09.jpg' },
  { id: '23', title: '23. Kakashi Lightning Blade', ibbUrl: 'https://i.ibb.co/Y7BVBkN7/photo-23-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/Y7BVBkN7/photo-23-2026-08-05-22-37-09.jpg' },
  { id: '24', title: '24. Orange Minimalist Horizon', ibbUrl: 'https://i.ibb.co/XrJbhYY3/photo-24-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/XrJbhYY3/photo-24-2026-08-05-22-37-09.jpg' },
  { id: '25', title: '25. Megumi Fushiguro Shadows', ibbUrl: 'https://i.ibb.co/GfGcXP4t/photo-25-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/GfGcXP4t/photo-25-2026-08-05-22-37-09.jpg' },
  { id: '26', title: '26. Roronoa Zoro Ashura', ibbUrl: 'https://i.ibb.co/DfwR1RJG/photo-27-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/DfwR1RJG/photo-27-2026-08-05-22-37-09.jpg' },
  { id: '27', title: '27. Tomioka Giyuu Eleventh Form', ibbUrl: 'https://i.ibb.co/kVnzS9YG/photo-26-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/kVnzS9YG/photo-26-2026-08-05-22-37-09.jpg' },
  { id: '28', title: '28. Crimson Flame Phoenix', ibbUrl: 'https://i.ibb.co/nN8HKQ3D/photo-29-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/nN8HKQ3D/photo-29-2026-08-05-22-37-09.jpg' },
  { id: '29', title: '29. Neon Cyberpunk Tokyo Sky', ibbUrl: 'https://i.ibb.co/d8W6x3S/photo-28-2026-08-05-22-37-09.jpg', url: 'https://i.ibb.co/d8W6x3S/photo-28-2026-08-05-22-37-09.jpg' },
];

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenPremium: () => void;
  savedCount: number;
  historyCount: number;
  onAnimeAdded?: (anime: Anime) => void;
}

const sanitizeImageUrl = (url?: string): string => {
  if (!url) return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop';
  if (url.includes('ibb.co/') && !url.includes('i.ibb.co/')) {
    const matched = PROFILE_BACKGROUNDS.find(b => b.ibbUrl === url || b.url === url);
    return matched ? matched.url : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop';
  }
  return url;
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  setActiveTab,
  onOpenPremium,
  savedCount,
  historyCount,
  onAnimeAdded,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isFandubModalOpen, setIsFandubModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Form edit states
  const [editName, setEditName] = useState(user.name || 'ANILO EGA²');
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [editCover, setEditCover] = useState(user.coverImage || PROFILE_BACKGROUNDS[0].url);
  const [balance, setBalance] = useState<number>(user.balance || 0);

  // UseEffect to sync balance when user prop changes
  React.useEffect(() => {
    if (user.balance !== undefined) {
      setBalance(user.balance);
    }
  }, [user.balance]);

  // Settings states
  const [videoQuality, setVideoQuality] = useState('1080p');
  const [autoNext, setAutoNext] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const activeCover = user.coverImage || PROFILE_BACKGROUNDS[0].url;
  const isPremium = user.isPremium;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData = {
      full_name: editName,
      avatar_url: editAvatar,
      banner_url: editCover,
    };

    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase
          .from('profiles')
          .update(updatedData)
          .eq('id', authUser.id);
      }
    }

    onUpdateUser({
      name: editName,
      avatar: editAvatar,
      coverImage: editCover,
    });
    setIsEditModalOpen(false);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      // For local mode, we don't have a real logout, maybe just a message
      alert("Lokal rejimda tizimdan chiqish imkoniyati yo'q.");
    }
  };

  const handleSelectCover = async (bgUrl: string) => {
    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase
          .from('profiles')
          .update({ banner_url: bgUrl })
          .eq('id', authUser.id);
      }
    }
    onUpdateUser({ coverImage: bgUrl });
    setEditCover(bgUrl);
  };

  const handleUpdateBalance = async (newBalance: number) => {
    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', authUser.id);
      }
    }
    setBalance(newBalance);
    onUpdateUser({ balance: newBalance });
  };

  return (
    <div className={`min-h-screen ${isPremium ? 'bg-[#0a0a02]' : 'bg-[#111115]'} text-[#e5e2e1] pb-28 animate-fadeIn`}>
      
      {/* Header Section with Background Banner & Gradient Vignette */}
      <div 
        className={`relative h-72 sm:h-80 w-full bg-cover bg-center flex flex-col items-center justify-end pb-6 border-b ${isPremium ? 'border-yellow-500/30 shadow-[0_10px_50px_rgba(234,179,8,0.15)]' : 'border-white/10 shadow-2xl'} transition-all duration-500 overflow-hidden`}
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(17, 17, 21, 0.3), ${isPremium ? 'rgba(10, 10, 2, 0.85)' : 'rgba(17, 17, 21, 0.85)'} 70%, ${isPremium ? 'rgba(10, 10, 2, 1)' : 'rgba(17, 17, 21, 1)'}), url('${sanitizeImageUrl(activeCover)}')`
        }}
      >
        {/* Premium Ornament Overlays */}
        {isPremium && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/gold-dust.png')]" />
            <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-yellow-500/30 rounded-tl-3xl" />
            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-yellow-500/30 rounded-tr-3xl" />
          </div>
        )}

        {/* Top-Right Background Switcher Trigger */}
        <button
          onClick={() => setIsBackgroundModalOpen(true)}
          className={`absolute top-4 right-4 z-20 flex items-center gap-2 backdrop-blur-md border px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-xl active:scale-95 group ${
            isPremium 
              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500 hover:bg-yellow-500 hover:text-black' 
              : 'bg-black/60 border-white/20 text-white hover:bg-orange-500 hover:text-black'
          }`}
        >
          <Palette className={`w-4 h-4 transition ${isPremium ? 'text-yellow-400 group-hover:text-black' : 'text-orange-400 group-hover:text-black'}`} />
          <span>Orqa Fon Oboylar</span>
          <span className={`${isPremium ? 'bg-yellow-500' : 'bg-orange-500'} group-hover:bg-black group-hover:text-orange-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full`}>
            29
          </span>
        </button>

        {/* Avatar Container */}
        <div className="relative mb-3 z-10">
          <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 overflow-hidden flex items-center justify-center transition hover:scale-105 ${
            isPremium 
              ? 'border-yellow-500 bg-yellow-900/20 shadow-[0_0_40px_rgba(234,179,8,0.4)]' 
              : 'border-[#17171f] bg-[#1a1a24] shadow-[0_0_30px_rgba(255,107,0,0.4)]'
          }`}>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = 'https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg';
              }}
            />
          </div>
          {isPremium && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-600 to-yellow-400 p-1.5 rounded-full shadow-lg border border-yellow-300/50">
              <Crown className="w-4 h-4 text-black" fill="currentColor" />
            </div>
          )}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className={`absolute bottom-1 right-1 rounded-full p-2 text-black shadow-lg transition active:scale-95 ${
              isPremium 
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:scale-110' 
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-110'
            }`}
            title="Profilni tahrirlash"
          >
            <Edit3 className="w-4 h-4 font-bold" />
          </button>
        </div>

        {/* User Name & Badges */}
        <div className={`backdrop-blur-xl rounded-2xl px-6 py-3 flex flex-col items-center border shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-10 max-w-sm w-full mx-4 ${
          isPremium 
            ? 'bg-yellow-950/20 border-yellow-500/25 shadow-[0_10px_30px_rgba(234,179,8,0.1)]' 
            : 'bg-[#181824]/80 border-white/15'
        }`}>
          <div className="flex items-center gap-2 text-center">
            <h1 className={`font-black text-xl sm:text-2xl tracking-tight ${
              isPremium 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-400 to-yellow-100' 
                : 'text-white'
            }`}>
              {user.name || 'ANILO EGA²'}
            </h1>
            {isPremium && (
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`font-extrabold text-xs ${isPremium ? 'text-yellow-500/80' : 'text-orange-400'}`}>@Anilo.uz</span>
            <span className="text-gray-500">•</span>
            <span className={`text-[11px] font-extrabold flex items-center gap-1 px-2.5 py-0.5 rounded-full border shadow-lg ${
              isPremium 
                ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40' 
                : 'text-amber-300 bg-amber-500/20 border-amber-500/30'
            }`}>
              <Crown className={`w-3.5 h-3.5 ${isPremium ? 'fill-yellow-400' : 'fill-amber-300'}`} />
              VIP A'zo
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className={`border rounded-2xl p-3 flex flex-col items-center text-center transition cursor-pointer group ${
              isPremium 
                ? 'bg-yellow-900/5 border-yellow-500/20 hover:border-yellow-500/50' 
                : 'bg-[#191924] border-white/10 hover:border-emerald-500/50'
            }`}
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hamyon</span>
            <span className={`text-xs sm:text-sm font-black font-mono mt-1 truncate ${
              isPremium ? 'text-yellow-400' : 'text-emerald-400'
            }`}>
              {(balance / 1000).toFixed(0)}k UZS
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('favorites')}
            className="bg-[#191924] border border-white/10 rounded-2xl p-3 flex flex-col items-center text-center hover:border-orange-500/50 transition cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sevimli</span>
            <span className="text-xs sm:text-sm font-black text-orange-400 mt-1">
              {savedCount} ta
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className="bg-[#191924] border border-white/10 rounded-2xl p-3 flex flex-col items-center text-center hover:border-rose-500/50 transition cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarix</span>
            <span className="text-xs sm:text-sm font-black text-rose-400 mt-1">
              {historyCount} ta
            </span>
          </button>
        </div>

        {/* Change Background Banner Card */}
        <button
          onClick={() => setIsBackgroundModalOpen(true)}
          className="w-full bg-gradient-to-r from-orange-600/30 via-amber-600/20 to-orange-500/30 hover:from-orange-600/40 hover:to-orange-500/40 border border-orange-500/40 rounded-2xl p-4 flex items-center justify-between transition-all group shadow-xl active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,107,0,0.5)] group-hover:scale-110 transition">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-black text-sm text-white tracking-wide group-hover:text-orange-400 transition">
                Orqa Fon Rasmlari Gallery
              </h3>
              <p className="text-[11px] text-gray-300 font-medium">
                29 ta eksklyuziv anime oboylardan birini tanlang
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition" />
        </button>

        {/* Fandub Studio Card */}
        <button
          onClick={() => setIsFandubModalOpen(true)}
          className="w-full bg-[#6C5CE7]/20 hover:bg-[#6C5CE7]/30 border border-[#6C5CE7]/40 rounded-2xl p-4 flex items-center gap-4 transition-all group shadow-lg bg-gradient-to-r from-[#6C5CE7]/30 to-[#6C5CE7]/10 cursor-pointer text-left active:scale-[0.99]"
        >
          <div className="bg-[#6C5CE7]/30 p-2.5 rounded-xl flex items-center justify-center text-[#6C5CE7] border border-[#6C5CE7]/40 group-hover:scale-110 transition-transform">
            <Mic className="w-6 h-6 text-[#8c7ae6]" />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="font-extrabold text-base text-white tracking-wide group-hover:text-[#8c7ae6] transition-colors">
              FANDUB STUDIO
            </span>
            <span className="text-[11px] font-bold text-[#b7b5b4] uppercase tracking-wider mt-0.5">
              IJODKOR PANELI VA OVOZ BERISH
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
        </button>

        {/* Menu List 1: MENING PROFILIM */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-[#A0A0A0] uppercase tracking-widest px-2 flex items-center gap-2">
            <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
            MENING PROFILIM
          </h2>

          <div className="bg-[#181822] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-2xl">
            
            {/* 1. Suhbat */}
            <button
              onClick={() => setActiveTab('community')}
              className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Suhbat va Jamiyat
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition" />
            </button>

            {/* 2. Profilni tahrirlash */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Profilni tahrirlash
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition" />
            </button>

            {/* 3. Mening Hisobim */}
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Mening Hisobim
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {balance.toLocaleString('uz-UZ')} UZS
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition" />
              </div>
            </button>

            {/* 4. Premium Obuna */}
            <button
              onClick={onOpenPremium}
              className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Crown className="w-4 h-4 fill-amber-400/20" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Premium Obuna
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  {user.isPremium ? 'FAOL VIP' : 'Obuna bo\'lish'}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition" />
              </div>
            </button>

            {/* 5. Saqlanganlar */}
            <button
              onClick={() => setActiveTab('favorites')}
              className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Bookmark className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Saqlanganlar (Sevimliklar)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                  {savedCount} ta
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition" />
              </div>
            </button>

            {/* 6. Ko'rishlar tarixi */}
            <button
              onClick={() => setActiveTab('history')}
              className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <History className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Ko'rishlar tarixi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                  {historyCount} ta
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition" />
              </div>
            </button>

          </div>
        </div>

        {/* Menu List 2: YORDAM VA SOZLAMALAR */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-black text-[#A0A0A0] uppercase tracking-widest px-2 flex items-center gap-2">
            <span className="w-1.5 h-3 bg-teal-500 rounded-full" />
            YORDAM VA SOZLAMALAR
          </h2>

          <div className="bg-[#181822] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-2xl">
            
            {/* 1. Yordam Markazi (AI) */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Yordam Markazi (AI Assistant)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  AI 24/7
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition" />
              </div>
            </button>

            {/* 2. Ilova Sozlamalari */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-gray-300">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Ilova Sozlamalari
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition" />
            </button>

            {/* 3. Admin Panel (Only for admins) */}
            {(supabase && user.role === 'admin') && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className={`w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition group ${isPremium ? 'border-l-2 border-yellow-500/50' : ''}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                    isPremium 
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold transition-colors ${
                    isPremium ? 'text-yellow-100 group-hover:text-yellow-400' : 'text-white group-hover:text-orange-400'
                  }`}>
                    Admin Panel (Anime Qo'shish)
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 transition ${isPremium ? 'text-yellow-600 group-hover:text-yellow-400' : 'text-gray-500 group-hover:text-white'}`} />
              </button>
            )}

          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl p-4 flex items-center justify-center gap-3 text-red-500 font-black text-sm transition-all active:scale-[0.98] mt-4 mb-8"
        >
          <LogOut className="w-5 h-5" />
          <span>TIZIMDAN CHIQISH</span>
        </button>

        {/* Platform Footer Info */}
        <div className="text-center pt-4 text-xs text-gray-500 space-y-1">
          <p className="font-bold text-gray-400">ANILO.UZ • Version 2.4.0 (Pro Cloud)</p>
          <p>© 2026 Barcha huquqlar himoyalangan</p>
        </div>

      </div>

      {/* MODAL: Admin Panel */}
      {isAdminPanelOpen && (
        <AdminView 
          onClose={() => setIsAdminPanelOpen(false)} 
          onAnimeAdded={(anime) => {
            onAnimeAdded?.(anime);
            setIsAdminPanelOpen(false);
          }}
        />
      )}

      {/* MODAL: Background Wallpapers Selector (29 Anime Wallpapers) */}
      {isBackgroundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#181824] border border-orange-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-black flex items-center justify-center font-bold">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Profile Orqa Fon Rasmlari
                  </h3>
                  <p className="text-xs text-gray-400">29 ta eksklyuziv anime orqa fonlaridan birini tanlang</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBackgroundModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wallpaper Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1 custom-scrollbar">
              {PROFILE_BACKGROUNDS.map((bg) => {
                const isSelected = activeCover === bg.url || activeCover === bg.ibbUrl;
                return (
                  <div
                    key={bg.id}
                    onClick={() => handleSelectCover(bg.url)}
                    className={`relative group rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 aspect-video ${
                      isSelected 
                        ? 'border-orange-500 ring-4 ring-orange-500/30 scale-95 shadow-[0_0_20px_rgba(255,107,0,0.5)]' 
                        : 'border-white/10 hover:border-orange-500/50 hover:scale-[1.02]'
                    }`}
                  >
                    <img
                      src={bg.url}
                      alt={bg.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop';
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 p-2 flex flex-col justify-end">
                      <span className="text-[10px] font-bold text-white truncate drop-shadow">
                        {bg.title}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-black p-1 rounded-full shadow-lg">
                        <CheckCircle2 className="w-4 h-4 font-black" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-white/10 flex-shrink-0">
              <button
                onClick={() => setIsBackgroundModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs shadow-lg shadow-orange-500/30 active:scale-95"
              >
                Tayyor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Profile */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#181824] border border-orange-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-400" />
                Profilni tahrirlash
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Ismingiz / Taxallus:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#111115] border border-white/10 text-white focus:outline-none focus:border-orange-500 text-sm font-medium"
                  placeholder="Ismingizni kiriting"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Avatar Rasm URL:
                </label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#111115] border border-white/10 text-white focus:outline-none focus:border-orange-500 text-xs font-mono"
                  placeholder="https://..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-300">
                    Orqa Fon Banner URL:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsBackgroundModalOpen(true)}
                    className="text-[11px] text-orange-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Oboylar (29 ta)
                  </button>
                </div>
                <input
                  type="text"
                  value={editCover}
                  onChange={(e) => setEditCover(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#111115] border border-white/10 text-white focus:outline-none focus:border-orange-500 text-xs font-mono"
                  placeholder="https://..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs shadow-lg shadow-orange-500/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Wallet / Hisobim */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#181824] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Mening Hisobim (Balans)
              </h3>
              <button 
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#111115] p-5 rounded-2xl border border-emerald-500/20 text-center space-y-1">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Joriy Hamyon Balansi:
              </span>
              <div className="text-3xl font-black font-mono text-emerald-400">
                {balance.toLocaleString('uz-UZ')} UZS
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-300">
                Balansni to'ldirish (Tezkor Click / Payme):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 250000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      handleUpdateBalance(balance + amount);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold transition active:scale-95"
                  >
                    +{amount.toLocaleString('uz-UZ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsWalletModalOpen(false)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Settings */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#181824] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-300" />
                Ilova Sozlamalari
              </h3>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111115] border border-white/5">
                <div>
                  <h4 className="font-bold text-white">Video Pleyer Sifati</h4>
                  <p className="text-gray-400 mt-0.5">Avtomatik sifat darajasi</p>
                </div>
                <select
                  value={videoQuality}
                  onChange={(e) => setVideoQuality(e.target.value)}
                  className="bg-[#201f1f] text-orange-400 border border-white/10 rounded-xl px-3 py-1.5 font-mono font-bold focus:outline-none"
                >
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p SD</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111115] border border-white/5">
                <div>
                  <h4 className="font-bold text-white">Avto-ijro (Keyingi qism)</h4>
                  <p className="text-gray-400 mt-0.5">Epizod tugaganda navbatdagisiga o'tish</p>
                </div>
                <button
                  onClick={() => setAutoNext(!autoNext)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                    autoNext ? 'bg-orange-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    autoNext ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111115] border border-white/5">
                <div>
                  <h4 className="font-bold text-white">Bildirishnomalar</h4>
                  <p className="text-gray-400 mt-0.5">Yangi premyeralar va epizodlar</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                    notifications ? 'bg-orange-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-xs shadow-lg"
            >
              Saqlash va Yopish
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Fandub Studio Info */}
      {isFandubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#181824] border border-[#6C5CE7]/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#8c7ae6]" />
                FANDUB STUDIO (Ovoz Beruvchilar)
              </h3>
              <button 
                onClick={() => setIsFandubModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              Fandub Studio — ANILO.UZ platformasining rasmiy ovoz berish va tarjimonlar jamoasi. Bu yerda siz o'zbekcha dublyaj jarayonida qatnashishingiz mumkin!
            </p>

            <div className="bg-[#6C5CE7]/20 p-4 rounded-2xl border border-[#6C5CE7]/30 text-xs text-purple-200 space-y-1">
              <p className="font-bold text-white">🎙️ Dublyaj kastingi ochiq!</p>
              <p className="text-gray-300">O'z ovozingiz audiosini Telegram botimizga yuboring: <span className="text-orange-400 font-bold">@AniloDubBot</span></p>
            </div>

            <button
              onClick={() => setIsFandubModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-black text-xs shadow-lg"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: AI Help Center */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#181824] border border-teal-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-teal-400" />
                Yordam Markazi (AI)
              </h3>
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#111115] border border-teal-500/20 text-xs text-gray-300 space-y-2">
              <p className="font-bold text-white text-sm">🤖 AI Yordamchi Savol-Javob:</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-400">
                <li>Video ijro etilmayaptimi? Brauzer keshini tozalang yoki pleyer sifatini 720p qiling.</li>
                <li>VIP Obuna qachon aktiv bo'ladi? To'lov qilishingiz bilan darhol avtomatik ulanadi.</li>
                <li>Murojaat uchun: Telegram <span className="text-orange-400 font-bold">@AniloAdmin</span> (24/7)</li>
              </ul>
            </div>

            <button
              onClick={() => setIsHelpModalOpen(false)}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs shadow-lg"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
