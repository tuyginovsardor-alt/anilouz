
import React, { useState, useEffect } from 'react';
import { 
    X, CreditCard, History, Bookmark, 
    Settings, LogOut, ChevronRight, User, 
    ShieldCheck, Edit3, Lock, HelpCircle, FileText, Wallet, Crown, Mic
} from 'lucide-react';
import { DashboardSubPage, Page, LegalDocType } from '../App';
import { supabase } from '../services/supabaseClient';
import { getUserProfile } from '../services/dbService';
import { UserRole, UserProfile } from '../types';

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    onMainNavigate: (page: Page) => void;
    onDashboardNavigate: (page: DashboardSubPage) => void;
    onSwitchRole: (role: UserRole) => void;
    onOpenLegal: (type: LegalDocType) => void; // Yangi prop
}

const MenuItem: React.FC<{ 
    icon?: React.ReactNode; 
    label: string; 
    value?: string; 
    onClick: () => void; 
    isDestructive?: boolean;
    hasArrow?: boolean;
    badge?: string;
}> = ({ icon, label, value, onClick, isDestructive = false, hasArrow = true, badge }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 border-b border-white/5 active:bg-white/5 transition-colors group"
    >
        <div className="flex items-center gap-3">
            {icon && <span className={isDestructive ? "text-red-500" : "text-zinc-400 group-hover:text-white transition-colors"}>{icon}</span>}
            <span className={`text-sm font-medium ${isDestructive ? "text-red-500" : "text-white"}`}>
                {label}
            </span>
            {badge && <span className="px-2 py-0.5 bg-orange-600 text-[9px] font-black uppercase rounded text-white ml-2">{badge}</span>}
        </div>
        <div className="flex items-center gap-2">
            {value && <span className="text-xs text-zinc-500 font-medium">{value}</span>}
            {hasArrow && <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400" />}
        </div>
    </button>
);

const MenuSection: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        {title && <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">{title}</h4>}
        <div className="flex flex-col">
            {children}
        </div>
    </div>
);

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
    isOpen, onClose, onLogout, onMainNavigate, onDashboardNavigate, onSwitchRole, onOpenLegal 
}) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const p = await getUserProfile(user.id);
                    setProfile(p as UserProfile);
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
                            <MenuItem 
                                icon={<Wallet size={20}/>} 
                                label="Mening Hisobim" 
                                value={`${(profile?.balance || 0).toLocaleString()} UZS`}
                                onClick={() => handleAction('sub', 'account')} 
                            />
                            <MenuItem 
                                icon={<Crown size={20}/>} 
                                label="Premium Obuna" 
                                value={profile?.subscription_plan || "Yo'q"} 
                                onClick={() => handleAction('sub', 'billing')} 
                            />
                            <MenuItem icon={<Bookmark size={20}/>} label="Saqlanganlar" onClick={() => handleAction('sub', 'saved')} />
                            <MenuItem icon={<History size={20}/>} label="Ko'rishlar tarixi" onClick={() => handleAction('sub', 'history')} />
                        </MenuSection>

                        <MenuSection title="Yordam va Sozlamalar">
                            <MenuItem 
                                icon={<HelpCircle size={20}/>} 
                                label="Yordam Markazi (AI)" 
                                badge="BOT"
                                onClick={() => handleAction('main', 'ai-assistant')} 
                            />
                            <MenuItem icon={<Settings size={20}/>} label="Ilova Sozlamalari" onClick={() => handleAction('sub', 'settings')} />
                        </MenuSection>

                        <MenuSection title="Hujjatlar">
                            <MenuItem icon={<FileText size={20}/>} label="Ommaviy Oferta" hasArrow={false} onClick={() => {onOpenLegal('terms'); onClose();}} />
                            <MenuItem icon={<Lock size={20}/>} label="Maxfiylik Siyosati" hasArrow={false} onClick={() => {onOpenLegal('privacy'); onClose();}} />
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
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Anilo v1.0.3</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
