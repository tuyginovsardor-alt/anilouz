import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Search,
  Music, 
  ShieldCheck, 
  MoreHorizontal, 
  Send,
  X,
  Smile,
  ThumbsUp
} from 'lucide-react';
import { UserProfile } from '../types';

interface ReelComment {
  id: string;
  reelId: string;
  userName: string;
  userAvatar: string;
  text: string;
  time: string;
  likes: number;
  isLiked?: boolean;
}

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
  const [activeCommentReelId, setActiveCommentReelId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  
  const [commentsMap, setCommentsMap] = useState<Record<string, ReelComment[]>>({
    '1': [
      {
        id: 'rc-1',
        reelId: '1',
        userName: 'otabek_anime',
        userAvatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop',
        text: 'Juda ajoyib video bo\'libdi! Yangi qismlarni kutib qolamiz 🔥',
        time: '2 soat oldin',
        likes: 24,
        isLiked: false
      },
      {
        id: 'rc-2',
        reelId: '1',
        userName: 'dildora_art',
        userAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop',
        text: 'Ovozlashtirish sifati 10/10, Anilo.uz ga gap yo\'q 👏',
        time: '45 daqiqa oldin',
        likes: 12,
        isLiked: true
      }
    ],
    '2': [
      {
        id: 'rc-3',
        reelId: '2',
        userName: 'shoxrux_coder',
        userAvatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=200&auto=format&fit=crop',
        text: 'Server tezligi zo\'r ishlayapti, 4K da qotmasdan ko\'rsatyapti ⚡',
        time: '15 daqiqa oldin',
        likes: 8,
        isLiked: false
      }
    ]
  });

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

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentInput.trim() || !activeCommentReelId) return;

    const newC: ReelComment = {
      id: 'rc-' + Date.now(),
      reelId: activeCommentReelId,
      userName: user.name || 'Siz (Foydalanuvchi)',
      userAvatar: user.avatar || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop',
      text: commentInput.trim(),
      time: 'Hozirgina',
      likes: 0,
      isLiked: false
    };

    setCommentsMap(prev => ({
      ...prev,
      [activeCommentReelId]: [newC, ...(prev[activeCommentReelId] || [])]
    }));

    setReels(prev => prev.map(r => {
      if (r.id === activeCommentReelId) {
        return { ...r, comments: r.comments + 1 };
      }
      return r;
    }));

    setCommentInput('');
  };

  const toggleCommentLike = (commentId: string) => {
    if (!activeCommentReelId) return;
    setCommentsMap(prev => ({
      ...prev,
      [activeCommentReelId]: (prev[activeCommentReelId] || []).map(c => {
        if (c.id === commentId) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likes: isLiked ? c.likes + 1 : c.likes - 1
          };
        }
        return c;
      })
    }));
  };

  const activeComments = activeCommentReelId ? (commentsMap[activeCommentReelId] || []) : [];

  return (
    <div className="h-full w-full bg-black text-[#dbe3f0] antialiased overflow-hidden flex flex-col relative font-['Plus_Jakarta_Sans']">
      {/* Transparent Top Bar */}
      <header className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 w-full bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <h1 className="text-lg font-bold text-white pointer-events-auto">Reels</h1>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors pointer-events-auto">
          <Search className="w-6 h-6 text-white" />
        </button>
      </header>

      {/* Main Reels Container */}
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
            {/* Video Background */}
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <video 
                src={reel.video_url}
                className="h-full w-full object-cover opacity-80 mix-blend-screen"
                loop
                muted={index !== activeIndex}
                autoPlay={index === activeIndex}
                playsInline
              />
            </div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            
            {/* Content Area (Bottom Left) */}
            <div className="absolute bottom-6 left-4 right-20 flex flex-col gap-2 z-10">
              {/* Author Info */}
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={reel.user_avatar} 
                  alt="Author" 
                  className="w-10 h-10 rounded-full border-2 border-[#ff6b00] object-cover" 
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white flex items-center gap-1">
                    @{reel.user_name} 
                    {reel.is_verified && <ShieldCheck className="w-4 h-4 text-[#ff6b00] fill-current" />}
                  </span>
                  <button className="text-[11px] font-bold text-[#ff6b00] border border-[#ff6b00] rounded px-2 py-0.5 w-fit hover:bg-[#ff6b00]/20 transition-colors">Follow</button>
                </div>
              </div>
              
              {/* Video Description */}
              <p className="text-xs font-normal text-gray-200 line-clamp-2 w-[90%] leading-relaxed">
                {reel.description}
              </p>
              
              {/* Audio Track Info */}
              <div className="flex items-center gap-2 mt-1 bg-black/40 rounded-full px-3 py-1 w-fit backdrop-blur-sm">
                <Music className="w-3.5 h-3.5 text-white fill-current" />
                <div className="overflow-hidden max-w-[150px]">
                  <div className="text-[11px] font-bold text-white whitespace-nowrap animate-marquee">
                    {reel.music_name} • Original Audio
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction Buttons (Right Column) */}
            <aside className="absolute bottom-6 right-2 flex flex-col items-center gap-6 z-10">
              {/* Like */}
              <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-1 group">
                <div className={`p-3 rounded-full backdrop-blur-sm transition-all active:scale-90 ${reel.is_liked ? 'bg-[#ff6b00]/30 text-[#ff6b00]' : 'bg-black/40 text-white hover:bg-white/10'}`}>
                  <Heart className={`w-7 h-7 ${reel.is_liked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow-md">{(reel.likes / 1000).toFixed(1)}K</span>
              </button>

              {/* Comment */}
              <button 
                onClick={() => setActiveCommentReelId(reel.id)}
                className="flex flex-col items-center gap-1 group"
                title="Izoh qoldirish"
              >
                <div className="p-3 bg-black/40 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors active:scale-90">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow-md">{reel.comments}</span>
              </button>

              {/* Share */}
              <button 
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Havola nusxalandi!');
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 bg-black/40 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors active:scale-90">
                  <Send className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow-md">Share</span>
              </button>

              {/* More options */}
              <button className="flex flex-col items-center gap-1 group mt-2">
                <div className="p-2 bg-black/40 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <MoreHorizontal className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Audio Record Thumbnail */}
              <div className="mt-4 w-10 h-10 rounded-lg overflow-hidden border-2 border-white/50 animate-[spin_4s_linear_infinite] shadow-xl">
                <img src={reel.user_avatar} alt="Audio" className="w-full h-full object-cover" />
              </div>
            </aside>
          </article>
        ))}
      </main>

      {/* Interactive Reels Comment Modal / Drawer */}
      {activeCommentReelId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full sm:max-w-lg bg-[#141c25] border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[85vh] sm:max-h-[75vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#182029]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#ff6b00]" />
                <h3 className="font-bold text-white text-base">Izohlar ({activeComments.length})</h3>
              </div>
              <button 
                onClick={() => setActiveCommentReelId(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
              {activeComments.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Hali izohlar yo'q. Birinchi bo'lib fikringizni bildiring!
                </div>
              ) : (
                activeComments.map(c => (
                  <div key={c.id} className="flex gap-3 items-start">
                    <img 
                      src={c.userAvatar} 
                      alt={c.userName} 
                      className="w-8 h-8 rounded-full object-cover border border-white/10 mt-1 shrink-0" 
                    />
                    <div className="flex-1 bg-[#182029] p-3 rounded-2xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">@{c.userName}</span>
                        <span className="text-[10px] text-gray-400">{c.time}</span>
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed">{c.text}</p>
                    </div>
                    <button 
                      onClick={() => toggleCommentLike(c.id)}
                      className={`flex flex-col items-center gap-0.5 p-1 transition ${c.isLiked ? 'text-[#ff6b00]' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Heart className={`w-4 h-4 ${c.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-[10px] font-bold">{c.likes}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="p-3 bg-[#182029] border-t border-white/10 flex items-center gap-2">
              <input 
                type="text" 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Fikringizni qoldiring..." 
                className="flex-1 bg-[#141c25] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#ff6b00]"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!commentInput.trim()}
                className="p-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ff8533] text-black font-bold disabled:opacity-40 transition active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
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

