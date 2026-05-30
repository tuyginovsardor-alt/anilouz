import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomePage } from './WelcomePage';
import { SearchPage } from './SearchPage';
import { DashboardPage } from './DashboardPage';
import { AuthModal } from './components/AuthModal';
import { Movie, UserRole, Ad, Notification, Episode, UserProfile, LiveStream } from './types';
import { MovieDetailPage } from './MovieDetailPage';
import { VideoPlayerPage } from './VideoPlayerPage';
import { AdminPage } from './AdminPage';
import { DubDashboard } from './DubDashboard';
import { StudioPage } from './StudioPage';
import { ShopPage } from './ShopPage';
import { ShopAdminPage } from './ShopAdminPage';
import { CatalogPage } from './CatalogPage'; 
import { FandubDashboard } from './FandubDashboard';
import { RamazonPage } from './RamazonPage'; 
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { CopyrightPage } from './CopyrightPage';
import { LiveStreamPage } from './LiveStreamPage';
import { PWAReportPage } from './PWAReportPage';
import { Home, Search, Sparkles, User, X, Layers, LayoutGrid, ShoppingBag, WifiOff, RefreshCw, AlertTriangle, Moon, Star, Maximize2, Video, Users } from 'lucide-react';
import { getUserProfile, getMovies } from './services/dbService';
import { pruneCache, clearAppCache } from './services/cacheService';
import { HamburgerMenu } from './components/HamburgerMenu';
import { LegalDocs } from './components/LegalDocs';
import { PWAProvider } from './components/InstallPWA';

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'dub-dashboard' | 'studio' | 'shop' | 'shop-admin' | 'catalog' | 'fandub-dashboard' | 'ramazon' | 'live' | 'pwa-report';
export type DashboardSubPage = 'main' | 'profile' | 'settings' | 'history' | 'saved' | 'account' | 'billing' | 'plans' | 'more' | 'support';
export type AdminSubPage = 'dashboard' | 'sessions' | 'broadcasts' | 'users' | 'movies' | 'settings' | 'financials' | 'support' | 'advertisements' | 'promocodes' | 'customization' | 'sitemap' | 'security' | 'stamp_tool' | 'bundle_manager';
export type LegalDocType = 'privacy' | 'terms';

