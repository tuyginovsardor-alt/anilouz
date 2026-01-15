
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
import { getAppConfig } from './services/dbService';
import { SupportChatWidget } from './components/SupportChatWidget';
import { Footer } from './components/Footer';
import { CopyrightPage } from './CopyrightPage';
import { AniConcursPage } from './AniConcursPage';
import { ArkTradingPage } from './ArkTradingPage';
import { Home, Search, Gift, User, LayoutGrid } from 'lucide-react';

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
                setPage('dashboard'); // Kirgan foydalanuvchi to'g'ri dashboardga tushadi
            }
            const config = await getAppConfig();
            if (config['site_background']) document.body.style.backgroundImage = `url(${config['site_background']})`;
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
            if (page === 'welcome') setPage('dashboard');
        } else {
            setIsAuthenticated(false);
            setCurrentUserRole('user');
            setPage('welcome');
        }
    });
    return () => subscription.unsubscribe();
  }, [page]);

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

  if (isCheckingAuth) return <div className="h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        <div className="min-h-screen text-gray-100 flex flex-col page-enter">
          
          {/* Header faqat video pleyer ochiq bo'lmaganda ko'rinadi */}
          {!selectedMovie && !isPlayerActive && !activeVideoAd && (
            <Header onNavigate={handleNavigation} currentPage={page} isAuthenticated={isAuthenticated} onLoginClick={() => setIsAuthModalOpen(true)} />
          )}
          
          <main className="flex-1 pb-20 md:pb-8">
            <div className={`${selectedMovie || isPlayerActive ? '' : 'container mx-auto px-4 py-6'}`}>
                {activeVideoAd && selectedMovie && <VideoAdPlayer ad={activeVideoAd} onFinish={() => {setActiveVideoAd(null); setIsPlayerActive(true);}} />}
                {isPlayerActive && selectedMovie && !activeVideoAd && <VideoPlayerPage movie={selectedMovie} onBack={() => setIsPlayerActive(false)} />}
                
                {!isPlayerActive && !activeVideoAd && (
                  <>
                    {selectedMovie ? (
                      <MovieDetailPage movie={selectedMovie} onBack={() => setSelectedMovie(null)} onPlay={() => setIsPlayerActive(true)} />
                    ) : (
                      <>
                        {page === 'welcome' && <WelcomePage onSearch={(q) => {setCurrentQuery(q); setPage('search');}} onMovieClick={handleMovieClick} onStart={() => setIsAuthModalOpen(true)} />}
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
            </div>
          </main>

          {/* MOBILE BOTTOM NAVIGATION - Faqat video ko'rmayotgan bo'lsa chiqadi */}
          {!selectedMovie && !isPlayerActive && !activeVideoAd && page !== 'admin' && (
            <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-white/5 md:hidden flex justify-around items-center h-16 z-50">
               <button onClick={() => handleNavigation(isAuthenticated ? 'dashboard' : 'welcome')} className={`bottom-nav-item ${page === 'dashboard' || page === 'welcome' ? 'active' : ''}`}>
                  <Home size={22} />
                  <span className="text-[10px] font-bold">Uy</span>
               </button>
               <button onClick={() => handleNavigation('search')} className={`bottom-nav-item ${page === 'search' ? 'active' : ''}`}>
                  <Search size={22} />
                  <span className="text-[10px] font-bold">Qidiruv</span>
               </button>
               <button onClick={() => handleNavigation('aniconcurs')} className={`bottom-nav-item ${page === 'aniconcurs' ? 'active' : ''}`}>
                  <div className="w-12 h-12 -mt-8 bg-orange-600 rounded-full flex items-center justify-center border-4 border-[#07070a] shadow-lg shadow-orange-500/20">
                      <Gift size={24} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold">Konkurs</span>
               </button>
               <button onClick={() => {if(isAuthenticated) {setPage('dashboard'); setDashboardPage('profile');} else setIsAuthModalOpen(true)}} className={`bottom-nav-item ${dashboardPage === 'profile' ? 'active' : ''}`}>
                  <User size={22} />
                  <span className="text-[10px] font-bold">Profil</span>
               </button>
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
