import React, { useState, useEffect, useMemo } from 'react';
import { Play, Star, Lock } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { getUserProfile } from './services/dbService';
import { Movie, UserProfile } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';

// Fix: Define missing interface MovieDetailPageProps
interface MovieDetailPageProps {
  movie: Movie;
  onBack: () => void;
  onPlay: () => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onBack, onPlay }) => {
  // Fix: Initialize missing state variables
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const { addNotification } = useNotification();

  // Fix: Correct useEffect logic with proper imports
  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            if (user) {
                const profile = await getUserProfile(user.id);
                setUserProfile(profile as UserProfile);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    init();
  }, [movie.id]);

  // Fix: Use useMemo for performance and reactivity
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

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0c]"><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in pb-20 bg-[#0a0a0c] min-h-screen text-white">
        <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover opacity-40 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent"></div>
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
                <div className="flex items-center gap-3 mb-4">
                    {movie.access_type === 'premium' ? (
                        <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase shadow-lg shadow-yellow-500/30 flex items-center gap-1">
                            <Lock size={10} /> PREMIUM ACCESS
                        </span>
                    ) : (
                        <span className="bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">BEPUL</span>
                    )}
                    <span className="text-yellow-500 font-black text-xl flex items-center gap-1.5"><Star size={20} fill="currentColor"/> {movie.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">{movie.title}</h1>
                <p className="text-gray-300 max-w-2xl text-sm md:text-base mb-6">{movie.plot}</p>
                <button 
                    onClick={handlePlayClick}
                    className={`w-full md:w-max px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 ${canWatch ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                    {canWatch ? (
                        <><Play fill="currentColor" size={24}/> {currentEpisode ? `${currentEpisode.title}ni ko'rish` : "Hozir ko'rish"}</>
                    ) : (
                        <><Lock size={24}/> Faqat Premium Uchun</>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};