// Ramazon bezaklari komponenti - Yorqinroq variant
const RamadanDecoration = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
    <div className="absolute top-20 left-[5%] ramadan-decoration" style={{ animationDelay: '0s' }}>
      <Moon size={50} className="text-orange-500 fill-orange-500/30" />
    </div>
    <div className="absolute top-60 right-[10%] ramadan-decoration" style={{ animationDelay: '2s' }}>
      <Star size={25} className="text-yellow-400 fill-yellow-400/50 shadow-xl" />
    </div>
    <div className="absolute bottom-1/3 left-[15%] ramadan-decoration" style={{ animationDelay: '4s' }}>
      <Star size={20} className="text-orange-400 fill-orange-400/20" />
    </div>
    <div className="absolute bottom-40 right-[5%] ramadan-decoration" style={{ animationDelay: '1s' }}>
      <Moon size={70} className="text-orange-600/40 rotate-180" />
    </div>
    <div className="absolute top-1/2 left-4 ramadan-decoration hidden md:block" style={{ animationDelay: '3s' }}>
      <Star size={15} className="text-white/20 fill-white/10" />
    </div>
  </div>
);

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('welcome');
  const [dashboardPage, setDashboardPage] = useState<DashboardSubPage>('main');
  const [adminPage, setAdminPage] = useState<AdminSubPage>('dashboard');
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine); 
  const [showRetryButton, setShowRetryButton] = useState(false); 
  const [initError, setInitError] = useState<string | null>(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType | null>(null);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [activeVideoAd, setActiveVideoAd] = useState<Ad | null>(null);

  // Global Live Stream State
  const [activeLiveStream, setActiveLiveStream] = useState<LiveStream | null>(null);
  const [isLiveMinimized, setIsLiveMinimized] = useState(false);
  const [isStreamerMode, setIsStreamerMode] = useState(false);
  const [isAnyLive, setIsAnyLive] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    // Replace existing notifications to avoid stacking ("rain" effect)
    setNotifications([{ id, ...notification }]);
  };
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const refreshProfile = async () => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const profile = await getUserProfile(user.id);
              if (profile) {
                  setUserProfile(profile);
                  setCurrentUserRole(profile.role);
                  setIsAuthenticated(true);
              }
          }
      } catch (e) {
          console.error("RefreshProfile Error:", e);
      }
  };

  const initApp = async () => {
      try {
          setIsAppReady(false);
          setInitError(null);
          setShowRetryButton(false);
          
          pruneCache();
          
          const safetyTimeout = setTimeout(() => {
              setShowRetryButton(true);
          }, 10000);

          const { data: { session }, error: sessionError } = await supabase.auth.getSession().catch(err => ({ data: { session: null }, error: err }));
          
          if (sessionError) throw sessionError;

          const params = new URLSearchParams(window.location.search);
          const pageParam = params.get('page') as Page;
          const movieIdParam = params.get('movie_id');
          const liveIdParam = params.get('live_id');

          if (session) {
              setIsAuthenticated(true); 
              await refreshProfile();
              
              if (movieIdParam) {
                  const allMovies = await getMovies();
                  const found = allMovies.find(m => m.id === Number(movieIdParam));
                  if (found) setSelectedMovie(found);
              }

              if (liveIdParam) {
                  try {
                      const { data: stream } = await supabase
                          .from('live_streams')
                          .select('*, profiles(username, avatar_url), fandub_channels(name)')
                          .eq('id', liveIdParam)
                          .maybeSingle();
                      
                      if (stream) {
                          setActiveLiveStream(stream);
                          setPage('live');
                          if (stream.status === 'ended') {
                              addNotification({ type: 'info', title: 'Efir yakunlangan', message: 'Bu jonli efir allaqachon tugagan.' });
                          }
                      }
                  } catch (e) {
                      console.error("URL Live Stream Error:", e);
                  }
              }
              
              if (pageParam && ['ramazon', 'search', 'shop', 'studio', 'catalog', 'live'].includes(pageParam)) {
                  setPage(pageParam);
              } else if (!liveIdParam) {
                  setPage('dashboard');
              }
          } else {
              setPage('welcome');
          }
          
          clearTimeout(safetyTimeout);
          setIsAppReady(true);
      } catch (e: any) { 
          console.error("FATAL INIT ERROR:", e);
          setInitError(e.message || "Tizim yuklanishida xatolik");
          localStorage.removeItem('anilo_cache_all_movies_catalog');
      }
  };

  useEffect(() => {
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            setIsAuthenticated(true);
            refreshProfile();
        } else {
            setIsAuthenticated(false);
            setCurrentUserRole('user');
            setUserProfile(null);
            setPage('welcome');
        }
    });

    // Global Live Status check
    const checkLive = async () => {
        const { data } = await supabase.from('live_streams').select('id').eq('status', 'live').limit(1);
        setIsAnyLive(!!data && data.length > 0);
    };
    checkLive();
    const liveSub = supabase.channel('global_live_check')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, () => checkLive())
        .subscribe();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        subscription.unsubscribe();
        supabase.removeChannel(liveSub);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigation = (targetPage: Page) => {
    setPage(targetPage);
    if (targetPage === 'dashboard') setDashboardPage('main');
    setSelectedMovie(null);
    setIsSearchOpen(false);
    
    const newUrl = targetPage === 'welcome' ? '/' : `/?page=${targetPage}`;
    window.history.pushState({}, '', newUrl);
    window.scrollTo(0, 0);
  };

  const handleMovieClick = (movie: Movie) => {
    if (!isAuthenticated) setIsAuthModalOpen(true);
    else {
        setSelectedMovie(movie);
        setActiveEpisode(null);
        if (movie.id) {
            window.history.pushState({ movie_id: movie.id }, '', `?movie_id=${movie.id}`);
        }
        window.scrollTo(0, 0);
    }
  };

  const handleRepair = () => {
      clearAppCache();
      window.location.href = '/';
  };

  if (initError) {
      return (
          <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={40} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-white uppercase mb-2">Yuklanishda xato</h2>
              <p className="text-zinc-500 text-sm mb-8 max-w-xs">Kesh ma'lumotlari buzilgan bo'lishi mumkin. Ilovani ta'mirlashni bosing.</p>
              <button 
                onClick={handleRepair}
                className="w-full max-w-xs py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-orange-500 transition-all"
              >
                  <RefreshCw size={16} /> Tizimni Ta'mirlash
              </button>
          </div>
      );
  }

  if (!isAppReady) {
      return (
          <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-4 relative">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] animate-pulse">
                  {showRetryButton ? "Internet sekin..." : "Yuklanmoqda..."}
              </p>
              {showRetryButton && (
                  <button onClick={handleRepair} className="mt-4 text-[10px] text-orange-500 font-bold uppercase underline">Keshni tozalab kirish</button>
              )}
          </div>
      );
  }

  const shouldHideGlobalNav = selectedMovie || isPlayerActive || activeVideoAd || 
                             ['welcome', 'admin', 'copyright', 'fandub-dashboard', 'live'].includes(page);

  return (
    <PWAProvider>
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        
        {!isOnline && (
            <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1 z-[300] flex items-center justify-center gap-2">
                <WifiOff size={12} /> Offline Rejim
            </div>
        )}

        <div className="min-h-screen text-gray-100 flex flex-col bg-[#050505] relative">
          {!shouldHideGlobalNav && (
            <Header 
              onNavigate={handleNavigation} 
              onDashboardNavigate={setDashboardPage}
              currentPage={page} 
              isAuthenticated={isAuthenticated} 
              onLoginClick={() => setIsAuthModalOpen(true)}
              onSearchClick={() => setIsSearchOpen(true)}
              onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}}
              onLogout={() => supabase.auth.signOut()}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              onNotificationClick={async (type, data) => {
                  if (['live', 'invite', 'mention'].includes(type) && data?.stream_id) {
                      try {
                          const { data: stream } = await supabase.from('live_streams').select('*, profiles(username, avatar_url), fandub_channels(name)').eq('id', data.stream_id).maybeSingle();
                          if (stream) {
                              setActiveLiveStream(stream);
                              setPage('live');
                          } else {
                              addNotification({ type: 'error', title: 'Xatolik', message: 'Efir topilmadi yoki yakunlangan.' });
                          }
                      } catch (e) {
                          console.error("Notification navigation error:", e);
                      }
                  } else if (type === 'promo') {
                      setPage('shop');
                  }
              }}
            />
          )}
          
          <main className={`flex-1 relative z-10 ${selectedMovie || isPlayerActive || page === 'welcome' ? '' : (page === 'copyright' ? '' : 'pt-20 pb-32 md:pb-20')}`}>
                {activeVideoAd && selectedMovie && <VideoAdPlayer ad={activeVideoAd} onFinish={() => {setActiveVideoAd(null); setIsPlayerActive(true);}} />}
                {isPlayerActive && selectedMovie && !activeVideoAd && (
                    <VideoPlayerPage movie={selectedMovie} episode={activeEpisode} onBack={() => setIsPlayerActive(false)} />
                )}
                
                {!isPlayerActive && !activeVideoAd && (
                  <>
                    {selectedMovie ? (
                      <MovieDetailPage 
                        movie={selectedMovie} 
                        onBack={() => setSelectedMovie(null)} 
                        onPlay={() => setIsPlayerActive(true)} 
                        onEpisodePlay={(episode) => { setActiveEpisode(episode); setIsPlayerActive(true); }} 
                        onArtistClick={setSelectedArtistId}
                        onMovieClick={handleMovieClick}
                      />
                    ) : (
                      <>
                        {page === 'welcome' && <WelcomePage onNavigate={handleNavigation} onSearch={handleNavigation as any} onMovieClick={handleMovieClick} onStart={() => setIsAuthModalOpen(true)} />}
                        {page === 'search' && <SearchPage initialQuery="" onNewSearch={() => {}} onMovieClick={handleMovieClick} />}
                        {page === 'catalog' && <CatalogPage onMovieClick={handleMovieClick} />}
                        {page === 'dashboard' && <DashboardPage viewUserId={selectedArtistId} currentPage={dashboardPage} onNavigate={setDashboardPage} onMainNavigate={handleNavigation} onSearch={() => {}} onLogout={() => supabase.auth.signOut()} onMovieClick={handleMovieClick} currentRole={currentUserRole} onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}} />}
                        {page === 'admin' && <AdminPage currentRole={currentUserRole} currentPage={adminPage} onNavigate={setAdminPage} onSwitchView={() => setPage('dashboard')} onLogout={() => supabase.auth.signOut()} />}
                        {page === 'ai-assistant' && <AiAssistantPage />}
                        {page === 'live' && (
                          <LiveStreamPage 
                            userProfile={userProfile} 
                            onBack={() => setPage('dashboard')} 
                            selectedStream={activeLiveStream}
                            setSelectedStream={setActiveLiveStream}
                            isStreamerMode={isLiveMinimized ? false : isStreamerMode} // Handle mode carefully
                            setIsStreamerMode={setIsStreamerMode}
                            isMinimized={isLiveMinimized}
                            setIsMinimized={setIsLiveMinimized}
                          />
                        )}
                        {page === 'copyright' && <CopyrightPage onBack={() => setPage('welcome')} />}
                        {page === 'dub-dashboard' && <DubDashboard />}
                        {page === 'studio' && (
                          <StudioPage 
                            onArtistClick={setSelectedArtistId} 
                            onMovieClick={handleMovieClick} 
                            onStreamClick={(stream) => {
                              setActiveLiveStream(stream);
                              setPage('live');
                            }}
                          />
                        )}
                        {page === 'shop' && <ShopPage />}
                        {page === 'shop-admin' && <ShopAdminPage />}
                        {page === 'fandub-dashboard' && <FandubDashboard />}
                        {page === 'ramazon' && <RamazonPage onBack={() => setPage('dashboard')} />}
                        {page === 'pwa-report' && (
                          <div className="pt-20">
                            <PWAReportPage />
                            <button 
                              onClick={() => setPage('welcome')}
                              className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-black rounded-full font-bold shadow-2xl z-50 flex items-center gap-2"
                            >
                              <Home size={18} /> Asosiyga qaytish
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
          </main>

          {isSearchOpen && (
              <div className="fixed inset-0 z-[200] bg-[#050505] animate-fade-in flex flex-col p-6 sm:p-10">
                  <button onClick={() => setIsSearchOpen(false)} className="absolute top-6 right-6 p-3 bg-zinc-800 rounded-full text-gray-400"><X size={28} /></button>
                  <div className="max-w-4xl mx-auto w-full pt-20">
                      <h2 className="text-4xl font-black tracking-tighter uppercase mb-8 text-white">Kashfiyot</h2>
                      <input type="text" autoFocus placeholder="Anime nomi..." onKeyDown={(e) => { if (e.key === 'Enter') { handleNavigation('search'); setIsSearchOpen(false); } }} className="w-full bg-zinc-900 border-b-2 border-orange-600/50 py-6 px-4 text-2xl font-bold outline-none focus:border-orange-500 transition-all text-white"/>
                  </div>
              </div>
          )}

          {!shouldHideGlobalNav && (
            <div className="fixed bottom-0 left-0 right-0 z-[110] md:hidden">
                <div className="bg-[#050505]/95 backdrop-blur-xl h-20 flex justify-around items-center px-2 border-t border-zinc-900 pb-2">
                    <button onClick={() => handleNavigation('dashboard')} className={`flex flex-col items-center gap-1 w-1/4 ${page === 'dashboard' && dashboardPage === 'main' ? 'text-orange-500' : 'text-zinc-600'}`}><Home size={22} /><span className="text-[9px] font-black uppercase">Asosiy</span></button>
                    <button onClick={() => handleNavigation('shop')} className={`flex flex-col items-center gap-1 w-1/4 -mt-6 group`}><div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#050505] ${page === 'shop' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}><ShoppingBag size={20} /></div><span className={`text-[9px] font-black uppercase ${page === 'shop' ? 'text-orange-500' : 'text-zinc-600'}`}>Do'kon</span></button>
                    <button onClick={() => handleNavigation('studio')} className={`flex flex-col items-center gap-1 w-1/4 relative ${page === 'studio' ? 'text-orange-500' : 'text-zinc-600'}`}>
                        <LayoutGrid size={22} />
                        {isAnyLive && <div className="absolute top-0 right-1/4 w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>}
                        <span className="text-[9px] font-black uppercase">Fandub</span>
                    </button>
                    
                    <button onClick={() => {if(isAuthenticated) setIsMenuOpen(true); else setIsAuthModalOpen(true);}} className={`flex flex-col items-center gap-1 w-1/4 ${isMenuOpen ? 'text-orange-500' : 'text-zinc-600'}`}>
                        {isAuthenticated ? (
                            <div className={`w-7 h-7 rounded-full border-2 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'border-orange-500 scale-110 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'border-zinc-700'}`}>
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                        <User size={14} className="text-zinc-400" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <User size={22} />
                        )}
                        <span className="text-[9px] font-black uppercase">Profil</span>
                    </button>
                </div>
            </div>
          )}

          {isAuthModalOpen && (
            <AuthModal 
              onClose={() => setIsAuthModalOpen(false)} 
              onAuthSuccess={() => {setIsAuthModalOpen(false); setPage('dashboard');}} 
              onOpenLegal={(type) => setLegalDocType(type)}
            />
          )}
          <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onLogout={() => { supabase.auth.signOut(); setIsMenuOpen(false); }} onMainNavigate={handleNavigation} onDashboardNavigate={setDashboardPage} onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}} onOpenLegal={(type) => setLegalDocType(type)} />
          {legalDocType && <LegalDocs type={legalDocType} onClose={() => setLegalDocType(null)} />}
          
          {/* Global Mini Player */}
          {activeLiveStream && page !== 'live' && (
            <div 
                className="fixed bottom-24 right-4 w-64 aspect-video bg-gray-900 rounded-2xl border-2 border-orange-600 shadow-2xl z-[200] overflow-hidden animate-scale-in group"
            >
                <div onClick={() => setPage('live')} className="absolute inset-0 cursor-pointer">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center animate-pulse">
                            <Video className="text-orange-500 w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-white" />
                    </div>
                </div>
                
                <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
                    <div className="bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Live</div>
                    <div className="bg-black/60 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Users size={8} />
                        {activeLiveStream.viewer_count}
                    </div>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isStreamerMode) {
                            if (window.confirm("Efirni tugatmoqchimisiz?")) {
                                setActiveLiveStream(null);
                                setIsStreamerMode(false);
                            }
                        } else {
                            setActiveLiveStream(null);
                        }
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                    <X size={14} />
                </button>

                <div className="absolute bottom-2 left-2 right-2 truncate pointer-events-none">
                    <p className="text-[10px] text-white font-bold drop-shadow-lg">{activeLiveStream.title}</p>
                </div>
            </div>
          )}
        </div>
    </NotificationContext.Provider>
    </PWAProvider>
  );
};

export default App;