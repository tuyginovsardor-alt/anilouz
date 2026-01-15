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
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { SupportChatWidget } from './components/SupportChatWidget';
import { Footer } from './components/Footer';
import { CopyrightPage } from './CopyrightPage';
import { AniConcursPage } from './AniConcursPage';
import { ArkTradingPage } from './ArkTradingPage';
import { Home, LayoutGrid, Repeat, RefreshCw, Menu } from 'lucide-react';

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'aniconcurs' | 'arktrading';
export type DashboardSubPage = 'main' | 'profile' | 'settings' | 'history' | 'saved' | 'account' | 'billing';
export type AdminSubPage = 'dashboard' | 'sessions' | 'broadcasts' | 'users' | 'movies' | 'settings' | 'financials' | 'support' | 'advertisements' | 'promocodes' | 'customization' | 'contest' | 'sitemap' | 'cash_contest' | 'security' | 'stamp_tool';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('welcome');
  const [dashboardPage, setDashboardPage] = useState<DashboardSubPage>('main');
  const [adminPage, setAdminPage] = useState<AdminSubPage>('dashboard');
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
      if (data) setCurrentUserRole(data.role);
  };

  const handleNavigation = (targetPage: Page) => {
    setPage(targetPage);
    setSelectedMovie(null);
    setIsPlayerActive(false);
    window.scrollTo(0, 0);
  };

  const handleMovieClick = (movie: Movie) => {
    if (!isAuthenticated) setIsAuthModalOpen(true);
    else {
        setSelectedMovie(movie);
        window.scrollTo(0, 0);
    }
  };

  if (isCheckingAuth) return <div className="h-screen bg-[#0a0a0c] flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        <div className="min-h-screen text-gray-100 flex flex-col bg-[#0a0a0c]">
          
          {!isPlayerActive && !activeVideoAd && (
            <Header onNavigate={handleNavigation} currentPage={page} isAuthenticated={isAuthenticated} onLoginClick={() => setIsAuthModalOpen(true)} />
          )}
          
          <main className={`flex-1 ${selectedMovie || isPlayerActive ? '' : 'pb-32 md:pb-20'}`}>
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
                        {page === 'aniconcurs' && <AniConcursPage />}
                        {page === 'arktrading' && <ArkTradingPage />}
                        {page === 'ai-assistant' && <AiAssistantPage />}
                        {page === 'copyright' && <CopyrightPage onBack={() => setPage('welcome')} />}
                      </>
                    )}
                  </>
                )}
          </main>

          {/* MOBILE BOTTOM NAVIGATION */}
          {!selectedMovie && !isPlayerActive && page !== 'admin' && (
            <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-4 pb-8">
                <div className="bottom-nav h-20 flex justify-around items-center px-4 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
                    <button 
                        onClick={() => handleNavigation('welcome')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${page === 'welcome' ? 'active-nav-item' : 'text-gray-600'}`}
                    >
                        <Home size={22} strokeWidth={page === 'welcome' ? 2.5 : 2} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Asosiy</span>
                    </button>
                    <button 
                        onClick={() => {setPage('dashboard'); setDashboardPage('billing')}}
                        className={`flex flex-col items-center gap-1.5 transition-all ${dashboardPage === 'billing' && page === 'dashboard' ? 'active-nav-item' : 'text-gray-600'}`}
                    >
                        <LayoutGrid size={22} />
                        <span className="text-[9px] font-black uppercase tracking-widest">To'lovlar</span>
                    </button>
                    <button 
                        onClick={() => handleNavigation('arktrading')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${page === 'arktrading' ? 'active-nav-item' : 'text-gray-600'}`}
                    >
                        <Repeat size={22} />
                        <span className="text-[9px] font-black uppercase tracking-widest">O'tkazmalar</span>
                    </button>
                    <button 
                        onClick={() => handleNavigation('aniconcurs')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${page === 'aniconcurs' ? 'active-nav-item' : 'text-gray-600'}`}
                    >
                        <RefreshCw size={22} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Konvert</span>
                    </button>
                    <button 
                        onClick={() => {setPage('dashboard'); setDashboardPage('profile')}}
                        className={`flex flex-col items-center gap-1.5 transition-all ${dashboardPage === 'profile' && page === 'dashboard' ? 'active-nav-item' : 'text-gray-600'}`}
                    >
                        <Menu size={22} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Yana</span>
                    </button>
                </div>
            </div>
          )}

          {!selectedMovie && !isPlayerActive && page !== 'admin' && <Footer onNavigate={handleNavigation} />}
          {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => {setIsAuthModalOpen(false); setPage('dashboard');}} />}
          <SupportChatWidget />
        </div>
    </NotificationContext.Provider>
  );
};

export default App;