
import React, { useState, useEffect } from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { CloseIcon } from './icons/CloseIcon';
import { AdminIcon } from './icons/AdminIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { TelegramIcon } from './icons/TelegramIcon';
import { DashboardSubPage } from '../App';
import { useNotification } from '../hooks/useNotification';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, getSocialLinks } from '../services/dbService';
import { UserRole, SocialLink } from '../types';

interface HamburgerMenuProps {
    onLogout: () => void;
    onNavigate: (page: DashboardSubPage) => void;
    onSwitchRole: (role: UserRole) => void;
}

const menuItems: { name: string; page: DashboardSubPage }[] = [
    { name: 'Boshqaruv Paneli', page: 'main' },
    { name: 'Hisobim', page: 'account' },
    { name: 'Hisobni to\'ldirish', page: 'billing' },
    { name: 'Profil', page: 'profile' },
    { name: 'Saqlanganlar', page: 'saved' },
    { name: 'Tarix', page: 'history' },
    { name: 'Sozlamalar', page: 'settings' },
];

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onLogout, onNavigate, onSwitchRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [realRole, setRealRole] = useState<UserRole>('user');
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const { addNotification } = useNotification();

    useEffect(() => {
        const checkRealRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const profile = await getUserProfile(user.id);
                    if (profile && profile.role !== 'user') {
                        setRealRole(profile.role);
                    }
                }
            } catch (error) {
                console.error("Rolni tekshirishda xatolik:", error);
            }
        };
        checkRealRole();
        
        const loadLinks = async () => {
            try {
                const links = await getSocialLinks();
                setSocialLinks(links);
            } catch (e) {
                console.error("Error loading social links:", e);
            }
        };
        loadLinks();
    }, []);

    const handleNavigate = (page: DashboardSubPage) => {
        onNavigate(page);
        setIsOpen(false);
    };

    const handleAdminSwitch = () => {
        if (realRole !== 'user') {
            onSwitchRole(realRole);
            setIsOpen(false);
            addNotification({
                type: 'info',
                title: 'Rejim o\'zgardi',
                message: 'Admin paneliga o\'tilmoqda...'
            });
        }
    };

    const getSocialIcon = (platform: string) => {
        const className = "w-5 h-5";
        switch(platform) {
            case 'instagram': return <InstagramIcon className={className} />;
            case 'facebook': return <FacebookIcon className={className} />;
            case 'youtube': return <YouTubeIcon className={className} />;
            case 'telegram': return <TelegramIcon className={className} />;
            default: return <div className="w-5 h-5 bg-gray-600 rounded-full" />;
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white z-50 relative"
                aria-label="Asosiy menyuni ochish"
            >
                {isOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>

            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-72 bg-gray-900 border-l border-gray-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-orange-500">Menyu</h2>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex-grow overflow-y-auto">
                        <ul className="space-y-2">
                            {/* Admin Button - Only visible for privileged users */}
                            {realRole !== 'user' && (
                                <li className="mb-4 pb-4 border-b border-gray-800">
                                    <button 
                                        onClick={handleAdminSwitch}
                                        className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg text-base font-bold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all"
                                    >
                                        <AdminIcon className="w-5 h-5" />
                                        Admin Panelga O'tish
                                    </button>
                                </li>
                            )}

                            {menuItems.map((item) => (
                                <li key={item.name}>
                                    <button onClick={() => handleNavigate(item.page)} className="w-full text-left text-gray-300 hover:bg-gray-800 hover:text-white block px-3 py-2.5 rounded-lg text-base font-medium transition-colors">
                                        {item.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    
                    <div className="pt-4 border-t border-gray-800">
                        {/* Ijtimoiy Tarmoqlar (Dinamik) */}
                        {socialLinks.length > 0 && (
                            <div className="flex justify-center flex-wrap gap-3 mb-4">
                                {socialLinks.map((link) => (
                                    <a 
                                        key={link.id}
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-orange-500 transition-all duration-300 transform hover:scale-110"
                                        title={link.label}
                                    >
                                        {getSocialIcon(link.platform)}
                                    </a>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                addNotification({
                                    type: 'info',
                                    title: 'Chiqish',
                                    message: 'Xayr, salomat bo\'ling!',
                                });
                                onLogout();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-center px-3 py-3 bg-red-600/10 text-red-400 border border-red-600/20 rounded-lg text-base font-medium hover:bg-red-600 hover:text-white transition-all duration-200"
                        >
                            Chiqish
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
