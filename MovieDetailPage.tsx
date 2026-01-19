
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Star, Lock, ArrowLeft, MessageCircle, User, Bookmark, Calendar, Info, Clock, Languages, Award, Share2, Info as InfoIcon, Image as ImageIcon, ChevronDown, Mic, Send } from 'lucide-react';
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
  onArtistClick?: (userId: string) => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onBack, onPlay, onArtistClick }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'details' | 'comments' | 'gallery'>('episodes');
  const [scrollY, setScrollY] = useState(0);

  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addNotification } = useNotification();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => window.removeEventListener('scroll', handleScroll);
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

      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userProfile) return addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Sharh yozish uchun avval tizimga kiring.' });
      if (!commentText.trim()) return;

      setIsSubmittingReview(true);
      try {
          await addReview(movie.id!, userProfile.id, rating, commentText);
          setCommentText('');
          setRating(5);
          // Refresh reviews
          const revs = await getMovieReviews(movie.id!);
          setReviews(revs);
          addNotification({ type: 'success', title: 'Rahmat!', message: 'Sharhingiz qabul qilindi.' });
      } catch (e) {
          console.error(e);
          addNotification({ type: 'error', title: 'Xatolik', message: 'Sharhni saqlashda xatolik yuz berdi.' });
      } finally {
          setIsSubmittingReview(false);
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
          addNotification({ type: 'warning', title: 'Premium Kerak', message: 'Ushbu animeni ko\'rish uchun obuna bo\'lishingiz shart.' });
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

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 overflow-x-hidden">
        
        {/* PARALLAX HERO SECTION */}
        <div className="relative w-full h-[85vh] md:h-[95vh] overflow-hidden">
            {/* Background Image - Full Coverage */}
            <div 
                className="absolute inset-0 z-0 will-change-transform"
                style={{ 
                    transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0005})`,
                    transition: 'transform 0.1s linear'
                }}
            >
                <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
                {/* Gradient faqat pastdan, tepasi ochiq qoladi rasm ko'rinishi uchun */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
                {/* Tepadagi gradient faqat ikonkalarni ko'rsatish uchun juda yupqa */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
            </div>

            {/* Transparent Header Icons (No Background Frame) */}
            <div className="fixed top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-[100] animate-fade-in">
                <button 
                    onClick={onBack} 
                    className="p-2 text-white hover:text-orange-500 transition-colors active:scale-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                    <ArrowLeft size={28} strokeWidth={2.5} />
                </button>
                <div className="flex gap-4">
                    <button className="p-2 text-white hover:text-orange-500 transition-colors active:scale-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        <Share2 size={26} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={handleToggleSave} 
                        className={`p-2 transition-colors active:scale-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isSaved ? 'text-orange-500' : 'text-white hover:text-orange-500'}`}
                    >
                        <Bookmark size={26} strokeWidth={2.5} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-7xl mx-auto w-full z-10 pb-20">
                <div 
                    className="max-w-4xl space-y-6 animate-fade-in"
                    style={{ transform: `translateY(${scrollY * -0.1}px)` }}
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.6)]">
                            {movie.access_type === 'premium' ? 'PREMIUM' : 'BEPUL'}
                        </span>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                            <Star size={14} className="text-yellow-400 fill-yellow-400"/>
                            <span className="font-bold text-sm text-white">{movie.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white">
                            <span className="uppercase">{movie.quality}</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] drop-shadow-2xl text-white">
                        {movie.title}
                    </h1>
                    
                    <div className="pt-2">
                        <p className="text-gray-200 text-sm md:text-lg leading-relaxed font-medium max-w-3xl line-clamp-4 md:line-clamp-none opacity-90 drop-shadow-lg border-l-4 border-orange-500 pl-5">
                            {movie.plot}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button 
                            onClick={handlePlayClick}
                            className={`h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 border border-white/20 ${canWatch ? 'bg-white text-black hover:bg-gray-200' : 'bg-zinc-800/80 backdrop-blur text-zinc-400 border-zinc-700'}`}
                        >
                            {canWatch ? <><Play fill="currentColor" size={24}/> Tomosha Qilish</> : <><Lock size={20}/> Premium Obuna</>}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Scroll Down Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-50 z-20">
                <ChevronDown size={32} />
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6" ref={contentRef}>
            <div className="flex border-b border-white/5 mb-12 gap-10 overflow-x-auto scrollbar-hide pt-4 sticky top-0 bg-[#050505] z-50">
                {[
                    { id: 'episodes', label: 'Qismlar', icon: <Play size={18}/> },
                    { id: 'details', label: 'Ma\'lumotlar', icon: <InfoIcon size={18}/> },
                    { id: 'gallery', label: 'Galereya', icon: <ImageIcon size={18}/> },
                    { id: 'comments', label: 'Fikrlar', icon: <MessageCircle size={18}/> },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-5 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-200'}`}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 rounded-t-full shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>}
                    </button>
                ))}
            </div>

            <div className="animate-fade-in min-h-[500px]">
                {activeTab === 'episodes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {episodes.length > 0 ? episodes.map((ep, i) => (
                            <div 
                                key={ep.id} 
                                onClick={handlePlayClick}
                                className="group flex items-center justify-between p-6 bg-[#0f0f0f] border border-white/5 hover:border-orange-500/40 transition-all cursor-pointer rounded-2xl hover:translate-y-[-4px] shadow-lg"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center font-black text-zinc-600 group-hover:bg-orange-600 group-hover:text-white transition-all text-sm shadow-inner">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <span className="block font-black text-sm uppercase tracking-wider group-hover:text-orange-500 transition-colors text-white">{ep.title}</span>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">24 min • FULL HD</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                    <Play size={16} fill="currentColor" className="ml-0.5" />
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-32 text-center bg-[#0f0f0f] border border-dashed border-zinc-800 rounded-3xl">
                                <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-sm">Pleyer orqali to'liq tomosha qiling</p>
                                <button onClick={handlePlayClick} className="mt-6 px-10 py-4 bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-orange-700 transition-all rounded-xl shadow-lg">Pleyerni ochish</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Format", val: episodes.length > 0 ? "Serial" : "Film", icon: <Info size={20}/> },
                            { label: "Dublyajchi", val: movie.translator || 'Anilo.uz', icon: <Mic size={20}/>, isArtist: !!movie.translator_id, artistId: movie.translator_id },
                            { label: "Yil", val: movie.year, icon: <Calendar size={20}/> },
                            { label: "Sifat", val: movie.quality, icon: <Award size={20}/> },
                            { label: "Holati", val: movie.status === 'ongoing' ? 'Davomli' : 'Tugallangan', icon: <Clock size={20}/> },
                            { label: "Reyting", val: `${movie.rating}/5.0`, icon: <Star size={20}/> }
                        ].map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => item.isArtist && item.artistId && onArtistClick?.(item.artistId)}
                                className={`bg-[#0f0f0f] p-8 border border-white/5 rounded-3xl group transition-all ${item.isArtist ? 'hover:border-orange-500/50 cursor-pointer scale-105 shadow-xl' : ''}`}
                            >
                                <div className="text-orange-600 mb-4 group-hover:scale-110 transition-transform bg-orange-600/10 w-12 h-12 rounded-full flex items-center justify-center">{item.icon}</div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                                <p className={`font-black text-xl text-white uppercase tracking-tighter ${item.isArtist ? 'text-orange-500' : ''}`}>{item.val}</p>
                                {item.isArtist && <span className="text-[8px] text-blue-400 font-bold mt-2 inline-block">PROFILNI KO'RISH &rarr;</span>}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Other tabs remain same */}
                {activeTab === 'gallery' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
                        <div className="relative group overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
                            <img src={movie.posterUrl} alt="Poster" className="w-full h-auto object-contain bg-zinc-900 transition-transform duration-1000 group-hover:scale-105" />
                        </div>
                        <div className="flex flex-col justify-center space-y-8 p-10 bg-[#0f0f0f] border border-white/5 rounded-3xl">
                            <h4 className="text-3xl font-black uppercase tracking-tighter text-orange-500">{movie.title}</h4>
                            <p className="text-zinc-400 leading-relaxed text-lg">{movie.plot}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'comments' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in">
                        <div className="lg:col-span-5">
                            <div className="bg-[#0f0f0f] p-10 border border-white/5 rounded-[2.5rem] sticky top-32">
                                <h3 className="text-base font-black uppercase tracking-[0.3em] mb-8 text-orange-500">Sharh qoldirish</h3>
                                <form onSubmit={handleReviewSubmit} className="space-y-6">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Baholang</p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button 
                                                    key={s} 
                                                    type="button" 
                                                    onClick={() => setRating(s)}
                                                    className={`p-2 transition-all ${s <= rating ? 'text-yellow-500 scale-110' : 'text-zinc-700 hover:text-zinc-500'}`}
                                                >
                                                    <Star size={24} fill={s <= rating ? 'currentColor' : 'none'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Xabar</label>
                                        <textarea 
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Anime haqida fikringizni yozing..."
                                            className="w-full bg-black border border-white/5 rounded-2xl p-5 h-32 text-sm text-white focus:border-orange-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmittingReview}
                                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isSubmittingReview ? <LoadingSpinner /> : <><Send size={16}/> Sharhni yuborish</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-7 space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-8">Sharhlar ({reviews.length})</h3>
                            {reviews.length === 0 ? (
                                <div className="text-center py-20 bg-[#0f0f0f] border border-dashed border-zinc-800 rounded-[2.5rem]">
                                    <MessageCircle size={48} className="mx-auto text-zinc-800 mb-4" />
                                    <p className="text-zinc-600 font-bold uppercase tracking-widest">Hali sharhlar yo'q. Birinchi bo'ling!</p>
                                </div>
                            ) : (
                                reviews.map((rev) => (
                                    <div key={rev.id} className="bg-[#0f0f0f] border border-white/5 p-8 rounded-[2.5rem] flex gap-6 hover:border-orange-500/20 transition-all">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden flex-shrink-0">
                                            {rev.profiles?.avatar_url ? (
                                                <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-700"><User size={28}/></div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-black text-white text-sm uppercase">{rev.profiles?.full_name || 'Foydalanuvchi'}</p>
                                                    <p className="text-[10px] text-zinc-500 mt-0.5">{new Date(rev.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">
                                                    <Star size={12} fill="currentColor" />
                                                    <span className="text-[10px] font-black">{rev.rating}.0</span>
                                                </div>
                                            </div>
                                            <p className="text-zinc-400 text-sm leading-relaxed">{rev.comment}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {relatedMovies.length > 0 && (
                <section className="mt-32">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-1.5 h-12 bg-orange-600 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.5)]"></div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter">O'xshash Animelar</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {relatedMovies.map(m => (
                            <MovieCard key={m.id} movie={m} isActive={true} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); init(); }} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    </div>
  );
};
