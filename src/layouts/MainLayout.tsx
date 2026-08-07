
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Footer } from '../components/Footer';
import { SearchModal } from '../components/SearchModal';
import { PremiumModal } from '../components/PremiumModal';
import { AuthModal } from '../components/AuthModal';
import { UserProfile, ActiveTab } from '../types';
import { GENRES_DATA } from '../data/animeData';

export const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isPremiumOpen, setIsPremiumOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Sync activeTab with route
    useEffect(() => {
        const path = location.pathname.split('/')[1] || 'home';
        if (path === 'chat') setActiveTab('community');
        else if (path === 'contest') setActiveTab('contest');
        else setActiveTab(path as ActiveTab);
    }, [location.pathname]);

    // Mock user for now, should come from a context/store
    const [user, setUser] = useState<UserProfile>({
        id: '1',
        name: 'ANILO EGA²',
        avatar: 'https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg',
        isPremium: true,
    } as any);

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        if (tab === 'home') navigate('/');
        else if (tab === 'profile') navigate('/profile');
        else if (tab === 'community') navigate('/chat');
        else if (tab === 'favorites') navigate('/favorites');
        else if (tab === 'history') navigate('/history');
        else if (tab === 'contest') navigate('/contest');
        else navigate(`/${tab}`);
    };

    return (
        <div className="min-h-screen bg-[#0E0E12] text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-black">
            <Navbar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenPremium={() => setIsPremiumOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
                favoritesCount={0}
                historyCount={0}
                user={user}
                currentLang="UZ"
                onChangeLang={() => {}}
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            />

            <div className="flex-1 flex max-w-[1800px] w-full mx-auto">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    selectedGenre={null}
                    onSelectGenre={(genre) => {
                        navigate(`/catalog?genre=${genre}`);
                    }}
                    genres={GENRES_DATA}
                    onOpenPremium={() => setIsPremiumOpen(true)}
                    isOpenMobile={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                />

                <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 pb-28 lg:pb-12">
                    <Outlet />
                </main>
            </div>

            <Footer />

            <MobileBottomNav
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenPremium={() => setIsPremiumOpen(true)}
                favoritesCount={0}
            />

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                animeList={[]}
                genres={GENRES_DATA}
                onPlayAnime={(anime) => navigate(`/watch/${anime.id}`)}
                onOpenDetail={(anime) => navigate(`/anime/${anime.id}`)}
            />

            <PremiumModal
                isOpen={isPremiumOpen}
                onClose={() => setIsPremiumOpen(false)}
                user={user}
                onUpgradeSuccess={() => setUser({ ...user, isPremium: true })}
            />

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onAuthSuccess={() => {}}
            />
        </div>
    );
};
