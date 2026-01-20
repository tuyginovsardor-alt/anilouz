
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
import { CatalogPage } from './CatalogPage'; 
import { FandubDashboard } from './FandubDashboard';
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { CopyrightPage } from './CopyrightPage';
import { Home, Search, Sparkles, User, X, Layers, LayoutGrid, ShoppingBag } from 'lucide-react';
import { getAppConfig } from './services/dbService';
import { UzumakiLogo } from './components/icons/UzumakiLogo';
import { HamburgerMenu } from './components/HamburgerMenu';
import { LegalDocs } from './components/LegalDocs';

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'dub-dashboard' | 'studio' | 'shop' | 'shop-admin' | 'catalog' | 'fandub-dashboard';
export type DashboardSubPage = 'main' | 'profile' | 'settings' | 'history' | 'saved' | 'account' | 'billing' | 'plans' | 'more' | 'support';
export type AdminSubPage = 'dashboard' | 'sessions' | 'broadcasts' | 'users' | 'movies' | 'settings' | 'financials' | 'support' | 'advertisements' | 'promocodes' | 'customization' | 'sitemap' | 'security' | 'stamp_tool' | 'contest' | 'cash_contest';
export type LegalDocType = 'privacy' | 'terms';

// Helper for image preloading
const preloadImage = (src: string) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = resolve; // Don't block app if image fails
    });
};

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('welcome');
  const [dashboardPage, setDashboardPage] = useState<DashboardSubPage>('main');
  const [adminPage, setAdminPage] = useState<AdminSubPage>('dashboard');
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Custom Branding State for Loader
  const [loaderLogo, setLoaderLogo] = useState<string | null>(null);
  
  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Legal Docs State
  const [legalDocType, setLegalDocType] = useState<LegalDocType | null>(null);

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
            // 1. Fetch Config First
            const config = await getAppConfig();
            
            // 2. Set branding states
            if (config['site_logo']) setLoaderLogo(config['site_logo']);
            
            // 3. Preload Critical Assets ("Shimini kiyish")
            const assetsToLoad = [];
            if (config['site_logo']) assetsToLoad.push(preloadImage(config['site_logo']));
            if (config['site_background']) assetsToLoad.push(preloadImage(config['site_background']));
            
            // Wait for assets to be cached by browser
            await Promise.all(assetsToLoad);

            // 4. Check Session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                await fetchUserRole(session.user.id);
                setPage('dashboard'); // Redirect to dashboard immediately if logged in
            } else {
                setPage('welcome');
            }
        } catch (e) { 
            console.error(e); 
        } finally { 
            // 5. Reveal App
            setTimeout(() => setIsAppReady(true), 800); 
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

  if (!isAppReady) return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden z-[9999]">
          <div className="flex flex-col items-center gap-6 animate-fade-in relative z-10">
              {/* Dynamic Logo Loader */}
              <div className="relative w-24 h-24">
                  {/* Spinning Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-orange-500 border-l-transparent animate-spin"></div>
                  
                  {/* Logo Center */}
                  <div className="absolute inset-2 rounded-full overflow-hidden bg-black flex items-center justify-center border-2 border-white/10">
                      {loaderLogo ? (
                          <img src={loaderLogo} alt="Logo" className="w-full h-full object-cover animate-pulse" />
                      ) : (
                          <UzumakiLogo className="w-12 h-12 text-orange-500 animate-pulse" />
                      )}
                  </div>
              </div>
              
              <div className="text-center">
                  <h1 className="text-2xl font-black text-white tracking-[0.3em] uppercase">ANILO.UZ</h1>
                  <p className="text-[10px] text-zinc-500 font-bold mt-1">YUKLANMOQDA...</p>
              </div>
          </div>

          {/* Loading Bar */}
          <div className="absolute bottom-20 w-64 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 w-full animate-[loading_1.5s_ease-in-out_infinite] origin-left"></div>
          </div>
          
          <style>{`
            @keyframes loading {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
            }
          `}</style>
      </div>
  );

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        <div className="min-h-screen text-gray-100 flex flex-col bg-[#050505]">
          
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
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
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
                        {page === 'welcome' && <WelcomePage onSearch={(q) => {setCurrentQuery(q); setPage('search');}} onMovieClick={handleMovieClick} onStart={() => setIsAuthModalOpen(true)} />}
                        {page === 'search' && <SearchPage initialQuery={currentQuery} onNewSearch={setCurrentQuery} onMovieClick={handleMovieClick} />}
                        {page === 'catalog' && <CatalogPage onMovieClick={handleMovieClick} />}
                        {page === 'dashboard' && <DashboardPage viewUserId={selectedArtistId} currentPage={dashboardPage} onNavigate={setDashboardPage} onMainNavigate={handleNavigation} onSearch={(q) => {setCurrentQuery(q); setPage('search');}} onLogout={() => supabase.auth.signOut()} onMovieClick={handleMovieClick} currentRole={currentUserRole} onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}} />}
                        {page === 'admin' && <AdminPage currentRole={currentUserRole} currentPage={adminPage} onNavigate={setAdminPage} onSwitchView={() => setPage('dashboard')} onLogout={() => supabase.auth.signOut()} />}
                        {page === 'ai-assistant' && <AiAssistantPage />}
                        {page === 'copyright' && <CopyrightPage onBack={() => setPage('welcome')} />}
                        {page === 'dub-dashboard' && <DubDashboard />}
                        {page === 'studio' && <StudioPage onArtistClick={handleArtistClick} onMovieClick={handleMovieClick} />}
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

          {!selectedMovie && !isPlayerActive && page !== 'admin' && page !== 'welcome' && (
            <div className="fixed bottom-0 left-0 right-0 z-[110] md:hidden">
                <div className="bg-[#050505]/95 backdrop-blur-xl h-20 flex justify-around items-center px-2 border-t border-zinc-900 pb-2">
                    <button 
                        onClick={() => { handleNavigation('dashboard'); setDashboardPage('main'); }}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 w-1/5 ${page === 'dashboard' && dashboardPage === 'main' ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                        <Home size={22} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Asosiy</span>
                    </button>

                    <button 
                        onClick={() => handleNavigation('catalog')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 w-1/5 ${page === 'catalog' ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                        <Layers size={22} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Katalog</span>
                    </button>

                    {/* CENTERED SHOP ICON */}
                    <button 
                        onClick={() => handleNavigation('shop')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 w-1/5 -mt-6 group`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-[#050505] ${page === 'shop' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}`}>
                            <ShoppingBag size={20} fill={page === 'shop' ? 'currentColor' : 'none'} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${page === 'shop' ? 'text-orange-500' : 'text-zinc-600'}`}>Do'kon</span>
                    </button>

                    <button 
                        onClick={() => handleNavigation('studio')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 w-1/5 ${page === 'studio' ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                        <LayoutGrid size={22} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Fandub</span>
                    </button>

                    <button 
                        onClick={() => setIsMenuOpen(true)}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 w-1/5 ${isMenuOpen ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                        <User size={22} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Profil</span>
                    </button>
                </div>
            </div>
          )}

          {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => {setIsAuthModalOpen(false); setPage('dashboard');}} />}
          
          <HamburgerMenu 
            isOpen={isMenuOpen} 
            onClose={() => setIsMenuOpen(false)} 
            onLogout={() => { supabase.auth.signOut(); setIsMenuOpen(false); }}
            onMainNavigate={handleNavigation}
            onDashboardNavigate={handleDashboardNavigation}
            onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}}
            onOpenLegal={(type) => setLegalDocType(type)}
          />

          {legalDocType && <LegalDocs type={legalDocType} onClose={() => setLegalDocType(null)} />}
        </div>
    </NotificationContext.Provider>
  );
};

export default App;
