import React, { useState, useEffect, useRef } from 'react';
import { Movie, Episode, Review } from './types';
import { getReviews, checkIsSaved, addToSaved, removeFromSaved, incrementMovieView, getEpisodes } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Play, Bookmark, ArrowLeft, Star, Clock, Eye, Info, ChevronDown } from 'lucide-react';

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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Init data
    Promise.all([
        getReviews(movie.id!),
        getEpisodes(movie.id!),
        checkSavedStatus(),
        incrementMovieView(movie.id!)
    ]).then(([revs, eps]) => {
        setReviews(revs);
        setEpisodes(eps);
        if (eps.length > 0) setCurrentEpisode(eps[0]);
        setIsLoading(false);
    });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [movie.id]);

  const checkSavedStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setIsSaved(await checkIsSaved(user.id, movie.id!));
  };

  const handleToggleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return addNotification({ type: 'warning', title: 'Login', message: 'Saqlash uchun kiring' });
    
    if (isSaved) {
        await removeFromSaved(user.id, movie.id!);
        setIsSaved(false);
    } else {
        await addToSaved(user.id, movie.id!);
        setIsSaved(true);
        addNotification({ type: 'success', title: 'Saqlandi', message: 'Ro\'yxatga qo\'shildi' });
    }
  };

  const handlePlay = () => {
    if (episodes.length > 0 && currentEpisode) {
        onPlay({ ...movie, title: `${movie.title} - ${currentEpisode.title}`, videoUrl: currentEpisode.source as string });
    } else {
        onPlay();
    }
  };

  // Dinamik header effektlari
  const headerHeight = 550;
  const opacity = Math.max(0, 1 - scrollY / (headerHeight * 0.8));
  const scale = scrollY < 0 ? 1 + Math.abs(scrollY) / 500 : 1; // Stretch effect
  const blur = Math.min(20, scrollY / 20);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-white">
      
      {/* FLOATING BACK BUTTON */}
      <button 
        onClick={onBack}
        className="fixed top-6 left-6 z-[150] w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-all shadow-2xl"
      >
        <ArrowLeft size={24} />
      </button>

      {/* STRETCHY PARALLAX HEADER */}
      <div className="relative w-full overflow-hidden" style={{ height: `${headerHeight}px` }}>
        <div 
            className="absolute inset-0 z-0"
            style={{ 
                transform: `scale(${scale}) translateY(${scrollY * 0.3}px)`,
                filter: `blur(${blur}px)`
            }}
        >
          <img src={movie.posterUrl} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0c]/60 to-[#0a0a0c]"></div>
        </div>

        {/* Content on Image */}
        <div 
            className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-16 container mx-auto"
            style={{ opacity }}
        >
            <div className="max-w-4xl space-y-6">
                <div className="flex items-center gap-3">
                    <span className="bg-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Premium</span>
                    <span className="flex items-center gap-1.5 text-yellow-500 font-black"><Star size={16} fill="currentColor"/> {movie.rating.toFixed(1)}</span>
                </div>
                <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none">{movie.title}</h1>
                <div className="flex items-center gap-6 text-gray-400 font-bold text-sm">
                    <span>{movie.year}</span>
                    <span>{movie.genre.split(',')[0]}</span>
                    <span>{movie.quality}</span>
                </div>
            </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-20 -mt-10 bg-[#0a0a0c] rounded-t-[3rem] p-6 md:p-16 container mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            {/* Left: Info */}
            <div className="lg:col-span-2 space-y-12">
                <section>
                    <h2 className="text-xl font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-3">
                        <Info size={18}/> Storyline
                    </h2>
                    <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-medium">
                        {movie.plot}
                    </p>
                </section>

                {episodes.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-3">
                            <Play size={18}/> Episodes ({episodes.length})
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
                        </div>
                    </section>
                )}

                {/* Reviews Section */}
                <section className="pt-10 border-t border-white/5">
                     <h2 className="text-xl font-black uppercase tracking-widest text-gray-500 mb-8">Fan Reviews</h2>
                     <div className="space-y-6">
                        {reviews.length === 0 ? <p className="text-gray-600 italic">Be the first to review!</p> : (
                            reviews.slice(0, 5).map(r => (
                                <div key={r.id} className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <div className="flex justify-between mb-4">
                                        <span className="font-bold text-orange-500">@{r.profiles?.username || 'anonymous'}</span>
                                        <div className="flex text-yellow-500"><Star size={14} fill="currentColor"/> {r.rating}</div>
                                    </div>
                                    <p className="text-gray-300">{r.comment}</p>
                                </div>
                            ))
                        )}
                     </div>
                </section>
            </div>

            {/* Right: Sidebar Metadata */}
            <div className="space-y-8">
                 <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="font-black uppercase tracking-widest text-xs text-gray-500">Details</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Language</span>
                            <span className="font-bold">{movie.language}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Status</span>
                            <span className="font-bold text-green-500 uppercase text-xs tracking-tighter">{movie.status}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Studio</span>
                            <span className="font-bold text-orange-500">{movie.translator || 'Anilo'}</span>
                        </div>
                    </div>
                 </div>

                 {/* Stats Card */}
                 <div className="flex gap-4">
                    <div className="flex-1 bg-white/5 p-6 rounded-3xl text-center border border-white/10">
                        <p className="text-2xl font-black text-white">{movie.view_count || 0}</p>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Views</p>
                    </div>
                    <div className="flex-1 bg-white/5 p-6 rounded-3xl text-center border border-white/10">
                        <p className="text-2xl font-black text-white">{reviews.length}</p>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Reviews</p>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* MOBILE FLOATING ACTION BAR */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex gap-2 shadow-2xl animate-fade-in">
          <button 
            onClick={handlePlay}
            className="flex-grow bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-full flex items-center justify-center gap-3 transition-all"
          >
            <Play size={18} fill="currentColor"/> {episodes.length > 0 ? `Play ${currentEpisode?.title}` : 'Watch Now'}
          </button>
          <button 
            onClick={handleToggleSave}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            <Bookmark size={22} fill={isSaved ? "black" : "none"} />
          </button>
      </div>

    </div>
  );
};