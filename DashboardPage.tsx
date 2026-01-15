
import React from 'react';
import { DashboardSubPage, Page } from './App';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { HistoryPage } from './HistoryPage';
import { DashboardHomePage } from './DashboardHomePage';
import { Movie, UserRole } from './types';
import { AccountPage } from './AccountPage';
import { BillingPage } from './BillingPage';
import { SavedPage } from './SavedPage';
import { LogOut, Settings, CreditCard, History, ShieldCheck, Instagram, Send, Youtube, Facebook } from 'lucide-react';

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

    const isAdmin = ['admin', 'owner', 'manager'].includes(currentRole);

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
            case 'more':
                return (
                    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-10">
                        <h2 className="text-2xl font-black tracking-tight text-white mb-8">Boshqa Bo'limlar</h2>
                        
                        <div className="grid gap-3">
                            {isAdmin && (
                                <button onClick={() => onSwitchRole(currentRole)} className="w-full flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-500 font-bold hover:bg-yellow-500/20 transition-all">
                                    <div className="flex items-center gap-3"><ShieldCheck size={20}/> Admin Paneli</div>
                                    <span>&rarr;</span>
                                </button>
                            )}
                            <button onClick={() => onNavigate('billing')} className="w-full flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-2xl text-gray-300 font-bold hover:bg-gray-800 transition-all">
                                <div className="flex items-center gap-3"><CreditCard size={20}/> Hisob To'ldirish</div>
                                <span>&rarr;</span>
                            </button>
                            <button onClick={() => onNavigate('history')} className="w-full flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-2xl text-gray-300 font-bold hover:bg-gray-800 transition-all">
                                <div className="flex items-center gap-3"><History size={20}/> Ko'rilganlar</div>
                                <span>&rarr;</span>
                            </button>
                            <button onClick={() => onNavigate('settings')} className="w-full flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-2xl text-gray-300 font-bold hover:bg-gray-800 transition-all">
                                <div className="flex items-center gap-3"><Settings size={20}/> Sozlamalar</div>
                                <span>&rarr;</span>
                            </button>
                        </div>

                        <div className="pt-8 space-y-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Biz Ijtimoiy Tarmoqlarda</p>
                            <div className="flex justify-center gap-4">
                                <a href="#" className="p-3 bg-gray-900 border border-gray-800 rounded-full text-gray-400 hover:text-white transition-all"><Instagram size={20}/></a>
                                <a href="#" className="p-3 bg-gray-900 border border-gray-800 rounded-full text-gray-400 hover:text-white transition-all"><Send size={20}/></a>
                                <a href="#" className="p-3 bg-gray-900 border border-gray-800 rounded-full text-gray-400 hover:text-white transition-all"><Youtube size={20}/></a>
                                <a href="#" className="p-3 bg-gray-900 border border-gray-800 rounded-full text-gray-400 hover:text-white transition-all"><Facebook size={20}/></a>
                            </div>
                        </div>

                        <button 
                            onClick={onLogout}
                            className="w-full mt-6 flex items-center justify-center gap-3 p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 font-bold hover:bg-red-600 hover:text-white transition-all"
                        >
                            <LogOut size={20}/> Hisobdan Chiqish
                        </button>
                    </div>
                );
            case 'main':
            default:
                // FIX: Removed 'onNavigate' as it is not part of DashboardHomePageProps
                return <DashboardHomePage onSearch={onSearch} onMovieClick={onMovieClick} />;
        }
    }

    return (
        <div className="container mx-auto px-4">
            {renderContent()}
        </div>
    );
};
