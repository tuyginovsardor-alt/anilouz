
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Star, Lock, ArrowLeft, MessageCircle, Send, User, Bookmark, Calendar, Info, Clock, Languages, Award, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [scrollY, setScrollY] = useState(0);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addNotification } = useNotification();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    init();
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
          ).slice(0, 15);
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

  const scrollCarousel = (direction: 'left' | 'right') => {
      if (carouselRef.current) {
          const { scrollLeft, clientWidth } = carouselRef.current;
          const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
          carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

  return (
    <div className="relative bg-[#0a0a0c] min-h-screen text-white">
        
        {/* PARALLAX HERO SECTION */}
        <div className="relative h-[80vh] md:h-[100vh] w-full overflow-hidden">
            {/* Background Image with Parallax & Blur */}
            <div 
                className="absolute inset-0 transition-transform duration-200"
                style={{ 
                    transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0005})`,
                    filter: `blur(${Math.min(scrollY * 0.05, 10)}px)`
                }}
            >
                <img src={movie.posterUrl} alt="" className="w-full h-full object-cover opacity-60" />
            </div>
            
            {/* Cinematic Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-transparent"></div>
            
            {/* Navigation Buttons */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                <button onClick={onBack} className="p-4 bg-black/40 hover:bg-orange-600 rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-90 shadow-2xl">
                    <ArrowLeft size={24} />
                </button>
                <button onClick={handleToggleSave} className={`p-4 rounded-full backdrop-blur-xl border transition-all active:scale-90 shadow-2xl ${isSaved ? 'bg-orange-600 border-orange-500' : 'bg-black/40 border-white/10 hover:bg-white/10'}`}>
                    <Bookmark size={24} fill={isSaved ? 'white' : 'none'} />
                </button>
            </div>

            {/* Movie Info Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-20 max-w-7xl mx-auto w-full z-20">
                <div className="space-y-8 max-w-4xl animate-fade-in">
                    <div className="flex flex-wrap items-center gap-4">
                        {movie.access_type === 'premium' ? (
                            <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[11px] font-black px-6 py-2 rounded-full tracking-widest uppercase shadow-xl shadow-yellow-500/20">PREMIUM</span>
                        ) : (
                            <span className="bg-green-600/20 border border-green-500/30 text-green-400 text-[11px] font-black px-6 py-2 rounded-full tracking-widest uppercase">BEPUL</span>
                        )}
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <Star size={16} className="text-yellow-500 fill-yellow-500"/>
                            <span className="font-black text-sm">{movie.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{movie.quality}</span>
                    </div>

                    <h1 className="text-5xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">{movie.title}</h1>
                    
                    <div className="flex flex-wrap gap-2">
                        {movie.genre.split(',').map(g => (
                            <span key={g} className="text-[10px] font-black text-gray-400 border border-white/10 px-4 py-2 rounded-xl bg-white/5 uppercase tracking-widest">{g.trim()}</span>
                        ))}
                    </div>

                    <p className="text-gray-300 max-w-3xl text-sm md:text-xl leading-relaxed font-medium opacity-90 border-l-4 border-orange-600 pl-6 drop-shadow-lg">
                        {movie.plot}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-5 pt-4">
                        <button 
                            onClick={handlePlayClick}
                            className={`px-14 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[12px] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${canWatch ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {canWatch ? <><Play fill="currentColor" size={24}/> HOZIR KO'RISH</> : <><Lock size={24}/> FAQAT PREMIUM</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div className="relative z-30 max-w-7xl mx-auto px-6 -mt-20 md:-mt-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                
                {/* EPISODES (LEFT) */}
                <div className="lg:col-span-8 space-y-20">
                    <section className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <div className="w-2 h-10 bg-orange-600 rounded-full"></div>
                                Qismlar
                            </h3>
                            <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">{episodes.length || 1} ta epizod</span>
                        </div>
                        
                        <div className="grid gap-4 max-h-[700px] overflow-y-auto pr-4 scrollbar-hide">
                            {episodes.length > 0 ? episodes.map((ep, i) => (
                                <div 
                                    key={ep.id} 
                                    onClick={handlePlayClick}
                                    className="group relative flex items-center justify-between p-6 bg-white/[0.03] hover:bg-orange-600/20 border border-white/5 rounded-[2rem] transition-all cursor-pointer overflow-hidden"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center font-black text-xl text-gray-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <span className="block font-black text-lg uppercase tracking-wider group-hover:text-orange-500 transition-colors">{ep.title}</span>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                                <Clock size={12}/> 24 daqiqa
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-xl">
                                        <Play size={20} fill="currentColor" />
                                    </div>
                                </div>
                            )) : (
                                <div onClick={handlePlayClick} className="w-full p-16 bg-white/5 border border-white/10 rounded-[3rem] font-black text-center cursor-pointer hover:bg-orange-600 transition-all flex flex-col items-center gap-6 shadow-2xl">
                                    <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse"><Play size={40} fill="white" /></div>
                                    <span className="tracking-widest">TO'LIQ VIDEONI KO'RISH</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Metadata Section */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Calendar, label: "Chiqqan yili", val: movie.year },
                            { icon: Languages, label: "Tarjimon", val: movie.translator || 'Anilo' },
                            { icon: Award, label: "Holati", val: movie.status === 'ongoing' ? 'Davomli' : 'Tugagan', color: 'text-green-500' },
                            { icon: Star, label: "Reyting", val: movie.rating?.toFixed(1) || '0.0' }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 hover:border-orange-500/30 transition-all shadow-xl text-center md:text-left">
                                <item.icon className="text-orange-500 mb-4 mx-auto md:mx-0" size={28}/>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{item.label}</p>
                                <p className={`font-black text-xl ${item.color || ''}`}>{item.val}</p>
                            </div>
                        ))}
                    </section>
                </div>

                {/* REVIEWS (RIGHT) */}
                <div className="lg:col-span-4 space-y-10">
                    <section className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 rounded-[3.5rem] shadow-2xl">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
                            <MessageCircle size={28} className="text-orange-500" />
                            Fikrlar
                        </h3>

                        {userProfile ? (
                            <form onSubmit={handleReviewSubmit} className="mb-12 space-y-8">
                                <div className="flex justify-center gap-4">
                                    {[1,2,3,4,5].map(num => (
                                        <button 
                                            key={num} type="button" 
                                            onClick={() => setRating(num)}
                                            className={`transition-all transform active:scale-75 ${rating >= num ? 'text-yellow-500 scale-125' : 'text-gray-800'}`}
                                        >
                                            <Star fill={rating >= num ? 'currentColor' : 'none'} size={32} />
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <textarea 
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Anime haqida fikringiz..."
                                        className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-6 text-sm focus:border-orange-500 outline-none transition-all resize-none h-40 text-gray-200"
                                    />
                                    <button 
                                        disabled={isSubmitting || !comment.trim()}
                                        className="absolute bottom-5 right-5 p-4 bg-orange-600 rounded-2xl text-white hover:bg-orange-500 transition-all disabled:opacity-50 shadow-2xl shadow-orange-600/40"
                                    >
                                        <Send size={24} />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-10 bg-orange-600/10 border border-orange-600/20 rounded-[2.5rem] mb-10 text-center">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-[0.2em]">Sharh qoldirish uchun tizimga kiring.</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <p className="text-gray-700 text-center italic py-10">Birinchi bo'lib fikr qoldiring!</p>
                            ) : reviews.map(rev => (
                                <div key={rev.id} className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-4 hover:bg-white/[0.08] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-900 border border-white/10 overflow-hidden shadow-inner">
                                            {rev.profiles?.avatar_url ? <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={24} className="m-3 text-gray-700"/>}
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-black uppercase text-white tracking-wider">{rev.profiles?.full_name || 'Mehmon'}</p>
                                            <div className="flex gap-1 text-yellow-500 mt-1">
                                                {Array.from({length: rev.rating}).map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                            </div>
                                        </div>
                                        <span className="ml-auto text-[9px] font-bold text-gray-600 uppercase tracking-widest">{new Date(rev.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {/* TULIQ IZOH - NO TRUNCATION */}
                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* O'XSHASH ANIMELAR CAROUSEL */}
            {relatedMovies.length > 0 && (
                <section className="mt-32 pb-40">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-6">
                             <h3 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <div className="w-2 h-12 bg-orange-600 rounded-full"></div>
                                O'xshash Animelar
                            </h3>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => scrollCarousel('left')} className="p-4 bg-white/5 hover:bg-orange-600 border border-white/10 rounded-full transition-all backdrop-blur-xl">
                                <ChevronLeft size={24} />
                            </button>
                            <button onClick={() => scrollCarousel('right')} className="p-4 bg-white/5 hover:bg-orange-600 border border-white/10 rounded-full transition-all backdrop-blur-xl">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                    
                    <div 
                        ref={carouselRef}
                        className="flex gap-10 overflow-x-auto scrollbar-hide pb-20 px-4 snap-inline scroll-smooth"
                    >
                        {relatedMovies.map(m => (
                            <div key={m.id} className="min-w-[200px] md:min-w-[260px] snap-item">
                                <MovieCard movie={m} isActive={true} onClick={() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    init();
                                }} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    </div>
  );
};
