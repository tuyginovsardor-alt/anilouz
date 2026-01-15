import React, { useState, useEffect, useMemo } from 'react';
import { Play, Star, Lock, ArrowLeft, MessageCircle, Send, User } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getMovieEpisodes, getMovieReviews, addReview } from './services/dbService';
import { Movie, UserProfile, Episode } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';

interface MovieDetailPageProps {
  movie: Movie;
  onBack: () => void;
  onPlay: () => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onBack, onPlay }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addNotification } = useNotification();

  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const profile = await getUserProfile(user.id);
                setUserProfile(profile as UserProfile);
            }
            
            // Fetch episodes and reviews
            const [eps, revs] = await Promise.all([
                getMovieEpisodes(movie.id!),
                getMovieReviews(movie.id!)
            ]);
            
            setEpisodes(eps);
            setReviews(revs);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    init();
  }, [movie.id]);

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userProfile) return addNotification({ type: 'error', title: 'Xatolik', message: 'Sharh qoldirish uchun tizimga kiring.' });
      if (!comment.trim()) return;

      setIsSubmitting(true);
      try {
          await addReview(movie.id!, userProfile.id, rating, comment);
          addNotification({ type: 'success', title: 'Rahmat!', message: 'Sharhingiz qabul qilindi.' });
          setComment('');
          // Refresh reviews
          const updatedRevs = await getMovieReviews(movie.id!);
          setReviews(updatedRevs);
      } catch (e) {
          console.error(e);
          addNotification({ type: 'error', title: 'Xatolik', message: 'Sharh yuborishda xatolik yuz berdi.' });
      } finally {
          setIsSubmitting(false);
      }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in pb-20 bg-[#0a0a0c] min-h-screen text-white">
        
        {/* HERO SECTION */}
        <div className="relative h-[60vh] md:h-[80vh] overflow-hidden">
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover opacity-30 blur-sm scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent"></div>
            
            <button onClick={onBack} className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md transition-all z-20">
                <ArrowLeft size={24} />
            </button>

            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-20 max-w-6xl mx-auto w-full">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    {movie.access_type === 'premium' ? (
                        <span className="bg-yellow-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-xl shadow-yellow-500/20 flex items-center gap-1.5">
                            <Lock size={12} /> Premium Access
                        </span>
                    ) : (
                        <span className="bg-green-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase">Bepul Tomosha</span>
                    )}
                    <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{movie.quality}</span>
                    <span className="text-yellow-500 font-black text-2xl flex items-center gap-2 drop-shadow-lg"><Star size={24} fill="currentColor"/> {movie.rating?.toFixed(1) || '0.0'}</span>
                </div>

                <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-[0.85]">{movie.title}</h1>
                
                <div className="flex flex-wrap gap-3 mb-8">
                    {movie.genre.split(',').map(g => (
                        <span key={g} className="text-xs font-bold text-gray-400 border border-gray-800 px-3 py-1 rounded-lg bg-gray-900/50 uppercase tracking-widest">{g.trim()}</span>
                    ))}
                </div>

                <p className="text-gray-400 max-w-3xl text-sm md:text-lg mb-10 leading-relaxed font-medium line-clamp-3 md:line-clamp-none">{movie.plot}</p>
                
                <button 
                    onClick={handlePlayClick}
                    className={`w-full md:w-max px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${canWatch ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                    {canWatch ? (
                        <><Play fill="currentColor" size={24}/> Hozir Tomosha Qilish</>
                    ) : (
                        <><Lock size={24}/> Faqat Premium Uchun</>
                    )}
                </button>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            {/* LEFT COLUMN: EPISODES */}
            <div className="lg:col-span-2 space-y-10">
                <section>
                    <h3 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                        <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
                        Qismlar ({episodes.length || 1})
                    </h3>
                    
                    <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                        {episodes.length > 0 ? episodes.map((ep, i) => (
                            <button 
                                key={ep.id} 
                                onClick={handlePlayClick}
                                className="group w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center font-black text-sm text-gray-500 group-hover:bg-orange-600 group-hover:text-white transition-colors">{i + 1}</div>
                                    <span className="font-bold text-sm uppercase tracking-wider">{ep.title}</span>
                                </div>
                                <Play size={18} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                            </button>
                        )) : (
                            <button onClick={handlePlayClick} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl font-bold flex items-center justify-between">
                                <span>To'liq Video</span>
                                <Play size={18} />
                            </button>
                        )}
                    </div>
                </section>

                {/* INFO SECTION */}
                <section className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Yil</p>
                            <p className="font-bold">{movie.year}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tarjimon</p>
                            <p className="font-bold text-orange-500">{movie.translator || 'Anilo Team'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Holati</p>
                            <p className="font-bold uppercase text-[10px] px-2 py-1 bg-green-600/20 text-green-500 rounded-lg w-max">{movie.status === 'ongoing' ? 'Davom etmoqda' : 'Tugallangan'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sifat</p>
                            <p className="font-bold">{movie.quality}</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* RIGHT COLUMN: REVIEWS */}
            <div className="space-y-10">
                <section>
                    <h3 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                        <MessageCircle size={24} className="text-orange-500" />
                        Fikrlar ({reviews.length})
                    </h3>

                    {/* Review Form */}
                    {userProfile ? (
                        <form onSubmit={handleReviewSubmit} className="mb-10 space-y-4">
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(num => (
                                    <button 
                                        key={num} 
                                        type="button" 
                                        onClick={() => setRating(num)}
                                        className={`transition-all ${rating >= num ? 'text-yellow-500 scale-110' : 'text-gray-700'}`}
                                    >
                                        <Star fill={rating >= num ? 'currentColor' : 'none'} size={24} />
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <textarea 
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Fikringizni yozing..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all resize-none h-24"
                                />
                                <button 
                                    disabled={isSubmitting || !comment.trim()}
                                    className="absolute bottom-3 right-3 p-2 bg-orange-600 rounded-xl text-white hover:bg-orange-500 transition-all disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-6 bg-orange-600/10 border border-orange-600/20 rounded-2xl mb-10 text-center">
                            <p className="text-sm font-bold text-orange-500">Sharh qoldirish uchun tizimga kiring.</p>
                        </div>
                    )}

                    {/* Review List */}
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                        {reviews.length === 0 ? (
                            <p className="text-gray-600 text-center italic py-10">Hozircha sharhlar yo'q. Birinchi bo'ling!</p>
                        ) : reviews.map(rev => (
                            <div key={rev.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                                            {rev.profiles?.avatar_url ? <img src={rev.profiles.avatar_url} /> : <User size={16}/>}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase">{rev.profiles?.full_name || 'Foydalanuvchi'}</p>
                                            <div className="flex gap-0.5 text-yellow-500 mt-0.5">
                                                {Array.from({length: rev.rating}).map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase">{new Date(rev.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{rev.comment}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    </div>
  );
};