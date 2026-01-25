
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Users, Film, CreditCard, MessageSquare, TrendingUp, AlertCircle, Check, X as XIcon, Eye, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { getDashboardStats, getPendingFandubUploads, approveFandubUpload, rejectFandubUpload } from '../services/dbService';
import { FandubUpload } from '../types';
import { useNotification } from '../hooks/useNotification';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [pendingUploads, setPendingUploads] = useState<FandubUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setRefreshing(true);
        try {
            const [d, u] = await Promise.all([
                getDashboardStats(),
                getPendingFandubUploads()
            ]);
            setStats(d);
            setPendingUploads(u);
        } catch (e) { console.error(e); }
        finally { 
            setLoading(false); 
            setRefreshing(false);
        }
    };

    const handleApprove = async (id: number) => {
        if(!window.confirm("Tasdiqlashni istaysizmi? Anime katalogda faollashadi.")) return;
        try {
            await approveFandubUpload(id);
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: 'Anime katalogga qo\'shildi.' });
            setPendingUploads(prev => prev.filter(u => u.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleReject = async (id: number) => {
        const comment = prompt("Rad etish sababi (Foydalanuvchiga ko'rinadi):");
        if (comment === null) return; // Cancelled
        
        try {
            await rejectFandubUpload(id, comment || "Sabab ko'rsatilmagan");
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
            
            {/* PENDING FANDUB UPLOADS SECTION */}
            <div className="bg-gray-800/40 border border-gray-700 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-500" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Fandub Moderatsiyasi ({pendingUploads.length})</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-gray-500 italic hidden sm:block">Yangi kelgan loyihalarni tekshiring</p>
                        <button 
                            onClick={loadData} 
                            disabled={refreshing}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-all active:scale-90"
                            title="Yangilash"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="p-5">Anime</th>
                                <th className="p-5">Yuklovchi</th>
                                <th className="p-5">Janr / Yil</th>
                                <th className="p-5 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {pendingUploads.length === 0 ? (
                                <tr><td colSpan={4} className="p-10 text-center text-gray-600 uppercase font-black text-xs tracking-widest italic">Hozircha yangi loyihalar yo'q.</td></tr>
                            ) : pendingUploads.map(up => (
                                <tr key={up.id} className="group hover:bg-gray-800/50 transition-all">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative group/poster cursor-pointer">
                                                <img src={up.poster_url} className="w-12 h-16 rounded-lg object-cover shadow-lg group-hover/poster:scale-150 transition-transform origin-left z-10 relative" alt="" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{up.title}</p>
                                                <p className="text-[10px] text-zinc-500 line-clamp-1 max-w-[200px]" title={up.description}>{up.description}</p>
                                                <a href={up.video_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-1"><Eye size={10}/> Videoni ko'rish</a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-sm text-purple-400 font-bold">{(up as any).profiles?.full_name || 'Noma\'lum'}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{(up as any).fandub_channels?.name || 'Studio'}</p>
                                    </td>
                                    <td className="p-5">
                                        <span className="bg-gray-700 px-2 py-1 rounded text-[10px] font-black text-gray-300 mr-2">{up.genre}</span>
                                        <span className="text-xs text-gray-500 font-mono">{up.year}</span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleApprove(up.id)}
                                                className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all shadow-lg shadow-green-900/20"
                                                title="Tasdiqlash"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleReject(up.id)}
                                                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg shadow-red-900/20"
                                                title="Rad etish"
                                            >
                                                <XIcon size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
