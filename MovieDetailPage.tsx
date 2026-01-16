import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Star, Lock, ArrowLeft, MessageCircle, User, Bookmark, Calendar, Info, Clock, Languages, Award, Share2, Info as InfoIcon, Image as ImageIcon, Maximize2, ChevronDown } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'episodes' | 'details' | 'comments' | 'gallery'>('episodes');
  const [scrollY, setScrollY] = useState(0);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const isPremiumUser = useMemo(() => {
      if (!userProfile) return false;
      const hasSubscription = userProfile.subscription_end_at && new Date(userProfile.subscription_end_at) > new Date();
      return !!(hasSubscription || ['admin', 'owner', 'manager'].includes(userProfile.role));
  }, [userProfile]);

  const canWatch = movie.access_type === 'free' || isPremiumUser;

  const handlePlayClick = () => {
      if (!canWatch) {
          addNotification({ type: 'warning', title: 'Premium Kerak', message: 'Obuna bo\'lishingiz shart.' });
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
        <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden">
            {/* Background Image with Scroll Transform */}
            <div 
                className="absolute inset-0 z-0 will-change-transform"
                style={{ 
                    transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0005})`,
                    transition: 'transform 0.1s linear'
                }}
            >
                <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
                <div className="absolute inset-0 bg-black/30"></div>
            </div>

            {/* Navigation Overlay */}
            <div className={`fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-[100] transition-all duration-500 ${scrollY > 100 ? 'bg-[#050505] border-b border-white/5 py-4 shadow-2xl' : ''}`}>
                <button onClick={onBack} className="p-3 bg-black/60 hover:bg-orange-600 rounded-full border border-white/10 transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex gap-3">
                    <button onClick={() => {}} className="p-3 bg-black/60 hover:bg-zinc-800 rounded-full border border-white/10 transition-all">
                        <Share2 size={24} />
                    </button>
                    <button onClick={handleToggleSave} className={`p-3 rounded-full border transition-all ${isSaved ? 'bg-orange-600 border-orange-500' : 'bg-black/60 border-white/10 hover:bg-zinc-800'}`}>
                        <Bookmark size={24} fill={isSaved ? 'white' : 'none'} />
                    </button>
                </div>
            </div>

            {/* Title & Description Overlay - Suzip chiquvchi qism */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-20 max-w-7xl mx-auto w-full z-10">
                <div 
                    className="max-w-4xl space-y-6 animate-fade-in"
                    style={{ transform: `translateY(${scrollY * -0.1}px)` }}
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-sm uppercase tracking-widest">
                            {movie.access_type === 'premium' ? 'PREMIUM' : 'BEPUL'}
                        </span>
                        <div className="flex items-center gap-1.5 bg-black/80 border border-white/10 px-3 py-1.5 rounded-sm">
                            <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                            <span className="font-bold text-sm">{movie.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 bg-black/60 border border-white/10 px-3 py-1.5 rounded-sm uppercase tracking-widest">{movie.year} • {movie.quality}</span>
                    </div>

                    <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                        {movie.title}
                    </h1>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                        {movie.genre.split(',').map(g => (
                            <span key={g} className="text-[11px] font-black text-white/60 bg-white/5 border border-white/10 px-4 py-2 rounded-full uppercase tracking-widest">{g.trim()}</span>
                        ))}
                    </div>

                    <p className="text-zinc-300 text-sm md:text-xl leading-relaxed font-medium max-w-2xl line-clamp-3 md:line-clamp-none opacity-90 drop-shadow-lg border-l-4 border-orange-600 pl-6">
                        {movie.plot}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-8">
                        <button 
                            onClick={handlePlayClick}
                            className={`px-16 py-6 rounded-sm font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${canWatch ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-zinc-800 text-zinc-500'}`}
                        >
                            {canWatch ? <><Play fill="currentColor" size={20}/> HOZIR KO'RISH</> : <><Lock size={20}/> FAQAT PREMIUM</>}
                        </button>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="flex justify-center pt-10 animate-bounce opacity-40">
                        <ChevronDown size={32} />
                    </div>
                </div>
            </div>
        </div>

        {/* INTERACTIVE CONTENT SECTION */}
        <div className="max-w-7xl mx-auto px-6" ref={contentRef}>
            
            {/* Professional Tabs */}
            <div className="flex border-b border-white/5 mb-12 gap-10 overflow-x-auto scrollbar-hide pt-10 sticky top-16 bg-[#050505] z-50">
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
                {/* EPISODES */}
                {activeTab === 'episodes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {episodes.length > 0 ? episodes.map((ep, i) => (
                            <div 
                                key={ep.id} 
                                onClick={handlePlayClick}
                                className="group flex items-center justify-between p-6 bg-[#0f0f0f] border border-white/5 hover:border-orange-500/40 transition-all cursor-pointer rounded-sm hover:translate-y-[-4px] shadow-lg"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center font-black text-zinc-600 group-hover:bg-orange-600 group-hover:text-white transition-all text-sm rounded-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <span className="block font-black text-sm uppercase tracking-wider group-hover:text-orange-500 transition-colors">{ep.title}</span>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">24 min • FULL HD</span>
                                    </div>
                                </div>
                                <Play size={18} className="text-zinc-700 group-hover:text-orange-500 transition-colors" />
                            </div>
                        )) : (
                            <div className="col-span-full py-32 text-center bg-[#0f0f0f] border border-dashed border-zinc-800 rounded-sm">
                                <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-sm">Pleyer orqali to'liq tomosha qiling</p>
                                <button onClick={handlePlayClick} className="mt-6 px-10 py-4 bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-orange-700 transition-all rounded-sm">Pleyerni ochish</button>
                            </div>
                        )}
                    </div>
                )}

                {/* GALLERY */}
                {activeTab === 'gallery' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
                        <div className="relative group overflow-hidden rounded-sm border border-white/5 shadow-2xl">
                            <img src={movie.posterUrl} alt="Poster" className="w-full h-auto object-contain bg-zinc-900 transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute top-6 left-6 bg-orange-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-xl">Original Art</div>
                        </div>
                        <div className="flex flex-col justify-center space-y-8 p-10 bg-[#0f0f0f] border border-white/5 rounded-sm">
                            <h4 className="text-3xl font-black uppercase tracking-tighter text-orange-500">{movie.title}</h4>
                            <p className="text-zinc-400 text-lg leading-relaxed font-medium">Ushbu rasm animening rasmiy yuqori sifatli posteri hisoblanadi. Hech qanday matn va interfeys elementlarisiz to'liq sifatda ko'rishingiz mumkin.</p>
                            <div className="grid grid-cols-2 gap-6 pt-6">
                                <div className="bg-black/40 p-6 rounded-sm border border-white/5">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">Piksellar</p>
                                    <p className="text-sm font-black text-white uppercase">2000 x 3000 PX</p>
                                </div>
                                <div className="bg-black/40 p-6 rounded-sm border border-white/5">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">Manba</p>
                                    <p className="text-sm font-black text-white uppercase">Anilo CDN</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* DETAILS */}
                {activeTab === 'details' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Format", val: episodes.length > 0 ? "Serial" : "Film", icon: <Info size={20}/> },
                            { label: "Tarjimon", val: movie.translator || 'Anilo.uz', icon: <Languages size={20}/> },
                            { label: "Yil", val: movie.year, icon: <Calendar size={20}/> },
                            { label: "Sifat", val: movie.quality, icon: <Award size={20}/> },
                            { label: "Holati", val: movie.status === 'ongoing' ? 'Davomli' : 'Tugallangan', icon: <Clock size={20}/> },
                            { label: "Reyting", val: `${movie.rating}/5.0`, icon: <Star size={20}/> }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-[#0f0f0f] p-8 border border-white/5 rounded-sm group hover:border-orange-500/30 transition-all">
                                <div className="text-orange-600 mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                                <p className="font-black text-xl text-white uppercase tracking-tighter">{item.val}</p>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* COMMENTS */}
                {activeTab === 'comments' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in">
                        <div className="lg:col-span-5">
                            <div className="bg-[#0f0f0f] p-10 border border-white/5 rounded-sm sticky top-32">
                                <h3 className="text-base font-black uppercase tracking-[0.3em] mb-8 text-orange-500">Sharh yozish</h3>
                                {userProfile ? (
                                    <form onSubmit={() => {}} className="space-y-8">
                                        <div className="flex gap-4">
                                            {[1,2,3,4,5].map(num => (
                                                <button key={num} type="button" className={`transition-all ${rating >= num ? 'text-yellow-500' : 'text-zinc-800'}`}>
                                                    <Star fill={rating >= num ? 'currentColor' : 'none'} size={32} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            placeholder="Fikringiz biz uchun muhim..."
                                            className="w-full bg-black border border-zinc-800 rounded-sm p-5 text-base focus:border-orange-500 outline-none transition-all h-40 resize-none font-medium"
                                        />
                                        <button className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] hover:bg-orange-600 hover:text-white transition-all shadow-2xl">
                                            Sharhni yuborish
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center py-10 border border-zinc-800 border-dashed rounded-sm">
                                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6">Fikr qoldirish uchun tizimga kiring</p>
                                        <button className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 border-b border-orange-500/30 pb-1">Kirish / Ro'yxatdan o'tish</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-7 space-y-6">
                            {reviews.length === 0 ? (
                                <div className="py-24 text-center bg-[#0f0f0f] border border-white/5 rounded-sm">
                                    <p className="text-zinc-500 font-bold italic">Hozircha sharhlar yo'q. Birinchi bo'lib fikr bildiring!</p>
                                </div>
                            ) : reviews.map(rev => (
                                <div key={rev.id} className="bg-[#0f0f0f] border border-white/5 p-8 rounded-sm hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                                            {rev.profiles?.avatar_url ? <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={24} className="m-4 text-zinc-600"/>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-black uppercase text-white tracking-widest">{rev.profiles?.full_name || 'Mehmon'}</p>
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase">{new Date(rev.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-1 text-yellow-500">
                                                {Array.from({length: rev.rating}).map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300 text-base leading-relaxed font-medium pl-16 border-l border-orange-600/20">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RELATED ANIMES */}
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