import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomePage } from './WelcomePage';
import { SearchPage } from './SearchPage';
import { DashboardPage } from './DashboardPage';
import { AuthModal } from './components/AuthModal';
// Fix: Ad and Notification are now correctly exported from types.ts
import { Movie, UserRole, Ad, Notification } from './types';
import { MovieDetailPage } from './MovieDetailPage';
import { VideoPlayerPage } from './VideoPlayerPage';
import { AdminPage } from './AdminPage';
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { Footer } from './components/Footer';
import { CopyrightPage } from './CopyrightPage';
import { Home, Search, Bookmark, User, MoreHorizontal, ShieldCheck, X, Sparkles } from 'lucide-react';

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright';
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
        } catch (e) {
            console.error(e);
        } finally {
            setIsCheckingAuth(false);
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
    setSelectedMovie(null);
    setIsPlayerActive(false);
    setIsSearchOpen(false);
    window.scrollTo(0, 0);
  };

  const handleMovieClick = (movie: Movie) => {
    if (!isAuthenticated) setIsAuthModalOpen(true);
    else {
        setSelectedMovie(movie);
        window.scrollTo(0, 0);
    }
  };

  if (isCheckingAuth) return <div className="h-screen bg-[#050505] flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        <div className="min-h-screen text-gray-100 flex flex-col bg-[#050505]">
          
          {!isPlayerActive && !activeVideoAd && (
            <Header 
              onNavigate={handleNavigation} 
              currentPage={page} 
              isAuthenticated={isAuthenticated} 
              onLoginClick={() => setIsAuthModalOpen(true)}
              onSearchClick={() => setIsSearchOpen(true)}
            />
          )}
          
          <main className={`flex-1 ${selectedMovie || isPlayerActive ? '' : 'pt-20 pb-32 md:pb-20'}`}>
                {activeVideoAd && selectedMovie && <VideoAdPlayer ad={activeVideoAd} onFinish={() => {setActiveVideoAd(null); setIsPlayerActive(true);}} />}
                {isPlayerActive && selectedMovie && !activeVideoAd && <VideoPlayerPage movie={selectedMovie} onBack={() => setIsPlayerActive(false)} />}
                
                {!isPlayerActive && !activeVideoAd && (
                  <>
                    {selectedMovie ? (
                      <MovieDetailPage movie={selectedMovie} onBack={() => setSelectedMovie(null)} onPlay={() => setIsPlayerActive(true)} />
                    ) : (
                      <>
                        {page === 'welcome' && <WelcomePage onSearch={(q) => {setCurrentQuery(q); setPage('search');}} onMovieClick={handleMovieClick} onStart={() => setPage('dashboard')} />}
                        {page === 'search' && <SearchPage initialQuery={currentQuery} onNewSearch={setCurrentQuery} onMovieClick={handleMovieClick} />}
                        {page === 'dashboard' && <DashboardPage currentPage={dashboardPage} onNavigate={setDashboardPage} onMainNavigate={handleNavigation} onSearch={(q) => {setCurrentQuery(q); setPage('search');}} onLogout={() => supabase.auth.signOut()} onMovieClick={handleMovieClick} currentRole={currentUserRole} onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}} />}
                        {page === 'admin' && <AdminPage currentRole={currentUserRole} currentPage={adminPage} onNavigate={setAdminPage} onSwitchView={() => setPage('dashboard')} onLogout={() => supabase.auth.signOut()} />}
                        {page === 'ai-assistant' && <AiAssistantPage />}
                        {page === 'copyright' && <CopyrightPage onBack={() => setPage('welcome')} />}
                      </>
                    )}
                  </>
                )}
          </main>

          {/* SEARCH MODAL */}
          {isSearchOpen && (
              <div className="fixed inset-0 z-[200] bg-[#050505]/98 animate-fade-in flex flex-col p-6 sm:p-10">
                  <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute top-6 right-6 sm:top-10 sm:right-10 p-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                  >
                      <X size={28} />
                  </button>
                  <div className="max-w-4xl mx-auto w-full pt-20">
                      <div className="flex items-center gap-3 mb-8">
                          <Sparkles className="text-orange-500" size={24} />
                          <h2 className="text-4xl font-black tracking-tighter uppercase">Nima qidiramiz?</h2>
                      </div>
                      <div className="relative group">
                          <input 
                            type="text" 
                            autoFocus
                            placeholder="Anime nomi, janr yoki kashfiyot..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setCurrentQuery((e.target as HTMLInputElement).value);
                                    setPage('search');
                                    setIsSearchOpen(false);
                                }
                            }}
                            className="w-full bg-white/5 border-b-2 border-white/10 py-6 px-4 text-2xl sm:text-4xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-gray-700"
                          />
                      </div>
                  </div>
              </div>
          )}

          {/* MOBILE BOTTOM NAVIGATION - SOLID DARK STYLE */}
          {!selectedMovie && !isPlayerActive && page !== 'admin' && (
            <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-0 pb-0 pointer-events-none">
                <div className="bottom-nav h-16 flex justify-around items-center px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pointer-events-auto">
                    <button onClick={() => handleNavigation('welcome')} className={`flex flex-col items-center gap-1 transition-all ${page === 'welcome' ? 'text-orange-500' : 'text-gray-500'}`}>
                        <Home size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Asosiy</span>
                    </button>
                    <button onClick={() => setIsSearchOpen(true)} className={`flex flex-col items-center gap-1 text-gray-500`}>
                        <Search size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Qidiruv</span>
                    </button>
                    <button onClick={() => {setPage('dashboard'); setDashboardPage('saved')}} className={`flex flex-col items-center gap-1 transition-all ${page === 'dashboard' && dashboardPage === 'saved' ? 'text-orange-500' : 'text-gray-500'}`}>
                        <Bookmark size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Saqlangan</span>
                    </button>
                    <button onClick={() => {setPage('dashboard'); setDashboardPage('profile')}} className={`flex flex-col items-center gap-1 transition-all ${page === 'dashboard' && dashboardPage === 'profile' ? 'text-orange-500' : 'text-gray-500'}`}>
                        <User size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Profil</span>
                    </button>
                    <button onClick={() => {setPage('dashboard'); setDashboardPage('more')}} className={`flex flex-col items-center gap-1 transition-all ${page === 'dashboard' && dashboardPage === 'more' ? 'text-orange-500' : 'text-gray-500'}`}>
                        <MoreHorizontal size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Yana</span>
                    </button>
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