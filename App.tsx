
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomePage } from './WelcomePage';
import { SearchPage } from './SearchPage';
import { DashboardPage } from './DashboardPage';
import { AuthModal } from './components/AuthModal';
import { Movie, UserRole, Ad, Notification } from './types';
import { MovieDetailPage } from './MovieDetailPage';
import { VideoPlayerPage } from './VideoPlayerPage';
import { AdminPage } from './AdminPage';
import { DubDashboard } from './DubDashboard';
import { StudioPage } from './StudioPage';
import { ShopPage } from './ShopPage';
import { ShopAdminPage } from './ShopAdminPage';
import { CatalogPage } from './CatalogPage'; // Import CatalogPage
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { Footer } from './components/Footer';
import { CopyrightPage } from './CopyrightPage';
import { Home, Search, Bookmark, User, MoreHorizontal, X, Sparkles, Mic, Menu, ShoppingBag, LayoutGrid, Layers } from 'lucide-react';
import { getAppConfig } from './services/dbService';
import { UzumakiLogo } from './components/icons/UzumakiLogo'; // Import logo

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'dub-dashboard' | 'studio' | 'shop' | 'shop-admin' | 'catalog';
export type DashboardSubPage = 'main' | 'profile' | 'settings' | 'history' | 'saved' | 'account' | 'billing' | 'more' | 'support';
export type AdminSubPage = 'dashboard' | 'sessions' | 'broadcasts' | 'users' | 'movies' | 'settings' | 'financials' | 'support' | 'advertisements' | 'promocodes' | 'customization' | 'sitemap' | 'security' | 'stamp_tool' | 'contest' | 'cash_contest';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('welcome');
  const [dashboardPage, setDashboardPage] = useState<DashboardSubPage>('main');
  const [adminPage, setAdminPage] = useState<AdminSubPage>('dashboard');
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false); // Global Loading State

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
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

  useEffect(() => {
    const initApp = async () => {
        try {
            // 1. Config va Logo yuklash
            await getAppConfig(); 
            
            // 2. Auth tekshirish
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                await fetchUserRole(session.user.id);
            }
        } catch (e) { console.error(e); }
        finally { 
            // Simulate minimal splash duration for better UX
            setTimeout(() => setIsAppReady(true), 1500); 
        }
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            setIsAuthenticated(true);
            fetchUserRole(session.user.id);
        } else {
            setIsAuthenticated(false);
            setCurrentUserRole('user');
            setPage('welcome');
        }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data) setCurrentUserRole((data as any).role);
  };

  const handleNavigation = (targetPage: Page) => {
    setPage(targetPage);
    
    // Agar Dashboardga o'tilayotgan bo'lsa, uni bosh sahifasiga (main) reset qilamiz
    if (targetPage === 'dashboard') {
        setDashboardPage('main');
    }

    setSelectedMovie(null);
    setSelectedArtistId(null);
    setIsPlayerActive(false);
    setIsSearchOpen(false);
    window.scrollTo(0, 0);
  };

  const handleDashboardNavigation = (subPage: DashboardSubPage) => {
      setPage('dashboard');
      setDashboardPage(subPage);
      window.scrollTo(0, 0);
  }

  const handleMovieClick = (movie: Movie) => {
    if (!isAuthenticated) setIsAuthModalOpen(true);
    else {
        setSelectedMovie(movie);
        window.scrollTo(0, 0);
    }
  };

  const handleArtistClick = (userId: string) => {
      setSelectedArtistId(userId);
      setPage('dashboard');
      setDashboardPage('profile');
  };

  // GLOBAL LOADING SCREEN (CRUNCHYROLL STYLE)
  if (!isAppReady) return (
      <div className="h-screen w-full bg-[#000000] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Central Logo */}
          <div className="flex flex-col items-center gap-4 animate-fade-in">
              <UzumakiLogo className="w-20 h-20 text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-pulse" />
              <h1 className="text-3xl font-black text-white tracking-widest uppercase mt-2">ANILO</h1>
          </div>
          
          {/* Bottom Loading Bar */}
          <div className="absolute bottom-20 w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-orange-600 animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
          
          <style>{`
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
          `}</style>
      </div>
  );

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        <div className="min-h-screen text-gray-100 flex flex-col bg-[#050505]">
          
          {/* Header faqat authenticated bo'lsa yoki welcome page bo'lmasa ko'rinadi */}
          {!isPlayerActive && !activeVideoAd && page !== 'welcome' && (
            <Header 
              onNavigate={handleNavigation} 
              onDashboardNavigate={handleDashboardNavigation}
              currentPage={page} 
              isAuthenticated={isAuthenticated} 
              onLoginClick={() => setIsAuthModalOpen(true)}
              onSearchClick={() => setIsSearchOpen(true)}
              onSwitchRole={(r) => {if(['admin','owner','shop'].includes(r)) setPage('admin')}}
              onLogout={() => supabase.auth.signOut()}
            />
          )}
          
          <main className={`flex-1 ${selectedMovie || isPlayerActive || page === 'welcome' ? '' : 'pt-20 pb-32 md:pb-20'}`}>
                {activeVideoAd && selectedMovie && <VideoAdPlayer ad={activeVideoAd} onFinish={() => {setActiveVideoAd(null); setIsPlayerActive(true);}} />}
                {isPlayerActive && selectedMovie && !activeVideoAd && <VideoPlayerPage movie={selectedMovie} onBack={() => setIsPlayerActive(false)} />}
                
                {!isPlayerActive && !activeVideoAd && (
                  <>
                    {selectedMovie ? (
                      <MovieDetailPage movie={selectedMovie} onBack={() => setSelectedMovie(null)} onPlay={() => setIsPlayerActive(true)} onArtistClick={handleArtistClick} />
                    ) : (
                      <>
                        {/* onStart prop endi AuthModalni ochadi */}
                        {page === 'welcome' && <WelcomePage onSearch={(q) => {setCurrentQuery(q); setPage('search');}} onMovieClick={handleMovieClick} onStart={() => setIsAuthModalOpen(true)} />}
                        {page === 'search' && <SearchPage initialQuery={currentQuery} onNewSearch={setCurrentQuery} onMovieClick={handleMovieClick} />}
                        {page === 'catalog' && <CatalogPage onMovieClick={handleMovieClick} />} {/* New Catalog Page */}
                        {page === 'dashboard' && <DashboardPage viewUserId={selectedArtistId} currentPage={dashboardPage} onNavigate={setDashboardPage} onMainNavigate={handleNavigation} onSearch={(q) => {setCurrentQuery(q); setPage('search');}} onLogout={() => supabase.auth.signOut()} onMovieClick={handleMovieClick} currentRole={currentUserRole} onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}} />}
                        {page === 'admin' && <AdminPage currentRole={currentUserRole} currentPage={adminPage} onNavigate={setAdminPage} onSwitchView={() => setPage('dashboard')} onLogout={() => supabase.auth.signOut()} />}
                        {page === 'ai-assistant' && <AiAssistantPage />}
                        {page === 'copyright' && <CopyrightPage onBack={() => setPage('welcome')} />}
                        {page === 'dub-dashboard' && <DubDashboard />}
                        {page === 'studio' && <StudioPage onArtistClick={handleArtistClick} onMovieClick={handleMovieClick} />}
                        {page === 'shop' && <ShopPage />}
                        {page === 'shop-admin' && <ShopAdminPage />}
                      </>
                    )}
                  </>
                )}
          </main>

          {/* SEARCH MODAL */}
          {isSearchOpen && (
              <div className="fixed inset-0 z-[200] bg-[#050505] animate-fade-in flex flex-col p-6 sm:p-10">
                  <button onClick={() => setIsSearchOpen(false)} className="absolute top-6 right-6 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-gray-400">
                      <X size={28} />
                  </button>
                  <div className="max-w-4xl mx-auto w-full pt-20">
                      <div className="flex items-center gap-3 mb-8">
                          <Sparkles className="text-orange-500" size={24} />
                          <h2 className="text-4xl font-black tracking-tighter uppercase">Kashfiyot qilish vaqti</h2>
                      </div>
                      <input 
                        type="text" autoFocus placeholder="Anime nomi yoki janr..."
                        onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentQuery((e.target as HTMLInputElement).value); setPage('search'); setIsSearchOpen(false); } }}
                        className="w-full bg-zinc-900 border-b-2 border-orange-600/50 py-6 px-4 text-2xl sm:text-4xl font-bold outline-none focus:border-orange-500 transition-all text-white"
                      />
                  </div>
              </div>
          )}

          {/* MOBILE BOTTOM NAVIGATION - UPDATED */}
          {!selectedMovie && !isPlayerActive && page !== 'admin' && page !== 'welcome' && (
            <div className="fixed bottom-0 left-0 right-0 z-[110] md:hidden">
                <div className="bg-[#050505]/95 backdrop-blur-xl h-20 flex justify-around items-center px-4 border-t border-zinc-900 pb-2">
                    {[
                        { id: 'dashboard', label: 'Asosiy', icon: <Home size={24} />, active: page === 'dashboard' && dashboardPage === 'main' },
                        { id: 'catalog', label: 'Katalog', icon: <Layers size={24} />, active: page === 'catalog' },
                        { id: 'studio', label: 'Studio', icon: <LayoutGrid size={24} />, active: page === 'studio' }, 
                        { id: 'profile', label: 'Profil', icon: <User size={24} />, active: page === 'dashboard' && dashboardPage === 'profile' },
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'dashboard') {
                                    handleNavigation('dashboard');
                                    setDashboardPage('main'); // FORCE RESET TO MAIN
                                }
                                else if (item.id === 'catalog') handleNavigation('catalog');
                                else if (item.id === 'studio') handleNavigation('studio');
                                else if (item.id === 'profile') handleDashboardNavigation('profile');
                            }}
                            className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-1/4 ${item.active ? 'text-orange-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            <div className={`${item.active ? 'drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]' : ''}`}>
                                {item.icon}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
          )}

          {!selectedMovie && !isPlayerActive && page !== 'admin' && page !== 'welcome' && <Footer onNavigate={handleNavigation} />}
          {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => {setIsAuthModalOpen(false); setPage('dashboard');}} />}
        </div>
    </NotificationContext.Provider>
  );
};

export default App;
