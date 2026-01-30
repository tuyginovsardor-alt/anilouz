
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomePage } from './WelcomePage';
import { SearchPage } from './SearchPage';
import { DashboardPage } from './DashboardPage';
import { AuthModal } from './components/AuthModal';
import { Movie, UserRole, Ad, Notification, Episode, UserProfile } from './types';
import { MovieDetailPage } from './MovieDetailPage';
import { VideoPlayerPage } from './VideoPlayerPage';
import { AdminPage } from './AdminPage';
import { DubDashboard } from './DubDashboard';
import { StudioPage } from './StudioPage';
import { ShopPage } from './ShopPage';
import { ShopAdminPage } from './ShopAdminPage';
import { CatalogPage } from './CatalogPage'; 
import { FandubDashboard } from './FandubDashboard';
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { CopyrightPage } from './CopyrightPage';
import { Home, Search, Sparkles, User, X, Layers, LayoutGrid, ShoppingBag, WifiOff, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getAppConfig, getUserProfile, getMovies } from './services/dbService';
import { pruneCache, clearAppCache } from './services/cacheService';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { HamburgerMenu } from './components/HamburgerMenu';
import { LegalDocs } from './components/LegalDocs';
import { PWAProvider } from './components/InstallPWA';

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'dub-dashboard' | 'studio' | 'shop' | 'shop-admin' | 'catalog' | 'fandub-dashboard';
export type DashboardSubPage = 'main' | 'profile' | 'settings' | 'history' | 'saved' | 'account' | 'billing' | 'plans' | 'more' | 'support';
export type AdminSubPage = 'dashboard' | 'sessions' | 'broadcasts' | 'users' | 'movies' | 'settings' | 'financials' | 'support' | 'advertisements' | 'promocodes' | 'customization' | 'sitemap' | 'security' | 'stamp_tool' | 'bundle_manager';
export type LegalDocType = 'privacy' | 'terms';

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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, ...notification }]);
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
          
          // 1. Keshni tekshirish va tozalash
          pruneCache();
          
          const safetyTimeout = setTimeout(() => {
              setShowRetryButton(true);
          }, 8000);

          const params = new URLSearchParams(window.location.search);
          const movieIdParam = params.get('movie_id');

          // 2. Supabase sessiyasini olish (Xavfsiz)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession().catch(err => ({ data: { session: null }, error: err }));
          
          if (sessionError) throw sessionError;

          if (session) {
              setIsAuthenticated(true); 
              await refreshProfile();
              
              if (movieIdParam) {
                  const allMovies = await getMovies();
                  const found = allMovies.find(m => m.id === Number(movieIdParam));
                  if (found) {
                      setSelectedMovie(found);
                  }
              }
              setPage('dashboard');
          } else {
              if (movieIdParam) {
                  setIsAuthModalOpen(true);
              }
              setPage('welcome');
          }
          
          clearTimeout(safetyTimeout);
          setIsAppReady(true);
      } catch (e: any) { 
          console.error("FATAL INIT ERROR:", e);
          setInitError(e.message || "Tizim yuklanishida xatolik");
          // Xatolik bo'lsa keshni o'chirib yuborishga harakat qilamiz
          clearAppCache();
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

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        subscription.unsubscribe();
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigation = (targetPage: Page) => {
    setPage(targetPage);
    if (targetPage === 'dashboard') setDashboardPage('main');
    setSelectedMovie(null);
    setIsSearchOpen(false);
    window.history.pushState({}, '', window.location.pathname);
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

  const handleCloseMovieDetail = () => {
      setSelectedMovie(null);
      window.history.pushState({}, '', window.location.pathname);
  };

  // --- REPAIR / FIX SYSTEM ---
  const handleRepair = () => {
      clearAppCache();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
  };

  if (initError) {
      return (
          <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                  <AlertTriangle size={48} className="text-red-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase mb-2">Tizimda nosozlik</h2>
              <p className="text-zinc-500 text-sm mb-10 max-w-sm">Kesh yoki sessiya ma'lumotlari buzilgan bo'lishi mumkin. Saytni qayta tiklashni maslahat beramiz.</p>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button 
                      onClick={handleRepair} 
                      className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-orange-500 transition-all active:scale-95"
                  >
                      <RefreshCw size={16} /> Tizimni Ta'mirlash
                  </button>
                  <button 
                      onClick={() => window.location.reload()} 
                      className="w-full py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:text-white transition-all"
                  >
                      Shunchaki yangilash
                  </button>
              </div>
          </div>
      );
  }

  if (!isAppReady) {
      return (
          <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-4 relative">
              <div className="w-16 h-16 relative">
                  <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] animate-pulse">
                  {showRetryButton ? "Internet sekinlashmoqda..." : "ANILO yuklanmoqda..."}
              </p>
              {showRetryButton && (
                  <div className="flex flex-col items-center gap-3 animate-fade-in mt-4">
                      <button 
                          onClick={() => window.location.reload()} 
                          className="px-8 py-3 bg-zinc-900 border border-white/10 text-white rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800"
                      >
                          <RefreshCw size={12} /> Qayta urinish
                      </button>
                      <button onClick={handleRepair} className="text-[9px] text-zinc-700 font-bold uppercase hover:text-zinc-500">Keshni tozalab kirish</button>
                  </div>
              )}
          </div>
      );
  }

  return (
    <PWAProvider>
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        
        {!isOnline && (
            <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1 z-[300] animate-fade-in flex items-center justify-center gap-2">
                <WifiOff size={12} /> Offline Rejim
            </div>
        )}

        <div className="min-h-screen text-gray-100 flex flex-col bg-[#050505]">
          
          {!selectedMovie && !isPlayerActive && !activeVideoAd && page !== 'welcome' && (
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
            />
          )}
          
          <main className={`flex-1 ${selectedMovie || isPlayerActive || page === 'welcome' ? '' : (page === 'copyright' ? '' : 'pt-20 pb-32 md:pb-20')}`}>
                {activeVideoAd && selectedMovie && <VideoAdPlayer ad={activeVideoAd} onFinish={() => {setActiveVideoAd(null); setIsPlayerActive(true);}} />}
                {isPlayerActive && selectedMovie && !activeVideoAd && (
                    <VideoPlayerPage movie={selectedMovie} episode={activeEpisode} onBack={() => setIsPlayerActive(false)} />
                )}
                
                {!isPlayerActive && !activeVideoAd && (
                  <>
                    {selectedMovie ? (
                      <MovieDetailPage 
                        movie={selectedMovie} 
                        onBack={handleCloseMovieDetail} 
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
                        {page === 'copyright' && <CopyrightPage onBack={() => setPage('welcome')} />}
                        {page === 'dub-dashboard' && <DubDashboard />}
                        {page === 'studio' && <StudioPage onArtistClick={setSelectedArtistId} onMovieClick={handleMovieClick} />}
                        {page === 'shop' && <ShopPage />}
                        {page === 'shop-admin' && <ShopAdminPage />}
                        {page === 'fandub-dashboard' && <FandubDashboard />}
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

          {!selectedMovie && !isPlayerActive && page !== 'admin' && page !== 'welcome' && page !== 'copyright' && (
            <div className="fixed bottom-0 left-0 right-0 z-[110] md:hidden">
                <div className="bg-[#050505]/95 backdrop-blur-xl h-20 flex justify-around items-center px-2 border-t border-zinc-900 pb-2">
                    <button onClick={() => handleNavigation('dashboard')} className={`flex flex-col items-center gap-1 w-1/5 ${page === 'dashboard' && dashboardPage === 'main' ? 'text-orange-500' : 'text-zinc-600'}`}><Home size={22} /><span className="text-[9px] font-black uppercase">Asosiy</span></button>
                    <button onClick={() => handleNavigation('catalog')} className={`flex flex-col items-center gap-1 w-1/5 ${page === 'catalog' ? 'text-orange-500' : 'text-zinc-600'}`}><Layers size={22} /><span className="text-[9px] font-black uppercase">Katalog</span></button>
                    <button onClick={() => handleNavigation('shop')} className={`flex flex-col items-center gap-1 w-1/5 -mt-6 group`}><div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#050505] ${page === 'shop' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}><ShoppingBag size={20} /></div><span className={`text-[9px] font-black uppercase ${page === 'shop' ? 'text-orange-500' : 'text-zinc-600'}`}>Do'kon</span></button>
                    <button onClick={() => handleNavigation('studio')} className={`flex flex-col items-center gap-1 w-1/5 ${page === 'studio' ? 'text-orange-500' : 'text-zinc-600'}`}><LayoutGrid size={22} /><span className="text-[9px] font-black uppercase">Fandub</span></button>
                    
                    <button onClick={() => {if(isAuthenticated) setIsMenuOpen(true); else setIsAuthModalOpen(true);}} className={`flex flex-col items-center gap-1 w-1/5 ${isMenuOpen ? 'text-orange-500' : 'text-zinc-600'}`}>
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
        </div>
    </NotificationContext.Provider>
    </PWAProvider>
  );
};

export default App;
