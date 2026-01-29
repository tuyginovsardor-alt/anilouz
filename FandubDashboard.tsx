
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel, FandubEarning, FandubWithdrawal } from './types';
import { 
    getUserProfile, getFandubChannel, updateFandubChannel, 
    getFandubUploads, uploadPoster, uploadVideo, getFandubPosts, createFandubPost, 
    deleteFandubPost, deleteFandubUpload, getFandubEarnings, getFandubWithdrawals, requestFandubWithdrawal, updateFandubUpload, getFandubStatsSummary 
} from './services/dbService';
import { 
    Mic, Film, Settings, LayoutGrid, Eye, Edit3, 
    DollarSign, Users, Camera, Image as ImageIcon, Trash2, Clock, 
    CheckCircle, XCircle, Upload, Save, MessageSquare, TrendingUp, Wallet, ArrowUpRight, BarChart3, Globe, Instagram, Send, Plus, Activity
} from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { AddFandubUploadModal } from './components/AddFandubUploadModal';

const StatusBadge = ({ status, comment }: { status: string, comment?: string }) => {
    switch (status) {
        case 'approved': return <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-500/30 flex items-center gap-1"><CheckCircle size={10}/> Tasdiqlangan</span>;
        case 'rejected': return <span className="bg-red-600/20 text-red-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/30 flex items-center gap-1" title={comment}><XCircle size={10}/> Rad etilgan</span>;
        default: return <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-yellow-500/30 flex items-center gap-1 animate-pulse"><Clock size={10}/> Kutilmoqda</span>;
    }
};

