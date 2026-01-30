
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Star, Lock, ArrowLeft, MessageSquare, User, Bookmark, Share2, ChevronDown, Mic, Send, Trash2, Edit2, Reply, Info, Calendar, Globe, Layers, Clock, CheckCircle, Eye, TrendingUp, XCircle, CornerUpLeft } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getMovieEpisodes, getMovieReviews, addReview, deleteReview, updateReview, getMovies, isMovieSaved, toggleSaveMovie, getUserIdByUsername, createNotification } from './services/dbService';
import { Movie, UserProfile, Episode } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { MovieCard } from './components/MovieCard';
import { VerifiedBadge } from './components/VerifiedBadge';

interface MovieDetailPageProps {
  movie: Movie;
  onBack: () => void;
  onPlay: () => void;
  onEpisodePlay?: (episode: Episode) => void;
  onArtistClick?: (userId: string) => void;
  onMovieClick?: (movie: Movie) => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onBack, onPlay, onEpisodePlay, onArtistClick, onMovieClick }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'info' | 'comments'>('episodes');
  const [scrollY, setScrollY] = useState(0);

  // Comment State
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [replyToComment, setReplyToComment] = useState<any | null>(null);

  const { addNotification } = useNotification();
  const contentRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    document.title = `${movie.title} - Anilo.uz`;
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.title = "Anilo.uz | Anime Olami";
    };
  }, [movie.id, movie.title]);

  useEffect(() => {
      if (activeTab === 'comments') {
          scrollToBottom();
      }
  }, [activeTab, reviews]);

  const scrollToBottom = () => {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const init = async () => {
      setIsLoading(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const profile = await getUserProfile(user.id);
              setUserProfile(profile as UserProfile);
              const saved = await isMovieSaved(user.id, movie.id!);
              setIsSaved(saved);
          }
          
          const [eps, revs, allMovies] = await Promise.all([
              getMovieEpisodes(movie.id!),
              getMovieReviews(movie.id!),
              getMovies()
          ]);
          
          setEpisodes(eps);
          setReviews(revs);
          
          const genres = movie.genre.split(',').map(g => g.trim());
          const related = allMovies.filter(m => 
              m.id !== movie.id && 
              m.genre.split(',').some(g => genres.includes(g.trim()))
          ).slice(0, 12);
          setRelatedMovies(related);

      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  };

  const isPremiumUser = useMemo(() => {
      if (!userProfile) return false;
      const hasSubscription = userProfile.subscription_end_at && new Date(userProfile.subscription_end_at) > new Date();
      return !!(hasSubscription || ['admin', 'owner', 'manager'].includes(userProfile.role));
  }, [userProfile]);

  const canWatch = movie.access_type === 'free' || isPremiumUser;
  const viewCount = (movie as any).view_count || Math.floor(Math.random() * 5000) + 1000;

  // --- ACTIONS ---

  const handleReviewSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userProfile) return addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Fikr bildirish uchun tizimga kiring.' });
      if (!commentText.trim()) return;

      setIsSubmittingReview(true);
      try {
          // Extract mentions and send notifications
          const mentionPattern = /@(\w+)/g;
          let match;
          while ((match = mentionPattern.exec(commentText)) !== null) {
              const mentionedUsername = match[1];
              const mentionedUserId = await getUserIdByUsername(mentionedUsername);
              if (mentionedUserId && mentionedUserId !== userProfile.id) {
                  await createNotification(
                      mentionedUserId, 
                      "Atmetka qilindingiz!", 
                      `@${userProfile.username} sizni "${movie.title}" sharhlarida atmetka qildi.`,
                      'info'
                  );
              }
          }

          if (editingReviewId) {
              await updateReview(editingReviewId, commentText);
              setEditingReviewId(null);
              addNotification({ type: 'success', title: 'Yangilandi', message: 'Sharhingiz o\'zgartirildi.' });
          } else {
              await addReview(movie.id!, userProfile.id, rating, commentText, replyToComment?.id);
              
              // Reply notification
              if (replyToComment && replyToComment.user_id !== userProfile.id) {
                  await createNotification(
                      replyToComment.user_id,
                      "Xabaringizga javob berishdi",
                      `@${userProfile.username} "${movie.title}" dagi fikringizga javob berdi.`,
                      'success'
                  );
              }
          }
          
          setCommentText('');
          setReplyToComment(null);
          const revs = await getMovieReviews(movie.id!);
          setReviews(revs);
          scrollToBottom();
      } catch (e: any) {
          addNotification({ type: 'error', title: 'Xatolik', message: e.message });
      } finally {
          setIsSubmittingReview(false);
      }
  };

  const handleReply = (comment: any) => {
      setReplyToComment(comment);
      commentInputRef.current?.focus();
  };

  const renderCommentWithMentions = (text: string) => {
      const parts = text.split(/(@\w+)/g);
      return parts.map((part, i) => {
          if (part.startsWith('@')) {
              return <span key={i} className="text-blue-400 font-black hover:underline cursor-pointer">{part}</span>;
          }
          return part;
      });
  };

  const handleToggleSave = async () => {
      if (!userProfile) return addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Saqlash uchun tizimga kiring.' });
      try {
          const savedStatus = await toggleSaveMovie(userProfile.id, movie.id!);
          setIsSaved(savedStatus);
          addNotification({ type: 'success', title: savedStatus ? 'Saqlandi' : 'O\'chirildi', message: savedStatus ? 'Saqlanganlarga qo\'shildi.' : 'Olib tashlandi.' });
      } catch (e) { console.error(e); }
  };

  const isAdminOrOwner = ['admin', 'owner'].includes(userProfile?.role || '');

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 overflow-x-hidden font-sans">
        
        {/* HERO HEADER */}
        <div className="relative w-full h-[80vh] lg:h-[85vh] overflow-hidden">
            <div 
                className="absolute inset-0 z-0"
                style={{ 
                    transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0005})`,
                    transition: 'transform 0.1s linear'
                }}
            >
                <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            </div>

            <div className="absolute top-0 left-0 right-0 pt-12 md:pt-8 px-4 md:px-8 flex justify-between items-center z-[100] animate-fade-in">
                <button onClick={onBack} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-lg">
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <div className="flex gap-3">
                    <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-lg">
                        <Share2 size={24} />
                    </button>
                    <button 
                        onClick={handleToggleSave} 
                        className={`p-3 backdrop-blur-md rounded-full transition-all active:scale-90 border border-white/10 shadow-lg ${isSaved ? 'bg-orange-600 text-white border-orange-500 shadow-orange-500/50' : 'bg-black/40 text-white hover:bg-white/20'}`}
                    >
                        <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-7xl mx-auto w-full z-10 pb-20">
                <div className="max-w-3xl space-y-6 animate-slide-in-up">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest shadow-lg ${movie.access_type === 'premium' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' : 'bg-gradient-to-r from-green-600 to-teal-600 text-white'}`}>
                            {movie.access_type === 'premium' ? 'PREMIUM' : 'BEPUL'}
                        </span>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg">
                            <Star size={14} className="text-yellow-400 fill-yellow-400"/>
                            <span className="font-bold text-sm">{movie.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg">
                            <Eye size={14} className="text-blue-400"/>
                            <span className="font-bold text-sm">{viewCount.toLocaleString()}</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400">
                        {movie.title}
                    </h1>
                    
                    <div className="flex flex-wrap gap-2">
                        {movie.genre.split(',').slice(0, 3).map((g, i) => (
                            <span key={i} className="text-[10px] uppercase font-bold tracking-widest text-blue-200 border border-blue-500/30 bg-blue-900/20 px-3 py-1 rounded-full">{g.trim()}</span>
                        ))}
                    </div>

                    <p className="text-gray-200 text-sm md:text-lg leading-relaxed font-medium line-clamp-3 md:line-clamp-4 drop-shadow-md border-l-2 border-orange-500 pl-4">
                        {movie.plot}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                            onClick={() => { if(canWatch) onPlay(); else addNotification({type:'warning', title:'Premium Kerak', message:'Obuna bo\'ling.'}) }}
                            className={`h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 border-2 ${canWatch ? 'bg-white text-black border-white hover:bg-zinc-200' : 'bg-black/60 backdrop-blur text-white border-white/30'}`}
                        >
                            {canWatch ? <><Play fill="currentColor" size={20}/> Tomosha Qilish</> : <><Lock size={20}/> Premium Obuna</>}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-50 z-20">
                <ChevronDown size={32} />
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-30" ref={contentRef}>
            
            {/* TABS SELECTOR */}
            <div className="flex justify-center mb-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-1.5 rounded-full w-full max-w-lg shadow-2xl">
                    <div className="grid grid-cols-3 relative">
                        <div 
                            className={`absolute top-0 bottom-0 bg-white rounded-full transition-all duration-300 shadow-lg`}
                            style={{ 
                                left: activeTab === 'episodes' ? '0%' : activeTab === 'info' ? '33.33%' : '66.66%',
                                width: '33.33%'
                            }}
                        ></div>

                        <button onClick={() => setActiveTab('episodes')} className={`relative z-10 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'episodes' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
                            <Play size={14} fill={activeTab==='episodes' ? 'currentColor' : 'none'}/> <span>Kino</span>
                        </button>
                        
                        <button onClick={() => setActiveTab('info')} className={`relative z-10 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'info' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
                            <Info size={14} fill={activeTab==='info' ? 'currentColor' : 'none'}/> <span>Info</span>
                        </button>

                        <button onClick={() => setActiveTab('comments')} className={`relative z-10 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'comments' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
                            <MessageSquare size={14} fill={activeTab==='comments' ? 'currentColor' : 'none'}/> <span>Sharh</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="animate-fade-in min-h-[500px]">
                {/* --- 1. KINO (EPISODES) BO'LIMI --- */}
                {activeTab === 'episodes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-in-up">
                        {episodes.length > 0 ? episodes.map((ep, i) => (
                            <div key={ep.id} onClick={() => { if(canWatch) onEpisodePlay?.(ep); else addNotification({type:'warning', title:'Premium Kerak', message:'Obuna bo\'ling.'}) }} className="group flex items-center p-4 bg-[#0d0d0d] border border-white/5 hover:border-orange-500/50 transition-all cursor-pointer rounded-2xl hover:bg-zinc-900 shadow-xl">
                                <div className="relative w-36 h-20 bg-black rounded-xl overflow-hidden flex-shrink-0 mr-4">
                                    <img src={movie.posterUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt=""/>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors shadow-lg border border-white/10">
                                            <Play size={14} fill="white" className="text-white ml-0.5"/>
                                        </div>
                                    </div>
                                    <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase tracking-tighter">HD</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-black text-sm truncate group-hover:text-orange-500 transition-colors uppercase tracking-tight">{ep.title}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded border border-white/5">{i + 1}-QISM</span>
                                        <span className="text-[9px] text-green-500 font-black uppercase">{movie.status === 'ongoing' ? 'Yangilandi' : 'Tayyor'}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-24 text-center bg-[#0d0d0d] border border-dashed border-zinc-800 rounded-[3rem]">
                                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700"> <Film size={40}/> </div>
                                <p className="text-zinc-500 uppercase font-black text-xs tracking-[0.3em] mb-6">Qismlar hali yuklanmagan</p>
                                <button onClick={() => onPlay()} className="px-12 py-4 bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all rounded-2xl shadow-2xl active:scale-95">Kinoni ko'rish</button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- 2. INFO (DETAILS) BO'LIMI --- */}
                {activeTab === 'info' && (
                    <div className="max-w-4xl mx-auto space-y-10 animate-slide-in-up">
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px]"></div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6 pl-4 border-l-4 border-orange-600 flex items-center gap-3"> <TrendingUp size={20} className="text-orange-500"/> Syujet va Mazmuni</h3>
                            <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap font-medium">{movie.plot}</p>
                            
                            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar size={10}/> Yili</p>
                                    <p className="text-sm font-black text-white">{movie.year}</p>
                                </div>
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Globe size={10}/> Tili</p>
                                    <p className="text-sm font-black text-white">{movie.language}</p>
                                </div>
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Zap size={10}/> Sifati</p>
                                    <p className="text-sm font-black text-white">{movie.quality}</p>
                                </div>
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Layers size={10}/> Janri</p>
                                    <p className="text-sm font-black text-white truncate">{movie.genre.split(',')[0]}</p>
                                </div>
                            </div>
                        </div>

                        {relatedMovies.length > 0 && (
                            <div className="space-y-8">
                                <h3 className="text-xl font-black uppercase tracking-widest text-white px-4">O'xshash Animelar</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                    {relatedMovies.map(rm => (
                                        <div key={rm.id} className="scale-90 hover:scale-100 transition-transform">
                                            <MovieCard movie={rm} isActive={true} onClick={() => onMovieClick?.(rm)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- 3. SHARH (TELEGRAM STYLE CHAT) BO'LIMI --- */}
                {activeTab === 'comments' && (
                    <div className="max-w-3xl mx-auto flex flex-col h-[75vh] bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 shadow-3xl overflow-hidden relative animate-slide-in-up">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar pb-36">
                            {reviews.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-800">
                                    <MessageSquare size={56} className="mb-6 opacity-10"/>
                                    <p className="font-black uppercase tracking-[0.4em] text-[10px]">Suhbatni boshlang...</p>
                                </div>
                            ) : (
                                reviews.map((rev) => {
                                    const isMe = userProfile?.id === rev.user_id;
                                    const isAdminComment = ['admin', 'owner'].includes(rev.profiles?.role);
                                    const isReply = !!rev.parent_id;

                                    return (
                                        <div key={rev.id} id={`comment-${rev.id}`} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="flex-shrink-0 mt-1">
                                                <div className={`w-11 h-11 rounded-[1rem] overflow-hidden border-2 transition-all ${isAdminComment ? 'border-red-600 shadow-xl shadow-red-900/20 scale-105' : 'border-zinc-800'}`}>
                                                    {rev.profiles?.avatar_url ? <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : <User size={22} className="w-full h-full p-2 bg-zinc-900 text-zinc-600"/>}
                                                </div>
                                            </div>
                                            <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 mb-1.5 px-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isAdminComment ? 'text-red-600' : 'text-zinc-500'}`}>
                                                        {rev.profiles?.username || 'user'}
                                                    </span>
                                                    {isAdminComment && <VerifiedBadge type="gold" className="w-3.5 h-3.5" />}
                                                </div>

                                                <div className={`p-4 rounded-[1.8rem] shadow-2xl relative transition-all group/bubble ${isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-[#1a1a1a] text-zinc-200 rounded-tl-none border border-white/5'}`}>
                                                    
                                                    {/* Reply Quote UI */}
                                                    {isReply && (
                                                        <div 
                                                            onClick={() => document.getElementById(`comment-${rev.parent_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                            className={`mb-3 p-3 rounded-2xl border-l-4 cursor-pointer hover:bg-black/20 transition-all ${isMe ? 'bg-orange-700/50 border-orange-300' : 'bg-black/30 border-orange-600'}`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <CornerUpLeft size={10} className="text-orange-400" />
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">@{rev.parent?.profiles?.username}</p>
                                                            </div>
                                                            <p className="text-[11px] line-clamp-2 opacity-60 italic leading-snug">{rev.parent?.comment}</p>
                                                        </div>
                                                    )}

                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                                        {renderCommentWithMentions(rev.comment)}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between gap-6 mt-3 pt-2 border-t border-black/5">
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={8} className={i < rev.rating ? (isMe ? "text-orange-200 fill-orange-200" : "text-yellow-500 fill-yellow-500") : "opacity-10"} />
                                                            ))}
                                                        </div>
                                                        <span className={`text-[8px] font-mono opacity-40 font-bold`}>{new Date(rev.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-2 px-4 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                                                    <button onClick={() => handleReply(rev)} className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"> <Reply size={12} className="-scale-x-100"/> Javob</button>
                                                    {(isAdminOrOwner || isMe) && <button onClick={() => { if(confirm("O'chirilsinmi?")) deleteReview(rev.id).then(init); }} className="text-[9px] font-black text-red-900/60 hover:text-red-500 uppercase tracking-widest transition-colors">O'chirish</button>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={commentsEndRef} />
                        </div>

                        {/* Sticky Bottom Chat Input */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent">
                            <form onSubmit={handleReviewSubmit} className="max-w-2xl mx-auto flex flex-col bg-[#121212] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden focus-within:border-orange-500/50 transition-all">
                                
                                {/* Reply Preview (Telegram style bar) */}
                                {replyToComment && (
                                    <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5 animate-fade-in">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-1 h-10 bg-orange-600 rounded-full flex-shrink-0 shadow-[0_0_15px_rgba(234,88,12,0.5)]"></div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2"> <Reply size={12} className="-scale-x-100"/> Javob berilmoqda: @{replyToComment.profiles?.username}</p>
                                                <p className="text-xs text-zinc-500 truncate italic font-medium mt-0.5">{replyToComment.comment}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setReplyToComment(null)} className="p-2.5 text-zinc-600 hover:text-white transition-colors bg-white/5 rounded-full">
                                            <XCircle size={20} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-end gap-3 p-4">
                                    <div className="flex-1 relative flex items-center">
                                        <textarea 
                                            ref={commentInputRef}
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Chatga yozing..."
                                            className="w-full bg-transparent border-none text-sm text-white focus:ring-0 outline-none resize-none max-h-40 py-3 px-2 custom-scrollbar font-medium"
                                            rows={1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReviewSubmit(e as any);
                                                }
                                            }}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isSubmittingReview || !commentText.trim()}
                                        className="w-14 h-14 bg-orange-600 text-white rounded-[1.3rem] flex items-center justify-center hover:bg-orange-500 transition-all active:scale-90 disabled:opacity-50 shadow-2xl shadow-orange-900/30 shrink-0"
                                    >
                                        {isSubmittingReview ? <LoadingSpinner /> : <Send size={24} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
