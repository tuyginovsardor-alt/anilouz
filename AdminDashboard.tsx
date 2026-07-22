
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { 
    Users, Film, CreditCard, MessageSquare, TrendingUp, AlertCircle, 
    Check, X as XIcon, Eye, RefreshCw, Lock, Unlock, Layers, Sparkles, Terminal, Activity, ArrowUpRight
} from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getDashboardStats, getPendingFandubUploads, approveFandubUpload, rejectFandubUpload, toggleBlockFandub, getAllUsers, getPaymentRequests } from './services/dbService';
import { runAiServerManager, isAiPilotEnabled, setAiPilotEnabled } from './services/aiGuardService';
import { FandubUpload, UserProfile, PaymentRequestDB } from './types';
import { useNotification } from './hooks/useNotification';

const StatCard: React.FC<{ label: string, value: number, icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
    <div className="relative group bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] overflow-hidden hover:border-orange-500/30 transition-all duration-500">
        <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity`}></div>
        
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 bg-black/50 border border-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                {icon}
            </div>
            <ArrowUpRight className="text-zinc-800 group-hover:text-orange-500 transition-colors" size={20} />
        </div>
        
        <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{value.toLocaleString()}</h3>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
    </div>
);

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [pendingUploads, setPendingUploads] = useState<FandubUpload[]>([]);
    const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
    const [recentPayments, setRecentPayments] = useState<PaymentRequestDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [isAiPilotActive, setIsAiPilotActive] = useState(isAiPilotEnabled());
    const [aiLogs, setAiLogs] = useState<{time: string, msg: string, type: 'info'|'action'}[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setRefreshing(true);
        try {
            const [d, u, users, payments] = await Promise.all([
                getDashboardStats(),
                getPendingFandubUploads(),
                getAllUsers(),
                getPaymentRequests()
            ]);
            setStats(d);
            setPendingUploads(u);
            setRecentUsers(users.slice(0, 5));
            setRecentPayments(payments.slice(0, 5));
        } catch (e) { console.error(e); }
        finally { 
            setLoading(false); 
            setRefreshing(false);
        }
    };

    const handleToggleAiPilot = () => {
        const newState = !isAiPilotActive;
        setIsAiPilotActive(newState);
        setAiPilotEnabled(newState);
        addNotification({ type: 'info', title: 'AI Pilot', message: newState ? 'AI Pilot tizimi faollashtirildi.' : 'AI Pilot o\'chirildi.' });
    };

    const handleRunAiGuard = async () => {
        setIsAiThinking(true);
        const context = `Hozirgi holat: ${pendingUploads.length} ta tasdiqlanmagan fandub. Statistika: ${stats?.users} users.`;
        const result = await runAiServerManager(context);
        if (result) {
            const newLogs: any[] = [];
            result.actions.forEach(a => newLogs.push({ time: new Date().toLocaleTimeString(), msg: a, type: 'action' }));
            if (result.analysis) newLogs.push({ time: new Date().toLocaleTimeString(), msg: result.analysis, type: 'info' });
            setAiLogs(prev => [...newLogs, ...prev].slice(0, 15));
            if (result.actions.length > 0) loadData();
        }
        setIsAiThinking(false);
    };

    if (loading) return <div className="h-full flex items-center justify-center py-20"><LoadingSpinner /></div>;

    return (
        <div className="animate-fade-in space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-0">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-br from-zinc-900/50 to-transparent p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-1 bg-orange-600 rounded-full"></span>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Administrator</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white">Xush Kelibsiz!</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] border-l-2 border-orange-600/30 pl-3">Tizim nazorati va moderatsiya markazi</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={loadData}
                        disabled={refreshing}
                        className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-zinc-400 hover:text-white hover:border-white/10 transition-all active:scale-95"
                    >
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>

                    <div className={`flex items-center gap-4 p-2 pr-6 rounded-3xl border transition-all duration-500 ${isAiPilotActive ? 'bg-orange-600/10 border-orange-500/50' : 'bg-zinc-900/50 border-white/5'}`}>
                        <button 
                            onClick={handleToggleAiPilot}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isAiPilotActive ? 'bg-orange-600 text-white shadow-2xl shadow-orange-500/50' : 'bg-zinc-800 text-zinc-500'}`}
                        >
                            <Sparkles size={20} className={isAiPilotActive ? 'animate-pulse' : ''} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Pilot v2.0</span>
                            <span className={`text-[9px] font-bold ${isAiPilotActive ? 'text-orange-500' : 'text-zinc-600'}`}>{isAiPilotActive ? 'MONITORING...' : 'STANDBY'}</span>
                        </div>
                    </div>
                </div>
            </header>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard label="Foydalanuvchilar" value={stats?.users || 0} icon={<Users size={20} className="text-blue-500" />} color="from-blue-600 to-transparent" />
                <StatCard label="Anime Katalog" value={stats?.movies || 0} icon={<Film size={20} className="text-orange-500" />} color="from-orange-600 to-transparent" />
                <StatCard label="Tranzaksiyalar" value={stats?.payments || 0} icon={<CreditCard size={20} className="text-green-500" />} color="from-green-600 to-transparent" />
                <StatCard label="Ticketlar" value={stats?.tickets || 0} icon={<MessageSquare size={20} className="text-red-500" />} color="from-red-600 to-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* MODERATION TABLE */}
                <div className="lg:col-span-2 bg-[#080808] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[600px]">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#0d0d0d] to-transparent shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-600/10 rounded-xl">
                                <Activity className="text-orange-500" size={18}/>
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">Fandub Moderatsiyasi</h2>
                        </div>
                        <span className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest">{pendingUploads.length} PENDING</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-[#0d0d0d] text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="p-6 border-b border-white/5">Sarlavha & Ma'lumot</th>
                                    <th className="p-6 border-b border-white/5">Studio / Ijodkor</th>
                                    <th className="p-6 text-right border-b border-white/5">Tasdiqlash</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pendingUploads.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Check size={48} />
                                                <p className="font-black uppercase text-[10px] tracking-widest">Hamma narsa toza!</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : pendingUploads.map(up => (
                                    <tr key={up.id} className="group hover:bg-white/[0.02] transition-all">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <img src={up.poster_url} className="w-10 h-14 rounded-lg object-cover shadow-2xl border border-white/10 group-hover:scale-105 transition-transform" alt="" />
                                                    {up.video_url?.includes('mega.nz') && (
                                                        <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-1 rounded-md shadow-lg" title="Mega.io havolasi">
                                                            <Layers size={10} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[180px]">{up.title}</p>
                                                    <p className="text-[9px] font-bold text-zinc-600 uppercase mt-1">{up.genre.split(',')[0]} • {up.year}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-wide">{(up as any).fandub_channels?.name || 'Mustaqil'}</p>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => approveFandubUpload(up.id).then(loadData)} className="p-2.5 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"><Check size={16}/></button>
                                                <button onClick={() => toggleBlockFandub(up.id, true).then(loadData)} className="p-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"><XIcon size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI LOGS TERMINAL */}
                <div className="bg-[#050505] border border-white/5 rounded-[2.5rem] p-8 flex flex-col shadow-3xl h-[600px]">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 shrink-0">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-3">
                            <Terminal size={16} className="text-orange-500" /> AI Server Logs
                        </h3>
                        <div className="flex gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                             <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                             <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[9px] custom-scrollbar pr-2">
                        {aiLogs.length === 0 && (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-zinc-800 animate-pulse italic">Terminal standby rejimida...</p>
                            </div>
                        )}
                        {aiLogs.map((log, i) => (
                            <div key={i} className={`p-4 rounded-xl border ${log.type === 'action' ? 'bg-orange-600/5 border-orange-500/10 text-orange-500/80' : 'bg-zinc-900/30 border-white/5 text-zinc-500'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${log.type === 'action' ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>{log.type}</span>
                                    <span className="opacity-20 text-[8px]">{log.time}</span>
                                </div>
                                <p className="leading-relaxed leading-4">{log.msg}</p>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleRunAiGuard}
                        disabled={isAiThinking}
                        className={`mt-6 w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 border shrink-0 ${isAiThinking ? 'bg-orange-600/20 border-orange-500/50 text-orange-500 animate-pulse' : 'bg-orange-600 text-white border-orange-500 hover:bg-orange-700 shadow-lg shadow-orange-600/20 active:scale-95'}`}
                    >
                        {isAiThinking ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                        {isAiThinking ? 'ANALYZING...' : 'RUN SECURITY SCAN'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* RECENT USERS */}
                <div className="bg-[#080808] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-[500px] flex flex-col">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0d0d0d] shrink-0">
                        <div className="flex items-center gap-3">
                            <Users className="text-blue-500" size={18}/>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">Yangi Ro'yxatlar</h2>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 z-10 bg-[#0d0d0d] text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="p-6 border-b border-white/5">Foydalanuvchi</th>
                                    <th className="p-6 border-b border-white/5">Sana</th>
                                    <th className="p-6 border-b border-white/5">Rol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-white/[0.01] transition-all">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <img src={user.avatar_url || ''} className="w-9 h-9 rounded-xl object-cover bg-zinc-800 border border-white/5" alt="" />
                                                <div>
                                                    <p className="text-[13px] font-black text-white uppercase truncate max-w-[150px]">{user.full_name || 'Anonymous'}</p>
                                                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">@{user.username || 'user'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-[10px] font-bold text-zinc-500 uppercase">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${user.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RECENT PAYMENTS */}
                <div className="bg-[#080808] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-[500px] flex flex-col">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0d0d0d] shrink-0">
                        <div className="flex items-center gap-3">
                            <CreditCard className="text-green-500" size={18}/>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">So'nggi Tranzaksiyalar</h2>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 z-10 bg-[#0d0d0d] text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="p-6 border-b border-white/5">Foydalanuvchi</th>
                                    <th className="p-6 border-b border-white/5">Summa</th>
                                    <th className="p-6 border-b border-white/5">Holat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentPayments.map(pay => (
                                    <tr key={pay.id} className="hover:bg-white/[0.01] transition-all">
                                        <td className="p-6">
                                            <p className="text-[13px] font-black text-white uppercase truncate max-w-[150px]">{pay.profiles?.full_name || 'Foydalanuvchi'}</p>
                                            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">{new Date(pay.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-6 font-black text-green-500 text-[13px]">{pay.amount.toLocaleString()} <span className="text-[8px] text-zinc-600">UZS</span></td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${pay.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : pay.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