export const FandubDashboard: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [channel, setChannel] = useState<FandubChannel | null>(null);
    const [myUploads, setMyUploads] = useState<FandubUpload[]>([]);
    const [earnings, setEarnings] = useState<FandubEarning[]>([]);
    const [withdrawals, setWithdrawals] = useState<FandubWithdrawal[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'wallet' | 'settings'>('overview');
    
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const { addNotification } = useNotification();

    const [wAmount, setWAmount] = useState('');
    const [wCard, setWCard] = useState('');
    const [wHolder, setWHolder] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const [p, c, u] = await Promise.all([
                getUserProfile(user.id),
                getFandubChannel(user.id),
                getFandubUploads(user.id)
            ]);
            setProfile(p as UserProfile);
            setChannel(c);
            setMyUploads(u || []);
            if (c) { 
                const [e, w, s] = await Promise.all([
                    getFandubEarnings(c.id),
                    getFandubWithdrawals(c.id),
                    getFandubStatsSummary(c.id)
                ]);
                setEarnings(e);
                setWithdrawals(w);
                setStats(s);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel || !profile) return;
        const amt = Number(wAmount);
        if (amt < 10 || amt > channel.balance_usd) return addNotification({ type: 'error', title: 'Xatolik', message: 'Summa noto\'g\'ri (Min $10)' });
        
        try {
            await requestFandubWithdrawal(channel.id, profile.id, amt, wCard, wHolder);
            addNotification({ type: 'success', title: 'So\'rov yuborildi', message: '24 soat ichida ko\'rib chiqiladi.' });
            setWAmount(''); setWCard(''); setWHolder('');
            loadData();
        } catch (e: any) { addNotification({ type: 'error', title: 'Xatolik', message: e.message }); }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel) return;
        try {
            await updateFandubChannel(channel.id, { 
                name: channel.name, 
                bio: channel.bio, 
                social_links: channel.social_links 
            });
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Kanal ma\'lumotlari yangilandi.' });
        } catch (e) { console.error(e); }
    };

    const handleEditProject = (project: FandubUpload) => {
        setEditingProject({
            id: project.id,
            title: project.title,
            year: project.year,
            genre: project.genre,
            desc: project.description,
            access: project.access_type,
            tags: project.tags,
            posterUrl: project.poster_url,
            posterType: 'url',
            episodes: project.episodes
        });
        setIsUploadModalOpen(true);
    };

    const handleSaveProject = async (data: any) => {
        setIsUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !channel) return;

            let posterUrl = data.posterUrl;
            if (data.posterType === 'file' && data.posterFile) {
                posterUrl = await uploadPoster(data.posterFile);
            }

            const processedEpisodes = await Promise.all(data.episodes.map(async (ep: any) => {
                if (ep.type === 'file' && ep.source instanceof File) {
                    const url = await uploadVideo(ep.source);
                    return { title: ep.title, source: url };
                }
                return { title: ep.title, source: ep.source };
            }));

            const payload = {
                title: data.title,
                description: data.desc,
                poster_url: posterUrl,
                genre: data.genre,
                year: data.year,
                access_type: data.access,
                episodes: processedEpisodes,
                tags: data.tags,
                video_url: processedEpisodes[0]?.source || '',
                status: 'pending'
            };

            if (data.id) {
                await updateFandubUpload(data.id, payload);
                addNotification({ type: 'success', title: 'Yangilandi', message: 'Loyihangiz qayta moderatsiyaga yuborildi.' });
            } else {
                await supabase.from('fandub_uploads').insert({ ...payload, user_id: user.id, channel_id: channel.id });
                addNotification({ type: 'success', title: 'Yuborildi', message: 'Yangi loyiha ko\'rib chiqish uchun yuborildi.' });
            }

            setIsUploadModalOpen(false);
            setEditingProject(null);
            loadData();
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteProject = async (id: number) => {
        if (!window.confirm("Haqiqatan ham ushbu loyihani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) return;
        try {
            await deleteFandubUpload(id);
            addNotification({ type: 'warning', title: 'O\'chirildi', message: 'Loyiha butunlay olib tashlandi.' });
            loadData();
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row">
            <aside className="w-full lg:w-72 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-600 mb-4 shadow-2xl relative">
                        <div className="w-full h-full rounded-[1.3rem] bg-black overflow-hidden border-2 border-black">
                            <img src={channel?.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" />
                        </div>
                        {channel?.is_verified && <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1 border-2 border-black"><CheckCircle size={14} fill="white" className="text-blue-500"/></div>}
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-center">{channel?.name}</h3>
                    <p className="text-[9px] font-black text-zinc-600 tracking-widest mt-1 uppercase">Ijodkor</p>
                </div>

                <nav className="space-y-1">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: <LayoutGrid size={18}/> },
                        { id: 'content', label: 'Loyihalar', icon: <Film size={18}/> },
                        { id: 'analytics', label: 'Statistika', icon: <Activity size={18}/> },
                        { id: 'wallet', label: 'Hamyon', icon: <Wallet size={18}/> },
                        { id: 'settings', label: 'Studio Sozlamalari', icon: <Settings size={18}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20 translate-x-2' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-10">
                    <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-[9px] tracking-widest border border-white/5 hover:text-white transition-all">Studio-dan chiqish</button>
                </div>
            </aside>

            <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto">
                        <header className="flex justify-between items-end">
                            <div>
                                <h1 className="text-5xl font-black uppercase tracking-tighter">Studio Boshqaruvi</h1>
                                <p className="text-zinc-500 text-sm mt-2 border-l-2 border-purple-600 pl-3 uppercase tracking-widest font-black text-[10px]">Xush kelibsiz, {profile?.full_name}!</p>
                            </div>
                            <button onClick={() => { setEditingProject(null); setIsUploadModalOpen(true); }} className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all"><Plus size={18} className="inline mr-2"/> Yangi Anime Yuklash</button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <TrendingUp size={48} className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"/>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Jami Ko'rishlar</p>
                                <h3 className="text-4xl font-black">{(channel?.total_views || 0).toLocaleString()}</h3>
                                <p className="text-[10px] text-green-400 font-bold mt-2 flex items-center gap-1"><ArrowUpRight size={12}/> Haqiqiy statistika</p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <Users size={48} className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"/>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Obunachilar</p>
                                <h3 className="text-4xl font-black">{(channel?.subscriber_count || 0).toLocaleString()}</h3>
                                <p className="text-[10px] text-blue-400 font-bold mt-2">Haqiqiy auditoriya</p>
                            </div>
                            <div className="bg-purple-600/10 border border-purple-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <DollarSign size={48} className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"/>
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-4">Mavjud Balans</p>
                                <h3 className="text-4xl font-black text-purple-500">${channel?.balance_usd.toFixed(2)}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold mt-2">Oxirgi 30 kun: +${stats?.lastMonthEarnings.toFixed(2)}</p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <Film size={48} className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"/>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Loyihalar</p>
                                <h3 className="text-4xl font-black">{myUploads.length}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold mt-2">{myUploads.filter(u=>u.status==='approved').length} ta tasdiqlangan</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                                 <h4 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-3"> <Activity className="text-green-500" size={20}/> So'nggi Daromadlar</h4>
                                 <div className="space-y-4">
                                     {earnings.slice(0, 6).map(e => (
                                         <div key={e.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center text-green-500"><ArrowUpRight size={18}/></div>
                                                 <div>
                                                     <p className="text-sm font-bold text-white">{e.source.toUpperCase()}</p>
                                                     <p className="text-[9px] text-zinc-500 uppercase font-mono">{new Date(e.created_at).toLocaleDateString()}</p>
                                                 </div>
                                             </div>
                                             <span className="text-green-400 font-black text-lg">+${e.amount.toFixed(3)}</span>
                                         </div>
                                     ))}
                                     {earnings.length === 0 && <p className="text-center py-20 text-zinc-800 font-black uppercase text-[10px] tracking-widest">Hali daromad mavjud emas</p>}
                                 </div>
                             </div>

                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                                 <h4 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-3"> <BarChart3 className="text-blue-500" size={20}/> Eng Ommabop Loyihalar</h4>
                                 <div className="space-y-4">
                                     {myUploads.slice(0, 6).sort((a,b)=> (b.view_count||0) - (a.view_count||0)).map(m => (
                                         <div key={m.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                                             <img src={m.poster_url} className="w-10 h-14 rounded-lg object-cover shadow-xl" />
                                             <div className="flex-1 min-w-0">
                                                 <p className="text-sm font-black text-white uppercase truncate tracking-tight">{m.title}</p>
                                                 <div className="flex items-center gap-3 mt-1">
                                                     <span className="text-[10px] text-blue-400 font-black uppercase flex items-center gap-1"> <Eye size={10}/> {(m.view_count || 0).toLocaleString()}</span>
                                                     <span className="text-[10px] text-zinc-600 uppercase font-black">{m.genre.split(',')[0]}</span>
                                                 </div>
                                             </div>
                                             <div className="h-2 w-16 bg-zinc-800 rounded-full overflow-hidden">
                                                 <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (m.view_count || 0) / 100)}%` }}></div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto">
                         <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter">Barcha Loyihalar</h2>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Siz tomoningizdan yuklangan animelar boshqaruvi</p>
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-6 py-2.5 rounded-full border border-white/5 shadow-xl">{myUploads.length} TA TOTAL</span>
                         </div>

                         <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden shadow-3xl">
                             <table className="w-full text-left">
                                 <thead className="bg-[#111] text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                     <tr>
                                         <th className="p-8">Ma'lumot</th>
                                         <th className="p-8">Statistika</th>
                                         <th className="p-8">Holati</th>
                                         <th className="p-8">Sana</th>
                                         <th className="p-8 text-right">Amallar</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                     {myUploads.map(up => (
                                         <tr key={up.id} className="group hover:bg-white/5 transition-all">
                                             <td className="p-8 flex items-center gap-6">
                                                 <img src={up.poster_url} className="w-14 h-20 rounded-2xl object-cover shadow-2xl border border-white/10" alt="" />
                                                 <div className="min-w-0">
                                                     <p className="text-base font-black text-white uppercase tracking-tight truncate max-w-[200px]">{up.title}</p>
                                                     <p className="text-[10px] font-black text-zinc-500 uppercase mt-1.5 tracking-widest">{up.genre.split(',')[0]} • {up.access_type}</p>
                                                 </div>
                                             </td>
                                             <td className="p-8">
                                                 <div className="flex flex-col">
                                                     <span className="text-white font-black text-sm flex items-center gap-1.5"> <Eye size={14} className="text-blue-500"/> {(up.view_count || 0).toLocaleString()}</span>
                                                     <span className="text-[9px] text-green-500 font-black uppercase mt-1">Haqiqiy ko'rishlar</span>
                                                 </div>
                                             </td>
                                             <td className="p-8">
                                                 <StatusBadge status={up.status} comment={up.admin_comment} />
                                             </td>
                                             <td className="p-8">
                                                 <span className="text-[10px] text-zinc-600 font-mono font-bold uppercase tracking-tighter">{new Date(up.created_at).toLocaleDateString()}</span>
                                             </td>
                                             <td className="p-8 text-right">
                                                 <div className="flex justify-end gap-3">
                                                     <button onClick={() => handleEditProject(up)} className="p-4 bg-white/5 hover:bg-blue-600 text-zinc-500 hover:text-white rounded-[1.2rem] transition-all shadow-xl"><Edit3 size={20}/></button>
                                                     <button onClick={() => handleDeleteProject(up.id)} className="p-4 bg-white/5 hover:bg-red-600 text-zinc-500 hover:text-white rounded-[1.2rem] transition-all shadow-xl"><Trash2 size={20}/></button>
                                                 </div>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                )}

                {activeTab === 'wallet' && (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
                        <div className="space-y-10">
                             <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-12 rounded-[4rem] shadow-3xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-2xl"></div>
                                 <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-6">Umumiy Balans</p>
                                 <h3 className="text-7xl font-black text-white tracking-tighter mb-12 flex items-baseline gap-2">
                                     <span className="text-3xl font-black opacity-50">$</span>
                                     {channel?.balance_usd.toFixed(2)}
                                 </h3>
                                 <div className="grid grid-cols-2 gap-6">
                                     <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                         <p className="text-[8px] font-black uppercase text-white/50 tracking-widest mb-1">Yechilgan</p>
                                         <p className="text-2xl font-black text-white">${channel?.total_withdrawn?.toFixed(2) || '0.00'}</p>
                                     </div>
                                     <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                         <p className="text-[8px] font-black uppercase text-white/50 tracking-widest mb-1">Bonuslar</p>
                                         <p className="text-2xl font-black text-white">$0.00</p>
                                     </div>
                                 </div>
                             </div>

                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-3xl">
                                 <h4 className="text-2xl font-black uppercase tracking-tight text-white mb-10 border-l-4 border-purple-600 pl-6">Pul Yechish</h4>
                                 <form onSubmit={handleWithdraw} className="space-y-8">
                                     <div className="space-y-2">
                                         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6">Mablag' (USD)</label>
                                         <div className="relative">
                                             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-purple-500">$</div>
                                             <input type="number" min="10" step="0.01" value={wAmount} onChange={e=>setWAmount(e.target.value)} placeholder="0.00" className="w-full bg-black border border-white/10 rounded-3xl py-6 pl-14 pr-8 text-white font-black text-3xl outline-none focus:border-purple-600 transition-all" required />
                                         </div>
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6">Karta Raqami</label>
                                         <input value={wCard} onChange={e=>setWCard(e.target.value)} placeholder="8600 ...." className="w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 text-white font-mono text-lg tracking-widest outline-none focus:border-purple-600" required />
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6">Karta Egasi</label>
                                         <input value={wHolder} onChange={e=>setWHolder(e.target.value)} placeholder="FULL NAME" className="w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 text-white uppercase font-black text-sm tracking-widest outline-none focus:border-purple-600" required />
                                     </div>
                                     <button type="submit" className="w-full py-6 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-purple-900/40 hover:bg-purple-500 transition-all active:scale-95">Yuborish</button>
                                 </form>
                             </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[4rem] p-12 h-fit shadow-2xl">
                            <h4 className="text-2xl font-black uppercase tracking-tight text-white mb-10 border-l-4 border-blue-600 pl-6">To'lovlar Tarixi</h4>
                            <div className="space-y-6">
                                {withdrawals.map(w => (
                                    <div key={w.id} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-blue-400 transition-colors shadow-lg"><Clock size={22}/></div>
                                            <div>
                                                <p className="text-lg font-black text-white">${w.amount.toFixed(2)}</p>
                                                <p className="text-[10px] text-zinc-600 font-mono font-bold tracking-widest">{w.card_number.slice(0,4)} **** {w.card_number.slice(-4)}</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${w.status==='approved' ? 'bg-green-600/10 text-green-500 border-green-500/20' : 'bg-yellow-600/10 text-yellow-400 border-yellow-500/20'}`}>
                                            {w.status}
                                        </div>
                                    </div>
                                ))}
                                {withdrawals.length === 0 && <p className="text-center py-32 text-zinc-800 font-black uppercase text-xs tracking-[0.3em]">Hali to'lovlar amalga oshirilmagan</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="animate-fade-in max-w-3xl mx-auto space-y-12">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-12 shadow-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-[100px]"></div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-12 border-l-4 border-purple-600 pl-8">Kanal Profilingiz</h2>
                            <form onSubmit={handleUpdateSettings} className="space-y-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6">Studio Brand Nomi</label>
                                    <input value={channel?.name || ''} onChange={e=>setChannel(channel?{...channel, name:e.target.value}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 text-white font-black text-xl uppercase outline-none focus:border-purple-600 transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6">Qisqacha Ma'lumot (Bio)</label>
                                    <textarea value={channel?.bio || ''} onChange={e=>setChannel(channel?{...channel, bio:e.target.value}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-white text-base h-40 resize-none font-medium leading-relaxed outline-none focus:border-purple-600" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6 flex items-center gap-2 font-bold"><Send size={12} className="text-blue-500"/> Telegram Channel</label>
                                        <input value={channel?.social_links?.telegram || ''} onChange={e=>setChannel(channel?{...channel, social_links:{...channel.social_links, telegram:e.target.value}}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-xs font-mono font-bold" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-6 flex items-center gap-2 font-bold"><Instagram size={12} className="text-pink-500"/> Instagram</label>
                                        <input value={channel?.social_links?.instagram || ''} onChange={e=>setChannel(channel?{...channel, social_links:{...channel.social_links, instagram:e.target.value}}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-xs font-mono font-bold" />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-6 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-purple-500 transition-all active:scale-95"><Save size={22} className="inline mr-2"/> O'zgarishlarni Saqlash</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {isUploadModalOpen && <AddFandubUploadModal initialData={editingProject} onClose={() => { setIsUploadModalOpen(false); setEditingProject(null); }} onSave={handleSaveProject} isUploading={isUploading} />}
        </div>
    );
};
