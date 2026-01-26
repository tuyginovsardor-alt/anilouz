
import React, { useState, useEffect } from 'react';
import { AdminSubPage } from './App';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { UserManagementPage } from './UserManagementPage';
import { MovieManagementPage } from './MovieManagementPage';
import { UserRole } from './types';
import { FinancialsPage } from './FinancialsPage';
import { SupportPage } from './SupportPage';
import { AdvertisementPage } from './AdvertisementPage';
import { PromocodePage } from './PromocodePage';
import { SiteCustomizationPage } from './SiteCustomizationPage';
import { AdminSettings } from './components/AdminSettings';
import { getAdminNotificationCounts, getAdminPin, getProtectedRoutes } from './services/dbService';
import { SessionsPage } from './SessionsPage';
import { BroadcastPage } from './BroadcastPage';
import { ContestManagementPage } from './ContestManagementPage';
import { SitemapGeneratorPage } from './SitemapGeneratorPage';
import { CashContestPage } from './CashContestPage';
import { SecurityPage } from './SecurityPage';
import { PinModal } from './components/PinModal';
import { StampToolPage } from './StampToolPage';
import { BundleManagementPage } from './BundleManagementPage'; // NEW

interface AdminPageProps {
  currentRole: UserRole;
  currentPage: AdminSubPage;
  onNavigate: (page: AdminSubPage) => void;
  onSwitchView: () => void;
  onLogout: () => void;
  onImpersonate?: (userId: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ currentRole, currentPage, onNavigate, onSwitchView, onLogout, onImpersonate }) => {
  const [counts, setCounts] = useState<{ financials: number, support: number }>({ financials: 0, support: 0 });
  const [correctPin, setCorrectPin] = useState<string>('');
  const [protectedRoutes, setProtectedRoutes] = useState<string[]>([]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [verifiedRoutes, setVerifiedRoutes] = useState<Set<string>>(new Set());
  const [pendingRoute, setPendingRoute] = useState<AdminSubPage | null>(null);

  useEffect(() => {
      const fetchCounts = async () => {
          const data = await getAdminNotificationCounts();
          setCounts(data);
      };
      fetchCounts();
      const fetchSecurity = async () => {
          const pin = await getAdminPin();
          const routes = await getProtectedRoutes();
          setCorrectPin(pin);
          setProtectedRoutes(routes);
      };
      fetchSecurity();
  }, []);

  const handleNavigate = (page: any) => {
      if (protectedRoutes.includes(page) && !verifiedRoutes.has(page)) {
          setPendingRoute(page);
          setIsPinModalOpen(true);
      } else {
          onNavigate(page);
      }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return <AdminDashboard />;
      case 'bundle_manager': return <BundleManagementPage />; // NEW
      case 'users': return <UserManagementPage onImpersonate={onImpersonate} />;
      case 'sessions': return <SessionsPage />;
      case 'contest': return <ContestManagementPage />;
      case 'cash_contest': return currentRole === 'owner' ? <CashContestPage /> : <AdminDashboard />;
      case 'broadcasts': return <BroadcastPage />;
      case 'movies': return <MovieManagementPage />;
      case 'settings': return currentRole === 'owner' ? <AdminSettings /> : <AdminDashboard />;
      case 'financials': return (currentRole === 'owner' || currentRole === 'accountant') ? <FinancialsPage /> : <AdminDashboard />;
      case 'support': return <SupportPage />;
      case 'advertisements': return <AdvertisementPage />;
      case 'promocodes': return <PromocodePage />;
      case 'sitemap': return <SitemapGeneratorPage />;
      case 'customization': return currentRole === 'owner' ? <SiteCustomizationPage /> : <AdminDashboard />;
      case 'security': return currentRole === 'owner' ? <SecurityPage /> : <AdminDashboard />;
      case 'stamp_tool': return currentRole === 'owner' ? <StampToolPage /> : <AdminDashboard />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      <AdminSidebar currentRole={currentRole} currentPage={currentPage} onNavigate={handleNavigate} onSwitchView={onSwitchView} onLogout={onLogout} counts={counts} />
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto custom-scrollbar">
        {renderContent()}
      </main>
      {isPinModalOpen && <PinModal correctPin={correctPin} onSuccess={() => { verifiedRoutes.add(pendingRoute!); onNavigate(pendingRoute!); setIsPinModalOpen(false); }} onClose={() => setIsPinModalOpen(false)} />}
    </div>
  );
};
