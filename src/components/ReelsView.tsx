import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreVertical, 
  Plus, 
  Music, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  X,
  Upload,
  Video,
  Loader2
} from 'lucide-react';
import { UserProfile, Anime } from '../types';
import { supabase } from '../lib/supabase';

interface Reel {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  video_url: string;
  description: string;
  likes: number;
  comments: number;
  is_liked?: boolean;
  music_name?: string;
  is_verified?: boolean;
}

interface ReelsViewProps {
  user: UserProfile;
}

export const ReelsView: React.FC<ReelsViewProps> = ({ user }) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock initial reels for UI demo
  useEffect(() => {
    setReels([
      {
        id: '1',
        user_id: 'u1',
        user_name: 'Anilo Official',
        user_avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=Anilo',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1282-large.mp4',
        description: 'Yangi anime mavsumi boshlanmoqda! 🎬✨ #anime #anilo #newseason',
        likes: 12400,
        comments: 856,
        music_name: 'Anilo Original Sound - Mash-up',
        is_verified: true
      },
      {
        id: '2',
        user_id: 'u2',
        user_name: 'Firdavs_Fan',
        user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Firdavs',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
        description: 'Shunchaki ajoyib manzara... 🌸 #nature #chill',
        likes: 8500,
        comments: 120,
        music_name: 'Rainy Day Lofi - Chill Beats'
      },
      {
        id: '3',
        user_id: 'u3',
        user_name: 'Otaku_King',
        user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=King',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-underwater-in-slow-motion-158-large.mp4',
        description: 'Bu effekt qanday ekan? 🎭 #edit #animeedit',
        likes: 45200,
        comments: 3400,
        music_name: 'Nightcore - My Heart'
      }
    ]);
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      setActiveIndex(index);
    }
  };

  const toggleLike = (id: string) => {
    setReels(prev => prev.map(reel => {
      if (reel.id === id) {
        return {
          ...reel,
          is_liked: !reel.is_liked,
          likes: reel.is_liked ? reel.likes - 1 : reel.likes + 1
        };
      }
      return reel;
    }));
  };

  return (
    <div className="h-full w-full bg-black rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col animate-fadeIn relative">
      {/* Upload Button */}
      <button 
        onClick={() => setShowUploadModal(true)}
        className="absolute top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all border border-white/10 shadow-2xl active:scale-95 group"
      >
        <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Reels Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth"
      >
        {reels.map((reel, index) => (
          <div 
            key={reel.id}
            className="h-full w-full snap-start relative flex items-center justify-center bg-black"
          >
            {/* Video Background */}
            <video 
              src={reel.video_url}
              className="h-full w-full object-cover"
              loop
              muted={index !== activeIndex}
              autoPlay={index === activeIndex}
              playsInline
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

            {/* Right Action Bar */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => toggleLike(reel.id)}
                  className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-90 ${reel.is_liked ? 'bg-red-500 text-white' : 'bg-black/40 text-white'}`}
                >
                  <Heart className={`w-7 h-7 ${reel.is_liked ? 'fill-current' : ''}`} />
                </button>
                <span className="text-xs font-black text-white shadow-sm">{reel.likes.toLocaleString()}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all active:scale-90">
                  <MessageSquare className="w-7 h-7" />
                </button>
                <span className="text-xs font-black text-white shadow-sm">{reel.comments.toLocaleString()}</span>
              </div>

              <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all active:scale-90">
                <Share2 className="w-7 h-7" />
              </button>

              <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all active:scale-90">
                <MoreVertical className="w-7 h-7" />
              </button>
            </div>

            {/* Bottom Info Section */}
            <div className="absolute left-6 bottom-8 right-16 z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-orange-500 overflow-hidden shadow-lg">
                  <img src={reel.user_avatar} alt={reel.user_name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-base shadow-sm">@{reel.user_name}</span>
                    {reel.is_verified && <ShieldCheck className="w-4 h-4 text-orange-500" />}
                    <button className="ml-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-xs font-black transition-all active:scale-95 shadow-lg shadow-orange-600/20">
                      Follow
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-100 font-medium line-clamp-2 max-w-lg leading-relaxed shadow-sm">
                {reel.description}
              </p>

              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <Music className="w-4 h-4" />
                <div className="overflow-hidden w-40">
                  <div className="whitespace-nowrap animate-marquee">
                    {reel.music_name} • Original Audio • {reel.music_name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#14141f] w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Plus className="w-7 h-7 text-orange-500" />
                  Yangi Reel Yuklash
                </h2>
                <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-widest">Video format: MP4, MOV • Maks: {user.isPremium ? '120MB' : '20MB'}</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="aspect-[9/16] max-h-[400px] bg-black/40 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:border-orange-500/50 transition-all cursor-pointer">
                <div className="w-20 h-20 rounded-[2rem] bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-gray-300">Videoni tanlang yoki sudrab keling</p>
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Sizning tarifingiz: <span className={user.isPremium ? 'text-amber-400' : 'text-orange-500'}>{user.isPremium ? 'PREMIUM' : 'FREE'}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <textarea 
                  placeholder="Tavsif yozing... #anime #anilo"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-all resize-none h-24"
                />
                
                <button className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-black font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nashr qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
};
