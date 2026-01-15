
import React from 'react';
import { AdminSubPage } from '../App';
import { UzumakiLogo } from './icons/UzumakiLogo';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { MovieIcon } from './icons/MovieIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { SwitchUserIcon } from './icons/SwitchUserIcon';
import { UserRole } from '../types';
import { BillingIcon } from './icons/BillingIcon';
import { SupportIcon } from './icons/SupportIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { TagIcon } from './icons/TagIcon';
import { PaletteIcon } from './icons/PaletteIcon';
import { MonitorIcon } from './icons/MonitorIcon';
import { BroadcastIcon } from './icons/BroadcastIcon';
import { GiftIcon } from './icons/GiftIcon';
import { MapIcon } from './icons/MapIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { StampIcon } from './icons/StampIcon'; // Import

interface AdminSidebarProps {
  currentRole: UserRole;
  currentPage: AdminSubPage;
  onNavigate: (page: AdminSubPage) => void;
  onSwitchView: () => void;
  onLogout: () => void;
  counts?: { financials: number; support: number };
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    count?: number;
}> = ({ icon, label, isActive, onClick, count }) => (
    <li>
        <button
            type="button"
            onClick={onClick}
            className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
        >
            {icon}
            <span className="flex-1 text-left">{label}</span>
            {(count !== undefined && count > 0) && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm shadow-yellow-500/20 border border-yellow-600">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    </li>
);

// Added 'stamp_tool'
const allMenuItems: { page: AdminSubPage, label: string, icon: React.ReactNode, roles: UserRole[] }[] = [
    { page: 'dashboard', label: 'Boshqaruv Paneli', icon: <DashboardIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'cash_contest', label: 'CASH KONKURS (ARK)', icon: <TrendingUpIcon className="w-5 h-5" />, roles: ['owner'] }, 
    { page: 'contest', label: 'Konkurs (O\'yin)', icon: <GiftIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'sessions', label: 'Seanslar (Sessions)', icon: <MonitorIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'broadcasts', label: 'Brodkast (Xabarnoma)', icon: <BroadcastIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'users', label: 'Foydalanuvchilar', icon: <UsersIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'movies', label: 'Kinolar', icon: <MovieIcon className="w-5 h-5" />, roles: ['owner', 'admin', 'manager'] },
    { page: 'financials', label: 'Moliya', icon: <BillingIcon className="w-5 h-5" />, roles: ['owner', 'accountant'] },
    { page: 'advertisements', label: 'Reklamalar', icon: <MegaphoneIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'promocodes', label: 'Promokodlar', icon: <TagIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'support', label: 'Murojaatlar', icon: <SupportIcon className="w-5 h-5" />, roles: ['owner', 'support'] },
    { page: 'sitemap', label: 'Sitemap (SEO)', icon: <MapIcon className="w-5 h-5" />, roles: ['owner', 'admin'] },
    { page: 'customization', label: 'Sayt Ko\'rinishi', icon: <PaletteIcon className="w-5 h-5" />, roles: ['owner'] },
    { page: 'stamp_tool', label: 'Hujjatni Tasdiqlash', icon: <StampIcon className="w-5 h-5" />, roles: ['owner'] }, // NEW
    { page: 'settings', label: 'Sozlamalar', icon: <SettingsIcon className="w-5 h-5" />, roles: ['owner'] },
    { page: 'security', label: 'HIMOYA', icon: <ShieldIcon className="w-5 h-5" />, roles: ['owner'] },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentRole,
  currentPage,
  onNavigate,
  onSwitchView,
  onLogout,
  counts = { financials: 0, support: 0 }
}) => {

  const visibleMenuItems = allMenuItems.filter(item => item.roles.includes(currentRole));
  
  return (
    <aside className="w-64 bg-gray-800 p-4 flex-shrink-0 flex flex-col border-r border-gray-700">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="relative">
            <UzumakiLogo className="w-10 h-10" />
        </div>
        <div>
            <span className="text-xl font-bold font-['Metal_Mania'] tracking-wider text-white">Anilo.uz</span>
            <span className="block text-xs font-semibold text-orange-400 uppercase tracking-wide">Admin Paneli</span>
        </div>
      </div>

      <nav className="flex-grow">
        <ul className="space-y-2">
          {visibleMenuItems.map(item => (
            <NavItem
                key={item.page}
                icon={item.icon}
                label={item.label}
                isActive={currentPage === item.page}
                onClick={() => onNavigate(item.page)}
                count={item.page === 'financials' ? counts.financials : item.page === 'support' ? counts.support : undefined}
            />
          ))}
        </ul>
      </nav>

      <div className="mt-auto">
        <ul className="space-y-2">
           <li>
                <button
                    type="button"
                    onClick={onSwitchView}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <SwitchUserIcon className="w-5 h-5" />
                    <span className="flex-1 text-left">Foydalanuvchi rejimi</span>
                </button>
           </li>
           <li>
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="flex-1 text-left">Chiqish</span>
                </button>
           </li>
        </ul>
      </div>
    </aside>
  );
};
