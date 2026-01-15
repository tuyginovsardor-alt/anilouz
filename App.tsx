
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
import { getActiveAdForLocation } from './services/adService';
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { getAppConfig, getUserProfile } from './services/dbService';
import { SupportChatWidget } from './components/SupportChatWidget';
import { Footer } from './components/Footer';
import { CopyrightPage } from './CopyrightPage';
import { EyeIcon } from './components/icons/EyeIcon';
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
  const [connectionError, setConnectionError] = useState(false);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [activeVideoAd, setActiveVideoAd] = useState<Ad | null>(null);

  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedUserName, setImpersonatedUserName] = useState<string>('');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, ...notification }]);
  };
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const notificationContextValue = { notifications, addNotification, removeNotification };

  useEffect(() => {
    const initApp = async () => {
        try {
            const config = await getAppConfig();
            if (config['site_background']) document.body.style.backgroundImage = `url(${config['site_background']})`;

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                fetchUserRole(session.user.id);
                // Agar kirgan bo'lsa, to'g'ri Dashboardga o'tamiz
                setPage('dashboard');
            }

            const params = new URLSearchParams(window.location.search);
            const pageParam = params.get('page');
            if (pageParam === 'aniconcurs') setPage('aniconcurs');
            else if (pageParam === 'arktrading') setPage('arktrading');

        } catch (e) {
            console.error("Initialization error:", e);
            setConnectionError(true);
        } finally {
            setIsCheckingAuth(false);
        }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

  const handleLoginSuccess = (role: UserRole) => {
    setIsAuthModalOpen(false);
    setPage('dashboard');
    setDashboardPage('main');
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedMovie(null);
    setIsPlayerActive(false);
    setPage('welcome');
  };

  const handleNavigation = (targetPage: Page) => {
    if (targetPage === 'aniconcurs' || targetPage === 'arktrading') {
        const isPrivileged = ['premium', 'admin', 'owner', 'manager'].includes(currentUserRole);
        if (!isPrivileged) {
            addNotification({ type: 'warning', title: 'Premium Kerak', message: 'Ushbu bo\'limga faqat Premium a\'zolar kira oladi.' });
            setPage('dashboard');
            setDashboardPage('billing');
            return;
        }
    }
    setPage(targetPage);
    setSelectedMovie(null);
    setIsPlayerActive(false);
    window.scrollTo(0, 0);
  };

  const executeSearch = (query: string) => {
    setCurrentQuery(query);
    setPage('search');
  };

  const handleMovieClick = (movie: Movie) => {
    if (!isAuthenticated) setIsAuthModalOpen(true);
    else {
        setSelectedMovie(movie);
        window.scrollTo(0, 0);
    }
  };

  if (isCheckingAuth) return <div className="h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const renderAppContent = () => {
      const isAdminRole = ['admin', 'owner', 'manager', 'support', 'accountant'].includes(currentUserRole);

      if (impersonatedUserId) {
          return (
            <div className="min-h-screen text-gray-100 flex flex-col page-enter">
                 <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center sticky top-0 z-50">
                    <span>Siz <span className="font-bold">{impersonatedUserName}</span> nomidan kirdingiz.</span>
                    <button onClick={() => setImpersonatedUserId(null)} className="bg-white text-red-600 px-2 py-0.5 rounded text-xs font-bold">Chiqish</button>
                 </div>
                 <DashboardPage currentPage={dashboardPage} onNavigate={setDashboardPage} onMainNavigate={handleNavigation} onSearch={executeSearch} onLogout={handleLogout} onMovieClick={handleMovieClick} currentRole={'user'} onSwitchRole={() => {}} viewUserId={impersonatedUserId} />
            </div>
          );
      }

      if (isAuthenticated && isAdminRole && page === 'admin') {
        return <AdminPage currentRole={currentUserRole} currentPage={adminPage} onNavigate={setAdminPage} onSwitchView={() => setPage('dashboard')} onLogout={handleLogout} onImpersonate={(id) => setImpersonatedUserId(id)} />;
      }

      if (activeVideoAd && selectedMovie) return <VideoAdPlayer ad={activeVideoAd} onFinish={() => {setActiveVideoAd(null); setIsPlayerActive(true);}} />;
      if (isPlayerActive && selectedMovie) return <VideoPlayerPage movie={selectedMovie} onBack={() => setIsPlayerActive(false)} />;
      if (page === 'aniconcurs') return <AniConcursPage />;
      if (page === 'arktrading') return <ArkTradingPage />;
    
      return (
        <div className="min-h-screen text-gray-100 flex flex-col page-enter">
          {!selectedMovie && <Header onNavigate={handleNavigation} currentPage={page} isAuthenticated={isAuthenticated} onLoginClick={() => setIsAuthModalOpen(true)} />}
          
          <main className="flex-1 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6">
                {selectedMovie ? (
                  <MovieDetailPage movie={selectedMovie} onBack={() => setSelectedMovie(null)} onPlay={() => setIsPlayerActive(true)} />
                ) : (
                  <>
                    {page === 'welcome' && <WelcomePage onSearch={executeSearch} onMovieClick={handleMovieClick} onStart={() => setIsAuthModalOpen(true)} />}
                    {page === 'search' && <SearchPage initialQuery={currentQuery} onNewSearch={executeSearch} onMovieClick={handleMovieClick} />}
                    {page === 'dashboard' && <DashboardPage currentPage={dashboardPage} onNavigate={setDashboardPage} onMainNavigate={handleNavigation} onSearch={executeSearch} onLogout={handleLogout} onMovieClick={handleMovieClick} currentRole={currentUserRole} onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}} />}
                    {page === 'ai-assistant' && <AiAssistantPage />}
                  </>
                )}
            </div>
          </main>

          {/* MOBILE BOTTOM NAVIGATION */}
          <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-white/5 md:hidden flex justify-around items-center h-16 z-50">
             <button onClick={() => handleNavigation(isAuthenticated ? 'dashboard' : 'welcome')} className={`bottom-nav-item ${page === 'dashboard' || page === 'welcome' ? 'active' : ''}`}>
                <Home size={22} />
                <span className="text-[10px] mt-1 font-bold">Uy</span>
             </button>
             <button onClick={() => handleNavigation('search')} className={`bottom-nav-item ${page === 'search' ? 'active' : ''}`}>
                <Search size={22} />
                <span className="text-[10px] mt-1 font-bold">Qidiruv</span>
             </button>
             {/* Fix: Use string casting for 'page' comparison to prevent TypeScript narrowing error due to early returns in renderAppContent */}
             <button onClick={() => handleNavigation('aniconcurs')} className={`bottom-nav-item ${(page as string) === 'aniconcurs' ? 'active' : ''}`}>
                <div className="w-12 h-12 -mt-8 bg-orange-600 rounded-full flex items-center justify-center border-4 border-[#07070a] shadow-lg shadow-orange-500/20">
                    <Gift size={24} className="text-white" />
                </div>
                <span className="text-[10px] mt-1 font-bold">Konkurs</span>
             </button>
             <button onClick={() => {if(isAuthenticated) {setPage('dashboard'); setDashboardPage('profile');} else setIsAuthModalOpen(true)}} className={`bottom-nav-item ${dashboardPage === 'profile' ? 'active' : ''}`}>
                <User size={22} />
                <span className="text-[10px] mt-1 font-bold">Profil</span>
             </button>
          </div>

          {!selectedMovie && page !== 'admin' && <Footer onNavigate={handleNavigation} />}
          {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleLoginSuccess} />}
          <SupportChatWidget />
        </div>
      );
  }

  return (
    <NotificationContext.Provider value={notificationContextValue}>
        <NotificationContainer />
        {renderAppContent()}
    </NotificationContext.Provider>
  );
};

export default App;
