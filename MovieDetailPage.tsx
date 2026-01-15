import React, { useState, useEffect, useMemo } from 'react';
import { Movie, Episode, Review } from './types';
import { getReviews, checkIsSaved, addToSaved, removeFromSaved, incrementMovieView, getEpisodes, addReview, updateReview, deleteReview } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { 
    Play, Bookmark, ArrowLeft, Star, Clock, Eye, Info, 
    Send, Edit2, Trash2, Tag, Calendar
} from 'lucide-react';

interface MovieDetailPageProps {
  movie: Movie;
  onBack: () => void;
  onPlay: (movie?: Movie) => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onBack, onPlay }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addNotification } = useNotification();

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        const [revs, eps, saved] = await Promise.all([
            getReviews(movie.id!),
            getEpisodes(movie.id!),
            user ? checkIsSaved(user.id, movie.id!) : false,
            incrementMovieView(movie.id!)
        ]);

        setReviews(revs);
        setEpisodes(eps);
        setIsSaved(saved);
        if (eps.length > 0) setCurrentEpisode(eps[0]);
        setIsLoading(false);
    };
    init();
  }, [movie.id]);

  const ratingStats = useMemo(() => {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: reviews.length };
    reviews.forEach(r => { if(r.rating) stats[r.rating as 5|4|3|2|1]++ });
    return stats;
  }, [reviews]);

  const handleToggleSave = async () => {
    if (!currentUser) return addNotification({ type: 'warning', title: 'Kirish', message: 'Saqlash uchun kiring' });
    if (isSaved) {
        await removeFromSaved(currentUser.id, movie.id!);
        setIsSaved(false);
    } else {
        await addToSaved(currentUser.id, movie.id!);
        setIsSaved(true);
        addNotification({ type: 'success', title: 'Saqlandi', message: 'Ro\'yxatga qo\'shildi' });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return addNotification({ type: 'warning', title: 'Kirish', message: 'Fikr bildirish uchun kiring' });
    if (!userComment.trim()) return;

    setIsSubmitting(true);
    try {
        if (editingId) {
            await updateReview(editingId, userRating, userComment);
            addNotification({ type: 'success', title: 'Yangilandi', message: 'Izoh o\'zgartirildi' });
        } else {
            await addReview(movie.id!, currentUser.id, userRating, userComment);
            addNotification({ type: 'success', title: 'Rahmat!', message: 'Fikringiz qabul qilindi' });
        }
        setUserComment('');
        setEditingId(null);
        const updated = await getReviews(movie.id!);
        setReviews(updated);
    } catch (e) {
        addNotification({ type: 'error', title: 'Xatolik', message: 'Xatolik yuz berdi' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm("O'chirasizmi?")) return;
    await deleteReview(id);
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in pb-20">
      
      {/* HEADER SECTION */}
      <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden rounded-b-[3rem] mb-12 shadow-2xl">
          <img src={movie.posterUrl} className="w-full h-full object-cover opacity-50 blur-sm" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent"></div>
          
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 w-12 h-12 bg-black/40 hover:bg-orange-600 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-xl"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row items-end gap-8">
              <div className="w-40 h-60 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 hidden md:block">
                  <img src={movie.posterUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                      <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded">ANIME</span>
                      <span className="text-yellow-500 font-bold flex items-center gap-1"><Star size={16} fill="currentColor"/> {movie.rating.toFixed(1)}</span>
                  </div>
                  <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">{movie.title}</h1>
                  <div className="flex flex-wrap gap-4 text-gray-400 font-bold text-sm">
                      <span className="flex items-center gap-1"><Calendar size={16}/> {movie.year}</span>
                      <span className="flex items-center gap-1"><Eye size={16}/> {movie.view_count || 0}</span>
                      <span className="bg-gray-800 px-2 py-0.5 rounded text-[10px]">{movie.quality}</span>
                      <span className="text-orange-500 uppercase">{movie.status}</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT: CONTENT */}
          <div className="lg:col-span-2 space-y-12">
              
              {/* Episodes */}
              <section className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                  <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                      <Play size={20} className="text-orange-600"/> Qismlar
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {episodes.map((ep, idx) => (
                          <button
                              key={idx}
                              onClick={() => setCurrentEpisode(ep)}
                              className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                                  currentEpisode?.title === ep.title 
                                  ? 'bg-orange-600 border-orange-500 text-white shadow-lg' 
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                          >
                              {ep.title}
                          </button>
                      ))}
                  </div>
                  <button 
                    onClick={() => onPlay(currentEpisode ? { ...movie, title: `${movie.title} - ${currentEpisode.title}`, videoUrl: currentEpisode.source as string } : undefined)}
                    className="w-full mt-6 py-4 bg-white text-black hover:bg-orange-600 hover:text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3"
                  >
                      <Play fill="currentColor" size={20}/> {currentEpisode ? `${currentEpisode.title}ni ko'rish` : "Hozir ko'rish"}
                  </button>
              </section>

              {/* Plot */}
              <section>
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-500 mb-6">Qisqacha Mazmun</h2>
                  <p className="text-lg text-gray-300 leading-relaxed font-medium">
                      {movie.plot}
                  </p>
              </section>

              {/* Reviews */}
              <section className="space-y-8">
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-500">Reyting va Izohlar</h2>
                  
                  {/* Rating Stats Card */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-white/5 p-8 rounded-3xl border border-white/5">
                      <div className="text-center">
                          <p className="text-5xl font-black text-orange-500">{movie.rating.toFixed(1)}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black mt-2">{reviews.length} TA REYTING</p>
                      </div>
                      <div className="md:col-span-3 space-y-2">
                          {[5, 4, 3, 2, 1].map(num => (
                              <div key={num} className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-gray-500 w-2">{num}</span>
                                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-orange-600" style={{ width: `${ratingStats.total ? (ratingStats[num as 5|4|3|2|1] / ratingStats.total) * 100 : 0}%` }}></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleReviewSubmit} className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                      <div className="flex gap-2">
                          {[1,2,3,4,5].map(s => (
                              <button key={s} type="button" onClick={() => setUserRating(s)} className={userRating >= s ? 'text-orange-500' : 'text-gray-700'}><Star size={24} fill={userRating >= s ? 'currentColor' : 'none'}/></button>
                          ))}
                      </div>
                      <div className="flex gap-2">
                          <textarea value={userComment} onChange={e => setUserComment(e.target.value)} placeholder="Fikringiz..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500 min-h-[100px]"></textarea>
                          <button type="submit" disabled={isSubmitting || !userComment.trim()} className="bg-orange-600 text-white p-4 rounded-2xl self-end hover:bg-orange-500 transition-all"><Send size={20}/></button>
                      </div>
                  </form>

                  {/* List */}
                  <div className="space-y-4">
                      {reviews.map(r => (
                          <div key={r.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex justify-between items-start">
                              <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                      <span className="font-bold text-orange-500 text-sm">@{r.profiles?.username || 'user'}</span>
                                      <div className="flex text-yellow-500 scale-75">{[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor"/>)}</div>
                                  </div>
                                  <p className="text-gray-300">{r.comment}</p>
                              </div>
                              {currentUser?.id === r.user_id && (
                                  <div className="flex gap-2">
                                      <button onClick={() => { setEditingId(r.id); setUserComment(r.comment); setUserRating(r.rating); }} className="text-blue-400 p-2 hover:bg-blue-400/10 rounded-full"><Edit2 size={16}/></button>
                                      <button onClick={() => handleDeleteReview(r.id)} className="text-red-400 p-2 hover:bg-red-400/10 rounded-full"><Trash2 size={16}/></button>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </section>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="space-y-8">
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                  <h3 className="font-black uppercase tracking-widest text-xs text-gray-500">Anime Ma'lumotlari</h3>
                  <div className="space-y-4 text-sm">
                      <div className="flex justify-between border-b border-white/5 pb-3">
                          <span className="text-gray-500">Tarjima</span>
                          <span className="font-bold text-orange-500">{movie.translator || 'Anilo'}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-3">
                          <span className="text-gray-500">Til</span>
                          <span className="font-bold">{movie.language}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-3">
                          <span className="text-gray-500">Janrlar</span>
                          <span className="font-bold text-right">{movie.genre}</span>
                      </div>
                  </div>
                  <button 
                    onClick={handleToggleSave}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${isSaved ? 'bg-white text-black' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                  >
                    <Bookmark size={18} fill={isSaved ? "black" : "none"} /> {isSaved ? 'Saqlangan' : 'Saqlash'}
                  </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                  {movie.tags?.split(',').map(t => (
                      <span key={t} className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 border border-white/5"><Tag size={10}/> {t.trim()}</span>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};