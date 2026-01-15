
import React, { useEffect, useState } from 'react';
import { DashboardSubPage } from './App';
import { WalletIcon } from './components/icons/WalletIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { TrendingUpIcon } from './components/icons/TrendingUpIcon';
import { TrendingDownIcon } from './components/icons/TrendingDownIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';
import { CrownIcon } from './components/icons/CrownIcon';
import { BillingIcon } from './components/icons/BillingIcon';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getUserTransactions } from './services/dbService';
import { Transaction } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';

interface AccountPageProps {
  onNavigate: (page: DashboardSubPage) => void;
}

const BalanceChart: React.FC = () => (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
        <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
        </defs>
        <path d="M 0 20 L 10 15 L 20 22 L 30 18 L 40 25 L 50 20 L 60 12 L 70 18 L 80 15 L 90 20 L 100 15 V 30 H 0 Z" fill="url(#chartGradient)" />
        <path d="M 0 20 L 10 15 L 20 22 L 30 18 L 40 25 L 50 20 L 60 12 L 70 18 L 80 15 L 90 20 L 100 15" fill="none" stroke="#f97316" strokeWidth="1" />
    </svg>
);

const ActionItem: React.FC<{icon: React.ReactNode; label: string}> = ({ icon, label }) => (
    <button className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors">
        <div className="text-orange-400">{icon}</div>
        <span className="text-xs text-gray-300">{label}</span>
    </button>
);


export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const profile = await getUserProfile(user.id);
                setBalance(profile?.balance || 0);

                const txs = await getUserTransactions(user.id);
                setTransactions(txs);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-8">
        Mening Hisobim
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Balance & Actions */}
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <WalletIcon className="w-8 h-8 text-orange-400" />
                        <div>
                            <p className="text-sm text-gray-400">Joriy balans</p>
                            <p className="text-xs text-gray-500">Hamyon ID: {Math.floor(Math.random() * 1000000)}</p>
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold text-white my-2">{balance.toLocaleString()} <span className="text-2xl text-gray-400">UZS</span></h2>
                </div>
                <div className="relative h-20 w-full mt-auto">
                    <BalanceChart />
                </div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 shadow-lg">
                 <h3 className="text-lg font-semibold text-white mb-4">
                     Boshqaruv
                 </h3>
                 <div className="grid grid-cols-3 gap-4">
                    <ActionItem icon={<HistoryIcon className="w-6 h-6"/>} label="Tarix" />
                    <ActionItem icon={<CrownIcon className="w-6 h-6"/>} label="Obuna" />
                    <ActionItem icon={<BillingIcon className="w-6 h-6"/>} label="Kartalar" />
                 </div>
            </div>
            
            <button 
                onClick={() => onNavigate('billing')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium transition-colors transform active:scale-95 text-lg">
                <PlusIcon className="w-6 h-6" />
                <span>Hisobni to'ldirish</span>
            </button>
        </div>

        {/* Right Column - Transaction History */}
        <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-6">So'nggi Tranzaksiyalar</h3>
            {transactions.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Hozircha tranzaksiyalar yo'q.</div>
            ) : (
                <ul className="space-y-3">
                    {transactions.map((tx) => {
                        const isTopup = tx.amount > 0;
                        return (
                            <li key={tx.id} className="flex justify-between items-center p-4 bg-gray-800/60 rounded-md transition-colors hover:bg-gray-800">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTopup ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {isTopup ? <TrendingUpIcon className="w-5 h-5 text-green-400" /> : <TrendingDownIcon className="w-5 h-5 text-red-400" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-200">{tx.description || (isTopup ? "Kirim" : "Chiqim")}</p>
                                        <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className={`font-semibold text-lg ${isTopup ? 'text-green-400' : 'text-red-400'}`}>
                                    {isTopup ? '+' : ''}{tx.amount.toLocaleString()} UZS
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>

      </div>
    </div>
  );
};
