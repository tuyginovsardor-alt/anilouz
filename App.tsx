
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
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { Footer } from './components/Footer';
import { CopyrightPage } from './CopyrightPage';
import { Home, Search, Bookmark, User, MoreHorizontal, X, Sparkles, Mic, Menu, ShoppingBag, LayoutGrid } from 'lucide-react';

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'dub-dashboard' | 'studio' | 'shop' | 'shop-admin';
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                fetchUserRole(session.user.id);
            }
        } catch (e) { console.error(e); }
        finally { setIsCheckingAuth(false); }
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

  if (isCheckingAuth) return <div className="h-screen bg-[#050505] flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        <div className="min-h-screen text-gray-100 flex flex-col bg-[#050505]">
          
          {!isPlayerActive && !activeVideoAd && (
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
          
          <main className={`flex-1 ${selectedMovie || isPlayerActive ? '' : 'pt-20 pb-32 md:pb-20'}`}>
                {activeVideoAd && selectedMovie && <VideoAdPlayer ad={activeVideoAd} onFinish={() => {setActiveVideoAd(null); setIsPlayerActive(true);}} />}
                {isPlayerActive && selectedMovie && !activeVideoAd && <VideoPlayerPage movie={selectedMovie} onBack={() => setIsPlayerActive(false)} />}
                
                {!isPlayerActive && !activeVideoAd && (
                  <>
                    {selectedMovie ? (
                      <MovieDetailPage movie={selectedMovie} onBack={() => setSelectedMovie(null)} onPlay={() => setIsPlayerActive(true)} onArtistClick={handleArtistClick} />
                    ) : (
                      <>
                        {page === 'welcome' && <WelcomePage onSearch={(q) => {setCurrentQuery(q); setPage('search');}} onMovieClick={handleMovieClick} onStart={() => setPage('dashboard')} />}
                        {page === 'search' && <SearchPage initialQuery={currentQuery} onNewSearch={setCurrentQuery} onMovieClick={handleMovieClick} />}
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

          {/* MOBILE BOTTOM NAVIGATION */}
          {!selectedMovie && !isPlayerActive && page !== 'admin' && (
            <div className="fixed bottom-0 left-0 right-0 z-[110] md:hidden">
                <div className="bg-[#050505] h-20 flex justify-around items-center px-2 border-t border-zinc-900 pb-2">
                    {[
                        { id: 'welcome', label: 'Asosiy', icon: <Home size={22} />, active: page === 'welcome' },
                        { id: 'shop', label: 'Shop', icon: <ShoppingBag size={22} />, active: page === 'shop' },
                        { id: 'studio', label: 'Studio', icon: <LayoutGrid size={22} />, active: page === 'studio' }, // Added Studio
                        { id: 'profile', label: 'Profil', icon: <User size={22} />, active: page === 'dashboard' && dashboardPage === 'profile' },
                        { id: 'more', label: 'Yana', icon: <Menu size={22} />, active: false },
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'welcome') handleNavigation('welcome');
                                else if (item.id === 'shop') handleNavigation('shop');
                                else if (item.id === 'studio') handleNavigation('studio');
                                else if (item.id === 'profile') handleDashboardNavigation('profile');
                                else if (item.id === 'more') document.dispatchEvent(new CustomEvent('toggleMenu'));
                            }}
                            className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-1/5 ${item.active ? 'text-orange-500 scale-110' : 'text-zinc-600'}`}
                        >
                            <div className={`${item.active ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' : ''}`}>
                                {item.icon}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
          )}

          {!selectedMovie && !isPlayerActive && page !== 'admin' && <Footer onNavigate={handleNavigation} />}
          {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => {setIsAuthModalOpen(false); setPage('dashboard');}} />}
        </div>
    </NotificationContext.Provider>
  );
};

export default App;
