


import React from 'react';
import { HamburgerMenu } from './components/HamburgerMenu';
import { DashboardSubPage, Page } from './App';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { HistoryPage } from './HistoryPage';
import { DashboardHomePage } from './DashboardHomePage';
import { Movie, UserRole } from './types';
import { AdminIcon } from './components/icons/AdminIcon';
import { AccountPage } from './AccountPage';
import { BillingPage } from './BillingPage';
import { SavedPage } from './SavedPage';
import { TrendingUpIcon } from './components/icons/TrendingUpIcon';

interface DashboardPageProps {
  currentPage: DashboardSubPage;
  onNavigate: (page: DashboardSubPage) => void;
  onMainNavigate: (page: Page) => void;
  onSearch: (query: string) => void;
  onLogout: () => void;
  onMovieClick: (movie: Movie) => void;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  viewUserId?: string | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
    currentPage, 
    onNavigate, 
    onMainNavigate,
    onSearch, 
    onLogout, 
    onMovieClick, 
    currentRole, 
    onSwitchRole,
    viewUserId 
}) => {

    const renderContent = () => {
        switch (currentPage) {
            case 'profile':
                return <ProfilePage viewUserId={viewUserId} onMainNavigate={onMainNavigate} />;
            case 'settings':
                return <SettingsPage />;
            case 'history':
                return <HistoryPage onMovieClick={onMovieClick} viewUserId={viewUserId} />;
            case 'saved':
                return <SavedPage onMovieClick={onMovieClick} viewUserId={viewUserId} />;
            case 'account':
                return <AccountPage onNavigate={onNavigate} />;
            case 'billing':
                return <BillingPage />;
            case 'main':
            default:
                return (
                    <div>
                        <div className="mb-8">
                            {/* ARK Banner */}
                            <div 
                                onClick={() => onMainNavigate('arktrading')}
                                className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border border-yellow-600/50 rounded-2xl p-6 mb-6 cursor-pointer group relative overflow-hidden shadow-[0_0_15px_rgba(202,138,4,0.2)]"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingUpIcon className="w-32 h-32 text-yellow-500" />
                                </div>
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded animate-pulse">NEW</span>
                                            <h2 className="text-2xl font-bold text-white tracking-widest font-mono">ARK TRADING</h2>
                                        </div>
                                        <p className="text-gray-400 text-sm max-w-md">
                                            Yangi raqamli aktivlarni yig'ing, savdo qiling va real pulga almashtiring. 
                                            <br/><span className="text-yellow-500 font-bold">Premium a'zolar uchun maxsus.</span>
                                        </p>
                                    </div>
                                    <div className="bg-yellow-600/20 p-3 rounded-full border border-yellow-600/50 group-hover:scale-110 transition-transform">
                                        <TrendingUpIcon className="w-8 h-8 text-yellow-500" />
                                    </div>
                                </div>
                            </div>

                            <DashboardHomePage onSearch={onSearch} onMovieClick={onMovieClick} onNavigate={onMainNavigate} />
                        </div>
                    </div>
                );
        }
    }
    
    const isAdminOrPrivileged = ['admin', 'owner', 'manager', 'support', 'accountant'].includes(currentRole);

    return (
        <div>
            <div className="flex justify-end items-center gap-4 mb-8">
                {isAdminOrPrivileged && !viewUserId && (
                    <button
                        onClick={() => onSwitchRole(currentRole)} // This would take you back to the admin view
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors"
                        aria-label="Admin Paneliga o'tish"
                    >
                        <AdminIcon className="w-5 h-5" />
                        <span>Admin Paneli</span>
                    </button>
                )}
                
                <HamburgerMenu onLogout={onLogout} onNavigate={onNavigate} onSwitchRole={onSwitchRole} />
            </div>
            {renderContent()}
        </div>
    );
};