
import React, { useState, useEffect } from 'react';
import { 
    X, Mic, LayoutGrid, CreditCard, History, Bookmark, 
    Settings, LogOut, ShieldCheck, ChevronRight, 
    Instagram, Send, Youtube, Facebook, User, Wallet, ShoppingBag, Store
} from 'lucide-react';
import { DashboardSubPage, Page } from '../App';
import { useNotification } from '../hooks/useNotification';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, getSocialLinks, getShopWallet } from '../services/dbService';
import { UserRole, SocialLink, UserProfile, ShopWallet } from '../types';

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    onMainNavigate: (page: Page) => void;
    onDashboardNavigate: (page: DashboardSubPage) => void;
    onSwitchRole: (role: UserRole) => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
    isOpen, onClose, onLogout, onMainNavigate, onDashboardNavigate, onSwitchRole 
}) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [shopWallet, setShopWallet] = useState<ShopWallet | null>(null);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const { addNotification } = useNotification();

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const [p, w] = await Promise.all([
                        getUserProfile(user.id),
                        getShopWallet(user.id)
                    ]);
                    setProfile(p as UserProfile);
                    setShopWallet(w);
                }
                const links = await getSocialLinks();
                setSocialLinks(links);
            };
            loadData();
        }
    }, [isOpen]);

    const handleAction = (type: 'main' | 'sub', target: any) => {
        if (type === 'main') onMainNavigate(target);
        else onDashboardNavigate(target);
        onClose();
    };

    const getSocialIcon = (platform: string) => {
        switch(platform) {
            case 'instagram': return <Instagram size={18}/>;
            case 'telegram': return <Send size={18}/>;
            case 'youtube': return <Youtube size={18}/>;
            default: return <Facebook size={18}/>;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex justify-end animate-fade-in">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>

            {/* Menu Panel */}
            <div className="relative w-full max-w-sm bg-[#0a0a0a] h-full border-l border-zinc-900 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
                
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-[#050505]">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">Menyu</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* User Info */}
                    {profile && (
                        <div className="p-6 bg-gradient-to-b from-zinc-900/50 to-transparent">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden">
                                    {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-zinc-600"><User size={28}/></div>}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-white truncate uppercase text-sm tracking-tight">{profile.full_name}</p>
                                    <p className="text-orange-500 text-xs font-bold">@{profile.username}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Anime Balance</p>
                                    <p className="text-[11px] font-black text-white"> {profile.balance.toLocaleString()} UZS</p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl border-orange-500/20">
                                    <p className="text-[8px] text-orange-500 font-black uppercase tracking-widest mb-1">Shop Balance</p>
                                    <p className="text-[11px] font-black text-white"> {(shopWallet?.balance || 0).toLocaleString()} UZS</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-4 space-y-1">
                        {/* SPECIAL FANDUB ENTRY - PURPLE STYLE */}
                        {profile?.role === 'fandub' && (
                            <div className="px-2 pb-2 pt-2">
                                <button 
                                    onClick={() => handleAction('main', 'fandub-dashboard')}
                                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-600 to-purple-900 rounded-[2rem] border border-purple-500/30 shadow-2xl shadow-purple-600/20 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                            <Mic size={22} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white uppercase tracking-tight">Fandub Studio</p>
                                            <p className="text-[8px] text-white/60 font-bold uppercase tracking-widest">Ijodkor Paneli</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-white/60 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}

                        <p className="px-3 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Platforma</p>
                        
                        <button onClick={() => handleAction('main', 'shop')} className="w-full group flex items-center justify-between p-4 hover:bg-orange-600/10 rounded-2xl transition-all text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                                    <ShoppingBag size={20}/>
                                </div>
                                <span className="text-sm font-black text-white uppercase tracking-tight">Anilo Shop</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-700" />
                        </button>

                        <button onClick={() => handleAction('main', 'studio')} className="w-full group flex items-center justify-between p-4 hover:bg-zinc-900 rounded-2xl transition-all text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-orange-500 border border-zinc-700 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                    <Mic size={20}/>
                                </div>
                                <span className="text-sm font-black text-white uppercase tracking-tight">Fandub Loyihalar</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-700" />
                        </button>

                        <p className="px-3 pt-6 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Sizning hisobingiz</p>
                        
                        {[
                            { id: 'saved', label: 'Saqlanganlar', icon: <Bookmark size={18}/> },
                            { id: 'history', label: 'Ko\'rishlar Tarixi', icon: <History size={18}/> },
                            { id: 'settings', label: 'Sozlamalar', icon: <Settings size={18}/> },
                        ].map(item => (
                            <button key={item.id} onClick={() => handleAction('sub', item.id as any)} className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl transition-all text-zinc-400 hover:text-white">
                                <div className="text-zinc-600">{item.icon}</div>
                                <span className="text-sm font-bold">{item.label}</span>
                            </button>
                        ))}

                        {/* GLOBAL ADMIN SWITCH */}
                        {['admin', 'owner'].includes(profile?.role || '') && (
                            <button onClick={() => {
                                onSwitchRole(profile!.role); 
                                onClose();
                            }} className="w-full flex items-center gap-4 p-4 hover:bg-yellow-500/10 rounded-2xl transition-all text-yellow-500 mt-4 border border-yellow-500/10">
                                <ShieldCheck size={18}/>
                                <span className="text-sm font-black uppercase tracking-widest">Global Admin</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#050505] border-t border-zinc-900">
                    <div className="flex justify-center gap-4 mb-6">
                        {socialLinks.map(link => (
                            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-all border border-zinc-800">
                                {getSocialIcon(link.platform)}
                            </a>
                        ))}
                    </div>
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all font-black uppercase text-[10px] tracking-[0.2em] border border-red-600/10">
                        <LogOut size={16}/> Hisobdan chiqish
                    </button>
                </div>
            </div>
        </div>
    );
};
