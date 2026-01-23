
import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { Plus, Trash2, Film, Image as ImageIcon, Save, Info, Link, Upload, Check } from 'lucide-react';
import { Episode } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface AddFandubUploadModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isUploading: boolean;
}

const GENRE_OPTIONS = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Horror', 'Isekai', 'Shonen'];

export const AddFandubUploadModal: React.FC<AddFandubUploadModalProps> = ({ onClose, onSave, isUploading }) => {
    const [title, setTitle] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [genre, setGenre] = useState<string[]>([]);
    const [desc, setDesc] = useState('');
    const [access, setAccess] = useState<'free' | 'premium'>('free');
    const [tags, setTags] = useState('');
    
    const [posterType, setPosterType] = useState<'url' | 'file'>('file');
    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [posterUrl, setPosterUrl] = useState('');

    const [episodes, setEpisodes] = useState<any[]>([{ title: '1-qism', type: 'file', source: null }]);

    const toggleGenre = (g: string) => {
        setGenre(prev => prev.includes(g) ? prev.filter(i => i !== g) : [...prev, g]);
    };

    const handleAddEpisode = () => {
        setEpisodes([...episodes, { title: `${episodes.length + 1}-qism`, type: 'file', source: null }]);
    };

    const handleEpisodeChange = (index: number, field: string, value: any) => {
        const newEps = [...episodes];
        newEps[index][field] = value;
        setEpisodes(newEps);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (genre.length === 0) return alert("Kamida bitta janr tanlang");
        
        onSave({
            title, year, genre: genre.join(', '), desc, access, tags,
            posterType, posterFile, posterUrl,
            episodes
        });
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => !isUploading && onClose()}></div>
            <form onSubmit={handleSubmit} className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-5xl rounded-[3rem] p-6 md:p-12 overflow-y-auto max-h-[90vh] animate-slide-in-up custom-scrollbar">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Yangi Anime Loyihasi</h2>
                    <button type="button" onClick={onClose} className="p-2 text-zinc-500 hover:text-white"><CloseIcon className="w-8 h-8"/></button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Anime Nomi</label>
                            <input value={title} onChange={e=>setTitle(e.target.value)} required className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-orange-500 outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Yili</label>
                                <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} required className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Kirish</label>
                                <select value={access} onChange={e=>setAccess(e.target.value as any)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white">
                                    <option value="free">BEPUL</option>
                                    <option value="premium">PREMIUM</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Janrlar</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {GENRE_OPTIONS.map(g => (
                                    <button key={g} type="button" onClick={()=>toggleGenre(g)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${genre.includes(g) ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{g}</button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Poster</label>
                            <div className="flex gap-2 mb-3 mt-1">
                                <button type="button" onClick={()=>setPosterType('file')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black ${posterType==='file' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>FAYL</button>
                                <button type="button" onClick={()=>setPosterType('url')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black ${posterType==='url' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>URL</button>
                            </div>
                            {posterType === 'file' ? (
                                <div className="relative h-40 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center hover:border-orange-500/50 transition-all cursor-pointer">
                                    {posterFile ? <img src={URL.createObjectURL(posterFile)} className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-40" /> : <ImageIcon size={32} className="text-zinc-700"/>}
                                    <span className="text-[10px] text-zinc-500 font-black mt-2">{posterFile ? posterFile.name : 'Yuklash'}</span>
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setPosterFile(e.target.files?.[0] || null)} accept="image/*" />
                                </div>
                            ) : (
                                <input value={posterUrl} onChange={e=>setPosterUrl(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white text-xs" placeholder="https://..." />
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase text-zinc-400">Qismlar</h3>
                            <button type="button" onClick={handleAddEpisode} className="px-4 py-2 bg-orange-600/10 text-orange-500 text-[10px] font-black uppercase rounded-xl border border-orange-500/20 hover:bg-orange-600 hover:text-white">+ Qo'shish</button>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {episodes.map((ep, idx) => (
                                <div key={idx} className="bg-zinc-900/50 border border-white/5 p-4 rounded-3xl space-y-4 relative group">
                                    <div className="flex justify-between items-center">
                                        <input value={ep.title} onChange={e=>handleEpisodeChange(idx, 'title', e.target.value)} className="bg-transparent border-b border-zinc-800 text-white font-black text-xs outline-none w-1/2" placeholder="Nomi"/>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={()=>handleEpisodeChange(idx, 'type', 'file')} className={`p-2 rounded-lg ${ep.type==='file' ? 'bg-orange-600 text-white' : 'bg-black text-zinc-600'}`}><Upload size={14}/></button>
                                            <button type="button" onClick={()=>handleEpisodeChange(idx, 'type', 'url')} className={`p-2 rounded-lg ${ep.type==='url' ? 'bg-orange-600 text-white' : 'bg-black text-zinc-600'}`}><Link size={14}/></button>
                                            <button type="button" onClick={()=>setEpisodes(episodes.filter((_, i) => i !== idx))} className="p-2 text-zinc-700 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                    {ep.type === 'file' ? (
                                        <div className="relative h-16 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center bg-black/20 hover:border-orange-500/30 transition-all cursor-pointer">
                                            <Film size={18} className="text-zinc-800 mr-2"/>
                                            <span className="text-[9px] font-black uppercase text-zinc-600 truncate max-w-[150px]">{ep.source ? (ep.source as File).name : 'MP4 Yuklash'}</span>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>handleEpisodeChange(idx, 'source', e.target.files?.[0] || null)} accept="video/mp4" />
                                        </div>
                                    ) : (
                                        <input value={ep.source as string || ''} onChange={e=>handleEpisodeChange(idx, 'source', e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-[10px] text-zinc-400" placeholder="Direct Video URL (MP4, HLS)..." />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex gap-4 pt-8 border-t border-white/5">
                    <button type="button" onClick={onClose} disabled={isUploading} className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-xs">Bekor qilish</button>
                    <button type="submit" disabled={isUploading} className="flex-1 py-5 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                        {isUploading ? <LoadingSpinner /> : <><Save size={18}/>Moderatsiyaga yuborish</>}
                    </button>
                </div>
            </form>
        </div>
    );
};
