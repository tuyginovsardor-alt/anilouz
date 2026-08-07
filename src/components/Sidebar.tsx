import React from 'react';
import { 
  Home, Compass, Play, Zap, Flame, Star, 
  Heart, History, User, MessageSquare, Gift,
  Crown, Info, ChevronRight, Menu, X
} from 'lucide-react';
import { ActiveTab, Genre } from '../types';

interface SidebarProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    selectedGenre: string | null;
    onSelectGenre: (genreId: string) => void;
    genres: Genre[];
    onOpenPremium: () => void;
    isOpenMobile: boolean;
    onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    selectedGenre,
    onSelectGenre,
    genres,
    onOpenPremium,
    isOpenMobile,
    onCloseMobile
}) => {
    const mainLinks = [
        { id: 'home', label: 'Bosh sahifa', icon: Home },
        { id: 'anime', label: 'Anime', icon: Compass },
        { id: 'movies', label: 'Filmlar', icon: Play },
        { id: 'new', label: 'Yangilar', icon: Zap },
        { id: 'popular', label: 'Ommabop', icon: Flame },
        { id: 'ongoing', label: 'Ongoing', icon: Play },
        { id: 'favorites', label: 'Sevimlilar', icon: Heart },
        { id: 'history', label: 'Tarix', icon: History },
        { id: 'contest', label: 'Konkurs', icon: Gift },
        { id: 'community', label: 'Suhbat', icon: MessageSquare },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-[#0E0E12] border-r border-white/5 w-64 lg:w-72 overflow-y-auto scrollbar-none">
            {/* Logo Area (Hidden on Desktop if Navbar has it) */}
            <div className="p-6 flex items-center justify-between lg:hidden">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                    <span className="text-xl font-bold tracking-tight">ANILO EGA²</span>
                </div>
                <button onClick={onCloseMobile} className="text-gray-400 p-1">
                    <X size={20} />
                </button>
            </div>

            {/* Main Navigation */}
            <div className="px-4 py-4 space-y-1">
                {mainLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = activeTab === link.id;
                    return (
                        <button
                            key={link.id}
                            onClick={() => {
                                setActiveTab(link.id as ActiveTab);
                                if (isOpenMobile) onCloseMobile();
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                isActive 
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-orange-500'} />
                            <span className="font-medium">{link.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Genres Section */}
            <div className="px-4 py-6">
                <h3 className="px-4 mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Janrlar</h3>
                <div className="space-y-1">
                    {genres.map((genre) => (
                        <button
                            key={genre.id}
                            onClick={() => {
                                onSelectGenre(genre.id);
                                if (isOpenMobile) onCloseMobile();
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                                selectedGenre === genre.id
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium">{genre.name}</span>
                            </div>
                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500">{genre.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium CTA */}
            <div className="mt-auto p-6">
                <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-5 relative overflow-hidden group cursor-pointer" onClick={onOpenPremium}>
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <Crown className="text-white/20 absolute right-4 top-4" size={40} />
                    <h4 className="text-white font-bold mb-1 relative z-10">Premiumga o'ting</h4>
                    <p className="text-white/70 text-xs mb-4 relative z-10">Barcha anime va filmlarni reklamasiz tomosha qiling.</p>
                    <button className="w-full bg-white text-orange-700 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors relative z-10">
                        Faollashtirish
                    </button>
                </div>
                
                <div className="mt-6 flex items-center justify-center space-x-4 text-gray-500">
                    <button className="hover:text-white transition-colors"><Info size={18} /></button>
                    <button className="hover:text-white transition-colors"><SettingsIcon size={18} /></button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block sticky top-[72px] h-[calc(100vh-72px)] shrink-0">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isOpenMobile && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
                    onClick={onCloseMobile}
                />
            )}

            {/* Mobile Sidebar */}
            <aside 
                className={`fixed inset-y-0 left-0 w-72 bg-[#0E0E12] z-[70] lg:hidden transform transition-transform duration-300 ease-out ${
                    isOpenMobile ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
};

const SettingsIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
