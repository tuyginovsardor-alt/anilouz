
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel, FandubStory } from './types';
import { 
    getUserProfile, getFandubChannel, createFandubChannel, updateFandubChannel, 
    getFandubUploads, uploadPoster, uploadVideo, createFandubStory 
} from './services/dbService';
import { 
    Mic, BarChart3, Film, Settings, LayoutGrid, Eye, TrendingUp, Edit3, 
    Plus, DollarSign, Users, Heart, Camera, Image as ImageIcon, Send, Clock, Check
} from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { AddFandubUploadModal } from './components/AddFandubUploadModal';

export const FandubDashboard: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [channel, setChannel] = useState<FandubChannel | null>(null);
    const [myUploads, setMyUploads] = useState<FandubUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'channel' | 'story'>('overview');
    
    // UI States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    // Story Form
    const [storyType, setStoryType] = useState<'file' | 'url'>('file');
    const [storyFile, setStoryFile] = useState<File | null>(null);
    const [storyUrl, setStoryUrl] = useState('');

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
            if (!mediaUrl) throw new Error("Media manbasini ko'rsating");
            
            await createFandubStory({
                user_id: profile!.id,
                channel_id: channel.id,
                media_url: mediaUrl,
                media_type: storyFile?.type.includes('video') ? 'video' : 'image'
            });

            addNotification({ type: 'success', title: 'Story qo\'shildi', message: '24 soat davomida ko\'rinadi.' });
            setStoryFile(null); setStoryUrl('');
        } catch (e: any) { addNotification({ type: 'error', title: 'Xato', message: e.message }); }
        finally { setIsSaving(false); }
    };

    if (loading && !isUploading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    if (!channel) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="bg-zinc-900 p-10 rounded-[3rem] border border-white/5 max-w-md text-center">
                <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Mic size={40}/></div>
                <h2 className="text-2xl font-black uppercase text-white mb-2">Studio Kanalini yarating</h2>
                <button onClick={async () => {
                        const name = prompt("Kanal nomi:");
                        if(name) { await createFandubChannel({ user_id: profile!.id, name, username: profile!.username || 'user_'+Date.now() }); loadData(); }
                    }}
                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                >Kanalni ochish</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-sans">
            <aside className="w-full md:w-72 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-orange-500 to-red-600 mb-4 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black">
                            <img src={channel.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" alt="" />
                        </div>
                    </div>
                    <h3 className="font-black text-white uppercase tracking-tight text-center">{channel.name}</h3>
                    <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest mt-1">@{channel.username}</p>
                </div>
                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: <LayoutGrid size={20}/> },
                        { id: 'content', label: 'Loyihalar', icon: <Film size={20}/> },
                        { id: 'story', label: 'Story qo\'shish', icon: <Camera size={20}/> },
                        { id: 'channel', label: 'Kanal Sozlamalari', icon: <Settings size={20}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter">Studio Xonasi</h1>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Kanal statistikasi</p>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(true)} className="px-8 py-4 bg-white text-black rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 flex items-center gap-2"><Plus size={18}/> Yangi Loyiha</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <StatCard title="Ko'rishlar" value={channel.total_views} icon={<Eye className="text-blue-500"/>} trend="+12%" />
                            <StatCard title="Obunachilar" value={channel.subscriber_count} icon={<Users className="text-orange-500"/>} trend="+5%" />
                            <StatCard title="Yoqtirishlar" value={channel.total_likes} icon={<Heart className="text-red-500"/>} trend="+24%" />
                            <StatCard title="Hamyon" value={`$${channel.balance_usd}`} icon={<DollarSign className="text-green-500"/>} trend="+8%" />
                        </div>
                    </div>
                )}

                {activeTab === 'story' && (
                    <div className="max-w-xl mx-auto animate-fade-in bg-zinc-900/50 p-10 rounded-[3rem] border border-white/5">
                        <h2 className="text-2xl font-black uppercase text-white mb-6">Yangi Story</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4 p-1 bg-black rounded-2xl w-fit">
                                <button onClick={()=>setStoryType('file')} className={`px-5 py-2 rounded-xl text-[10px] font-black ${storyType==='file' ? 'bg-orange-600 text-white' : 'text-zinc-500'}`}>FAYL</button>
                                <button onClick={()=>setStoryType('url')} className={`px-5 py-2 rounded-xl text-[10px] font-black ${storyType==='url' ? 'bg-orange-600 text-white' : 'text-zinc-500'}`}>URL</button>
                            </div>
                            {storyType === 'file' ? (
                                <div className="h-64 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center group hover:border-orange-500/50 transition-all relative">
                                    {storyFile ? <Check className="text-green-500" size={48}/> : <ImageIcon size={48} className="text-zinc-800"/>}
                                    <p className="text-[10px] font-black text-zinc-500 mt-4 uppercase">{storyFile ? storyFile.name : 'Rasm yoki Video tanlang'}</p>
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setStoryFile(e.target.files?.[0] || null)} />
                                </div>
                            ) : (
                                <input value={storyUrl} onChange={e=>setStoryUrl(e.target.value)} placeholder="Media URL (jpg, mp4)..." className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-sm outline-none" />
                            )}
                            <button onClick={handleAddStory} disabled={isSaving} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2">
                                {isSaving ? <LoadingSpinner /> : <><Send size={18}/>Storyni Chop etish</>}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-2xl font-black uppercase mb-8">Mening Loyihalarim</h2>
                        {myUploads.map(up => (
                            <div key={up.id} className="bg-zinc-900 border border-white/5 p-4 rounded-3xl flex items-center justify-between group hover:border-orange-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-12 rounded-xl overflow-hidden bg-black"><img src={up.poster_url} className="w-full h-full object-cover" alt="" /></div>
                                    <div>
                                        <p className="font-black text-white text-sm uppercase">{up.title}</p>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${up.status === 'approved' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-black'}`}>{up.status}</span>
                                    </div>
                                </div>
                                <div className="flex gap-8 px-4">
                                    <div className="text-center"><p className="text-xs font-black text-white">{up.view_count}</p><p className="text-[8px] text-zinc-500 font-bold uppercase">Views</p></div>
                                    <button className="p-2 text-zinc-500 hover:text-white"><Edit3 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {isUploadModalOpen && <AddFandubUploadModal onClose={() => setIsUploadModalOpen(false)} onSave={handleUpload} isUploading={isUploading} />}
        </div>
    );
};

const StatCard = ({ title, value, icon, trend }: any) => (
    <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 relative group hover:border-orange-500/20 transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-black/40 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-[10px] font-black text-green-400">{trend}</span>
        </div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-white mt-1">{value.toLocaleString()}</p>
    </div>
);
