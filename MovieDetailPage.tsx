import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Star, Lock, ArrowLeft, MessageCircle, Send, User, Bookmark, Calendar, Info, Clock, Languages, Award, ChevronLeft, ChevronRight, Share2, Info as InfoIcon } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getMovieEpisodes, getMovieReviews, addReview, getMovies, isMovieSaved, toggleSaveMovie } from './services/dbService';
import { Movie, UserProfile, Episode } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { MovieCard } from './components/MovieCard';

interface MovieDetailPageProps {
  movie: Movie;
  onBack: () => void;
  onPlay: () => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onBack, onPlay }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'details' | 'comments'>('episodes');
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addNotification } = useNotification();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [movie.id]);

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

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const isPremiumUser = useMemo(() => {
      if (!userProfile) return false;
      const hasSubscription = userProfile.subscription_end_at && new Date(userProfile.subscription_end_at) > new Date();
      return !!(hasSubscription || ['admin', 'owner', 'manager'].includes(userProfile.role));
  }, [userProfile]);

  const canWatch = movie.access_type === 'free' || isPremiumUser;

  const handlePlayClick = () => {
      if (!canWatch) {
          addNotification({ type: 'warning', title: 'Premium Kerak', message: 'Ushbu animeni ko\'rish uchun Premium obuna bo\'lishingiz shart.' });
          return;
      }
      onPlay();
  };

  const handleToggleSave = async () => {
      if (!userProfile) return addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Saqlash uchun tizimga kiring.' });
      try {
          const savedStatus = await toggleSaveMovie(userProfile.id, movie.id!);
          setIsSaved(savedStatus);
          addNotification({ 
              type: 'success', 
              title: savedStatus ? 'Saqlandi' : 'O\'chirildi', 
              message: savedStatus ? 'Anime saqlanganlar ro\'yxatiga qo\'shildi.' : 'Anime ro\'yxatdan olib tashlandi.' 
          });
      } catch (e) { console.error(e); }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userProfile) return addNotification({ type: 'error', title: 'Xatolik', message: 'Sharh qoldirish uchun tizimga kiring.' });
      if (!comment.trim()) return;
      setIsSubmitting(true);
      try {
          await addReview(movie.id!, userProfile.id, rating, comment);
          addNotification({ type: 'success', title: 'Rahmat!', message: 'Sharhingiz qabul qilindi.' });
          setComment('');
          const updatedRevs = await getMovieReviews(movie.id!);
          setReviews(updatedRevs);
      } catch (e) {
          addNotification({ type: 'error', title: 'Xatolik', message: 'Sharh yuborishda xatolik.' });
      } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32">
        
        {/* HERO SECTION - PROFESSIONAL CINEMATIC LAYOUT */}
        <div className="relative w-full h-[65vh] md:h-[85vh] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
                {/* Dark Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/20 to-transparent"></div>
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Top Bar Navigation */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center z-50">
                <button onClick={onBack} className="p-3 bg-black hover:bg-zinc-800 rounded-full border border-white/10 transition-all active:scale-90 shadow-xl">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex gap-3">
                    <button onClick={() => {}} className="p-3 bg-black hover:bg-zinc-800 rounded-full border border-white/10 transition-all active:scale-90">
                        <Share2 size={24} />
                    </button>
                    <button onClick={handleToggleSave} className={`p-3 rounded-full border transition-all active:scale-90 shadow-xl ${isSaved ? 'bg-orange-600 border-orange-500' : 'bg-black border-white/10 hover:bg-zinc-800'}`}>
                        <Bookmark size={24} fill={isSaved ? 'white' : 'none'} />
                    </button>
                </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-7xl mx-auto w-full">
                <div className="max-w-3xl animate-fade-in space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest">
                            {movie.access_type === 'premium' ? 'PREMIUM' : 'BEPUL'}
                        </span>
                        <div className="flex items-center gap-1 bg-black/60 border border-white/10 px-3 py-1 rounded-sm">
                            <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                            <span className="font-bold text-sm">{movie.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 border border-white/10 px-3 py-1 rounded-sm uppercase tracking-widest bg-black/40">{movie.year}</span>
                        <span className="text-[10px] font-bold text-zinc-400 border border-white/10 px-3 py-1 rounded-sm uppercase tracking-widest bg-black/40">{movie.quality}</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-tight drop-shadow-2xl">
                        {movie.title}
                    </h1>
                    
                    <div className="flex flex-wrap gap-2">
                        {movie.genre.split(',').map(g => (
                            <span key={g} className="text-[11px] font-bold text-orange-500/80 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-sm uppercase tracking-wider">{g.trim()}</span>
                        ))}
                    </div>

                    <p className="text-zinc-300 text-sm md:text-lg leading-relaxed font-medium max-w-2xl line-clamp-3 md:line-clamp-none opacity-90 drop-shadow-lg">
                        {movie.plot}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button 
                            onClick={handlePlayClick}
                            className={`flex-1 sm:flex-none px-12 py-5 rounded-sm font-black uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${canWatch ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            {canWatch ? <><Play fill="currentColor" size={20}/> HOZIR KO'RISH</> : <><Lock size={20}/> FAQAT PREMIUM</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* INTERACTIVE SECTION - TABS FOR BETTER SPACING */}
        <div className="max-w-7xl mx-auto px-6 mt-12">
            
            {/* Tabs Header */}
            <div className="flex border-b border-white/5 mb-10 gap-8">
                {[
                    { id: 'episodes', label: 'Qismlar', icon: <Play size={18}/> },
                    { id: 'details', label: 'Ma\'lumotlar', icon: <InfoIcon size={18}/> },
                    { id: 'comments', label: 'Fikrlar', icon: <MessageCircle size={18}/> },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${activeTab === tab.id ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            <div className="animate-fade-in min-h-[400px]">
                {/* EPISODES LIST */}
                {activeTab === 'episodes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {episodes.length > 0 ? episodes.map((ep, i) => (
                            <div 
                                key={ep.id} 
                                onClick={handlePlayClick}
                                className="group flex items-center justify-between p-5 bg-[#0f0f0f] border border-white/5 hover:border-orange-500/50 transition-all cursor-pointer rounded-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center font-black text-zinc-600 group-hover:bg-orange-600 group-hover:text-white transition-all text-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <span className="block font-bold text-sm uppercase tracking-wide group-hover:text-orange-500 transition-colors">{ep.title}</span>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">24 min • HD</span>
                                    </div>
                                </div>
                                <Play size={16} className="text-zinc-700 group-hover:text-orange-500 transition-colors" />
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center bg-[#0f0f0f] border border-dashed border-zinc-800 rounded-sm">
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">To'liq videoni pleyer orqali ko'ring</p>
                                <button onClick={handlePlayClick} className="mt-4 px-8 py-3 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all">Pleyerni ochish</button>
                            </div>
                        )}
                    </div>
                )}

                {/* DETAILS VIEW */}
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Format", val: episodes.length > 0 ? "Serial" : "Film", icon: <Info size={20}/> },
                            { label: "Tarjimon", val: movie.translator || 'Anilo.uz', icon: <Languages size={20}/> },
                            { label: "Chiqqan yili", val: movie.year, icon: <Calendar size={20}/> },
                            { label: "Sifat", val: movie.quality, icon: <Award size={20}/> },
                            { label: "Holati", val: movie.status === 'ongoing' ? 'Davomli' : 'Tugallangan', icon: <Clock size={20}/> },
                            { label: "Reyting", val: `${movie.rating}/5.0`, icon: <Star size={20}/> }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-[#0f0f0f] p-6 border border-white/5 rounded-sm">
                                <div className="text-orange-500 mb-3">{item.icon}</div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{item.label}</p>
                                <p className="font-bold text-lg text-white">{item.val}</p>
                            </div>
                        ))}
                        <div className="md:col-span-2 lg:col-span-4 bg-[#0f0f0f] p-6 border border-white/5 rounded-sm">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Teglar (Tags)</p>
                            <div className="flex flex-wrap gap-2">
                                {movie.tags?.split(',').map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-zinc-900 text-zinc-400 text-[10px] font-bold uppercase border border-zinc-800 rounded-sm">#{tag.trim()}</span>
                                )) || <span className="text-zinc-600 text-xs italic">Teglar mavjud emas</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* COMMENTS VIEW */}
                {activeTab === 'comments' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-[#0f0f0f] p-8 border border-white/5 rounded-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-6">Fikr bildiring</h3>
                                {userProfile ? (
                                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                                        <div className="flex gap-3">
                                            {[1,2,3,4,5].map(num => (
                                                <button key={num} type="button" onClick={() => setRating(num)} className={`transition-all ${rating >= num ? 'text-yellow-500' : 'text-zinc-800'}`}>
                                                    <Star fill={rating >= num ? 'currentColor' : 'none'} size={24} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            placeholder="Fikringizni yozing..."
                                            className="w-full bg-[#050505] border border-zinc-800 rounded-sm p-4 text-sm focus:border-orange-500 outline-none transition-all h-32 resize-none"
                                        />
                                        <button disabled={isSubmitting || !comment.trim()} className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all disabled:opacity-50">
                                            Yuborish
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center py-6 border border-zinc-800 border-dashed rounded-sm">
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Tizimga kiring</p>
                                        <button className="text-[10px] font-black uppercase tracking-widest text-orange-500">Kirish / Ro'yxatdan o'tish</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-7 space-y-4">
                            {reviews.length === 0 ? (
                                <div className="py-20 text-center bg-[#0f0f0f] border border-white/5 rounded-sm">
                                    <p className="text-zinc-600 italic text-sm">Birinchi bo'lib fikr qoldiring!</p>
                                </div>
                            ) : reviews.map(rev => (
                                <div key={rev.id} className="bg-[#0f0f0f] border border-white/5 p-6 rounded-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                            {rev.profiles?.avatar_url ? <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="m-2.5 text-zinc-600"/>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-black uppercase text-white tracking-wider">{rev.profiles?.full_name || 'Mehmon'}</p>
                                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{new Date(rev.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-0.5 text-yellow-500 mt-0.5">
                                                {Array.from({length: rev.rating}).map((_, i) => <Star key={i} size={8} fill="currentColor"/>)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap pl-14">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RELATED SECTION - PROFESSIONAL GRID */}
            {relatedMovies.length > 0 && (
                <section className="mt-24">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-8 bg-orange-600 rounded-full"></div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">O'xshash Animelar</h3>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {relatedMovies.map(m => (
                            <MovieCard key={m.id} movie={m} isActive={true} onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                init();
                            }} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    </div>
  );
};