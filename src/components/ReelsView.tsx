import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Search,
  Music, 
  ShieldCheck, 
  MoreHorizontal, 
  Send
} from 'lucide-react';
import { UserProfile } from '../types';

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
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReels([
      {
        id: '1',
        user_id: 'u1',
        user_name: 'tech_mentor_official',
        user_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD5J3K47Ll-LuMA9R60X0O2krngHpG27Dws7KBCb4WkFNphzKKzqtl4FmmlXUyPGlhSCspW3NmaAvzRv1eUyD8EYpw5EgPmfCw6CQ-rHdRgtvY3OUA4TOqYqd7aQ4BSbdR-LnTYY28mHQywVLmk80_kSxzvxqGEtMOBF40CRh_R4YuWcgc-OtxF9hv0c7FEgkOArudySDas2R-lVn7HbLJU8Q0XYoz1JPfMDuTyd_axuxhWrLHgWpS3Q',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1282-large.mp4',
        description: 'Mastering the new API integrations in our dashboard. Check out how fast data syncs now! 🔥 #tech #development #anilo',
        likes: 12400,
        comments: 458,
        music_name: 'Original Audio - Tech Mentor',
        is_verified: true
      },
      {
        id: '2',
        user_id: 'u2',
        user_name: 'sysadmin_life',
        user_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOIq2qzZzY_UFYGSHBtAMK2-PQP73FM2BzPsCfGg5tZWHzbt3hKQt3aEYt80wK4thWH8RB0LGTtyCekNoI1kbvoRpYms7XzzOSTAZWxycuQolGR8t8ENqypJhw_dtoW5c8LB5jvTw3ODj7E-rN_hNIoIsy6sj84D8h44hT4VAqtjFb0g7RM3_idBYZZVMjdJwAr3xA59xwZPmzES2ZpO5Fd3zZzF8lo60U-Nmny3CEgMBb048bYUFXpQ',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
        description: 'Server room aesthetics. Keeping the data flowing 24/7. ⚡️ #sysadmin #servers #techlife',
        likes: 8100,
        comments: 120,
        music_name: 'Lofi Tech Beats - Chill'
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
    <div className="h-full w-full bg-black text-[#dbe3f0] antialiased overflow-hidden flex flex-col relative">
      <header className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-5 w-full bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <h1 className="text-xl font-black text-white pointer-events-auto tracking-tight">Reels</h1>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors pointer-events-auto">
          <Search className="w-6 h-6 text-white" />
        </button>
      </header>

      <main 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black relative z-0"
      >
        {reels.map((reel, index) => (
          <article 
            key={reel.id}
            className="h-full w-full snap-start snap-always relative flex justify-center items-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <video 
                src={reel.video_url}
                className="h-full w-full object-cover opacity-80"
                loop
                muted={index !== activeIndex}
                autoPlay={index === activeIndex}
                playsInline
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute bottom-6 left-4 right-20 flex flex-col gap-2 z-10">
              <div className="flex items-center gap-3 mb-2">
                <img src={reel.user_avatar} alt="Author" className="w-10 h-10 rounded-full border-2 border-[#ff6b00] object-cover" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    @{reel.user_name} 
                    {reel.is_verified && <ShieldCheck className="w-4 h-4 text-[#ff6b00] fill-current" />}
                  </span>
                  <button className="text-[10px] font-bold text-[#ff6b00] border border-[#ff6b00] rounded px-2 py-0.5 w-fit hover:bg-[#ff6b00]/20 transition-colors uppercase tracking-wider">Follow</button>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-200 line-clamp-2 w-[90%] leading-relaxed">
                {reel.description}
              </p>
              <div className="flex items-center gap-2 mt-1 bg-black/40 rounded-full px-3 py-1.5 w-fit backdrop-blur-sm border border-white/5">
                <Music className="w-3.5 h-3.5 text-white fill-current" />
                <div className="overflow-hidden max-w-[150px]">
                  <div className="text-[10px] font-bold text-white whitespace-nowrap animate-marquee">
                    {reel.music_name} • Original Audio
                  </div>
                </div>
              </div>
            </div>
            <aside className="absolute bottom-6 right-2 flex flex-col items-center gap-6 z-10">
              <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-1 group">
                <div className={`p-3 rounded-full backdrop-blur-sm transition-all active:scale-90 ${reel.is_liked ? 'bg-[#ff6b00]/30 text-[#ff6b00]' : 'bg-black/40 text-white hover:bg-white/10'}`}>
                  <Heart className={`w-7 h-7 ${reel.is_liked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[11px] font-black text-white drop-shadow-md">{reel.likes.toLocaleString()}</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                <div className="p-3 bg-black/40 rounded-full backdrop-blur-sm group-hover:bg-white/10 transition-colors active:scale-90">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] font-black text-white drop-shadow-md">{reel.comments.toLocaleString()}</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                <div className="p-3 bg-black/40 rounded-full backdrop-blur-sm group-hover:bg-white/10 transition-colors active:scale-90">
                  <Send className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] font-black text-white drop-shadow-md">Share</span>
              </button>
              <button className="flex flex-col items-center gap-1 group mt-2">
                <div className="p-2 bg-black/40 rounded-full backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                  <MoreHorizontal className="w-6 h-6 text-white" />
                </div>
              </button>
              <div className="mt-4 w-10 h-10 rounded-lg overflow-hidden border-2 border-white/50 animate-[spin_5s_linear_infinite] shadow-xl">
                <img src={reel.user_avatar} alt="Audio" className="w-full h-full object-cover" />
              </div>
            </aside>
          </article>
        ))}
      </main>

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
