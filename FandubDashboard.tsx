
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload, FandubChannel } from './types';
import { 
    getUserProfile, getFandubChannel, createFandubChannel, updateFandubChannel, 
    getFandubUploads, uploadPoster, uploadVideo, createFandubStory, getFandubPosts, createFandubPost, deleteFandubPost, deleteFandubUpload, updateFandubUpload 
} from './services/dbService';
import { 
    Mic, Film, Settings, LayoutGrid, Eye, Edit3, 
    Plus, DollarSign, Users, Link, Camera, Image as ImageIcon, Send, Trash2, Clock, CheckCircle, XCircle, Upload, Save, MessageSquare
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
    const [communityPosts, setCommunityPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'community' | 'settings'>('overview');
    
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    // Community Post State
    const [postContent, setPostContent] = useState('');
    const [postImage, setPostImage] = useState<File | null>(null);

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
                const posts = await getFandubPosts(c.id);
                setCommunityPosts(posts);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel || !postContent) return;
        setIsSaving(true);
        try {
            let imgUrl = undefined;
            if (postImage) imgUrl = await uploadPoster(postImage);
            await createFandubPost({ channel_id: channel.id, content: postContent, image_url: imgUrl });
            setPostContent(''); setPostImage(null);
            const updated = await getFandubPosts(channel.id);
            setCommunityPosts(updated);
            addNotification({ type: 'success', title: 'Post yaratildi', message: 'Muxlislaringizga yuborildi.' });
        } catch (e) { console.error(e); }
        finally { setIsSaving(false); }
    };

    const handleDeleteProject = async (id: number) => {
        if(!window.confirm("Loyihani butunlay o'chirib tashlaysizmi?")) return;
        try {
            await deleteFandubUpload(id);
            setMyUploads(prev => prev.filter(u => u.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Loyiha olib tashlandi.' });
        } catch (e) { console.error(e); }
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
                user_id: profile.id, channel_id: channel.id, title: data.title,
                description: data.desc, poster_url: posterUrl, genre: data.genre,
                year: data.year, access_type: data.access, episodes: uploadedEpisodes,
                status: 'pending', video_url: uploadedEpisodes[0]?.source 
            });

            if (error) throw error;
            setIsUploadModalOpen(false);
            loadData();
        } catch (e: any) { addNotification({ type: 'error', title: 'Xatolik', message: e.message }); }
        finally { setIsUploading(false); }
    };

    if (loading && !isUploading && !isSaving) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    if (!channel) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
            <div className="bg-zinc-900 p-10 rounded-[3.5rem] border border-white/5 max-w-md">
                <Mic size={64} className="mx-auto mb-8 text-purple-600" />
                <h2 className="text-3xl font-black uppercase text-white mb-4">Studio Ochish</h2>
                <p className="text-zinc-500 mb-8 text-sm leading-relaxed">Animelarni o'zbek tiliga tarjima qilib nashr eting va muxlislar orttiring.</p>
                <button onClick={async () => {
                        const name = prompt("Studio nomi:");
                        if(name) { setLoading(true); await createFandubChannel({ user_id: profile!.id, name, username: profile!.username || 'user_'+Date.now() }); loadData(); }
                    }}
                    className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95"
                >Studio yaratish</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row">
            <aside className="w-full lg:w-80 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col flex-shrink-0">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-24 h-24 rounded-[2rem] p-1 bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-600 mb-4 shadow-xl">
                        <div className="w-full h-full rounded-[1.8rem] bg-black overflow-hidden border-2 border-black">
                            <img src={channel.avatar_url || profile?.avatar_url || ''} className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-center">{channel.name}</h3>
                    <p className="text-[10px] font-black text-zinc-600 tracking-widest mt-1">FANDUB IJODKORI</p>
                </div>

                <nav className="space-y-1">
                    {[
                        { id: 'overview', label: 'Boshqaruv', icon: <LayoutGrid size={18}/> },
                        { id: 'content', label: 'Loyihalarim', icon: <Film size={18}/> },
                        { id: 'community', label: 'Hamjamiyat', icon: <MessageSquare size={18}/> },
                        { id: 'settings', label: 'Sozlamalar', icon: <Settings size={18}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Xush kelibsiz!</h1>
                                <p className="text-zinc-500 text-sm">Loyihalaringizni boshqaring va yangilarini qo'shing.</p>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(true)} className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl active:scale-95"><Plus size={18}/> Yangi loyiha</button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { l: 'Ko\'rishlar', v: channel.total_views, i: <Eye className="text-blue-500"/> },
                                { l: 'Muxlislar', v: channel.subscriber_count, i: <Users className="text-purple-500"/> },
                                { l: 'Animelar', v: myUploads.length, i: <Film className="text-orange-500"/> },
                                { l: 'Balans', v: `$${channel.balance_usd}`, i: <DollarSign className="text-green-500"/> },
                            ].map((s, idx) => (
                                <div key={idx} className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
                                    <div className="mb-4">{s.i}</div>
                                    <p className="text-2xl font-black">{s.v}</p>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.l}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-black uppercase tracking-widest mb-8 border-l-4 border-purple-600 pl-4">Loyihalarim</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myUploads.map(up => (
                                <div key={up.id} className="group bg-zinc-900/50 border border-white/5 p-5 rounded-[2.5rem] flex flex-col gap-4 relative overflow-hidden">
                                    <div className="flex gap-5">
                                        <img src={up.poster_url} className="w-24 h-32 rounded-2xl object-cover shadow-2xl" alt="" />
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <p className="font-black text-white truncate uppercase text-sm mb-1">{up.title}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase">{up.genre}</p>
                                            </div>
                                            <StatusBadge status={up.status} comment={up.admin_comment} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"><Edit3 size={14}/> Tahrirlash</button>
                                        <button onClick={() => handleDeleteProject(up.id)} className="p-3 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'community' && (
                    <div className="animate-fade-in max-w-2xl mx-auto">
                        <div className="bg-zinc-900 border border-white/10 p-8 rounded-[3rem] mb-10 shadow-2xl">
                            <h3 className="text-xl font-black uppercase text-white mb-6 flex items-center gap-3"> <MessageSquare className="text-purple-500" /> Yangi Post Yaratish</h3>
                            <textarea 
                                value={postContent} 
                                onChange={e => setPostContent(e.target.value)} 
                                placeholder="Muxlislaringizga nima demoqchisiz? (Misol: Naruto 24-qism yuklandi!)" 
                                className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white text-sm h-32 outline-none focus:border-purple-600 transition-all mb-4 resize-none"
                            />
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                    <input type="file" className="hidden" accept="image/*" onChange={e => setPostImage(e.target.files?.[0] || null)} />
                                    <ImageIcon size={16} /> {postImage ? postImage.name : 'Rasm Qo\'shish'}
                                </label>
                                <button onClick={handleCreatePost} disabled={!postContent.trim() || isSaving} className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 disabled:opacity-50">Yuborish</button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {communityPosts.map(post => (
                                <div key={post.id} className="bg-zinc-900/50 border border-white/5 p-8 rounded-[3rem] relative group">
                                    <button onClick={() => deleteFandubPost(post.id).then(loadData)} className="absolute top-8 right-8 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"> <Trash2 size={18}/> </button>
                                    <p className="text-zinc-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
                                    {post.image_url && <img src={post.image_url} className="w-full rounded-2xl mb-6 shadow-2xl" alt="" />}
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{new Date(post.created_at).toLocaleString()}</p>
                                        <div className="flex gap-4 text-zinc-500 font-bold text-xs uppercase">
                                            <span>{post.likes || 0} Like</span>
                                            <span>0 Sharh</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="animate-fade-in max-w-2xl mx-auto bg-zinc-900 border border-white/10 rounded-[3rem] p-10">
                        <h2 className="text-2xl font-black uppercase text-white mb-8 border-l-4 border-purple-600 pl-4">Kanal Sozlamalari</h2>
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Kanal Nomi</label>
                                    <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Logotip</label>
                                    <input type="file" onChange={e=>setAvatarFile(e.target.files?.[0] || null)} className="w-full text-[10px] text-zinc-600 font-black uppercase" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Studio Haqida</label>
                                <textarea value={editBio} onChange={e=>setEditBio(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white text-sm h-32 resize-none" placeholder="Studio tarixi, jamoa azolari..." />
                            </div>
                            <button onClick={() => updateFandubChannel(channel.id, { name: editName, bio: editBio }).then(() => addNotification({type:'success', title:'Tayyor', message:'O\'zgarishlar saqlandi'}))} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-900/20">Saqlash</button>
                        </div>
                    </div>
                )}
            </main>

            {isUploadModalOpen && <AddFandubUploadModal onClose={() => setIsUploadModalOpen(false)} onSave={handleUpload} isUploading={isUploading} />}
        </div>
    );
};
