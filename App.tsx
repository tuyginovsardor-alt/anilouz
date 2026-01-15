
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

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'aniconcurs' | 'arktrading';
export type DashboardSubPage = 'main' | 'profile' | 'settings' | 'history' | 'saved' | 'account' | 'billing';
export type AdminSubPage = 'dashboard' | 'sessions' | 'broadcasts' | 'users' | 'movies' | 'settings' | 'financials' | 'support' | 'advertisements' | 'promocodes' | 'customization' | 'contest' | 'sitemap' | 'cash_contest' | 'security' | 'stamp_tool'; // Added stamp_tool

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('welcome');
  const [dashboardPage, setDashboardPage] = useState<DashboardSubPage>('main');
  const [adminPage, setAdminPage] = useState<AdminSubPage>('dashboard');
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [activeVideoAd, setActiveVideoAd] = useState<Ad | null>(null);

  // --- Impersonation State ---
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedUserName, setImpersonatedUserName] = useState<string>('');

  // --- Notification logic ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, ...notification }]);
  };
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const notificationContextValue = { notifications, addNotification, removeNotification };
  // ---------------------------

  useEffect(() => {
    const initApp = async () => {
        try {
            // 1. Test connection
            const { error } = await supabase.from('app_config').select('count', { count: 'exact', head: true });
            if (error && error.message.includes('fetch')) {
                throw error;
            }

            // 2. Load Config
            const config = await getAppConfig();
            if (config['site_background']) {
                document.body.style.backgroundImage = `url(${config['site_background']})`;
            }
            if (config['site_logo']) {
                localStorage.setItem('custom-logo', config['site_logo']);
            }

            // 3. Check Session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                fetchUserRole(session.user.id);
            }

            // 4. Handle URL Params (Deep Linking & Redirects)
            const params = new URLSearchParams(window.location.search);
            const pageParam = params.get('page');
            const movieIdParam = params.get('movie_id');

            if (pageParam === 'dashboard') {
                setPage('dashboard');
                setDashboardPage('main');
            } else if (pageParam === 'aniconcurs') {
                setPage('aniconcurs');
            } else if (pageParam === 'arktrading') {
                setPage('arktrading');
            }

        } catch (e) {
            console.error("Initialization error:", e);
            setConnectionError(true);
        }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      try {
          const { data, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userId)
              .single();
          
          if (data && !error) {
              setCurrentUserRole(data.role);
          }
      } catch (error) {
          console.error("Error fetching role:", error);
      }
  };

  const handleLoginSuccess = (role: UserRole) => {
    setIsAuthModalOpen(false);
    if (role === 'user' || role === 'premium') {
      setPage('dashboard');
      setDashboardPage('main');
    } else {
      setPage('admin');
      setAdminPage('dashboard');
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedMovie(null);
    setIsPlayerActive(false);
    setImpersonatedUserId(null);
  };
  
  const switchToUserView = () => {
    setPage('dashboard');
    setDashboardPage('main');
    window.scrollTo(0, 0);
    addNotification({
        type: 'info',
        title: 'Rejim o\'zgardi',
        message: 'Foydalanuvchi rejimi faollashdi. Admin panelga qaytish uchun menyudan foydalaning.'
    });
  }

  const handleImpersonate = async (userId: string) => {
      try {
          const userProfile = await getUserProfile(userId);
          if (userProfile) {
              setImpersonatedUserId(userId);
              setImpersonatedUserName(userProfile.full_name || 'Foydalanuvchi');
              setPage('dashboard');
              setDashboardPage('profile');
              addNotification({
                  type: 'success',
                  title: 'Kirish Muvaffaqiyatli',
                  message: `${userProfile.full_name} profiliga kirdingiz.`
              });
          }
      } catch (e) {
          console.error(e);
          addNotification({ type: 'error', title: 'Xatolik', message: 'Profilga kirib bo\'lmadi.' });
      }
  };

  const handleExitImpersonation = () => {
      setImpersonatedUserId(null);
      setImpersonatedUserName('');
      setPage('admin'); 
      setAdminPage('users'); 
      addNotification({
          type: 'info',
          title: 'Chiqildi',
          message: 'Admin paneliga qaytdingiz.'
      });
  };

  const executeSearch = (query: string) => {
    setCurrentQuery(query);
    setSelectedMovie(null);
    setIsPlayerActive(false);
    setPage('search');
  };
  
  const handleNavigation = (targetPage: Page) => {
    // PREMIUM/ADMIN CHECK FOR GAMES
    if (targetPage === 'aniconcurs' || targetPage === 'arktrading') {
        const isPrivileged = ['premium', 'admin', 'owner', 'manager'].includes(currentUserRole);
        if (!isPrivileged) {
            addNotification({
                type: 'warning',
                title: 'Faqat Premium',
                message: 'Ushbu bo\'limga kirish uchun Premium obuna talab qilinadi.'
            });
            setDashboardPage('billing');
            setPage('dashboard');
            return;
        }
    }

    setPage(targetPage);
    setSelectedMovie(null);
    setIsPlayerActive(false);
    window.scrollTo(0, 0);
    if (targetPage === 'welcome' || targetPage === 'dashboard') {
      setCurrentQuery('');
    }
    if (targetPage === 'dashboard') {
        setDashboardPage('main');
    }
  }
  
  const handleDashboardNavigation = (targetPage: DashboardSubPage) => {
    setDashboardPage(targetPage);
  }

  const handleMovieClick = (movie: Movie) => {
      if (!isAuthenticated) {
          setIsAuthModalOpen(true);
      } else {
        setSelectedMovie(movie);
        setIsPlayerActive(false);
        window.history.pushState({}, '', `/?movie_id=${movie.id}`);
      }
  };

  const handleBackFromDetail = () => {
    setSelectedMovie(null);
    window.history.pushState({}, '', '/');
  };
  
  const handlePlayMovie = async (movieOverride?: Movie) => {
    if (movieOverride) {
        setSelectedMovie(movieOverride);
    }
    
    if (selectedMovie || movieOverride) {
      const preRollAd = await getActiveAdForLocation('pre_roll_video');
      if (preRollAd) {
        setActiveVideoAd(preRollAd);
      } else {
        setIsPlayerActive(true);
      }
    }
  };

  const handleAdFinish = () => {
    setActiveVideoAd(null);
    setIsPlayerActive(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerActive(false);
  };

  const handleAdminNavigate = (page: AdminSubPage) => {
    setAdminPage(page);
  };

  if (connectionError) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Serverga ulanib bo'lmadi</h1>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">Qayta urinish</button>
          </div>
      );
  }
  
  const renderAppContent = () => {
      const isAdminRole = ['admin', 'owner', 'manager', 'support', 'accountant'].includes(currentUserRole);

      if (impersonatedUserId) {
          return (
            <div className="min-h-screen text-gray-100 flex flex-col">
                 <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center sticky top-0 z-50 shadow-md">
                    <div className="flex items-center gap-2 font-semibold">
                        <EyeIcon className="w-5 h-5" />
                        <span>Siz hozir <span className="underline font-bold">{impersonatedUserName}</span> nomidan ko'ryapsiz.</span>
                    </div>
                    <button onClick={handleExitImpersonation} className="bg-white text-red-600 px-3 py-1 rounded text-sm font-bold hover:bg-gray-100 transition-colors">Chiqish</button>
                 </div>
                 {!selectedMovie && (
                    <Header onNavigate={handleNavigation} currentPage={page} isAuthenticated={true} onLoginClick={() => {}} />
                  )}
                  <div className={`container mx-auto flex-1 transition-all duration-300 ${!selectedMovie ? 'px-4 sm:px-6 lg:px-8 py-8' : 'p-0'}`}>
                    <main className="h-full">
                      {selectedMovie ? (
                        <MovieDetailPage movie={selectedMovie} onBack={handleBackFromDetail} onPlay={handlePlayMovie} />
                      ) : (
                         <DashboardPage currentPage={dashboardPage} onNavigate={handleDashboardNavigation} onMainNavigate={handleNavigation} onSearch={executeSearch} onLogout={handleLogout} onMovieClick={handleMovieClick} currentRole={'user'} onSwitchRole={() => {}} viewUserId={impersonatedUserId} />
                      )}
                    </main>
                  </div>
            </div>
          );
      }

      if (isAuthenticated && isAdminRole && page === 'admin' && !selectedMovie && !activeVideoAd) {
        return <AdminPage currentRole={currentUserRole} currentPage={adminPage} onNavigate={handleAdminNavigate} onSwitchView={switchToUserView} onLogout={handleLogout} onImpersonate={handleImpersonate} />;
      }

      if (activeVideoAd && selectedMovie) {
        return <VideoAdPlayer ad={activeVideoAd} onFinish={handleAdFinish} />;
      }
      
      if (isPlayerActive && selectedMovie) {
        return <VideoPlayerPage movie={selectedMovie} onBack={handleClosePlayer} />;
      }

      // FULL PAGE GAMES
      if (page === 'aniconcurs') return <AniConcursPage />;
      if (page === 'arktrading') return <ArkTradingPage />;
    
      return (
        <div className="min-h-screen text-gray-100 flex flex-col">
          {!selectedMovie && (
            <Header onNavigate={handleNavigation} currentPage={page} isAuthenticated={isAuthenticated} onLoginClick={() => setIsAuthModalOpen(true)} />
          )}
          <div className={`container mx-auto flex-1 transition-all duration-300 ${!selectedMovie ? 'px-4 sm:px-6 lg:px-8 py-8' : 'p-0'}`}>
            <main className="h-full">
              {selectedMovie ? (
                <MovieDetailPage movie={selectedMovie} onBack={handleBackFromDetail} onPlay={handlePlayMovie} />
              ) : (
                <>
                  {page === 'welcome' && <WelcomePage onSearch={executeSearch} onMovieClick={handleMovieClick} />}
                  {page === 'search' && <SearchPage initialQuery={currentQuery} onNewSearch={executeSearch} onMovieClick={handleMovieClick} />}
                  {page === 'ai-assistant' && <AiAssistantPage />}
                  {page === 'copyright' && <CopyrightPage onBack={() => handleNavigation('welcome')} />}
                  {page === 'dashboard' && (
                    <DashboardPage currentPage={dashboardPage} onNavigate={handleDashboardNavigation} onMainNavigate={handleNavigation} onSearch={executeSearch} onLogout={handleLogout} onMovieClick={handleMovieClick} currentRole={currentUserRole} onSwitchRole={(role) => { if (['admin', 'owner', 'manager'].includes(role)) { setAdminPage('dashboard'); setPage('admin'); } }} />
                  )}
                </>
              )}
            </main>
          </div>
          
          {!selectedMovie && !activeVideoAd && page !== 'admin' && (
              <Footer onNavigate={handleNavigation} />
          )}

          {isAuthModalOpen && (
            <AuthModal onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleLoginSuccess} />
          )}
          
          {page !== 'admin' && <SupportChatWidget />}
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
