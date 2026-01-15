import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Movie, Episode, Review } from './types';
import { getReviews, checkIsSaved, addToSaved, removeFromSaved, incrementMovieView, getEpisodes, addReview, updateReview, deleteReview } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { 
    Play, Bookmark, ArrowLeft, Star, Clock, Eye, Info, 
    ChevronDown, Send, Edit2, Trash2, MessageSquare, 
    Share2, MoreVertical, Tag, ShieldCheck 
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
  const [scrollY, setScrollY] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Review Form State
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
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

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    init();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [movie.id]);

  // Reyting statistikasi
  const ratingStats = useMemo(() => {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: reviews.length };
    reviews.forEach(r => { if(r.rating) stats[r.rating as 5|4|3|2|1]++ });
    return stats;
  }, [reviews]);

  // --- FIX: Defined handlePlay to trigger onPlay prop ---
  const handlePlay = () => {
    onPlay();
  };

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
        if (editingReviewId) {
            await updateReview(editingReviewId, userRating, userComment);
            addNotification({ type: 'success', title: 'Yangilandi', message: 'Izohingiz o\'zgartirildi' });
        } else {
            await addReview(movie.id!, currentUser.id, userRating, userComment);
            addNotification({ type: 'success', title: 'Rahmat!', message: 'Fikringiz uchun tashakkur' });
        }
        setUserComment('');
        setEditingReviewId(null);
        const updated = await getReviews(movie.id!);
        setReviews(updated);
    } catch (e) {
        addNotification({ type: 'error', title: 'Xato', message: 'Saqlashda xatolik yuz berdi' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    try {
        await deleteReview(id);
        setReviews(prev => prev.filter(r => r.id !== id));
        addNotification({ type: 'info', title: 'O\'chirildi', message: 'Izoh olib tashlandi' });
    } catch (e) {
        addNotification({ type: 'error', title: 'Xato', message: 'O\'chirishda xatolik' });
    }
  };

  const startEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setUserRating(review.rating);
    setUserComment(review.comment);
    window.scrollTo({ top: document.getElementById('review-form')?.offsetTop ? document.getElementById('review-form')!.offsetTop - 100 : 0, behavior: 'smooth' });
  };

  const headerHeight = 550;
  const scale = scrollY < 0 ? 1 + Math.abs(scrollY) / 500 : 1;

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-white pb-32">
      
      {/* FLOATING BACK BUTTON */}
      <button 
        onClick={onBack}
        className="fixed top-6 left-6 z-[150] w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-all shadow-2xl"
      >
        <ArrowLeft size={24} />
      </button>

      {/* STRETCHY PARALLAX HEADER */}
      <div className="relative w-full overflow-hidden" style={{ height: `${headerHeight}px` }}>
        <div className="absolute inset-0 z-0" style={{ transform: `scale(${scale}) translateY(${scrollY * 0.3}px)` }}>
          <img src={movie.posterUrl} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0c]/60 to-[#0a0a0c]"></div>
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-16 container mx-auto">
            <div className="max-w-4xl space-y-6">
                <div className="flex items-center gap-3">
                    <span className="bg-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Anime</span>
                    <span className="flex items-center gap-1.5 text-yellow-500 font-black"><Star size={18} fill="currentColor"/> {movie.rating.toFixed(1)}</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none drop-shadow-2xl">{movie.title}</h1>
                <div className="flex items-center gap-6 text-gray-400 font-bold text-sm">
                    <span className="flex items-center gap-2"><Clock size={16}/> {movie.year}</span>
                    <span className="flex items-center gap-2"><Eye size={16}/> {movie.view_count || 0}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${movie.status === 'ongoing' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {movie.status === 'ongoing' ? 'Davom etmoqda' : 'Tugallangan'}
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-20 -mt-10 bg-[#0a0a0c] rounded-t-[3rem] p-6 md:p-16 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            {/* Left: Content */}
            <div className="lg:col-span-2 space-y-16">
                
                {/* Episodes Section */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-8 flex items-center gap-4">
                        <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
                        Qismlar
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {episodes.map((ep, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentEpisode(ep)}
                                className={`py-4 rounded-2xl font-bold text-sm transition-all border ${
                                    currentEpisode?.title === ep.title 
                                    ? 'bg-orange-600 border-orange-500 text-white shadow-lg' 
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                }`}
                            >
                                {ep.title}
                            </button>
                        ))}
                        {episodes.length === 0 && <p className="text-gray-600 italic">Qismlar yuklanmoqda...</p>}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-6 flex items-center gap-4">
                        <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
                        Qisqacha Mazmun
                    </h2>
                    <p className="text-xl text-gray-300 leading-relaxed font-medium pl-6 border-l border-white/10">
                        {movie.plot}
                    </p>
                </section>

                {/* Genres & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <section>
                        <h2 className="text-lg font-black uppercase tracking-widest text-gray-500 mb-6">Janrlar</h2>
                        <div className="flex flex-wrap gap-2">
                            {movie.genre.split(',').map(g => (
                                <span key={g} className="px-4 py-2 bg-white/5 rounded-full text-sm font-bold text-gray-300 border border-white/5">{g.trim()}</span>
                            ))}
                        </div>
                    </section>
                    <section>
                        <h2 className="text-lg font-black uppercase tracking-widest text-gray-500 mb-6">Qidiruv so'zlari</h2>
                        <div className="flex flex-wrap gap-2">
                            {movie.tags?.split(',').map(t => (
                                <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/10 rounded-lg text-xs font-bold text-orange-500 border border-orange-500/20"><Tag size={12}/> {t.trim()}</span>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Promo Banner */}
                <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-orange-600/20">
                    <div>
                        <h3 className="text-2xl font-black text-white mb-2">“ANILO” PROMOKODI</h3>
                        <p className="text-white/80 font-bold uppercase tracking-widest text-xs">Tariflarga 30% chegirmaga ega bo'ling</p>
                    </div>
                    <button className="px-8 py-3 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">Obuna bo'lish</button>
                </div>

                {/* REVIEWS SECTION - CHAT STYLE */}
                <section className="space-y-10" id="reviews">
                    <div className="flex items-center justify-between">
                         <h2 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-4">
                            <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
                            Reyting va Izohlar
                        </h2>
                        <span className="text-gray-500 font-bold">{reviews.length} ta fikr</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                        <div className="text-center flex flex-col justify-center">
                            <p className="text-6xl font-black text-orange-500">{movie.rating.toFixed(1)}</p>
                            <div className="flex justify-center text-yellow-500 my-2"><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/></div>
                            <p className="text-xs text-gray-500 uppercase font-black">{reviews.length} TA REYTING</p>
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            {[5, 4, 3, 2, 1].map(num => (
                                <div key={num} className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-gray-500 w-2">{num}</span>
                                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-orange-600 rounded-full" 
                                            style={{ width: `${ratingStats.total ? (ratingStats[num as 5|4|3|2|1] / ratingStats.total) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 w-8">{ratingStats[num as 5|4|3|2|1]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Review Form */}
                    <div id="review-form" className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl">
                        <h4 className="font-black text-white mb-6 uppercase tracking-widest text-sm">{editingReviewId ? 'Izohni tahrirlash' : 'O\'z fikringizni qoldiring'}</h4>
                        <form onSubmit={handleReviewSubmit} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-gray-500">Baholash:</span>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star} 
                                            type="button" 
                                            onClick={() => setUserRating(star)}
                                            className={`transition-all ${userRating >= star ? 'text-orange-500 scale-125' : 'text-gray-700'}`}
                                        >
                                            <Star size={24} fill={userRating >= star ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <textarea 
                                    value={userComment}
                                    onChange={e => setUserComment(e.target.value)}
                                    placeholder="Anime haqida fikringiz..."
                                    className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-gray-200 focus:border-orange-500 outline-none min-h-[120px] transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={isSubmitting || !userComment.trim()}
                                    className="absolute bottom-4 right-4 p-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl shadow-lg disabled:opacity-50 transition-all active:scale-90"
                                >
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Review List (Chat Style) */}
                    <div className="space-y-6">
                        {reviews.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                                <MessageSquare className="mx-auto text-gray-700 mb-4" size={48} />
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Birinchi bo'lib fikr qoldiring</p>
                            </div>
                        ) : (
                            reviews.map(r => {
                                const isMe = currentUser?.id === r.user_id;
                                return (
                                    <div key={r.id} className={`flex gap-4 group animate-fade-in ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-12 h-12 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden border-2 border-white/5">
                                            {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 font-black">{r.profiles?.username?.[0].toUpperCase()}</div>}
                                        </div>
                                        <div className={`max-w-[85%] space-y-2 ${isMe ? 'items-end' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-black ${isMe ? 'text-orange-500' : 'text-gray-400'}`}>@{r.profiles?.username || 'anonymous'}</span>
                                                <div className="flex text-yellow-500 scale-75">
                                                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-bold">{new Date(r.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className={`p-5 rounded-[2rem] text-sm md:text-base font-medium leading-relaxed relative ${isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'}`}>
                                                {r.comment}
                                                
                                                {/* Chat Actions */}
                                                <div className={`absolute top-0 flex gap-2 transition-all opacity-0 group-hover:opacity-100 ${isMe ? '-left-20' : '-right-20'}`}>
                                                    {isMe && (
                                                        <>
                                                            <button onClick={() => startEdit(r)} className="p-2 bg-white/5 hover:bg-blue-600 rounded-full transition-colors text-blue-400 hover:text-white"><Edit2 size={14}/></button>
                                                            <button onClick={() => handleDeleteReview(r.id)} className="p-2 bg-white/5 hover:bg-red-600 rounded-full transition-colors text-red-400 hover:text-white"><Trash2 size={14}/></button>
                                                        </>
                                                    )}
                                                    <button className="p-2 bg-white/5 hover:bg-orange-600 rounded-full transition-colors text-gray-400 hover:text-white"><Share2 size={14}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>
            </div>

            {/* Right: Sidebar Metadata */}
            <div className="space-y-10">
                 <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8 sticky top-24">
                    <h3 className="font-black uppercase tracking-[0.2em] text-xs text-gray-500 border-b border-white/5 pb-4">Anime Ma'lumotlari</h3>
                    
                    <div className="space-y-6">
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-500 font-bold text-sm">Holati</span>
                            <span className={`font-black text-xs uppercase tracking-tighter px-3 py-1 rounded-full ${movie.status === 'ongoing' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>{movie.status}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold text-sm">Turi</span>
                            <span className="font-black text-xs text-white uppercase">Serial</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold text-sm">Til</span>
                            <span className="font-black text-xs text-white uppercase">{movie.language}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold text-sm">Tarjima</span>
                            <span className="font-black text-xs text-orange-500 text-right">{movie.translator || 'Anilo Team'}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-6">
                             <div className="text-center flex-1 border-r border-white/5">
                                <p className="text-2xl font-black text-white">{movie.view_count || 0}</p>
                                <p className="text-[10px] uppercase font-bold text-gray-500">Ko'rilgan</p>
                             </div>
                             <div className="text-center flex-1">
                                <p className="text-2xl font-black text-white">{reviews.length}</p>
                                <p className="text-[10px] uppercase font-bold text-gray-500">Fikrlar</p>
                             </div>
                        </div>
                    </div>

                    <div className="pt-6 space-y-3">
                         <button 
                            onClick={handleToggleSave}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${isSaved ? 'bg-white text-black' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                         >
                            <Bookmark size={18} fill={isSaved ? "black" : "none"} /> {isSaved ? 'Saqlangan' : 'Saqlash'}
                         </button>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* MOBILE FLOATING ACTION BAR */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[130] w-[92%] max-w-md bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 flex gap-3 shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-fade-in md:hidden">
          <button 
            onClick={() => handlePlay()}
            className="flex-grow bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95"
          >
            <Play size={20} fill="currentColor"/> Ko'rish {currentEpisode ? `(${currentEpisode.title})` : ''}
          </button>
          <button 
            onClick={handleToggleSave}
            className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all ${isSaved ? 'bg-white text-black' : 'bg-white/10 text-white border border-white/5'}`}
          >
            <Bookmark size={24} fill={isSaved ? "black" : "none"} />
          </button>
      </div>

    </div>
  );
};