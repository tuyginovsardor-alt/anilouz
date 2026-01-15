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

  const handlePlayClick = () => {
      if (currentEpisode) {
          onPlay({
              ...movie,
              title: `${movie.title} - ${currentEpisode.title}`,
              videoUrl: currentEpisode.source as string
          });
      } else {
          onPlay(movie);
      }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in pb-20 bg-[#0a0a0c] min-h-screen text-white">
      
      {/* HEADER SECTION (Stable Cinematic) */}
      <div className="relative w-full h-[350px] md:h-[500px] overflow-hidden rounded-b-[4rem] mb-12 shadow-2xl">
          <img src={movie.posterUrl} className="w-full h-full object-cover opacity-40 blur-[2px]" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent"></div>
          
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 w-12 h-12 bg-black/40 hover:bg-orange-600 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-xl z-50"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="absolute bottom-10 left-6 md:left-16 right-6 md:right-16 flex flex-col md:flex-row items-end gap-10">
              <div className="w-44 h-64 flex-shrink-0 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/5 hidden md:block">
                  <img src={movie.posterUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-3">
                      <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">ANIME</span>
                      <span className="text-yellow-500 font-black text-xl flex items-center gap-1.5"><Star size={20} fill="currentColor"/> {movie.rating.toFixed(1)}</span>
                  </div>
                  <h1 className="text-4xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-lg">{movie.title}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-gray-400 font-bold text-sm">
                      <span className="flex items-center gap-2"><Calendar size={18}/> {movie.year}</span>
                      <span className="flex items-center gap-2"><Eye size={18}/> {movie.view_count || 0}</span>
                      <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] tracking-widest uppercase font-black">{movie.quality}</span>
                      <span className={`uppercase font-black ${movie.status === 'ongoing' ? 'text-green-500' : 'text-blue-500'}`}>{movie.status}</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* LEFT: CONTENT */}
          <div className="lg:col-span-2 space-y-16">
              
              {/* Episodes Panel */}
              <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-xl">
                  <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-8 flex items-center gap-4">
                      <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
                      Qismlar
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {episodes.map((ep, idx) => (
                          <button
                              key={idx}
                              onClick={() => setCurrentEpisode(ep)}
                              className={`py-4 rounded-2xl font-bold text-sm transition-all border ${
                                  currentEpisode?.title === ep.title 
                                  ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/30' 
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                          >
                              {ep.title}
                          </button>
                      ))}
                      {episodes.length === 0 && <p className="text-gray-600 italic">Qismlar yuklanmoqda...</p>}
                  </div>
                  <button 
                    onClick={handlePlayClick}
                    className="w-full mt-10 py-5 bg-white text-black hover:bg-orange-600 hover:text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95"
                  >
                      <Play fill="currentColor" size={24}/> {currentEpisode ? `${currentEpisode.title}ni ko'rish` : "Hozir ko'rish"}
                  </button>
              </section>

              {/* Description */}
              <section>
                  <h2 className="text-xl font-black uppercase tracking-[0.2em] text-gray-500 mb-8">Qisqacha Mazmun</h2>
                  <p className="text-xl text-gray-300 leading-relaxed font-medium pl-8 border-l-2 border-white/5">
                      {movie.plot}
                  </p>
              </section>

              {/* Review System */}
              <section className="space-y-12">
                  <h2 className="text-xl font-black uppercase tracking-[0.2em] text-gray-500">Reyting va Izohlar</h2>
                  
                  {/* Stats Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-10 bg-white/5 p-10 rounded-[2.5rem] border border-white/5 shadow-inner">
                      <div className="text-center flex flex-col justify-center">
                          <p className="text-6xl font-black text-orange-500">{movie.rating.toFixed(1)}</p>
                          <div className="flex justify-center text-yellow-500 my-3"><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/></div>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{reviews.length} TA REYTING</p>
                      </div>
                      <div className="md:col-span-3 space-y-3 flex flex-col justify-center">
                          {[5, 4, 3, 2, 1].map(num => (
                              <div key={num} className="flex items-center gap-4">
                                  <span className="text-xs font-bold text-gray-500 w-4">{num}</span>
                                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-orange-600 rounded-full" 
                                        style={{ width: `${ratingStats.total ? (ratingStats[num as 5|4|3|2|1] / ratingStats.total) * 100 : 0}%` }}
                                      ></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleReviewSubmit} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Baho:</span>
                        <div className="flex gap-2">
                            {[1,2,3,4,5].map(s => (
                                <button key={s} type="button" onClick={() => setUserRating(s)} className={`transition-transform active:scale-90 ${userRating >= s ? 'text-orange-500' : 'text-gray-700'}`}><Star size={28} fill={userRating >= s ? 'currentColor' : 'none'}/></button>
                            ))}
                        </div>
                      </div>
                      <div className="relative">
                          <textarea value={userComment} onChange={e => setUserComment(e.target.value)} placeholder="Anime haqida fikringiz..." className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-6 text-white outline-none focus:border-orange-500 min-h-[120px] transition-all"></textarea>
                          <button type="submit" disabled={isSubmitting || !userComment.trim()} className="absolute bottom-4 right-4 bg-orange-600 text-white p-4 rounded-2xl hover:bg-orange-500 transition-all active:scale-90 disabled:opacity-50"><Send size={20}/></button>
                      </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-6">
                      {reviews.length === 0 && <p className="text-center py-20 text-gray-600 italic font-bold">Hali izohlar yo'q. Birinchi bo'ling!</p>}
                      {reviews.map(r => (
                          <div key={r.id} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-start animate-fade-in group">
                              <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-black text-orange-500 border border-white/5">
                                          {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} className="w-full h-full rounded-full object-cover" /> : (r.profiles?.username?.[0].toUpperCase() || 'U')}
                                      </div>
                                      <div>
                                        <span className="font-black text-orange-500 text-sm">@{r.profiles?.username || 'user'}</span>
                                        <div className="flex text-yellow-500 scale-75 -ml-4">{[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor"/>)}</div>
                                      </div>
                                  </div>
                                  <p className="text-gray-300 leading-relaxed font-medium">{r.comment}</p>
                              </div>
                              {currentUser?.id === r.user_id && (
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setEditingId(r.id); setUserComment(r.comment); setUserRating(r.rating); }} className="text-blue-400 p-3 hover:bg-blue-400/10 rounded-full transition-colors"><Edit2 size={18}/></button>
                                      <button onClick={() => handleDeleteReview(r.id)} className="text-red-400 p-3 hover:bg-red-400/10 rounded-full transition-colors"><Trash2 size={18}/></button>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </section>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="space-y-10">
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-8 sticky top-24">
                  <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-500 border-b border-white/5 pb-4">Anime Ma'lumotlari</h3>
                  <div className="space-y-6">
                      <div className="flex justify-between border-b border-white/5 pb-4 group">
                          <span className="text-gray-500 font-bold text-sm group-hover:text-gray-400 transition-colors">Tarjimon</span>
                          <span className="font-black text-orange-500 text-sm text-right">{movie.translator || 'Anilo Team'}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-4 group">
                          <span className="text-gray-500 font-bold text-sm group-hover:text-gray-400 transition-colors">Til</span>
                          <span className="font-black text-white text-sm">JP / UZ</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-4 group">
                          <span className="text-gray-500 font-bold text-sm group-hover:text-gray-400 transition-colors">Janrlar</span>
                          <span className="font-black text-white text-sm text-right max-w-[150px] leading-snug">{movie.genre}</span>
                      </div>
                      <div className="flex justify-between group">
                          <span className="text-gray-500 font-bold text-sm group-hover:text-gray-400 transition-colors">Holati</span>
                          <span className={`font-black text-xs uppercase px-2 py-0.5 rounded ${movie.status === 'ongoing' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>{movie.status}</span>
                      </div>
                  </div>
                  <button 
                    onClick={handleToggleSave}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all ${isSaved ? 'bg-white text-black' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                  >
                    <Bookmark size={20} fill={isSaved ? "black" : "none"} /> {isSaved ? 'Saqlangan' : 'Saqlash'}
                  </button>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2 px-4">
                  {movie.tags?.split(',').map(t => (
                      <span key={t} className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 border border-white/5 hover:text-orange-500 hover:border-orange-500/30 transition-all cursor-default"><Tag size={10}/> {t.trim()}</span>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};