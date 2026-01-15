
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
import { StampToolPage } from './StampToolPage'; // NEW

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
  
  // Security States
  const [correctPin, setCorrectPin] = useState<string>('');
  const [protectedRoutes, setProtectedRoutes] = useState<string[]>([]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [verifiedRoutes, setVerifiedRoutes] = useState<Set<string>>(new Set()); // Routes verified in this session
  const [pendingRoute, setPendingRoute] = useState<AdminSubPage | null>(null);

  useEffect(() => {
      const fetchCounts = async () => {
          const data = await getAdminNotificationCounts();
          setCounts(data);
      };
      fetchCounts();
      
      // Fetch security config
      const fetchSecurity = async () => {
          const pin = await getAdminPin();
          const routes = await getProtectedRoutes();
          setCorrectPin(pin);
          setProtectedRoutes(routes);
      };
      fetchSecurity();

      const interval = setInterval(fetchCounts, 15000);
      return () => clearInterval(interval);
  }, []);

  // Intercept Navigation
  const handleNavigate = (page: AdminSubPage) => {
      if (protectedRoutes.includes(page) && !verifiedRoutes.has(page)) {
          setPendingRoute(page);
          setIsPinModalOpen(true);
      } else {
          onNavigate(page);
      }
  };

  const handlePinSuccess = () => {
      if (pendingRoute) {
          setVerifiedRoutes(prev => new Set(prev).add(pendingRoute));
          onNavigate(pendingRoute);
          setIsPinModalOpen(false);
          setPendingRoute(null);
      }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagementPage onImpersonate={onImpersonate} />;
      case 'sessions':
        return <SessionsPage />;
      case 'contest':
        return <ContestManagementPage />;
      case 'cash_contest':
        if (currentRole === 'owner') return <CashContestPage />;
        return <AdminDashboard />;
      case 'broadcasts':
        return <BroadcastPage />;
      case 'movies':
        return <MovieManagementPage />;
      case 'settings':
        if (currentRole === 'owner') return <AdminSettings />;
        return <AdminDashboard />;
      case 'financials':
        if (currentRole === 'owner' || currentRole === 'accountant') return <FinancialsPage />;
        return <AdminDashboard />;
      case 'support':
        return <SupportPage />;
      case 'advertisements':
        return <AdvertisementPage />;
      case 'promocodes':
        return <PromocodePage />;
      case 'sitemap':
        return <SitemapGeneratorPage />;
      case 'customization':
        if (currentRole === 'owner') return <SiteCustomizationPage />;
        return <AdminDashboard />;
      case 'security':
        if (currentRole === 'owner') return <SecurityPage />;
        return <AdminDashboard />;
      case 'stamp_tool': // NEW
        if (currentRole === 'owner') return <StampToolPage />;
        return <AdminDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      <AdminSidebar
        currentRole={currentRole}
        currentPage={currentPage}
        onNavigate={handleNavigate} // Use intercepted handler
        onSwitchView={onSwitchView}
        onLogout={onLogout}
        counts={counts}
      />
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
        {renderContent()}
      </main>

      {isPinModalOpen && (
          <PinModal 
            correctPin={correctPin} 
            onSuccess={handlePinSuccess} 
            onClose={() => { setIsPinModalOpen(false); setPendingRoute(null); }} 
          />
      )}
    </div>
  );
};
