
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Star, Lock, ArrowLeft, MessageCircle, Send, User, Bookmark, Check, Calendar, Info, Clock, Languages, Award, ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addNotification } = useNotification();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    // Scroll top when changing movie
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
          
          // Filter related movies by genre
          const genres = movie.genre.split(',').map(g => g.trim());
          const related = allMovies.filter(m => 
              m.id !== movie.id && 
              m.genre.split(',').some(g => genres.includes(g.trim()))
          ).slice(0, 10);
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
      const isAdmin = ['admin', 'owner', 'manager'].includes(userProfile.role);
      return !!(hasSubscription || isAdmin);
  }, [userProfile]);

  const canWatch = movie.access_type === 'free' || isPremiumUser;

  const handlePlayClick = () => {
      if (!canWatch) {
          addNotification({ 
              type: 'warning', 
              title: 'Premium Kerak', 
              message: 'Ushbu animeni ko\'rish uchun Premium obuna bo\'lishingiz shart.' 
          });
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
      } catch (e) {
          console.error(e);
      }
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
          console.error(e);
          addNotification({ type: 'error', title: 'Xatolik', message: 'Sharh yuborishda xatolik yuz berdi.' });
      } finally {
          setIsSubmitting(false);
      }
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
    <div className="animate-fade-in pb-32 bg-[#0a0a0c] min-h-screen text-white">
        
        {/* CINEMATIC HERO SECTION */}
        <div className="relative h-[70vh] md:h-[90vh] overflow-hidden group">
            {/* Background Image with Ken Burns Effect */}
            <div className="absolute inset-0 scale-105 group-hover:scale-110 transition-transform duration-[20s] ease-out">
                <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover opacity-40 blur-[2px]" />
            </div>
            
            {/* Immersive Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-transparent hidden lg:block"></div>
            
            {/* Top Navigation Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-center z-30">
                <button onClick={onBack} className="p-4 bg-black/40 hover:bg-orange-600 rounded-full backdrop-blur-xl border border-white/10 transition-all transform active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <button 
                    onClick={handleToggleSave}
                    className={`p-4 rounded-full backdrop-blur-xl border transition-all transform active:scale-90 ${isSaved ? 'bg-orange-600 border-orange-500' : 'bg-black/40 border-white/10 hover:bg-white/10'}`}
                >
                    <Bookmark size={24} fill={isSaved ? 'white' : 'none'} />
                </button>
            </div>

            {/* Content Bottom */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-20 max-w-7xl mx-auto w-full z-20">
                <div className="space-y-6 max-w-4xl animate-fade-in-up">
                    <div className="flex flex-wrap items-center gap-4">
                        {movie.access_type === 'premium' ? (
                            <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[10px] font-black px-5 py-2 rounded-full tracking-[0.2em] uppercase shadow-xl shadow-yellow-500/20 flex items-center gap-2">
                                <Award size={14} /> PREMIUM
                            </span>
                        ) : (
                            <span className="bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] font-black px-5 py-2 rounded-full tracking-[0.2em] uppercase">BEPUL</span>
                        )}
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <Star size={16} className="text-yellow-500 fill-yellow-500"/>
                            <span className="text-white font-black text-sm">{movie.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{movie.quality}</span>
                    </div>

                    <h1 className="text-5xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">{movie.title}</h1>
                    
                    <div className="flex flex-wrap gap-3">
                        {movie.genre.split(',').map(g => (
                            <span key={g} className="text-[10px] font-black text-gray-400 border border-white/5 px-4 py-1.5 rounded-full bg-white/5 uppercase tracking-[0.1em]">{g.trim()}</span>
                        ))}
                    </div>

                    <p className="text-gray-300 max-w-2xl text-sm md:text-xl leading-relaxed font-medium opacity-80 line-clamp-3 md:line-clamp-none border-l-4 border-orange-600 pl-6">
                        {movie.plot}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-5 pt-4">
                        <button 
                            onClick={handlePlayClick}
                            className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${canWatch ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {canWatch ? (
                                <><Play fill="currentColor" size={24}/> HOZIR KO'RISH</>
                            ) : (
                                <><Lock size={24}/> FAQAT PREMIUM</>
                            )}
                        </button>
                        <button className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] backdrop-blur-xl border border-white/10 flex items-center justify-center gap-3">
                            <Info size={20} /> Epizodlar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                
                {/* EPISODES & INFO (LEFT) */}
                <div className="lg:col-span-8 space-y-16">
                    
                    {/* Epizodlar Section */}
                    <section>
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <div className="w-2 h-10 bg-orange-600 rounded-full"></div>
                                Qismlar
                            </h3>
                            <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">{episodes.length || 1} ta epizod</span>
                        </div>
                        
                        <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                            {episodes.length > 0 ? episodes.map((ep, i) => (
                                <div 
                                    key={ep.id} 
                                    onClick={handlePlayClick}
                                    className="group relative w-full flex items-center justify-between p-6 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-3xl transition-all cursor-pointer overflow-hidden"
                                >
                                    {/* Play Progress Overlay Sim */}
                                    <div className="absolute bottom-0 left-0 h-1 bg-orange-600 w-0 group-hover:w-full transition-all duration-700"></div>

                                    <div className="flex items-center gap-6 z-10">
                                        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center font-black text-xl text-gray-700 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <span className="block font-black text-base uppercase tracking-wider group-hover:text-orange-500 transition-colors">{ep.title}</span>
                                            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                                <Clock size={12}/> 24 daqiqa
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                        <Play size={18} fill="currentColor" />
                                    </div>
                                </div>
                            )) : (
                                <div onClick={handlePlayClick} className="w-full p-10 bg-white/5 border border-white/10 rounded-3xl font-black text-center cursor-pointer hover:bg-orange-600 transition-all flex flex-col items-center gap-4">
                                    <Play size={40} fill="white" />
                                    <span>TO'LIQ VIDEONI KO'RISH</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Metadata Section */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all">
                            <Calendar className="text-orange-500 mb-3" size={24}/>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Chiqqan yili</p>
                            <p className="font-black text-lg">{movie.year}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all">
                            <Languages className="text-orange-500 mb-3" size={24}/>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tarjimon</p>
                            <p className="font-black text-lg truncate text-orange-500">{movie.translator || 'Anilo'}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all">
                            <Award className="text-orange-500 mb-3" size={24}/>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Holati</p>
                            <p className="font-black text-lg uppercase text-green-500">{movie.status === 'ongoing' ? 'Davomli' : 'Tugagan'}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all">
                            <Star className="text-orange-500 mb-3" size={24}/>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Reyting</p>
                            <p className="font-black text-lg">{movie.rating?.toFixed(1) || '0.0'}</p>
                        </div>
                    </section>
                </div>

                {/* REVIEWS (RIGHT) */}
                <div className="lg:col-span-4 space-y-10">
                    <section className="bg-white/5 border border-white/5 p-8 rounded-[3rem]">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <MessageCircle size={24} className="text-orange-500" />
                            Fikrlar
                        </h3>

                        {userProfile ? (
                            <form onSubmit={handleReviewSubmit} className="mb-10 space-y-6">
                                <div className="flex justify-center gap-3">
                                    {[1,2,3,4,5].map(num => (
                                        <button 
                                            key={num} type="button" 
                                            onClick={() => setRating(num)}
                                            className={`transition-all transform active:scale-90 ${rating >= num ? 'text-yellow-500 scale-125' : 'text-gray-700'}`}
                                        >
                                            <Star fill={rating >= num ? 'currentColor' : 'none'} size={28} />
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <textarea 
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Anime haqida fikringiz..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm focus:border-orange-500 outline-none transition-all resize-none h-32 text-gray-200"
                                    />
                                    <button 
                                        disabled={isSubmitting || !comment.trim()}
                                        className="absolute bottom-4 right-4 p-3 bg-orange-600 rounded-xl text-white hover:bg-orange-500 transition-all disabled:opacity-50 shadow-lg shadow-orange-600/30"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-8 bg-orange-600/10 border border-orange-600/20 rounded-3xl mb-10 text-center">
                                <p className="text-sm font-black text-orange-500 uppercase tracking-widest">Sharh qoldirish uchun tizimga kiring.</p>
                            </div>
                        )}

                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                            {reviews.length === 0 ? (
                                <p className="text-gray-600 text-center italic py-10">Birinchi bo'lib fikr qoldiring!</p>
                            ) : reviews.map(rev => (
                                <div key={rev.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-3 hover:bg-white/10 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 overflow-hidden">
                                                {rev.profiles?.avatar_url ? <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="m-2.5 text-gray-500"/>}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase text-white">{rev.profiles?.full_name || 'Mehmon'}</p>
                                                <div className="flex gap-0.5 text-yellow-500 mt-0.5">
                                                    {Array.from({length: rev.rating}).map((_, i) => <Star key={i} size={8} fill="currentColor"/>)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-xs leading-relaxed">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* RELATED CAROUSEL SECTION */}
            {relatedMovies.length > 0 && (
                <section className="mt-32">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                            <div className="w-2 h-10 bg-orange-600 rounded-full"></div>
                            O'xshash Animelar
                        </h3>
                        <div className="flex gap-3">
                            <button onClick={() => scrollCarousel('left')} className="p-3 bg-white/5 hover:bg-orange-600 border border-white/10 rounded-full transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => scrollCarousel('right')} className="p-3 bg-white/5 hover:bg-orange-600 border border-white/10 rounded-full transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div 
                        ref={carouselRef}
                        className="flex gap-8 overflow-x-auto scrollbar-hide pb-10 px-2 scroll-smooth"
                    >
                        {relatedMovies.map(m => (
                            <div key={m.id} className="min-w-[180px] md:min-w-[220px]">
                                <MovieCard movie={m} isActive={true} onClick={() => init()} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    </div>
  );
};
