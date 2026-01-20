
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, FandubUpload } from './types';
import { getUserProfile, uploadPoster, uploadVideo } from './services/dbService';
import { Mic, BarChart3, Upload, Film, Clock, CheckCircle, XCircle, AlertCircle, Plus, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';

// This file handles the "Studio" logic for Fandubbers
export const FandubDashboard: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [myUploads, setMyUploads] = useState<FandubUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    // Upload Form State
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [genre, setGenre] = useState('');
    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const p = await getUserProfile(user.id);
                setProfile(p as UserProfile);

                // Fetch uploads from 'fandub_uploads' table
                const { data } = await supabase.from('fandub_uploads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
                setMyUploads((data || []) as FandubUpload[]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !posterFile || !videoFile) {
            addNotification({ type: 'warning', title: 'Diqqat', message: 'Barcha maydonlarni to\'ldiring va fayllarni yuklang.' });
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload Media
            const posterUrl = await uploadPoster(posterFile);
            const videoUrl = await uploadVideo(videoFile);

            // 2. Insert into Pending Table
            const { error } = await supabase.from('fandub_uploads').insert({
                user_id: profile.id,
                title,
                description: desc,
                poster_url: posterUrl,
                video_url: videoUrl,
                genre,
                status: 'pending'
            });

            if (error) throw error;

            addNotification({ type: 'success', title: 'Yuborildi', message: 'Anime moderatsiyaga yuborildi. Tasdiqlangach saytda paydo bo\'ladi.' });
            setIsUploadModalOpen(false);
            resetForm();
            loadDashboard();

        } catch (e: any) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Yuklashda xatolik.' });
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setTitle(''); setDesc(''); setGenre(''); setPosterFile(null); setVideoFile(null);
    }

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;
    if (!profile || profile.role !== 'fandub') return <div className="text-center py-20 text-white">Sizda Fandub huquqi yo'q.</div>;

    const stats = {
        total: myUploads.length,
        approved: myUploads.filter(u => u.status === 'approved').length,
        pending: myUploads.filter(u => u.status === 'pending').length,
        views: 0 // In real app, calculate sum of view_count
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 pb-32 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/30">
                        <Mic size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">Fandub Studio</h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Creator Dashboard</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-8 py-4 bg-white text-black hover:bg-purple-600 hover:text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 flex items-center gap-3"
                >
                    <Plus size={18} /> Yangi Anime Yuklash
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Jami Yuklanmalar</p>
                    <p className="text-3xl font-black">{stats.total}</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-green-500/20">
                    <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-2">Tasdiqlangan</p>
                    <p className="text-3xl font-black text-green-400">{stats.approved}</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-yellow-500/20">
                    <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-2">Kutilmoqda</p>
                    <p className="text-3xl font-black text-yellow-400">{stats.pending}</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-blue-500/20">
                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">Umumiy Ko'rishlar</p>
                    <p className="text-3xl font-black text-blue-400">{stats.views}</p>
                </div>
            </div>

            {/* Uploads List */}
            <div className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Film size={20} className="text-purple-500"/> Mening Loyihalarim
                </h2>
                
                {myUploads.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-[3rem]">
                        <Upload size={48} className="mx-auto text-zinc-800 mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest">Hali hech narsa yuklamadingiz</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myUploads.map(item => (
                            <div key={item.id} className="group bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden hover:border-purple-500/30 transition-all">
                                <div className="relative aspect-video">
                                    <img src={item.poster_url} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                                            item.status === 'approved' ? 'bg-green-600' : 
                                            item.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600 text-black'
                                        }`}>
                                            {item.status === 'approved' ? 'Faol' : item.status === 'rejected' ? 'Rad etilgan' : 'Moderatsiyada'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-black text-white text-lg uppercase tracking-tight truncate">{item.title}</h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase mt-1">{item.genre}</p>
                                    
                                    {item.status === 'rejected' && item.admin_comment && (
                                        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-xl">
                                            <p className="text-[10px] text-red-400 font-bold uppercase mb-1">Rad etish sababi:</p>
                                            <p className="text-xs text-red-200">{item.admin_comment}</p>
                                        </div>
                                    )}
                                    
                                    <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                        <Clock size={12}/> {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* UPLOAD MODAL */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => !isUploading && setIsUploadModalOpen(false)}></div>
                    <form onSubmit={handleUpload} className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 overflow-y-auto max-h-[90vh] animate-slide-in-up">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Anime Yuklash</h2>
                            <p className="text-purple-500 text-[10px] font-bold uppercase tracking-widest mt-2">Moderatsiyadan so'ng e'lon qilinadi</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-4">Nomi</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white font-bold focus:border-purple-500 outline-none transition-all" placeholder="Anime nomi..." required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-4">Janr</label>
                                    <input value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white font-bold focus:border-purple-500 outline-none transition-all" placeholder="Action, Drama..." required />
                                </div>
                                {/* More fields like Year could go here */}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-4">Mazmun</label>
                                <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white font-medium focus:border-purple-500 outline-none transition-all h-32" placeholder="Qisqacha tavsif..." required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-4 flex items-center gap-2"><ImageIcon size={14}/> Poster (Rasm)</label>
                                    <input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="w-full text-zinc-400 text-xs" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-4 flex items-center gap-2"><Film size={14}/> Video Fayl (MP4)</label>
                                    <input type="file" accept="video/mp4" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="w-full text-zinc-400 text-xs" required />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end gap-4">
                            <button type="button" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading} className="px-6 py-3 bg-zinc-800 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all">Bekor qilish</button>
                            <button type="submit" disabled={isUploading} className="px-8 py-3 bg-purple-600 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2">
                                {isUploading ? <LoadingSpinner /> : <><Upload size={16}/> Yuborish</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
