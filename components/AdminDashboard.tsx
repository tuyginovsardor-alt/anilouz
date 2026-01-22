
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Users, Film, CreditCard, MessageSquare, TrendingUp, AlertCircle, Check, X as XIcon, Eye } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { getDashboardStats, getPendingFandubUploads, approveFandubUpload, rejectFandubUpload } from '../services/dbService';
import { FandubUpload } from '../types';
import { useNotification } from '../hooks/useNotification';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [pendingUploads, setPendingUploads] = useState<FandubUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [d, u] = await Promise.all([
                getDashboardStats(),
                getPendingFandubUploads()
            ]);
            setStats(d);
            setPendingUploads(u);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleApprove = async (id: number) => {
        try {
            await approveFandubUpload(id);
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: 'Anime katalogga qo\'shildi.' });
            setPendingUploads(prev => prev.filter(u => u.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleReject = async (id: number) => {
        const comment = prompt("Rad etish sababi:");
        if (!comment) return;
        try {
            await rejectFandubUpload(id, comment);
            addNotification({ type: 'warning', title: 'Rad etildi', message: 'Foydalanuvchiga xabar yuborildi.' });
            setPendingUploads(prev => prev.filter(u => u.id !== id));
        } catch (e) { console.error(e); }
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
            
            {/* PENDING FANDUB UPLOADS */}
            <div className="bg-gray-800/40 border border-gray-700 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-8">
                    <AlertCircle className="text-yellow-500" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Kutilayotgan Fandub Loyihalari ({pendingUploads.length})</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingUploads.map(up => (
                        <div key={up.id} className="bg-gray-900 p-5 rounded-2xl flex gap-5 border border-gray-800 group hover:border-yellow-500/30 transition-all">
                            <div className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
                                <img src={up.poster_url} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate text-lg">{up.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 uppercase font-black tracking-widest">{up.genre}</p>
                                <p className="text-xs text-blue-400 mt-2">Kimdan: { (up as any).profiles?.full_name }</p>
                                <div className="flex gap-2 mt-6">
                                    <button onClick={() => handleApprove(up.id)} className="flex-1 bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase"><Check size={14}/> Tasdiqlash</button>
                                    <button onClick={() => handleReject(up.id)} className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase"><XIcon size={14}/> Rad etish</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {pendingUploads.length === 0 && <p className="text-gray-600 italic text-center py-4 col-span-full">Hozircha yangi yuklamalar yo'q.</p>}
                </div>
            </div>
        </div>
    );
};
