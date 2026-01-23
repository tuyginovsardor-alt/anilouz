
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel, FandubStory } from './types';
import { 
    getUserProfile, getFandubChannel, createFandubChannel, updateFandubChannel, 
    getFandubUploads, uploadPoster, uploadVideo, createFandubStory 
} from './services/dbService';
import { 
    Mic, BarChart3, Film, Settings, LayoutGrid, Eye, TrendingUp, Edit3, 
    Plus, DollarSign, Users, Heart, Camera, Image as ImageIcon, Send, Clock, Check, Trash2, Banner
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
    
    // UI States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    // Story State
    const [storyType, setStoryType] = useState<'file' | 'url'>('file');
    const [storyFile, setStoryFile] = useState<File | null>(null);
    const [storyUrl, setStoryUrl] = useState('');

    // Settings State
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
            setMyUploads(u);
            
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
            addNotification({ type: 'success', title: 'Tayyor', message: 'Moderatsiyaga yuborildi. Tez orada tekshiriladi.' });
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

            addNotification({ type: 'success', title: 'Story chop etildi', message: 'Story 24 soat davomida muxlislaringizga ko\'rinadi.' });
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

            addNotification({ type: 'success', title: 'Saqlandi', message: 'Kanal sozlamalari yangilandi.' });
            loadData();
        } catch (e: any) { addNotification({ type: 'error', title: 'Xato', message: e.message }); }
        finally { setIsSaving(false); }
    }

    if (loading && !isUploading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    if (!channel) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="bg-zinc-900 p-10 rounded-[3.5rem] border border-white/5 max-w-md text-center shadow-2xl">
                <div className="w-24 h-24 bg-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-purple-900/30 rotate-3"><Mic size={48} className="text-white"/></div>
                <h2 className="text-3xl font-black uppercase text-white mb-3 tracking-tighter">Studio Ochish</h2>
                <p className="text-zinc-500 text-sm mb-8">O'z studiyangizni oching va muxlislaringiz uchun eng sara animelarni dublyaj qiling.</p>
                <button onClick={async () => {
                        const name = prompt("Studio nomi:");
                        if(name) { 
                            setLoading(true);
                            await createFandubChannel({ user_id: profile!.id, name, username: profile!.username || 'user_'+Date.now() }); 
                            loadData(); 
                        }
                    }}
                    className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-purple-500 transition-all active:scale-95"
                >Hozir boshlash</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row font-sans">
            {/* Sidebar (Desktop) / Header (Mobile) */}
            <aside className="w-full lg:w-80 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col flex-shrink-0">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-28 h-28 rounded-[2.5rem] p-1.5 bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-600 mb-5 shadow-2xl relative">
                        <div className="w-full h-full rounded-[2.3rem] bg-black overflow-hidden border-4 border-black">
                            <img src={channel.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-black"></div>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight text-center">{channel.name}</h3>
                    <p className="text-purple-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">@{channel.username}</p>
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

                <div className="mt-12 p-6 bg-zinc-900/50 rounded-[2.5rem] border border-white/5">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Studia Balansi</p>
                    <p className="text-2xl font-black text-green-400">${channel.balance_usd.toLocaleString()}</p>
                    <button className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Yechib olish</button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-12 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none mb-2">Studio Dashboard</h1>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Kanal ko'rsatkichlari va statistika</p>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(true)} className="px-10 py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 flex items-center gap-3 transition-all hover:bg-zinc-200"><Plus size={18}/> Loyiha Yuklash</button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <StatCard title="Ko'rishlar" value={channel.total_views} icon={<Eye className="text-blue-500"/>} trend="+12.4%" />
                            <StatCard title="Obunachilar" value={channel.subscriber_count} icon={<Users className="text-purple-500"/>} trend="+5.2%" />
                            <StatCard title="Likes" value={channel.total_likes} icon={<Heart className="text-red-500"/>} trend="+2.1%" />
                            <StatCard title="Daromad" value={`$${channel.balance_usd}`} icon={<DollarSign className="text-green-500"/>} trend="+8.0%" />
                        </div>

                        <div className="bg-zinc-900/30 border border-white/5 rounded-[3.5rem] p-10">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-xl font-black uppercase tracking-tight">So'nggi Loyihalar</h2>
                                <button className="text-[10px] font-black text-purple-500 uppercase tracking-widest hover:underline">Barchasi</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myUploads.slice(0, 3).map(up => (
                                    <div key={up.id} className="bg-black/40 rounded-[2.5rem] p-4 border border-white/5 group hover:border-purple-600/30 transition-all">
                                        <div className="aspect-video rounded-3xl overflow-hidden mb-5 relative shadow-xl">
                                            <img src={up.poster_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                            <span className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-[8px] font-black uppercase ${up.status === 'approved' ? 'bg-green-600' : up.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'} shadow-lg`}>{up.status}</span>
                                        </div>
                                        <h4 className="font-black text-white text-sm truncate uppercase pl-2">{up.title}</h4>
                                        <div className="flex justify-between items-center mt-3 px-2">
                                            <p className="text-[9px] text-zinc-500 font-bold">{up.view_count} ko'rish</p>
                                            <p className="text-[9px] text-zinc-500 font-bold">{new Date(up.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {myUploads.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                                    <Film size={48} className="mx-auto text-zinc-800 mb-4" />
                                    <p className="text-zinc-600 font-black uppercase text-xs">Loyihalar hali mavjud emas</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'story' && (
                    <div className="max-w-xl mx-auto animate-fade-in bg-zinc-900/50 p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-500">
                                <Camera size={32} />
                            </div>
                            <h2 className="text-3xl font-black uppercase text-white tracking-tighter">Yangi Story</h2>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Muxlislar uchun yangiliklar ulashing</p>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="flex gap-4 p-1.5 bg-black rounded-2xl w-fit mx-auto border border-white/5">
                                <button onClick={()=>setStoryType('file')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${storyType==='file' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-zinc-500'}`}>FAYL YUKLASH</button>
                                <button onClick={()=>setStoryType('url')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${storyType==='url' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-zinc-500'}`}>MEDIA URL</button>
                            </div>

                            {storyType === 'file' ? (
                                <div className="h-72 border-2 border-dashed border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center group hover:border-purple-600/50 transition-all relative overflow-hidden bg-black/20">
                                    {storyFile ? (
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            {storyFile.type.includes('image') ? <img src={URL.createObjectURL(storyFile)} className="w-full h-full object-contain rounded-2xl" /> : <Film size={64} className="text-purple-600" />}
                                            <button onClick={()=>setStoryFile(null)} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white"><Trash2 size={16}/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon size={48} className="text-zinc-800 mb-4 group-hover:scale-110 transition-transform duration-500" />
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rasm yoki MP4 tanlang</p>
                                        </>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setStoryFile(e.target.files?.[0] || null)} />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-4">To'g'ridan-to'g'ri Havola</label>
                                    <input value={storyUrl} onChange={e=>setStoryUrl(e.target.value)} placeholder="https://server.com/video.mp4" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-purple-600 transition-all font-mono" />
                                </div>
                            )}

                            <button onClick={handleAddStory} disabled={isSaving} className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                {isSaving ? <LoadingSpinner /> : <><Send size={20}/> Storyni Chop Etish</>}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        <form onSubmit={handleUpdateSettings} className="space-y-8">
                            <div className="bg-zinc-900/50 p-10 rounded-[3.5rem] border border-white/5">
                                <h2 className="text-2xl font-black uppercase mb-10 tracking-tight">Kanal Sozlamalari</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Kanal Banneri</p>
                                        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 group">
                                            <img src={channel.banner_url || 'https://i.imgur.com/8y9q1Xh.jpg'} className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera size={24} className="text-white"/>
                                            </div>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setEditBanner(e.target.files?.[0] || null)} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Profil Rasmi</p>
                                        <div className="relative w-32 h-32 bg-black rounded-[2rem] overflow-hidden border border-white/5 group">
                                            <img src={channel.avatar_url || ''} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera size={24} className="text-white"/>
                                            </div>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setEditAvatar(e.target.files?.[0] || null)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase ml-4">Studio Nomi</label>
                                        <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-purple-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase ml-4">Bio / Tavsif</label>
                                        <textarea value={editBio} onChange={e=>setEditBio(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white text-sm h-32 outline-none focus:border-purple-600 resize-none" />
                                    </div>
                                </div>

                                <button type="submit" disabled={isSaving} className="w-full mt-10 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
                                    {isSaving ? <LoadingSpinner /> : 'O\'zgarishlarni Saqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                {activeTab === 'content' && (
                    <div className="animate-fade-in space-y-6">
                        <h2 className="text-3xl font-black uppercase mb-10 tracking-tighter">Barcha Yuklamalar</h2>
                        <div className="grid gap-4">
                            {myUploads.map(up => (
                                <div key={up.id} className="bg-zinc-900 border border-white/5 p-4 rounded-3xl flex items-center justify-between group hover:border-purple-600/30 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-16 rounded-2xl overflow-hidden bg-black flex-shrink-0">
                                            <img src={up.poster_url} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white text-sm uppercase mb-1">{up.title}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${up.status === 'approved' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-black'}`}>{up.status}</span>
                                                <span className="text-[9px] text-zinc-500 font-bold uppercase">{up.year} • {up.access_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10 px-6">
                                        <div className="text-center hidden sm:block">
                                            <p className="text-sm font-black text-white">{up.view_count}</p>
                                            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Tomosha</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><Edit3 size={16}/></button>
                                            <button className="p-3 bg-red-900/10 hover:bg-red-900/30 text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {isUploadModalOpen && <AddFandubUploadModal onClose={() => setIsUploadModalOpen(false)} onSave={handleUpload} isUploading={isUploading} />}
        </div>
    );
};

const StatCard = ({ title, value, icon, trend }: any) => (
    <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-purple-500/20 transition-all shadow-2xl">
        <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-black/60 rounded-2xl group-hover:scale-110 transition-transform duration-500 border border-white/5">{icon}</div>
            <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">{trend}</span>
        </div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-white">{value.toLocaleString()}</p>
    </div>
);
