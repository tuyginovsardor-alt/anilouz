import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HeroSlider } from './components/HeroSlider';
import { ContinueWatching } from './components/ContinueWatching';
import { AnimeCard } from './components/AnimeCard';
import { AnimeDetailView } from './components/AnimeDetailView';
import { GenrePills } from './components/GenrePills';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { SearchModal } from './components/SearchModal';
import { PremiumModal } from './components/PremiumModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FavoritesView } from './components/FavoritesView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { CommunityChatView } from './components/CommunityChatView';
import { Footer } from './components/Footer';
import { AuthView } from './components/AuthView';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

import { ANIME_DATABASE, GENRES_DATA, INITIAL_CONTINUE_WATCHING } from './data/animeData';
import { Anime, ActiveTab, WatchProgress, UserProfile } from './types';
import { ChevronRight, Flame, Sparkles, Tv, Clapperboard, Film, PlayCircle, Star, Monitor, Smartphone, LayoutGrid } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [animeList, setAnimeList] = useState<Anime[]>(ANIME_DATABASE);
  const [isAnimeLoading, setIsAnimeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [cardFormat, setCardFormat] = useState<'16/9' | '2/3'>('16/9');

  // Detail view state
  const [detailAnime, setDetailAnime] = useState<Anime | null>(null);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active Video Player state
  const [activeAnime, setActiveAnime] = useState<Anime | null>(null);
  const [activeEpisodeNum, setActiveEpisodeNum] = useState<number>(1);

  // Favorites state (persisted in localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('anilo_favorites');
      return saved ? JSON.parse(saved) : ['naruto-shippuuden', 'jujutsu-kaisen-2', 'solo-leveling'];
    } catch {
      return ['naruto-shippuuden', 'jujutsu-kaisen-2', 'solo-leveling'];
    }
  });

  // History state (persisted in localStorage)
  const [history, setHistory] = useState<WatchProgress[]>(() => {
    try {
      const saved = localStorage.getItem('anilo_history');
      return saved ? JSON.parse(saved) : INITIAL_CONTINUE_WATCHING;
    } catch {
      return INITIAL_CONTINUE_WATCHING;
    }
  });

  // User profile state (persisted in localStorage)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('anilo_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.coverImage && parsed.coverImage.includes('ibb.co')) {
          parsed.coverImage = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop';
        }
        return parsed;
      }
    } catch {
      // ignore error
    }
    return {
      name: 'ANILO EGA²',
      avatar: 'https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg',
      coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
      isPremium: true,
    };
  });

  // Language state
  const [lang, setLang] = useState('UZ');

  useEffect(() => {
    // If supabase is not configured, skip auth/fetch
    if (!supabase) {
      console.log('Supabase not configured, running in local mode');
      setIsAuthLoading(false);
      setIsAnimeLoading(false);
      return;
    }

    // Safety timeout for loading state
    const timeout = setTimeout(() => {
      if (isAuthLoading) {
        console.warn('Auth session check timed out');
        setIsAuthLoading(false);
      }
    }, 5000);

    // Check active session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        console.log('Session check complete:', !!session);
        setSession(session);
        if (session?.user) {
          // Fetch additional profile data from Supabase
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && profile) {
            setUser({
              name: profile.full_name || session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
              avatar: profile.avatar_url || session.user.user_metadata.avatar_url || 'https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg',
              coverImage: profile.banner_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
              isPremium: !!profile.subscription_plan || false,
              balance: Number(profile.balance) || 0,
              role: profile.role || 'user',
            });
          } else if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const newProfile = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
              avatar_url: session.user.user_metadata.avatar_url || 'https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg',
              balance: 0,
              language: 'uz'
            };
            await supabase.from('profiles').insert([newProfile]);
            
            setUser({
              name: newProfile.full_name,
              avatar: newProfile.avatar_url,
              coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
              isPremium: false,
              balance: 0,
            });
          }
        }
      })
      .catch(err => {
        console.error('Session check error:', err);
      })
      .finally(() => {
        setIsAuthLoading(false);
        clearTimeout(timeout);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            name: profile.full_name,
            avatar: profile.avatar_url,
            coverImage: profile.banner_url,
            isPremium: !!profile.subscription_plan,
            balance: Number(profile.balance) || 0,
            role: profile.role || 'user',
          });
        }
      }
    });

    // Fetch anime from Supabase
    const fetchAnime = async () => {
      try {
        const { data, error } = await supabase
          .from('anime')
          .select('*, episodes(*)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setAnimeList(data as Anime[]);
        }
      } catch (err) {
        console.error('Error fetching anime from Supabase:', err);
      } finally {
        setIsAnimeLoading(false);
      }
    };

    // Fetch User Data (Favorites & History)
    const fetchUserData = async (userId: string) => {
      try {
        // Fetch Favorites
        const { data: favs } = await supabase
          .from('favorites')
          .select('anime_id')
          .eq('user_id', userId);
        
        if (favs) {
          setFavorites(favs.map(f => f.anime_id));
        }

        // Fetch History
        const { data: hist } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (hist) {
          const formattedHistory: WatchProgress[] = hist.map(h => ({
            animeId: h.anime_id,
            animeTitle: h.anime_title,
            posterImage: h.poster_image,
            episodeNumber: h.episode_number,
            progressPercentage: h.progress_percentage,
            lastWatchedAt: new Date(h.updated_at).getTime()
          }));
          setHistory(formattedHistory);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchAnime();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('anilo_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('anilo_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('anilo_user_profile', JSON.stringify(user));
  }, [user]);

  const toggleFavorite = async (animeId: string) => {
    const isFav = favorites.includes(animeId);
    
    setFavorites((prev) =>
      isFav ? prev.filter((id) => id !== animeId) : [...prev, animeId]
    );

    if (session?.user) {
      if (isFav) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('anime_id', animeId);
      } else {
        await supabase
          .from('favorites')
          .insert([{ user_id: session.user.id, anime_id: animeId }]);
      }
    }
  };

  const handlePlayAnime = (anime: Anime, episodeNum = 1) => {
    setActiveAnime(anime);
    setActiveEpisodeNum(episodeNum);
  };

  const updateWatchProgress = async (animeId: string, episodeNum: number, pct: number) => {
    const targetAnime = animeList.find((a) => a.id === animeId);
    if (!targetAnime) return;

    setHistory((prev) => {
      const existingIdx = prev.findIndex((item) => item.animeId === animeId);
      const updatedItem: WatchProgress = {
        animeId,
        animeTitle: targetAnime.title,
        posterImage: targetAnime.posterImage,
        episodeNumber: episodeNum,
        progressPercentage: pct,
        lastWatchedAt: Date.now(),
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedItem;
        return copy;
      }
      return [updatedItem, ...prev];
    });

    if (session?.user) {
      await supabase
        .from('watch_history')
        .upsert([{
          user_id: session.user.id,
          anime_id: animeId,
          anime_title: targetAnime.title,
          poster_image: targetAnime.posterImage,
          episode_number: episodeNum,
          progress_percentage: pct,
          updated_at: new Date().toISOString()
        }], { onConflict: 'user_id,anime_id' });
    }
  };

  // Filter lists based on selected genre & current view tab
  const getDisplayedAnimeList = (): { title: string; subtitle?: string; list: Anime[] } => {
    let list = animeList;

    if (selectedGenre) {
      list = list.filter((a) => a.genres.includes(selectedGenre));
    }

    switch (activeTab) {
      case 'anime':
        return { title: selectedGenre ? `${selectedGenre} Animelari` : 'Barcha Animelar', list };
      case 'series':
        return { title: 'Anime Seriallar', list: list.filter((a) => a.totalEpisodes > 1) };
      case 'movies':
        return { title: 'Anime Filmlar va Speshl', list: list.filter((a) => a.totalEpisodes <= 2) };
      case 'new':
        return { title: 'Yangi Chiqqan Animelar', list: list.filter((a) => a.isNew || a.year >= 2024) };
      case 'popular':
        return { title: 'Mashhur va Top Animelar', list: list.filter((a) => a.rating >= 8.5) };
      case 'ongoing':
        return { title: 'Ongoing (Davom etayotgan)', list: list.filter((a) => a.status === 'Ongoing') };
      case 'genres':
        return { title: selectedGenre ? `${selectedGenre} Janri` : 'Barcha Janrdagi Animelar', list };
      default:
        return { title: 'Tavsiya etilgan animelar', list };
    }
  };

  const favoritedAnimeObjects = animeList.filter((a) => favorites.includes(a.id));
  const displayedContent = getDisplayedAnimeList();

  const popularAnime = animeList.filter((a) => a.isPopular || a.rating >= 8.5);
  const newAnime = animeList.filter((a) => a.isNew || a.year === 2024);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session && supabase) {
    return <AuthView onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#0E0E12] text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-black">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setDetailAnime(null);
          setActiveTab(tab);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
        favoritesCount={favorites.length}
        historyCount={history.length}
        user={user}
        currentLang={lang}
        onChangeLang={setLang}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Workspace Layout (Sidebar + Main View Area) */}
      <div className="flex-1 flex max-w-[1800px] w-full mx-auto">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setDetailAnime(null);
            setActiveTab(tab);
          }}
          selectedGenre={selectedGenre}
          onSelectGenre={(genre) => {
            setDetailAnime(null);
            setSelectedGenre(genre);
          }}
          genres={GENRES_DATA}
          onOpenPremium={() => setIsPremiumOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 pb-28 lg:pb-12">
          
          {/* Detail View Pane */}
          {detailAnime ? (
            <AnimeDetailView
              anime={detailAnime}
              allAnime={animeList}
              onPlayAnime={handlePlayAnime}
              onOpenDetail={(anime) => setDetailAnime(anime)}
              onToggleFavorite={toggleFavorite}
              isFavorite={favorites.includes(detailAnime.id)}
              onBack={() => setDetailAnime(null)}
            />
          ) : activeTab === 'favorites' ? (
            /* View 1: Favorites */
            <FavoritesView
              favorites={favoritedAnimeObjects}
              onPlayAnime={handlePlayAnime}
              onOpenDetail={(anime) => setDetailAnime(anime)}
              onToggleFavorite={toggleFavorite}
              onClearFavorites={() => setFavorites([])}
            />
          ) : activeTab === 'history' ? (
            /* View 2: History */
            <HistoryView
              history={history}
              animeList={animeList}
              onPlayAnime={handlePlayAnime}
              onClearHistory={() => setHistory([])}
            />
          ) : activeTab === 'community' ? (
            /* View: Glassmorphism Community Chat */
            <CommunityChatView
              user={user}
              onBack={() => setActiveTab('home')}
            />
          ) : activeTab === 'profile' ? (
            /* View 3: Profile */
            <ProfileView
              user={user}
              onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
              setActiveTab={(tab) => {
                setDetailAnime(null);
                setActiveTab(tab);
              }}
              onOpenPremium={() => setIsPremiumOpen(true)}
              savedCount={favorites.length}
              historyCount={history.length}
              onAnimeAdded={(newAnime) => setAnimeList(prev => [newAnime, ...prev])}
            />
          ) : activeTab === 'home' && !selectedGenre ? (
            /* View 3: Default Home Screen */
            <div className="space-y-8 sm:space-y-10">
              
              {/* Full-width Grand Hero Showcase Banner */}
              <div className="w-full">
                <HeroSlider
                  animeList={animeList}
                  onPlayAnime={handlePlayAnime}
                  onOpenDetail={(anime) => setDetailAnime(anime)}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={(id) => favorites.includes(id)}
                />
              </div>

              {/* Mobile Format Preference & View Switcher Strip */}
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#151522] border border-white/10 shadow-lg">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-orange-400" />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    Ko'rinish formati:
                  </span>
                  <span className="text-[11px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                    {cardFormat === '16/9' ? '16:9 Mobil Komfort' : '2:3 Vertikal'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setCardFormat('16/9')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      cardFormat === '16/9'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>16:9 Keng</span>
                  </button>

                  <button
                    onClick={() => setCardFormat('2/3')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      cardFormat === '2/3'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>2:3 Poster</span>
                  </button>
                </div>
              </div>

              {/* Continue Watching Strip (If history exists) or Featured Quick Bar */}
              {history.length > 0 && (
                <div className="w-full">
                  <ContinueWatching
                    progressList={history.slice(0, 4)}
                    animeList={animeList}
                    onPlayAnime={handlePlayAnime}
                  />
                </div>
              )}

              {/* Mashhur animelar (Popular Anime Grid Section) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                      Mashhur animelar
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setDetailAnime(null);
                      setActiveTab('popular');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
                  >
                    <span>Barchasini ko'rish</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative">
                  <div className={
                    cardFormat === '16/9'
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6"
                      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-5"
                  }>
                    {popularAnime.slice(0, cardFormat === '16/9' ? 6 : 10).map((anime) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        onPlayAnime={handlePlayAnime}
                        onOpenDetail={(anime) => setDetailAnime(anime)}
                        onToggleFavorite={toggleFavorite}
                        isFavorite={favorites.includes(anime.id)}
                        variant={cardFormat === '16/9' ? 'widescreen' : 'poster'}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Yangi chiqarilganlar (Newly Released Section) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                      Yangi chiqarilganlar
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setDetailAnime(null);
                      setActiveTab('new');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
                  >
                    <span>Barchasini ko'rish</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative">
                  <div className={
                    cardFormat === '16/9'
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6"
                      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-5"
                  }>
                    {newAnime.slice(0, cardFormat === '16/9' ? 6 : 10).map((anime) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        onPlayAnime={handlePlayAnime}
                        onOpenDetail={(anime) => setDetailAnime(anime)}
                        onToggleFavorite={toggleFavorite}
                        isFavorite={favorites.includes(anime.id)}
                        variant={cardFormat === '16/9' ? 'widescreen' : 'poster'}
                      />
                    ))}
                  </div>
                </div>
              </section>

            </div>
          ) : (
            /* View 4: Filtered Category / Subpage Grid View */
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {displayedContent.title}
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Jami {displayedContent.list.length} ta anime topildi
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Format Switcher button for subpages */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setCardFormat('16/9')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        cardFormat === '16/9' ? 'bg-orange-500 text-black' : 'text-gray-400'
                      }`}
                      title="16:9 Keng format"
                    >
                      16:9
                    </button>
                    <button
                      onClick={() => setCardFormat('2/3')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        cardFormat === '2/3' ? 'bg-orange-500 text-black' : 'text-gray-400'
                      }`}
                      title="2:3 Poster"
                    >
                      2:3
                    </button>
                  </div>

                  {selectedGenre && (
                    <button
                      onClick={() => setSelectedGenre(null)}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold"
                    >
                      Filtr: {selectedGenre} (X)
                    </button>
                  )}
                </div>
              </div>

              <GenrePills
                genres={GENRES_DATA}
                selectedGenre={selectedGenre}
                onSelectGenre={(genre) => {
                  setDetailAnime(null);
                  setSelectedGenre(genre);
                }}
              />

              {displayedContent.list.length === 0 ? (
                <div className="text-center py-20 bg-[#14141E] border border-white/5 rounded-3xl">
                  <p className="text-sm text-gray-400">
                    Ushbu janr va toifada animelar topilmadi.
                  </p>
                </div>
              ) : (
                <div className={
                  cardFormat === '16/9'
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6"
                    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-5"
                }>
                  {displayedContent.list.map((anime) => (
                    <AnimeCard
                      key={anime.id}
                      anime={anime}
                      onPlayAnime={handlePlayAnime}
                      onOpenDetail={(anime) => setDetailAnime(anime)}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={favorites.includes(anime.id)}
                      variant={cardFormat === '16/9' ? 'widescreen' : 'poster'}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setDetailAnime(null);
          setActiveTab(tab);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
        favoritesCount={favorites.length}
      />

      {/* Modals */}
      <VideoPlayerModal
        anime={activeAnime}
        initialEpisodeNum={activeEpisodeNum}
        onClose={() => setActiveAnime(null)}
        onToggleFavorite={toggleFavorite}
        isFavorite={activeAnime ? favorites.includes(activeAnime.id) : false}
        onUpdateWatchProgress={updateWatchProgress}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        animeList={animeList}
        genres={GENRES_DATA}
        onPlayAnime={handlePlayAnime}
        onOpenDetail={(anime) => setDetailAnime(anime)}
      />

      <PremiumModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
        user={user}
        onUpgradeSuccess={() => setUser({ ...user, isPremium: true })}
      />

    </div>
  );
}
