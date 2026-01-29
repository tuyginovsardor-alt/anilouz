
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel, FandubEarning, FandubWithdrawal } from './types';
import { 
    getUserProfile, getFandubChannel, updateFandubChannel, 
    getFandubUploads, uploadPoster, uploadVideo, getFandubPosts, createFandubPost, 
    deleteFandubPost, deleteFandubUpload, getFandubEarnings, getFandubWithdrawals, requestFandubWithdrawal 
} from './services/dbService';
import { 
    Mic, Film, Settings, LayoutGrid, Eye, Edit3, 
    DollarSign, Users, Camera, Image as ImageIcon, Trash2, Clock, 
    CheckCircle, XCircle, Upload, Save, MessageSquare, TrendingUp, Wallet, ArrowUpRight, BarChart3, Globe, Instagram, Send, Plus
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
    const [communityPosts, setCommunityPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'wallet' | 'community' | 'settings'>('overview');
    
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { addNotification } = useNotification();

    // Withdrawal Form
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
                const [e, w, posts] = await Promise.all([
                    getFandubEarnings(c.id),
                    getFandubWithdrawals(c.id),
                    getFandubPosts(c.id)
                ]);
                setEarnings(e);
                setWithdrawals(w);
                setCommunityPosts(posts);
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

    // Added handleUpload implementation
    const handleUpload = async (data: any) => {
        setIsUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !channel) return;

            // 1. Upload Poster if file
            let posterUrl = data.posterUrl;
            if (data.posterType === 'file' && data.posterFile) {
                posterUrl = await uploadPoster(data.posterFile);
            }

            // 2. Upload Episodes
            const processedEpisodes = await Promise.all(data.episodes.map(async (ep: any) => {
                if (ep.type === 'file' && ep.source instanceof File) {
                    const url = await uploadVideo(ep.source);
                    return { title: ep.title, source: url };
                }
                return { title: ep.title, source: ep.source };
            }));

            // 3. Insert to DB
            const { error } = await supabase.from('fandub_uploads').insert({
                user_id: user.id,
                channel_id: channel.id,
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
            });

            if (error) throw error;

            addNotification({ type: 'success', title: 'Yuborildi', message: 'Loyiha ko\'rib chiqish uchun yuborildi.' });
            setIsUploadModalOpen(false);
            loadData();
        } catch (e: any) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Yuklash jarayonida xatolik yuz berdi.' });
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-600 mb-4 shadow-2xl relative">
                        <div className="w-full h-full rounded-[1.3rem] bg-black overflow-hidden border-2 border-black">
                            <img src={channel?.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" />
                        </div>
                        {channel?.is_verified && <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1 border-2 border-black"><CheckCircle size={14} fill="white" className="text-blue-500"/></div>}
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-center">{channel?.name}</h3>
                    <p className="text-[9px] font-black text-zinc-600 tracking-widest mt-1">EST. {new Date(channel?.created_at || '').getFullYear()}</p>
                </div>

                <nav className="space-y-1">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: <LayoutGrid size={18}/> },
                        { id: 'content', label: 'Loyihalar', icon: <Film size={18}/> },
                        { id: 'analytics', label: 'Statistika', icon: <BarChart3 size={18}/> },
                        { id: 'wallet', label: 'Moliya', icon: <Wallet size={18}/> },
                        { id: 'community', label: 'Postlar', icon: <MessageSquare size={18}/> },
                        { id: 'settings', label: 'Sozlamalar', icon: <Settings size={18}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20 translate-x-2' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-10">
                    <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-[9px] tracking-widest border border-white/5 hover:text-white transition-all">Saytga Qaytish</button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
                
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-fade-in">
                        <header className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter">Studio Boshqaruvi</h1>
                                <p className="text-zinc-500 text-sm mt-1">Xush kelibsiz, {profile?.full_name}!</p>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(true)} className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all"><Plus size={18} className="inline mr-2"/> Yuklash</button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <TrendingUp size={48} className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"/>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Jami Ko'rishlar</p>
                                <h3 className="text-4xl font-black">{channel?.total_views.toLocaleString()}</h3>
                                <p className="text-[10px] text-green-400 font-bold mt-2">+12% bu hafta</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <Users size={48} className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"/>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Obunachilar</p>
                                <h3 className="text-4xl font-black">{channel?.subscriber_count.toLocaleString()}</h3>
                                <p className="text-[10px] text-blue-400 font-bold mt-2">Toza auditoriya</p>
                            </div>
                            <div className="bg-purple-600/10 border border-purple-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <DollarSign size={48} className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"/>
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">Hisobingiz</p>
                                <h3 className="text-4xl font-black text-purple-500">${channel?.balance_usd.toFixed(2)}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold mt-2">Withdraw available</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                                <Film size={48} className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"/>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Loyihalar</p>
                                <h3 className="text-4xl font-black">{myUploads.length}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold mt-2">{myUploads.filter(u=>u.status==='approved').length} ta faol</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8">
                                 <h4 className="text-lg font-black uppercase tracking-tight mb-6">So'nggi Daromadlar</h4>
                                 <div className="space-y-4">
                                     {earnings.slice(0, 5).map(e => (
                                         <div key={e.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center text-green-500"><ArrowUpRight size={18}/></div>
                                                 <div>
                                                     <p className="text-sm font-bold text-white">{e.source.toUpperCase()}</p>
                                                     <p className="text-[9px] text-zinc-500 uppercase">{new Date(e.created_at).toLocaleDateString()}</p>
                                                 </div>
                                             </div>
                                             <span className="text-green-400 font-black">+${e.amount.toFixed(2)}</span>
                                         </div>
                                     ))}
                                     {earnings.length === 0 && <p className="text-center py-10 text-zinc-700 text-xs font-black uppercase">Ma'lumot yo'q</p>}
                                 </div>
                             </div>

                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8">
                                 <h4 className="text-lg font-black uppercase tracking-tight mb-6">Top Loyihalar</h4>
                                 <div className="space-y-4">
                                     {myUploads.slice(0, 5).sort((a,b)=>b.view_count-a.view_count).map(m => (
                                         <div key={m.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                             <img src={m.poster_url} className="w-10 h-14 rounded-lg object-cover" />
                                             <div className="flex-1">
                                                 <p className="text-sm font-bold text-white uppercase">{m.title}</p>
                                                 <p className="text-[9px] text-zinc-500 uppercase">{m.view_count} ko'rish • {m.genre}</p>
                                             </div>
                                             <BarChart3 size={16} className="text-zinc-700" />
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {/* --- CONTENT TAB --- */}
                {activeTab === 'content' && (
                    <div className="animate-fade-in space-y-8">
                         <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Loyihalar Ro'yxati</h2>
                            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-4 py-2 rounded-full border border-white/5">{myUploads.length} TA TOTAL</span>
                         </div>

                         <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden">
                             <table className="w-full text-left">
                                 <thead className="bg-[#111] text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                     <tr>
                                         <th className="p-6">Anime</th>
                                         <th className="p-6">Ko'rishlar</th>
                                         <th className="p-6">Status</th>
                                         <th className="p-6">Sana</th>
                                         <th className="p-6 text-right">Amal</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                     {myUploads.map(up => (
                                         <tr key={up.id} className="group hover:bg-white/5 transition-all">
                                             <td className="p-6 flex items-center gap-5">
                                                 <img src={up.poster_url} className="w-12 h-16 rounded-xl object-cover shadow-2xl border border-white/10" alt="" />
                                                 <div className="min-w-0">
                                                     <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[150px]">{up.title}</p>
                                                     <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">{up.genre.split(',')[0]} • {up.access_type}</p>
                                                 </div>
                                             </td>
                                             <td className="p-6">
                                                 <div className="flex flex-col">
                                                     <span className="text-white font-black text-sm">{up.view_count.toLocaleString()}</span>
                                                     <span className="text-[9px] text-green-500 font-bold uppercase">+$0.00</span>
                                                 </div>
                                             </td>
                                             <td className="p-6">
                                                 <StatusBadge status={up.status} comment={up.admin_comment} />
                                             </td>
                                             <td className="p-6">
                                                 <span className="text-[10px] text-zinc-600 font-mono">{new Date(up.created_at).toLocaleDateString()}</span>
                                             </td>
                                             <td className="p-6 text-right">
                                                 <div className="flex justify-end gap-2">
                                                     <button className="p-3 bg-white/5 hover:bg-blue-600 text-zinc-500 hover:text-white rounded-2xl transition-all"><Edit3 size={18}/></button>
                                                     <button onClick={() => deleteFandubUpload(up.id).then(loadData)} className="p-3 bg-white/5 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all"><Trash2 size={18}/></button>
                                                 </div>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                )}

                {/* --- WALLET TAB --- */}
                {activeTab === 'wallet' && (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                             <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-10 rounded-[3.5rem] shadow-3xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                 <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Mavjud Balans</p>
                                 <h3 className="text-6xl font-black text-white tracking-tighter mb-10">${channel?.balance_usd.toFixed(2)}</h3>
                                 <div className="flex gap-4">
                                     <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                                         <p className="text-[8px] font-black uppercase text-white/50 tracking-widest">Jami Yechilgan</p>
                                         <p className="text-xl font-black text-white">${channel?.total_withdrawn?.toFixed(2) || '0.00'}</p>
                                     </div>
                                     <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                                         <p className="text-[8px] font-black uppercase text-white/50 tracking-widest">Kutilmoqda</p>
                                         <p className="text-xl font-black text-white">$0.00</p>
                                     </div>
                                 </div>
                             </div>

                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10">
                                 <h4 className="text-xl font-black uppercase tracking-tight text-white mb-8">Pul Yechish</h4>
                                 <form onSubmit={handleWithdraw} className="space-y-6">
                                     <div className="space-y-2">
                                         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Summa (USD)</label>
                                         <input type="number" min="10" value={wAmount} onChange={e=>setWAmount(e.target.value)} placeholder="Min $10.00" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-black text-2xl outline-none focus:border-purple-600" required />
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Karta Raqami</label>
                                         <input value={wCard} onChange={e=>setWCard(e.target.value)} placeholder="8600 ...." className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-mono" required />
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Karta Egasi</label>
                                         <input value={wHolder} onChange={e=>setWHolder(e.target.value)} placeholder="FULL NAME" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white uppercase font-bold" required />
                                     </div>
                                     <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-900/40 hover:bg-purple-500 transition-all active:scale-95">Yuborish</button>
                                 </form>
                             </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 h-fit">
                            <h4 className="text-xl font-black uppercase tracking-tight text-white mb-8">To'lovlar Tarixi</h4>
                            <div className="space-y-4">
                                {withdrawals.map(w => (
                                    <div key={w.id} className="p-5 bg-white/5 rounded-[2rem] border border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400"><Clock size={18}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-white uppercase">${w.amount.toFixed(2)}</p>
                                                <p className="text-[9px] text-zinc-600 font-mono">{w.card_number.slice(0,4)} **** {w.card_number.slice(-4)}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${w.status==='approved' ? 'bg-green-600/20 text-green-500' : 'bg-yellow-600/20 text-yellow-400'}`}>{w.status}</span>
                                    </div>
                                ))}
                                {withdrawals.length === 0 && <p className="text-center py-20 text-zinc-800 font-black uppercase text-xs tracking-widest">Tarix bo'sh</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'settings' && (
                    <div className="animate-fade-in max-w-2xl mx-auto space-y-10">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] p-10 shadow-2xl">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-8 border-l-4 border-purple-600 pl-6">Kanal Profilingiz</h2>
                            <form onSubmit={handleUpdateSettings} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Studio Nomi</label>
                                    <input value={channel?.name || ''} onChange={e=>setChannel(channel?{...channel, name:e.target.value}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-black text-lg uppercase outline-none focus:border-purple-600" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Biografiya</label>
                                    <textarea value={channel?.bio || ''} onChange={e=>setChannel(channel?{...channel, bio:e.target.value}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-sm h-32 resize-none" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 flex items-center gap-2"><Send size={12}/> Telegram Username</label>
                                        <input value={channel?.social_links?.telegram || ''} onChange={e=>setChannel(channel?{...channel, social_links:{...channel.social_links, telegram:e.target.value}}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 flex items-center gap-2"><Instagram size={12}/> Instagram Username</label>
                                        <input value={channel?.social_links?.instagram || ''} onChange={e=>setChannel(channel?{...channel, social_links:{...channel.social_links, instagram:e.target.value}}:null)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white text-xs" />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95"><Save size={18} className="inline mr-2"/> Saqlash</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {isUploadModalOpen && <AddFandubUploadModal onClose={() => setIsUploadModalOpen(false)} onSave={handleUpload} isUploading={isUploading} />}
        </div>
    );
};
