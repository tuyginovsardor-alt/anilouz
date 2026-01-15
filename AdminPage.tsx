
import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { UserRole } from './types';
import { AdminSubPage } from './App';
import { AdminDashboard } from './components/AdminDashboard';
import { UserManagementPage } from './UserManagementPage';
import { MovieManagementPage } from './MovieManagementPage';
import { FinancialsPage } from './FinancialsPage';
import { SupportPage } from './SupportPage';
import { PromocodePage } from './PromocodePage';
import { ContestManagementPage } from './ContestManagementPage';
import { SiteCustomizationPage } from './SiteCustomizationPage';
import { SessionsPage } from './SessionsPage';
import { BroadcastPage } from './BroadcastPage';
import { SitemapGeneratorPage } from './SitemapGeneratorPage';
import { CashContestPage } from './CashContestPage';
import { SecurityPage } from './SecurityPage';
import { StampToolPage } from './StampToolPage';
import { getPaymentRequests, getAllTickets } from './services/dbService';

interface AdminPageProps {
  currentRole: UserRole;
  currentPage: AdminSubPage;
  onNavigate: (page: AdminSubPage) => void;
  onSwitchView: () => void;
  onLogout: () => void;
  onImpersonate: (userId: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentRole,
  currentPage,
  onNavigate,
  onSwitchView,
  onLogout,
  onImpersonate
}) => {
  const [counts, setCounts] = useState({ financials: 0, support: 0 });

  useEffect(() => {
    const loadBadgeCounts = async () => {
        try {
            const [payments, tickets] = await Promise.all([
                getPaymentRequests(),
                getAllTickets()
            ]);
            setCounts({
                financials: payments.filter(p => p.status === 'pending').length,
                support: tickets.filter(t => t.status === 'open').length
            });
        } catch (e) {
            console.error("Badge count error", e);
        }
    };
    loadBadgeCounts();
  }, [currentPage]);

  const renderSubPage = () => {
    switch (currentPage) {
      case 'dashboard': return <AdminDashboard />;
      case 'users': return <UserManagementPage onImpersonate={onImpersonate} />;
      case 'movies': return <MovieManagementPage />;
      case 'financials': return <FinancialsPage />;
      case 'support': return <SupportPage />;
      case 'promocodes': return <PromocodePage />;
      case 'contest': return <ContestManagementPage />;
      case 'customization': return <SiteCustomizationPage />;
      case 'sessions': return <SessionsPage />;
      case 'broadcasts': return <BroadcastPage />;
      case 'sitemap': return <SitemapGeneratorPage />;
      case 'cash_contest': return <CashContestPage />;
      case 'security': return <SecurityPage />;
      case 'stamp_tool': return <StampToolPage />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#07070a] overflow-hidden">
      <AdminSidebar 
        currentRole={currentRole} 
        currentPage={currentPage} 
        onNavigate={onNavigate} 
        onSwitchView={onSwitchView}
        onLogout={onLogout}
        counts={counts}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderSubPage()}
        </div>
      </main>
    </div>
  );
};
