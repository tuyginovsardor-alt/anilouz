
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
    
    document.title = `${movie.title} - O'zbek tilida sifatli ko'rish | Anilo.uz`;
    
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
          const mentionPattern = /@(\w+)/g;
          let match;
          while ((match = mentionPattern.exec(commentText)) !== null) {
              const mentionedUsername = match[1];
              const mentionedUserId = await getUserIdByUsername(mentionedUsername);
              if (mentionedUserId && mentionedUserId !== userProfile.id) {
                  await createNotification(
                      mentionedUserId, 
                      "Sizni atmetka qilishdi!", 
                      `@${userProfile.username} sizni "${movie.title}" anime sharhlarida atmetka qildi.`,
                      'promo'
                  );
              }
          }

          if (editingReviewId) {
              await updateReview(editingReviewId, commentText);
              setEditingReviewId(null);
              addNotification({ type: 'success', title: 'Yangilandi', message: 'Sharhingiz o\'zgartirildi.' });
          } else {
              await addReview(movie.id!, userProfile.id, rating, commentText, replyToComment?.id);
              
              if (replyToComment && replyToComment.user_id !== userProfile.id) {
                  await createNotification(
                      replyToComment.user_id,
                      "Xabaringizga javob berishdi",
                      `@${userProfile.username} sizning "${movie.title}" animesidagi fikringizga javob berdi.`,
                      'info'
                  );
              }
          }
          setCommentText('');
          setReplyToComment(null);
          setRating(5);
          const revs = await getMovieReviews(movie.id!);
          setReviews(revs);
          scrollToBottom();
      } catch (e: any) {
          addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Jarayonda xatolik yuz berdi.' });
      } finally {
          setIsSubmittingReview(false);
      }
  };

  const handleDeleteReview = async (id: number) => {
      if(!window.confirm("O'chirmoqchimisiz?")) return;
      try {
          await deleteReview(id);
          setReviews(prev => prev.filter(r => r.id !== id));
          addNotification({ type: 'success', title: 'O\'chirildi', message: 'Sharh o\'chirildi.' });
      } catch (e) {
          addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik.' });
      }
  };

  const handleReply = (comment: any) => {
      setReplyToComment({
          id: comment.id,
          username: comment.profiles?.username || 'user',
          text: comment.comment,
          user_id: comment.user_id
      });
      commentInputRef.current?.focus();
  };

  const renderCommentText = (text: string) => {
      const parts = text.split(/(@\w+)/g);
      return parts.map((part, i) => {
          if (part.startsWith('@')) {
              return <span key={i} className="text-blue-400 font-bold hover:underline cursor-pointer">{part}</span>;
          }
          return part;
      });
  };

  const handlePlayClick = () => {
      if (!canWatch) {
          addNotification({ type: 'warning', title: 'Premium Kerak', message: 'Tomosha qilish uchun obuna bo\'ling.' });
          return;
      }
      if (episodes.length > 0 && onEpisodePlay) onEpisodePlay(episodes[0]);
      else onPlay();
  };

  const handleEpisodeClick = (episode: Episode) => {
      if (!canWatch) {
          addNotification({ type: 'warning', title: 'Premium Kerak', message: 'Tomosha qilish uchun obuna bo\'ling.' });
          return;
      }
      if (onEpisodePlay) onEpisodePlay(episode);
      else onPlay();
  };

  const handleToggleSave = async () => {
      if (!userProfile) return addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Saqlash uchun tizimga kiring.' });
      try {
          const savedStatus = await toggleSaveMovie(userProfile.id, movie.id!);
          setIsSaved(savedStatus);
          addNotification({ type: 'success', title: savedStatus ? 'Saqlandi' : 'O\'chirildi', message: savedStatus ? 'Saqlanganlarga qo\'shildi.' : 'Saqlanganlardan olib tashlandi.' });
      } catch (e) { console.error(e); }
  };

  const isAdminOrOwner = ['admin', 'owner'].includes(userProfile?.role || '');

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 overflow-x-hidden font-sans">
        
        {/* HERO HEADER */}
        <div className="relative w-full h-[85vh] lg:h-[90vh] overflow-hidden">
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
                            onClick={handlePlayClick}
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
                            <Play size={14} fill={activeTab==='episodes' ? 'currentColor' : 'none'}/> <span>Qismlar</span>
                        </button>
                        
                        <button onClick={() => setActiveTab('info')} className={`relative z-10 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'info' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
                            <Info size={14} fill={activeTab==='info' ? 'currentColor' : 'none'}/> <span>Info</span>
                        </button>

                        <button onClick={() => setActiveTab('comments')} className={`relative z-10 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'comments' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
                            <MessageSquare size={14} fill={activeTab==='comments' ? 'currentColor' : 'none'}/> <span>Chat</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="animate-fade-in min-h-[400px]">
                {activeTab === 'episodes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-in-up">
                        {episodes.length > 0 ? episodes.map((ep, i) => (
                            <div key={ep.id} onClick={() => handleEpisodeClick(ep)} className="group flex items-center p-3 bg-zinc-900/80 border border-white/5 hover:border-orange-500/50 transition-all cursor-pointer rounded-2xl hover:bg-zinc-800">
                                <div className="relative w-28 h-16 sm:w-32 sm:h-20 bg-black rounded-xl overflow-hidden flex-shrink-0 mr-4">
                                    <img src={movie.posterUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" alt=""/>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                                            <Play size={12} fill="white" className="text-white ml-0.5"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold text-sm truncate group-hover:text-orange-500 transition-colors">{ep.title}</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{i + 1}-QISM</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                                <button onClick={handlePlayClick} className="mt-4 px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all rounded-xl shadow-lg">Kinoni ochish</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-slide-in-up">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-6 md:p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4 pl-2 border-l-4 border-orange-500">Syujet</h3>
                            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">{movie.plot}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'comments' && (
                    <div className="max-w-3xl mx-auto flex flex-col h-[75vh] bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden relative animate-slide-in-up">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
                            {reviews.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                                    <MessageSquare size={48} className="mb-4 opacity-20"/>
                                    <p className="font-black uppercase tracking-widest text-xs">Suhbatni boshlang...</p>
                                </div>
                            ) : (
                                reviews.map((rev) => {
                                    const isMe = userProfile?.id === rev.user_id;
                                    const isAdminComment = ['admin', 'owner'].includes(rev.profiles?.role);
                                    const isReply = !!rev.parent_id;

                                    return (
                                        <div key={rev.id} id={`comment-${rev.id}`} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="flex-shrink-0 mt-1">
                                                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${isAdminComment ? 'border-red-500' : 'border-zinc-800 shadow-lg'}`}>
                                                    {rev.profiles?.avatar_url ? <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : <User size={20} className="w-full h-full p-2 bg-zinc-900 text-zinc-600"/>}
                                                </div>
                                            </div>
                                            <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 mb-1 px-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isAdminComment ? 'text-red-500' : 'text-zinc-500'}`}>
                                                        {rev.profiles?.username || 'user'}
                                                    </span>
                                                    {isAdminComment && <VerifiedBadge type="gold" className="w-3 h-3" />}
                                                </div>

                                                <div className={`p-4 rounded-[1.8rem] shadow-xl relative transition-all active:scale-[0.98] ${isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5'}`}>
                                                    {isReply && (
                                                        <div 
                                                            onClick={() => document.getElementById(`comment-${rev.parent_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                            className={`mb-3 p-3 rounded-2xl border-l-4 cursor-pointer hover:bg-black/20 transition-colors ${isMe ? 'bg-orange-700/50 border-orange-400' : 'bg-black/20 border-orange-500'}`}
                                                        >
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-0.5">@{rev.parent?.profiles?.username}</p>
                                                            <p className="text-[11px] line-clamp-2 opacity-70 italic leading-tight">{rev.parent?.comment}</p>
                                                        </div>
                                                    )}

                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {renderCommentText(rev.comment)}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between gap-4 mt-2">
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={8} className={i < rev.rating ? (isMe ? "text-orange-200 fill-orange-200" : "text-yellow-500 fill-yellow-500") : "opacity-20"} />
                                                            ))}
                                                        </div>
                                                        <span className={`text-[8px] font-mono opacity-40`}>{new Date(rev.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-1.5 px-3">
                                                    <button onClick={() => handleReply(rev)} className="flex items-center gap-1 text-[9px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors"> <CornerUpLeft size={10}/> Javob</button>
                                                    {(isAdminOrOwner || isMe) && <button onClick={() => handleDeleteReview(rev.id)} className="text-[9px] font-black text-red-900/50 hover:text-red-500 uppercase tracking-widest transition-colors">O'chirish</button>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={commentsEndRef} />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
                            <form onSubmit={handleReviewSubmit} className="max-w-2xl mx-auto flex flex-col bg-[#121212] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
                                {replyToComment && (
                                    <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/5 animate-fade-in">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-1 h-8 bg-orange-500 rounded-full flex-shrink-0"></div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Javob qaytarilmoqda: @{replyToComment.username}</p>
                                                <p className="text-xs text-zinc-500 truncate italic">{replyToComment.text}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setReplyToComment(null)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-end gap-2 p-3">
                                    <textarea 
                                        ref={commentInputRef}
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder="Xabar yozing..."
                                        className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 outline-none resize-none max-h-32 py-3 px-3 custom-scrollbar"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReviewSubmit(e as any);
                                            }
                                        }}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={isSubmittingReview || !commentText.trim()}
                                        className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all active:scale-90 disabled:opacity-50 shadow-lg shadow-orange-900/30 shrink-0"
                                    >
                                        {isSubmittingReview ? <LoadingSpinner /> : <Send size={20} />}
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
