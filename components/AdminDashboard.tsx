
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Users, Film, CreditCard, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { getDashboardStats } from '../services/dbService';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const data = await getDashboardStats();
            // Bildirishnomalarni RPC orqali olamiz
            const { data: counts } = await supabase.rpc('get_admin_counts');
            setStats({ ...data, pendingFandub: counts?.fandub_pending || 0 });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;

    const cards = [
        { label: 'Jami Foydalanuvchilar', value: stats?.users || 0, icon: <Users className="text-blue-500" />, color: 'from-blue-500/10 to-transparent' },
        { label: 'Barcha Animelar', value: stats?.movies || 0, icon: <Film className="text-orange-500" />, color: 'from-orange-500/10 to-transparent' },
        { label: 'Tasdiqlangan To\'lovlar', value: stats?.payments || 0, icon: <CreditCard className="text-green-500" />, color: 'from-green-500/10 to-transparent' },
        { label: 'Ochiq Murojaatlar', value: stats?.tickets || 0, icon: <MessageSquare className="text-red-500" />, color: 'from-red-500/10 to-transparent' },
    ];

    return (
        <div className="animate-fade-in space-y-10 pb-10">
            {/* Bildirishnoma (Banner) */}
            {stats?.pendingFandub > 0 && (
                <div className="bg-purple-600 p-4 rounded-2xl flex justify-between items-center animate-pulse shadow-lg shadow-purple-900/40">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-white" />
                        <p className="text-white font-black uppercase text-xs tracking-widest">
                            Yangi {stats.pendingFandub} ta Fandub yuklamalari kutilmoqda!
                        </p>
                    </div>
                    <button className="px-5 py-2 bg-white text-purple-600 rounded-xl font-black text-[10px] uppercase">Tekshirish</button>
                </div>
            )}

            <h1 className="text-3xl font-bold text-white mb-8">Statistika</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {cards.map((card, i) => (
                    <div key={i} className={`bg-gray-800/40 border border-gray-700 p-6 rounded-2xl bg-gradient-to-br ${card.color}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-900/50 rounded-xl">{card.icon}</div>
                            <TrendingUp className="text-gray-600 w-4 h-4" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{card.value.toLocaleString()}</h3>
                    </div>
                ))}
            </div>
            
            <div className="bg-gray-800/20 border border-gray-800 p-10 rounded-3xl text-center">
                <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="text-orange-500 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Anilo Platformasi Faol</h2>
                <p className="text-gray-400 max-w-md mx-auto">Tizim barqaror ishlamoqda. Foydalanuvchilar soni va tomoshalar ko'rsatkichi oshmoqda.</p>
            </div>
        </div>
    );
};
