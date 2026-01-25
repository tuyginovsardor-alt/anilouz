
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel } from './types';
import { 
    getUserProfile, getFandubChannel, createFandubChannel, updateFandubChannel, 
    getFandubUploads, uploadPoster, uploadVideo, createFandubStory 
} from './services/dbService';
import { 
    Mic, Film, Settings, LayoutGrid, Eye, Edit3, 
    Plus, DollarSign, Users, Heart, Camera, Image as ImageIcon, Send, Trash2, Clock, CheckCircle, XCircle, Upload, Save
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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'story' | 'settings'>('overview');
    
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    // Story State
    const [storyFile, setStoryFile] = useState<File | null>(null);
    
    // Settings State
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

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
            // 1. Poster yuklash
            const posterUrl = data.posterType === 'file' ? await uploadPoster(data.posterFile) : data.posterUrl;
            
            // 2. Epizodlarni yuklash (Parallel)
            const uploadedEpisodes = await Promise.all(data.episodes.map(async (ep: any) => {
                const source = ep.type === 'file' ? await uploadVideo(ep.source) : ep.source;
                return { id: Date.now() + Math.random(), title: ep.title, source, sourceType: ep.type };
            }));

            // 3. Bazaga kiritish (Status: pending)
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
            addNotification({ type: 'success', title: 'Loyiha yuborildi', message: 'Moderatsiya tekshiruvidan so\'ng nashr etiladi.' });
            setIsUploadModalOpen(false);
            loadData();
        } catch (e: any) { addNotification({ type: 'error', title: 'Xatolik', message: e.message }); }
        finally { setIsUploading(false); }
    };

    const handleStoryUpload = async () => {
        if (!storyFile || !channel || !profile) return;
        setIsUploading(true);
        try {
            // Story videomi yoki rasmmi aniqlash va tegishli bucketga yuklash
            const bucket = storyFile.type.startsWith('video') ? 'videos' : 'posters';
            const mediaUrl = await uploadPoster(storyFile); // Using simple upload wrapper

            await createFandubStory({
                channel_id: channel.id,
                user_id: profile.id,
                media_url: mediaUrl,
                media_type: storyFile.type.startsWith('video') ? 'video' : 'image'
            });

            addNotification({ type: 'success', title: 'Story Joylandi', message: 'Story 24 soat davomida ko\'rinadi.' });
            setStoryFile(null);
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSettingsSave = async () => {
        if (!channel) return;
        setIsSaving(true);
        try {
            let avatarUrl = channel.avatar_url;
            let bannerUrl = channel.banner_url;

            if (avatarFile) avatarUrl = await uploadPoster(avatarFile);
            if (bannerFile) bannerUrl = await uploadPoster(bannerFile);

            await updateFandubChannel(channel.id, {
                name: editName,
                bio: editBio,
                avatar_url: avatarUrl,
                banner_url: bannerUrl
            });

            addNotification({ type: 'success', title: 'Saqlandi', message: 'Kanal sozlamalari yangilandi.' });
            loadData(); // Refresh UI
            setAvatarFile(null);
            setBannerFile(null);
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading && !isUploading && !isSaving) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    if (!channel) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="bg-zinc-900 p-10 rounded-[3.5rem] border border-white/5 max-w-md text-center shadow-2xl">
                <Mic size={64} className="mx-auto mb-8 text-purple-600" />
                <h2 className="text-3xl font-black uppercase text-white mb-6">Fandub Studio Ochish</h2>
                <p className="text-zinc-500 mb-8 text-sm">O'z studiyangizni yarating va animelarni o'zbek tiliga tarjima qilib nashr eting.</p>
                <button onClick={async () => {
                        const name = prompt("Studio nomi:");
                        if(name) { setLoading(true); await createFandubChannel({ user_id: profile!.id, name, username: profile!.username || 'user_'+Date.now() }); loadData(); }
                    }}
                    className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl"
                >Studio yaratish</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row">
            <aside className="w-full lg:w-80 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col flex-shrink-0">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-28 h-28 rounded-[2.5rem] p-1 bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-600 mb-5">
                        <div className="w-full h-full rounded-[2.3rem] bg-black overflow-hidden border-4 border-black">
                            <img src={channel.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{channel.name}</h3>
                </div>

                <nav className="space-y-1">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: <LayoutGrid size={20}/> },
                        { id: 'content', label: 'Loyihalarim', icon: <Film size={20}/> },
                        { id: 'story', label: 'Story Yuklash', icon: <Camera size={20}/> },
                        { id: 'settings', label: 'Kanal Sozlamalari', icon: <Settings size={20}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Salom, Ijodkor!</h1>
                                <p className="text-zinc-500 text-sm">Studio statistikasi va yangi loyihalar.</p>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(true)} className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-xl transition-all"><Plus size={18}/> Yangi Loyiha</button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
                                <Eye className="text-blue-500 mb-3" />
                                <p className="text-2xl font-black">{channel.total_views}</p>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Ko'rishlar</p>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
                                <Users className="text-purple-500 mb-3" />
                                <p className="text-2xl font-black">{channel.subscriber_count}</p>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Muxlislar</p>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
                                <Film className="text-orange-500 mb-3" />
                                <p className="text-2xl font-black">{myUploads.length}</p>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Animelar</p>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
                                <DollarSign className="text-green-500 mb-3" />
                                <p className="text-2xl font-black">${channel.balance_usd}</p>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Daromad</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-black uppercase tracking-widest mb-8">Loyihalar Ro'yxati</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myUploads.map(up => (
                                <div key={up.id} className="bg-zinc-900/50 border border-white/5 p-5 rounded-[2.5rem] flex gap-5 hover:border-purple-600/30 transition-all">
                                    <img src={up.poster_url} className="w-24 h-32 rounded-2xl object-cover shadow-2xl" alt="" />
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <p className="font-black text-white truncate uppercase text-sm mb-1">{up.title}</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase">{up.genre}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <StatusBadge status={up.status} comment={up.admin_comment} />
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Eye size={12}/> <span className="text-[10px] font-bold">{up.view_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {myUploads.length === 0 && <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600 font-bold uppercase tracking-widest text-xs">Hech qanday loyiha yuklanmagan</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'story' && (
                    <div className="animate-fade-in max-w-2xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-black uppercase tracking-widest text-white">Story Joylash</h2>
                            <p className="text-zinc-500 text-sm mt-2">Muxlislaringizga yangiliklarni tezkor ulashing (24 soat)</p>
                        </div>

                        <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center">
                            {storyFile ? (
                                <div className="relative w-full aspect-[9/16] max-w-xs bg-black rounded-3xl overflow-hidden shadow-2xl mb-6">
                                    {storyFile.type.startsWith('video') ? (
                                        <video src={URL.createObjectURL(storyFile)} className="w-full h-full object-cover" autoPlay muted loop />
                                    ) : (
                                        <img src={URL.createObjectURL(storyFile)} className="w-full h-full object-cover" alt="Preview" />
                                    )}
                                    <button 
                                        onClick={() => setStoryFile(null)} 
                                        className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-600 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full aspect-video border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center mb-6 hover:border-purple-600/50 transition-colors group cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        accept="image/*,video/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={(e) => e.target.files && setStoryFile(e.target.files[0])} 
                                    />
                                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={28} className="text-purple-500" />
                                    </div>
                                    <p className="font-bold text-white uppercase text-xs">Faylni tanlang</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Rasm yoki Video (Max 50MB)</p>
                                </div>
                            )}

                            <button 
                                onClick={handleStoryUpload}
                                disabled={!storyFile || isUploading}
                                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUploading ? <LoadingSpinner /> : <><Send size={16}/> Storyga Chiqarish</>}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="animate-fade-in max-w-3xl mx-auto">
                        <h2 className="text-2xl font-black uppercase tracking-widest mb-10 text-center">Kanal Sozlamalari</h2>
                        
                        <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-10">
                            {/* Banner Edit */}
                            <div className="relative group">
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 ml-2">Kanal Muqovasi (Banner)</label>
                                <div className="w-full h-40 md:h-52 bg-black rounded-3xl overflow-hidden relative border border-white/5">
                                    <img 
                                        src={bannerFile ? URL.createObjectURL(bannerFile) : (channel.banner_url || 'https://via.placeholder.com/800x300')} 
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all" 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/50 p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                            <Edit3 size={24} />
                                        </div>
                                    </div>
                                    <input type="file" accept="image/*" onChange={e => e.target.files && setBannerFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>

                            {/* Avatar Edit */}
                            <div className="flex justify-center -mt-20 relative z-10">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-black p-1 border-4 border-zinc-900 shadow-2xl overflow-hidden relative">
                                        <img 
                                            src={avatarFile ? URL.createObjectURL(avatarFile) : (channel.avatar_url || profile?.avatar_url || '')} 
                                            className="w-full h-full object-cover rounded-[2.2rem]" 
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                            <Camera size={24} />
                                        </div>
                                        <input type="file" accept="image/*" onChange={e => e.target.files && setAvatarFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            {/* Text Inputs */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Kanal Nomi</label>
                                    <input 
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-purple-600 transition-all"
                                        placeholder="Studio nomi"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tavsif (Bio)</label>
                                    <textarea 
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-purple-600 transition-all h-32 resize-none"
                                        placeholder="Kanal haqida qisqacha..."
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleSettingsSave}
                                disabled={isSaving}
                                className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <LoadingSpinner /> : <><Save size={18}/> Saqlash</>}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {isUploadModalOpen && <AddFandubUploadModal onClose={() => setIsUploadModalOpen(false)} onSave={handleUpload} isUploading={isUploading} />}
            
            {(isUploading || isSaving) && (
                <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center flex-col gap-6 backdrop-blur-xl">
                    <LoadingSpinner />
                    <div className="text-center">
                        <h3 className="text-2xl font-black uppercase text-white mb-2">Jarayon bajarilmoqda...</h3>
                        <p className="text-zinc-500 text-sm">Iltimos, sahifani yopmang.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
