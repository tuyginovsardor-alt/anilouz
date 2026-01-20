
import React, { useState, useEffect } from 'react';
import { 
    X, Mic, CreditCard, History, Bookmark, 
    Settings, LogOut, ChevronRight, User, 
    ShoppingBag, Star, ShieldCheck, Edit3, Globe, Lock
} from 'lucide-react';
import { DashboardSubPage, Page } from '../App';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, getShopWallet } from '../services/dbService';
import { UserRole, UserProfile, ShopWallet } from '../types';

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    onMainNavigate: (page: Page) => void;
    onDashboardNavigate: (page: DashboardSubPage) => void;
    onSwitchRole: (role: UserRole) => void;
}

const MenuItem: React.FC<{ 
    icon?: React.ReactNode; 
    label: string; 
    value?: string; 
    onClick: () => void; 
    isDestructive?: boolean;
    hasArrow?: boolean;
}> = ({ icon, label, value, onClick, isDestructive = false, hasArrow = true }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 border-b border-white/5 active:bg-white/5 transition-colors group"
    >
        <div className="flex items-center gap-3">
            {icon && <span className={isDestructive ? "text-red-500" : "text-zinc-400 group-hover:text-white transition-colors"}>{icon}</span>}
            <span className={`text-sm font-medium ${isDestructive ? "text-red-500" : "text-white"}`}>
                {label}
            </span>
        </div>
        <div className="flex items-center gap-2">
            {value && <span className="text-xs text-zinc-500 font-medium">{value}</span>}
            {hasArrow && <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400" />}
        </div>
    </button>
);

const MenuSection: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        {title && <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">{title}</h4>}
        <div className="flex flex-col">
            {children}
        </div>
    </div>
);

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
    isOpen, onClose, onLogout, onMainNavigate, onDashboardNavigate, onSwitchRole 
}) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [shopWallet, setShopWallet] = useState<ShopWallet | null>(null);

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
            };
            loadData();
        }
    }, [isOpen]);

    const handleAction = (type: 'main' | 'sub', target: any) => {
        if (type === 'main') onMainNavigate(target);
        else onDashboardNavigate(target);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex justify-end animate-fade-in">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Menu Panel */}
            <div className="relative w-full max-w-sm bg-[#0a0a0a] h-full border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
                
                {/* Header with Close Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* 1. Profile Header (Big Avatar) */}
                    <div className="pt-16 pb-8 px-6 flex flex-col items-center bg-gradient-to-b from-orange-900/20 to-transparent">
                        <div className="relative mb-4 group cursor-pointer" onClick={() => handleAction('sub', 'profile')}>
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-orange-500 to-red-600 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                                <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500"><User size={40}/></div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 bg-white text-black p-1.5 rounded-full shadow-lg border-2 border-black">
                                <Edit3 size={14} />
                            </div>
                        </div>
                        
                        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">
                            {profile?.full_name || 'Foydalanuvchi'}
                        </h2>
                        <p className="text-sm font-bold text-orange-500">@{profile?.username}</p>

                        {/* Balance Badge */}
                        <div className="mt-4 flex gap-3">
                            <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <CreditCard size={14} className="text-zinc-400"/>
                                <span className="text-xs font-mono text-white">{(profile?.balance || 0).toLocaleString()} UZS</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Menu Items */}
                    <div className="px-6 pb-10">
                        {/* Fandub Special Section */}
                        {profile?.role === 'fandub' && (
                            <div className="mb-6">
                                <button 
                                    onClick={() => handleAction('main', 'fandub-dashboard')}
                                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 flex items-center justify-between group hover:border-purple-500/60 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                            <Mic size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white uppercase">Fandub Studio</p>
                                            <p className="text-[10px] text-zinc-400">Ijodkor paneli</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-purple-400" />
                                </button>
                            </div>
                        )}

                        <MenuSection title="Mening Profilim">
                            <MenuItem icon={<User size={20}/>} label="Profilni tahrirlash" onClick={() => handleAction('sub', 'profile')} />
                            <MenuItem icon={<Bookmark size={20}/>} label="Saqlanganlar" onClick={() => handleAction('sub', 'saved')} />
                            <MenuItem icon={<History size={20}/>} label="Ko'rishlar tarixi" onClick={() => handleAction('sub', 'history')} />
                            <MenuItem icon={<Star size={20}/>} label="Obuna (Premium)" value={profile?.subscription_plan || "Yo'q"} onClick={() => handleAction('sub', 'billing')} />
                        </MenuSection>

                        <MenuSection title="Ilova Sozlamalari">
                            <MenuItem icon={<Globe size={20}/>} label="Ilova tili" value="O'zbekcha" onClick={() => handleAction('sub', 'settings')} />
                            <MenuItem icon={<Lock size={20}/>} label="Parol va Xavfsizlik" onClick={() => handleAction('sub', 'settings')} />
                            <MenuItem icon={<ShoppingBag size={20}/>} label="Anilo Shop" onClick={() => handleAction('main', 'shop')} />
                        </MenuSection>

                        {/* Admin Section */}
                        {['admin', 'owner'].includes(profile?.role || '') && (
                            <MenuSection title="Administrator">
                                <MenuItem icon={<ShieldCheck size={20}/>} label="Admin Panelga o'tish" onClick={() => { onSwitchRole(profile!.role); onClose(); }} />
                            </MenuSection>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <MenuItem 
                                icon={<LogOut size={20}/>} 
                                label="Hisobdan chiqish" 
                                isDestructive={true} 
                                hasArrow={false}
                                onClick={onLogout} 
                            />
                        </div>
                        
                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Anilo v1.0.2</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
