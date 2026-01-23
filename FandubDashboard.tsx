
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel } from './types';
import { 
    getUserProfile, getFandubChannel, createFandubChannel, updateFandubChannel, 
    getFandubUploads, uploadPoster, uploadVideo, createFandubStory 
} from './services/dbService';
import { 
    Mic, Film, Settings, LayoutGrid, Eye, Edit3, 
    Plus, DollarSign, Users, Heart, Camera, Image as ImageIcon, Send, Trash2
} from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { AddFandubUploadModal } from './components/AddFandubUploadModal';

export const FandubDashboard: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [channel, setChannel] = useState<FandubChannel | null>(null);
    const [myUploads, setMyUploads] = useState<FandubUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'story' | 'settings'>('overview');
    
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    const [storyType, setStoryType] = useState<'file' | 'url'>('file');
    const [storyFile, setStoryFile] = useState<File | null>(null);
    const [storyUrl, setStoryUrl] = useState('');

    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editAvatar, setEditAvatar] = useState<File | null>(null);
    const [editBanner, setEditBanner] = useState<File | null>(null);

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
                setEditName(c.name);
                setEditBio(c.bio || '');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleUpload = async (data: any) => {
        if (!channel || !profile) return;
        setIsUploading(true);
        try {
            const posterUrl = data.posterType === 'file' ? await uploadPoster(data.posterFile) : data.posterUrl;
            
            const uploadedEpisodes = await Promise.all(data.episodes.map(async (ep: any) => {
                const source = ep.type === 'file' ? await uploadVideo(ep.source) : ep.source;
                return { id: Date.now() + Math.random(), title: ep.title, source, sourceType: ep.type };
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
            addNotification({ type: 'success', title: 'Tayyor', message: 'Moderatsiyaga yuborildi.' });
            setIsUploadModalOpen(false);
            loadData();
        } catch (e: any) { addNotification({ type: 'error', title: 'Xato', message: e.message }); }
        finally { setIsUploading(false); }
    };

    const handleAddStory = async () => {
        if (!channel) return;
        setIsSaving(true);
        try {
            let mediaUrl = storyUrl;
            if (storyType === 'file' && storyFile) {
                mediaUrl = await uploadPoster(storyFile);
            }
            if (!mediaUrl) throw new Error("Media yuklanmadi");
            
            await createFandubStory({
                user_id: profile!.id,
                channel_id: channel.id,
                media_url: mediaUrl,
                media_type: (storyFile?.type.includes('video') || storyUrl.endsWith('.mp4')) ? 'video' : 'image'
            });

            addNotification({ type: 'success', title: 'Story chop etildi', message: 'Muxlislaringizga ko\'rinadi.' });
            setStoryFile(null); setStoryUrl('');
        } catch (e: any) { addNotification({ type: 'error', title: 'Xato', message: e.message }); }
        finally { setIsSaving(false); }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel) return;
        setIsSaving(true);
        try {
            let avatarUrl = channel.avatar_url;
            let bannerUrl = channel.banner_url;

            if (editAvatar) avatarUrl = await uploadPoster(editAvatar);
            if (editBanner) bannerUrl = await uploadPoster(editBanner);

            await updateFandubChannel(channel.id, {
                name: editName,
                bio: editBio,
                avatar_url: avatarUrl,
                banner_url: bannerUrl
            });

            addNotification({ type: 'success', title: 'Saqlandi', message: 'Kanal yangilandi.' });
            loadData();
        } catch (e: any) { addNotification({ type: 'error', title: 'Xato', message: e.message }); }
        finally { setIsSaving(false); }
    };

    if (loading && !isUploading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    if (!channel) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="bg-zinc-900 p-10 rounded-[3.5rem] border border-white/5 max-w-md text-center shadow-2xl">
                <div className="w-24 h-24 bg-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-purple-900/30 rotate-3"><Mic size={48} className="text-white"/></div>
                <h2 className="text-3xl font-black uppercase text-white mb-3 tracking-tighter">Studio Ochish</h2>
                <button onClick={async () => {
                        const name = prompt("Studio nomi:");
                        if(name) { 
                            setLoading(true);
                            await createFandubChannel({ user_id: profile!.id, name, username: profile!.username || 'user_'+Date.now() }); 
                            loadData(); 
                        }
                    }}
                    className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-purple-500 transition-all"
                >Hozir boshlash</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row font-sans">
            <aside className="w-full lg:w-80 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col flex-shrink-0">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-28 h-28 rounded-[2.5rem] p-1.5 bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-600 mb-5 shadow-2xl relative">
                        <div className="w-full h-full rounded-[2.3rem] bg-black overflow-hidden border-4 border-black">
                            <img src={channel.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" alt="" />
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight text-center">{channel.name}</h3>
                </div>

                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'overview', label: 'Bosh sahifa', icon: <LayoutGrid size={20}/> },
                        { id: 'content', label: 'Loyihalarim', icon: <Film size={20}/> },
                        { id: 'story', label: 'Story Qo\'shish', icon: <Camera size={20}/> },
                        { id: 'settings', label: 'Sozlamalar', icon: <Settings size={20}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-12 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none">Studio Dashboard</h1>
                            <button onClick={() => setIsUploadModalOpen(true)} className="px-10 py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 transition-all hover:bg-zinc-200"><Plus size={18}/> Loyiha Yuklash</button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <StatCard title="Ko'rishlar" value={channel.total_views} icon={<Eye className="text-blue-500"/>} trend="+12%" />
                            <StatCard title="Obunachilar" value={channel.subscriber_count} icon={<Users className="text-purple-500"/>} trend="+5%" />
                            <StatCard title="Likes" value={channel.total_likes} icon={<Heart className="text-red-500"/>} trend="+2%" />
                            <StatCard title="Daromad" value={`$${channel.balance_usd}`} icon={<DollarSign className="text-green-500"/>} trend="+8%" />
                        </div>
                    </div>
                )}

                {activeTab === 'story' && (
                    <div className="max-w-xl mx-auto animate-fade-in bg-zinc-900/50 p-12 rounded-[3.5rem] border border-white/5">
                        <h2 className="text-3xl font-black uppercase text-white tracking-tighter mb-8 text-center">Yangi Story</h2>
                        <div className="space-y-8">
                            <div className="h-72 border-2 border-dashed border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center group hover:border-purple-600/50 transition-all relative overflow-hidden bg-black/20">
                                {storyFile ? (
                                    <p className="text-white">{storyFile.name}</p>
                                ) : (
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rasm yoki MP4 tanlang</p>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setStoryFile(e.target.files?.[0] || null)} />
                            </div>
                            <button onClick={handleAddStory} disabled={isSaving} className="w-full py-5 bg-purple-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] flex items-center justify-center gap-3 disabled:opacity-50">
                                {isSaving ? <LoadingSpinner /> : <><Send size={20}/> Storyni Chop Etish</>}
                            </button>
                        </div>
                    </div>
                )}
                
                {activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        <div className="bg-zinc-900/50 p-10 rounded-[3.5rem] border border-white/5">
                            <h2 className="text-2xl font-black uppercase mb-10">Kanal Sozlamalari</h2>
                            <div className="space-y-6">
                                <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Studio Nomi" className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-bold" />
                                <textarea value={editBio} onChange={e=>setEditBio(e.target.value)} placeholder="Tavsif..." className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white text-sm h-32" />
                                <button onClick={handleUpdateSettings} disabled={isSaving} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[11px]"> Saqlash </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {isUploadModalOpen && <AddFandubUploadModal onClose={() => setIsUploadModalOpen(false)} onSave={handleUpload} isUploading={isUploading} />}
        </div>
    );
};

const StatCard = ({ title, value, icon, trend }: any) => (
    <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 relative shadow-2xl">
        <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-black/60 rounded-2xl">{icon}</div>
            <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">{trend}</span>
        </div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-white">{value?.toLocaleString() || 0}</p>
    </div>
);
