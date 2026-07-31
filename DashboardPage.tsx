
import React, { useState, useEffect } from 'react';
import { DashboardSubPage, Page } from './App';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { HistoryPage } from './HistoryPage';
import { DashboardHomePage } from './DashboardHomePage';
import { Movie, UserRole, SocialLink } from './types';
import { AccountPage } from './AccountPage';
import { BillingPage } from './BillingPage';
import { SavedPage } from './SavedPage';
import { DashboardSupportPage } from './components/DashboardSupportPage';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import * as db from './services/dbService';
import { supabase } from './services/supabaseClient';
import { Footer } from './components/Footer';
import { 
    LogOut, Settings, CreditCard, History as HistoryIcon, ShieldCheck, 
    Instagram, Send, Youtube, Facebook, MessageCircle, 
    Globe, ExternalLink, Mic, Star, LayoutGrid, ChevronRight,
    Terminal, Filter, List, Clock as ClockIcon,
    Home, Film, Tv, Clapperboard, Zap, TrendingUp, CalendarDays, Search, Heart, History, User,
    Sparkles, Bell
} from 'lucide-react';

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
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const isAdmin = ['admin', 'owner', 'manager'].includes(currentRole);
    const canAccessCreatorStudio = ['fandub', 'admin', 'owner', 'dub'].includes(currentRole);

    useEffect(() => {
        db.getAppConfig().then(config => {
            if (config['site_logo']) setCustomLogo(config['site_logo']);
        });

        supabase.auth.getUser().then(({data: {user}}) => {
            if (user) {
                db.getUserProfile(user.id).then(profile => {
                    if (profile) setAvatarUrl(profile.avatar_url);
                });
            }
        });

        if (currentPage === 'more') {
            db.getSocialLinks().then(setSocialLinks);
        }
    }, [currentPage]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchQuery);
    };

    const renderContent = () => {
        switch (currentPage) {
            case 'profile': return <ProfilePage viewUserId={viewUserId} onMainNavigate={onMainNavigate} />;
            case 'settings': return <SettingsPage onNavigate={onNavigate} />;
            case 'history': return <HistoryPage onMovieClick={onMovieClick} viewUserId={viewUserId} />;
            case 'saved': return <SavedPage onMovieClick={onMovieClick} viewUserId={viewUserId} />;
            case 'account': return <AccountPage onNavigate={onNavigate} />;
            case 'billing': return <BillingPage />;
            case 'plans': 
                return (
                    <div className="animate-fade-in pb-20">
                        <h2 className="text-3xl font-black text-center text-white mb-2 uppercase tracking-tight">Premium Tariflar</h2>
                        <p className="text-zinc-500 text-xs font-bold text-center uppercase tracking-widest mb-8">Eng qulayini tanlang</p>
                        <SubscriptionPlans />
                    </div>
                );
            case 'support': return <DashboardSupportPage onBack={() => onNavigate('more')} />;
            case 'more':
                return (
                    <div className="animate-fade-in space-y-10 max-w-2xl mx-auto pb-20">
                        <div className="flex flex-col gap-2">
                             <h2 className="text-3xl font-black tracking-tight text-white">Yana</h2>
                             <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Xizmatlar va Bo'limlar</p>
                        </div>
                        
                        <div className="grid gap-4">
                            {canAccessCreatorStudio && (
                                <button 
                                    onClick={() => onMainNavigate('fandub-dashboard')} 
                                    className="group w-full flex items-center justify-between p-6 bg-gradient-to-r from-purple-600/30 via-purple-600/10 to-transparent border border-purple-500/50 rounded-[2.5rem] text-white font-black transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-purple-500/20"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] group-hover:rotate-12 transition-transform">
                                            <Mic size={28}/>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xl tracking-tight">Ijodkor Xonasi</p>
                                            <p className="text-[10px] uppercase tracking-widest text-purple-400 font-black">LOYIHALARNI BOSHQARISH</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-purple-400 animate-pulse">OCHISH</span>
                                        <ChevronRight size={20} className="text-purple-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            )}

                            <button 
                                onClick={() => onMainNavigate('studio')} 
                                className="group w-full flex items-center justify-between p-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] text-orange-500 font-black transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-zinc-800 rounded-3xl flex items-center justify-center text-orange-500 border border-zinc-700 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                        <LayoutGrid size={28}/>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xl tracking-tight text-white">Anilo Studio</p>
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Artistlar va Katalog</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-zinc-600">OCHISH</span>
                                    <ExternalLink size={20} className="text-zinc-600 group-hover:text-orange-500" />
                                </div>
                            </button>

                            {isAdmin && (
                                <button onClick={() => onSwitchRole(currentRole)} className="group w-full flex items-center justify-between p-5 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-[2rem] text-yellow-500 font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-yellow-500/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                                            <ShieldCheck size={24}/>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-base text-white">Admin Paneli</p>
                                            <p className="text-[10px] opacity-60">Tizimni boshqarish</p>
                                        </div>
                                    </div>
                                    <ExternalLink size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                </button>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => onNavigate('account')} className="group w-full flex flex-col p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <div className="w-12 h-12 bg-orange-600/20 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
                                        <CreditCard size={24}/>
                                    </div>
                                    <p className="text-white font-bold text-lg">Moliya</p>
                                    <p className="text-gray-500 text-xs mt-1">Hisobni to'ldirish</p>
                                </button>

                                <button onClick={() => onNavigate('support')} className="group w-full flex flex-col p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <div className="w-12 h-12 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                                        <MessageCircle size={24}/>
                                    </div>
                                    <p className="text-white font-bold text-lg">Yordam</p>
                                    <p className="text-gray-500 text-xs mt-1">Murojaat va Chat</p>
                                </button>

                                <button onClick={() => onNavigate('history')} className="group w-full flex flex-col p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <div className="w-12 h-12 bg-purple-600/20 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
                                        <HistoryIcon size={24}/>
                                    </div>
                                    <p className="text-white font-bold text-lg">Tarix</p>
                                    <p className="text-gray-500 text-xs mt-1">Ko'rilgan animelar</p>
                                </button>

                                <button onClick={() => onNavigate('settings')} className="group w-full flex flex-col p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <div className="w-12 h-12 bg-gray-600/20 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
                                        <Settings size={24}/>
                                    </div>
                                    <p className="text-white font-bold text-lg">Sozlamalar</p>
                                    <p className="text-gray-500 text-xs mt-1">Hisob va Xavfsizlik</p>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'main':
            default:
                return <DashboardHomePage onSearch={onSearch} onMovieClick={onMovieClick} onMainNavigate={onMainNavigate} />;
        }
    }

    return (
        <div className="flex bg-[#131313] min-h-screen text-white font-sans selection:bg-orange-600/30">
            {/* Left Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#1c1b1b] flex flex-col py-6 z-50 border-r border-white/5">
                <div className="px-6 mb-8 cursor-pointer group" onClick={() => onNavigate('main')}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-orange-500/20 bg-black group-hover:scale-105 transition-transform">
                            {customLogo ? (
                                <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-orange-600 rounded-full" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white tracking-tighter leading-none">ANILO.UZ</h1>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.1em]">Anime Platform</p>
                        </div>
                    </div>
                </div>
                
                <nav className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                    <button 
                        onClick={() => onNavigate('main')}
                        className={`w-full flex items-center px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 ${currentPage === 'main' ? 'bg-orange-600 text-white font-bold shadow-lg shadow-orange-600/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Home className="mr-3" size={18} />
                        <span className="text-xs font-bold">Bosh sahifa</span>
                    </button>
                    
                    {[
                        { label: 'Animelar', icon: Film },
                        { label: 'Seriallar', icon: Tv },
                        { label: 'Filmlar', icon: Clapperboard },
                        { label: 'Janrlar', icon: LayoutGrid },
                        { label: 'Yangi chiqdi', icon: Zap },
                        { label: 'Mashhur', icon: TrendingUp },
                        { label: 'Ongoing', icon: CalendarDays },
                    ].map((item) => (
                        <button 
                            key={item.label}
                            className="w-full flex items-center text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2.5 mx-2 rounded-xl transition-all"
                        >
                            <item.icon className="mr-3" size={18} />
                            <span className="text-xs font-bold">{item.label}</span>
                        </button>
                    ))}

                    <div className="pt-6 pb-2 px-6">
                        <h3 className="text-zinc-600 font-black text-[9px] uppercase tracking-widest">Top janrlar</h3>
                    </div>
                    
                    {['Aksiya', 'Sarguzasht', 'Drama', 'Fantastika', 'Romantika'].map((genre) => (
                        <button key={genre} className="w-full flex items-center justify-between text-zinc-400 hover:text-white hover:bg-white/5 px-6 py-1.5 transition-all">
                            <span className="text-xs font-medium">{genre}</span>
                        </button>
                    ))}
                    
                    <button 
                        onClick={() => onNavigate('more')}
                        className={`w-full flex items-center px-4 py-2.5 mx-2 rounded-xl mt-4 transition-all duration-200 ${currentPage === 'more' ? 'bg-orange-600 text-white font-bold shadow-lg shadow-orange-600/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid className="mr-3" size={18} />
                        <span className="text-xs font-bold">Yana</span>
                    </button>
                </nav>

                <div className="px-4 mt-auto pt-6 space-y-4">
                    <div className="bg-[#2a2a2a] rounded-2xl p-4 text-center border border-white/5 group">
                        <Star className="text-orange-500 mx-auto mb-2 fill-orange-500 group-hover:scale-125 transition-transform" size={20} />
                        <p className="text-[10px] font-black text-white mb-2 leading-tight uppercase tracking-tight">Reklamasiz tomosha qiling!</p>
                        <button 
                            onClick={() => onNavigate('plans')}
                            className="w-full bg-orange-600 text-white font-black py-2 rounded-lg text-[9px] hover:brightness-110 transition-all uppercase tracking-widest"
                        >
                            PREMIUM
                        </button>
                    </div>

                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-red-600/10 border border-red-600/20 rounded-xl text-red-500 font-black uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all active:scale-95"
                    >
                        <LogOut size={14}/> Chiqish
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="h-16 bg-[#131313]/90 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8 border-b border-white/5">
                    <div className="flex items-center gap-8 flex-1">
                        <form onSubmit={handleSearch} className="max-w-md w-full">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={16} />
                                <input 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#2a2a2a] border-none rounded-full pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600 text-white" 
                                    placeholder="Qidirish..." 
                                    type="text"
                                />
                            </div>
                        </form>

                        <nav className="hidden xl:flex items-center gap-5">
                            {['Bosh sahifa', 'Anime', 'Dub sahifamiz', 'Kategoriyalar', 'Yangiliklar', 'Jadval'].map(link => (
                                <button key={link} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">{link}</button>
                            ))}
                        </nav>
                    </div>
                    
                    <div className="flex items-center gap-5 ml-8">
                        <div className="flex items-center gap-5 pr-5 border-r border-white/5">
                            <button className="text-zinc-400 hover:text-white transition-colors"><Sparkles size={18} /></button>
                            <button className="text-zinc-400 hover:text-white transition-colors relative">
                                <Bell size={18} />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full border border-[#131313]"></span>
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end hidden lg:flex">
                                <span className="text-[10px] font-black text-white uppercase tracking-tight">Foydalanuvchi</span>
                                <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest">VIP</span>
                            </div>
                            <button 
                                onClick={() => onNavigate('profile')}
                                className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 hover:border-orange-500 transition-all overflow-hidden"
                            >
                                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User size={18} />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className={`flex-1 ${currentPage === 'main' ? 'p-0' : 'p-6'}`}>
                    {renderContent()}
                </main>

                <Footer onNavigate={onMainNavigate} />
            </div>
        </div>
    );
};
