
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel } from './types';
import { getUserProfile, getFandubChannel, createFandubChannel, updateFandubChannel, getFandubUploads, uploadPoster, uploadVideo, updateUserProfile } from './services/dbService';
import { 
    Mic, BarChart3, Film, Settings, LayoutGrid, Eye, TrendingUp, Edit3, Info, Camera, Plus, DollarSign, Users, Heart
} from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { AddFandubUploadModal } from './components/AddFandubUploadModal';

export const FandubDashboard: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [channel, setChannel] = useState<FandubChannel | null>(null);
    const [myUploads, setMyUploads] = useState<FandubUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'channel' | 'money'>('overview');
    
    // UI States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false); // New local saving state
    const { addNotification } = useNotification();

    // Channel Settings States
    const [editName, setEditName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editAvatar, setEditAvatar] = useState<File | null>(null);
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

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
            setMyUploads(u);
            
            if (c) {
                setEditName(c.name);
                setEditUsername(c.username);
                setPreviewAvatar(c.avatar_url || p?.avatar_url || null);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleUpdateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel || !profile) return;
        setIsSavingSettings(true);
        try {
            let avatarUrl = channel.avatar_url;
            if (editAvatar) {
                avatarUrl = await uploadPoster(editAvatar);
            }

            await updateFandubChannel(channel.id, { 
                name: editName, 
                username: editUsername, 
                avatar_url: avatarUrl 
            });

            await updateUserProfile(profile.id, { 
                username: editUsername, 
                avatar_url: avatarUrl 
            });

            addNotification({ type: 'success', title: 'Saqlandi', message: 'Kanal ma\'lumotlari yangilandi.' });
            // Re-fetch only necessary data instead of full reset
            const updatedChannel = await getFandubChannel(profile.id);
            setChannel(updatedChannel);
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally { setIsSavingSettings(false); }
    };

    const handleUpload = async (data: any) => {
        if (!channel || !profile) return;
        setIsUploading(true);
        try {
            const posterUrl = data.posterType === 'file' ? await uploadPoster(data.posterFile) : data.posterUrl;
            
            const uploadedEpisodes = await Promise.all(data.episodes.map(async (ep: any) => {
                const source = ep.type === 'file' ? await uploadVideo(ep.source) : ep.source;
                return {
                    id: Date.now() + Math.random(),
                    title: ep.title,
                    source,
                    sourceType: ep.type
                };
            }));

            const { error } = await supabase.from('fandub_uploads').insert({
                user_id: profile.id,
                channel_id: channel.id,
                title: data.title,
                description: data.desc,
                poster_url: posterUrl,
                genre: data.genre,
                year: data.year,
                access_type: data.access,
                episodes: uploadedEpisodes,
                tags: data.tags,
                status: 'pending',
                revenue_share_percent: 50,
                video_url: uploadedEpisodes[0]?.source 
            });

            if (error) throw error;
            addNotification({ type: 'success', title: 'Yuborildi', message: 'Anime moderatsiyaga yuborildi.' });
            setIsUploadModalOpen(false);
            loadData();
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally { setIsUploading(false); }
    };

    if (loading && !isUploading && !isSavingSettings) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    if (!channel) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="bg-zinc-900 p-10 rounded-[3rem] border border-white/5 max-w-md text-center">
                <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Mic size={40}/></div>
                <h2 className="text-2xl font-black uppercase text-white mb-2">Studio Kanalini yarating</h2>
                <button onClick={async () => {
                        const name = prompt("Kanal nomi:");
                        if(name) {
                            await createFandubChannel({ user_id: profile!.id, name, username: profile!.username || 'user_'+Date.now() });
                            loadData();
                        }
                    }}
                    className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                >Kanalni ochish</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-sans">
            <aside className="w-full md:w-72 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-600 to-blue-600 mb-4 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black">
                            <img src={channel.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" alt="" />
                        </div>
                    </div>
                    <h3 className="font-black text-white uppercase tracking-tight text-center">{channel.name}</h3>
                    <p className="text-purple-500 text-[10px] font-bold uppercase tracking-widest mt-1">@{channel.username}</p>
                </div>
                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'overview', label: 'Bosh sahifa', icon: <LayoutGrid size={20}/> },
                        { id: 'content', label: 'Kontent', icon: <Film size={20}/> },
                        { id: 'money', label: 'Daromad', icon: <DollarSign size={20}/> },
                        { id: 'channel', label: 'Sozlamalar', icon: <Settings size={20}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
                <div className="mt-10 p-5 bg-zinc-900/50 rounded-[2rem] border border-white/5">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Hamyon</p>
                    <p className="text-xl font-black text-green-400">${channel.balance_usd.toLocaleString()}</p>
                </div>
            </aside>

            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter">Studio Xonasi</h1>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(true)} className="px-8 py-4 bg-white text-black rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl"><Plus size={18}/> Loyiha Yuklash</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <StatCard title="Ko'rishlar" value={channel.total_views} icon={<Eye className="text-blue-500"/>} trend="+12%" />
                            <StatCard title="Obunachilar" value={channel.subscriber_count} icon={<Users className="text-purple-500"/>} trend="+5%" />
                            <StatCard title="Yoqtirishlar" value={channel.total_likes} icon={<Heart className="text-red-500"/>} trend="+24%" />
                            <StatCard title="Daromad" value={`$${channel.balance_usd}`} icon={<TrendingUp className="text-green-500"/>} trend="+8%" />
                        </div>
                        <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10">
                            <h2 className="text-xl font-black uppercase mb-8">So'nggi yuklamalar</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myUploads.slice(0, 3).map(up => (
                                    <div key={up.id} className="bg-black/40 rounded-3xl p-4 border border-white/5">
                                        <div className="aspect-video rounded-2xl overflow-hidden mb-4 relative">
                                            <img src={up.poster_url} className="w-full h-full object-cover" alt="" />
                                            <span className={`absolute top-2 right-2 px-2 py-1 rounded text-[8px] font-black uppercase ${up.status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}`}>{up.status}</span>
                                        </div>
                                        <h4 className="font-bold text-white text-sm truncate">{up.title}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-3xl font-black uppercase mb-10">Mening Kontentim</h2>
                        {myUploads.map(up => (
                            <div key={up.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-[2rem] flex items-center justify-between group hover:border-purple-500/30 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-24 h-14 rounded-xl overflow-hidden bg-black"><img src={up.poster_url} className="w-full h-full object-cover" alt="" /></div>
                                    <div>
                                        <h4 className="font-black text-white text-sm">{up.title}</h4>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${up.access_type === 'premium' ? 'bg-yellow-500 text-black' : 'bg-blue-600 text-white'}`}>{up.access_type}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <div className="text-center"><p className="text-xs font-black">{up.view_count}</p><p className="text-[9px] text-zinc-600 font-bold uppercase">Ko'rish</p></div>
                                    <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${up.status === 'approved' ? 'bg-green-600/20 text-green-500' : 'bg-yellow-600/20 text-yellow-500'}`}>{up.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'channel' && (
                    <div className="animate-fade-in max-w-xl mx-auto">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-[3rem] p-10">
                            <h2 className="text-2xl font-black uppercase mb-8">Kanal Sozlamalari</h2>
                            <form onSubmit={handleUpdateChannel} className="space-y-6">
                                <div className="flex flex-col items-center mb-8">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-32 h-32 rounded-full p-1 bg-zinc-800 border border-white/10 overflow-hidden">
                                            <img src={editAvatar ? URL.createObjectURL(editAvatar) : previewAvatar || ''} className="w-full h-full object-cover rounded-full" alt="" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"><Camera size={24} /></div>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                                                const file = e.target.files?.[0] || null;
                                                setEditAvatar(file);
                                                if (file) setPreviewAvatar(URL.createObjectURL(file));
                                            }} accept="image/*" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-3 tracking-widest">Kanal logotipi</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase ml-4">Kanal Nomi</label>
                                        <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-purple-600 outline-none" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase ml-4">Username (@)</label>
                                        <input value={editUsername} onChange={e=>setEditUsername(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-purple-600 outline-none" required />
                                    </div>
                                </div>
                                <button type="submit" disabled={isSavingSettings} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
                                    {isSavingSettings ? <LoadingSpinner /> : 'Saqlash'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {isUploadModalOpen && (
                <AddFandubUploadModal onClose={() => setIsUploadModalOpen(false)} onSave={handleUpload} isUploading={isUploading} />
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, trend }: any) => (
    <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 relative group hover:border-purple-500/20 transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-black/40 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-[10px] font-black text-green-400">{trend}</span>
        </div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-white mt-1">{value.toLocaleString()}</p>
    </div>
);
