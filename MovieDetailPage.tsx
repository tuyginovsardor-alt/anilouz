
import React, { useState, useEffect } from 'react';
import { Movie, Ad, Review, Episode } from './types';
import { StarIcon } from './components/icons/StarIcon';
import { UserIcon } from './components/icons/UserIcon';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { CommentIcon } from './components/icons/CommentIcon';
import { EyeIcon } from './components/icons/EyeIcon';
import { getActiveAdForLocation } from './services/adService';
import { getReviews, addReview, checkIsSaved, addToSaved, removeFromSaved, incrementMovieView, getEpisodes } from './services/dbService';
import { AdBanner } from './components/AdBanner';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';

interface MovieDetailPageProps {
  movie: Movie;
  onBack: () => void;
  onPlay: (movie?: Movie) => void;
}

const DetailTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-gray-800 text-gray-300 text-[10px] sm:text-sm font-medium px-2 py-1 sm:px-3 rounded-full whitespace-nowrap">{children}</span>
);

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; primary?: boolean; onClick?: () => void; active?: boolean; className?: string }> = ({ icon, label, primary = false, onClick, active, className = '' }) => (
    <button 
        onClick={onClick} 
        className={`flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg font-semibold transition-transform duration-200 active:scale-95 text-sm sm:text-base
        ${primary ? 'bg-purple-600 text-white hover:bg-purple-700' : active ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-800/80 backdrop-blur-sm text-gray-200 hover:bg-gray-700'}
        ${className}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const RatingBar: React.FC<{ stars: number; count: number; total: number }> = ({ stars, count, total }) => (
    <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 flex items-center w-8">{stars} <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 ml-1" /></span>
        <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
            <div className="bg-yellow-400 h-1.5 sm:h-2 rounded-full" style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}></div>
        </div>
        <span className="text-xs sm:text-sm text-gray-400 w-6 text-right">{count}</span>
    </div>
);

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onBack, onPlay }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewCount, setViewCount] = useState(movie.view_count || 0);
  
  // Episodes State
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Save Status
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSave, setIsCheckingSave] = useState(false);

  const { addNotification } = useNotification();
  
  useEffect(() => { 
      const fetchAd = async () => {
          const activeAd = await getActiveAdForLocation('detail_top');
          setAd(activeAd);
      }
      fetchAd();

      loadReviews();
      checkSavedStatus();
      
      // Increment View Count Logic
      if (movie.id) {
          incrementMovieView(movie.id);
          // Optimistically update UI
          setViewCount(prev => prev + 1);
          
          // Load Episodes
          loadEpisodes(movie.id);
      }
  }, [movie.id]);

  const loadEpisodes = async (movieId: number) => {
      setIsLoadingEpisodes(true);
      try {
          const eps = await getEpisodes(movieId);
          setEpisodes(eps);
          if (eps.length > 0) {
              setCurrentEpisode(eps[0]);
          }
      } catch (e) {
          console.error("Episodes loading failed", e);
      } finally {
          setIsLoadingEpisodes(false);
      }
  };

  const checkSavedStatus = async () => {
      if (!movie.id) return;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const saved = await checkIsSaved(user.id, movie.id);
              setIsSaved(saved);
          }
      } catch (e) { console.error(e); }
  };

  const handleToggleSave = async () => {
      if (!movie.id) return;
      if (isCheckingSave) return;

      try {
          setIsCheckingSave(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
              addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Saqlash uchun tizimga kiring.' });
              return;
          }

          if (isSaved) {
              await removeFromSaved(user.id, movie.id);
              setIsSaved(false);
              addNotification({ type: 'info', title: 'O\'chirildi', message: 'Saqlanganlardan olib tashlandi.' });
          } else {
              await addToSaved(user.id, movie.id);
              setIsSaved(true);
              addNotification({ type: 'success', title: 'Saqlandi', message: 'Anime saqlanganlarga qo\'shildi.' });
          }
      } catch (e: any) {
          console.error(e);
          addNotification({ type: 'error', title: 'Xatolik', message: 'Amalni bajarib bo\'lmadi.' });
      } finally {
          setIsCheckingSave(false);
      }
  };

  const handlePlayClick = () => {
      if (episodes.length > 0 && currentEpisode) {
          // If it's a series, create a temporary movie object with the episode's source
          const episodeMovie = {
              ...movie,
              title: `${movie.title} - ${currentEpisode.title}`,
              videoUrl: currentEpisode.source as string
          };
          onPlay(episodeMovie);
      } else {
          // Standard single movie
          onPlay();
      }
  };

  const loadReviews = async () => {
      if (!movie.id) return;
      try {
          setIsLoadingReviews(true);
          const fetchedReviews = await getReviews(movie.id);
          setReviews(fetchedReviews);
      } catch (e) {
          console.error("Error fetching reviews", e);
      } finally {
          setIsLoadingReviews(false);
      }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!movie.id) return;
      if (userRating === 0) {
          addNotification({ type: 'warning', title: 'Xatolik', message: 'Iltimos, yulduzcha bilan baholang.' });
          return;
      }

      try {
          setIsSubmitting(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
              addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Sharh yozish uchun tizimga kiring.' });
              return;
          }

          await addReview(movie.id, user.id, userRating, comment);
          
          addNotification({ type: 'success', title: 'Rahmat', message: 'Bahoyingiz qabul qilindi.' });
          setComment('');
          setUserRating(0);
          loadReviews(); // Reload
      } catch (e: any) {
          console.error(e);
          addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Saqlashda xatolik.' });
      } finally {
          setIsSubmitting(false);
      }
  };

  // Calculate stats
  const totalRatings = reviews.length;
  const averageRating = totalRatings > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalRatings 
    : movie.rating || 0;
    
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
  reviews.forEach(r => {
      if (ratingDistribution[r.rating] !== undefined) ratingDistribution[r.rating]++;
  });

  // Determine Status Badge
  const isOngoing = movie.status === 'ongoing';
  const statusLabel = isOngoing ? 'Davom etmoqda' : 'Tugallangan';
  // Updated colors for better visibility
  const statusColor = isOngoing 
      ? 'bg-yellow-500/80 text-yellow-950 border-yellow-400' 
      : 'bg-green-500/80 text-green-950 border-green-400';

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -my-8 -mt-8">
      {/* Hero Section */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[65vh] min-h-[350px] w-full overflow-hidden shadow-2xl">
        
        {/* Image is now clear (no blur) per user request */}
        <img 
            src={movie.posterUrl} 
            alt={`${movie.title} background`} 
            className="absolute inset-0 w-full h-full object-cover" 
        />
        
        {/* Enhanced Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent/20"></div>
        
        {/* Distinct Bottom Border/Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-500 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-20"></div>
        
        {/* Back Button - Absolute to Top Left */}
        <button onClick={onBack} className="absolute top-10 left-4 sm:top-12 sm:left-6 bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-black/60 transition-colors z-30 border border-white/10" aria-label="Orqaga">
            <BackArrowIcon className="w-6 h-6 text-white" />
        </button>

        {/* Hero Content - Centered on Desktop */}
        <div className="absolute inset-0 flex flex-col justify-end pb-8 sm:pb-10 z-10">
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 sm:mb-3 leading-tight drop-shadow-lg">
                    {movie.title}
                </h1>
                
                <div className="flex items-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 text-gray-300 text-sm sm:text-base">
                    <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        <span className="font-bold text-white">{averageRating.toFixed(1)}</span>
                    </div>
                    <span>{movie.year}</span>
                    <span>Anime</span>
                    <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm">
                        <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                        <span className="text-xs sm:text-sm">{viewCount.toLocaleString()}</span>
                    </div>
                    <span className={`font-bold text-xs sm:text-sm px-3 py-1 rounded border ${statusColor}`}>{statusLabel}</span>
                </div>

                {/* EPISODES LIST (Mobile & Desktop) */}
                {episodes.length > 0 && (
                    <div className="mt-4 w-full overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2">
                            {episodes.map((ep, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentEpisode(ep)}
                                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                                        currentEpisode?.title === ep.title 
                                            ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                                            : 'bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700'
                                    }`}
                                >
                                    {ep.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Play Button - Responsive sizing */}
                    <ActionButton 
                        icon={<PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />} 
                        label={episodes.length > 0 ? `Ko'rish (${currentEpisode?.title || '1-qism'})` : "Ko'rish"} 
                        primary 
                        onClick={handlePlayClick} 
                        className="w-full sm:w-auto sm:min-w-[200px]"
                    />
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                        <ActionButton 
                            icon={<BookmarkIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isSaved ? 'fill-white text-white' : ''}`} />} 
                            label={isSaved ? "Saqlangan" : "Saqlash"} 
                            onClick={handleToggleSave}
                            active={isSaved}
                            className="flex-1"
                        />
                        <ActionButton 
                            icon={<CommentIcon className="w-5 h-5 sm:w-6 sm:h-6" />} 
                            label="Izoh" 
                            onClick={() => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex-1" 
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Content Section - Modified for Constrained Width */}
      <div className="bg-[#111]">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
            <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Qisqacha Mazmun</h2>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{movie.plot}</p>
            </section>

            <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Janrlar</h2>
                <div className="flex flex-wrap gap-2">
                    {movie.genre.split(',').map(g => <DetailTag key={g}>{g.trim()}</DetailTag>)}
                </div>
            </section>
            
            <section className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-900/70 rounded-lg border border-gray-800">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ma'lumot</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-gray-400 text-sm sm:text-base">
                    <div><span className="font-semibold text-gray-200">Holat:</span> {statusLabel}</div>
                    <div><span className="font-semibold text-gray-200">Turi:</span> {episodes.length > 0 ? 'Serial' : 'Film'}</div>
                    <div><span className="font-semibold text-gray-200">Yil:</span> {movie.year}</div>
                    <div><span className="font-semibold text-gray-200">Ko'rilgan:</span> {viewCount.toLocaleString()}</div>
                    <div><span className="font-semibold text-gray-200">Reyting:</span> {averageRating.toFixed(1)}/5</div>
                    
                    {/* Tarjimon va Tags Qismi */}
                    <div className="col-span-1 sm:col-span-2 mt-2 pt-2 border-t border-gray-700">
                        <span className="font-semibold text-orange-400">Tarjima:</span> <span className="text-white font-medium ml-1">{movie.translator || 'Anilo.uz'}</span>
                    </div>
                    {movie.tags && (
                        <div className="col-span-1 sm:col-span-2">
                            <span className="font-semibold text-gray-500 text-xs uppercase">Qidiruv so'zlari:</span>
                            <p className="text-gray-400 text-xs mt-1 italic leading-relaxed">{movie.tags}</p>
                        </div>
                    )}
                </div>
            </section>

            {ad && <AdBanner ad={ad} onClose={() => setAd(null)} />}

            <section id="review-section" className="p-4 sm:p-6 bg-gray-900/70 rounded-lg border border-gray-800">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Reytinglar va Izohlar</h2>
                
                {/* Review Form */}
                <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3">O'z fikringizni qoldiring</h3>
                    <div className="flex items-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setUserRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110 p-1"
                            >
                                <StarIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${star <= userRating ? 'text-yellow-400' : 'text-gray-600'}`} />
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Anime haqida fikringiz..."
                        rows={3}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none mb-3 text-sm sm:text-base"
                    />
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
                    </button>
                </form>

                {/* Stats */}
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8">
                    <div className="text-center">
                        <p className="text-4xl sm:text-5xl font-bold text-yellow-400">{averageRating.toFixed(1)}</p>
                        <div className="flex justify-center mt-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <StarIcon key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-600'}`} />
                            ))}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">{totalRatings} ta reyting</p>
                    </div>
                    <div className="w-full flex-1">
                        {[5, 4, 3, 2, 1].map(star => (
                            <RatingBar key={star} stars={star} count={ratingDistribution[star]} total={totalRatings} />
                        ))}
                    </div>
                </div>

                {/* Review List */}
                <div className="border-t border-gray-800 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Barcha Izohlar ({reviews.length})</h3>
                    </div>
                    
                    {isLoadingReviews ? <LoadingSpinner /> : (
                        <div className="space-y-4">
                            {reviews.length === 0 && <p className="text-gray-500 text-sm">Hozircha izohlar yo'q. Birinchi bo'lib yozing!</p>}
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-gray-800/80 p-4 rounded-lg border border-gray-700/50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-700 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                {review.profiles?.avatar_url ? 
                                                    <img src={review.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover"/> : 
                                                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"/>
                                                }
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm sm:text-base">{review.profiles?.full_name || 'Foydalanuvchi'}</p>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`} />)}
                                                    <span className="text-[10px] sm:text-xs text-gray-400 ml-1">{review.rating}/5</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] sm:text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {review.comment && <p className="text-gray-300 mt-3 text-sm leading-relaxed">{review.comment}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};
