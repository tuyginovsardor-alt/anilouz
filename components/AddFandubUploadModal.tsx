
import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { Plus, Trash2, Film, Image as ImageIcon, Save, CheckCircle, Info } from 'lucide-react';
import { Episode } from '../types';
// Added import for LoadingSpinner
import { LoadingSpinner } from './LoadingSpinner';

interface AddFandubUploadModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isUploading: boolean;
}

export const AddFandubUploadModal: React.FC<AddFandubUploadModalProps> = ({ onClose, onSave, isUploading }) => {
    const [title, setTitle] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [genre, setGenre] = useState('');
    const [desc, setDesc] = useState('');
    const [access, setAccess] = useState<'free' | 'premium'>('free');
    const [tags, setTags] = useState('');
    
    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [episodes, setEpisodes] = useState<Partial<Episode>[]>([{ title: '1-qism', sourceType: 'file', source: null as any }]);

    const handleAddEpisode = () => {
        setEpisodes([...episodes, { title: `${episodes.length + 1}-qism`, sourceType: 'file', source: null as any }]);
    };

    const handleRemoveEpisode = (index: number) => {
        setEpisodes(episodes.filter((_, i) => i !== index));
    };

    const handleEpisodeChange = (index: number, field: string, value: any) => {
        const newEps = [...episodes];
        (newEps[index] as any)[field] = value;
        setEpisodes(newEps);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!posterFile) return alert("Poster yuklang!");
        if (episodes.some(ep => !ep.source)) return alert("Barcha qismlar videolarini yuklang!");
        
        onSave({
            title, year, genre, desc, access, tags,
            poster: posterFile,
            episodes
        });
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => !isUploading && onClose()}></div>
            <form onSubmit={handleSubmit} className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-[3rem] p-8 md:p-12 overflow-y-auto max-h-[90vh] animate-slide-in-up custom-scrollbar">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Yangi Anime Loyihasi</h2>
                    <button type="button" onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors"><CloseIcon className="w-8 h-8"/></button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* LEFT SIDE: INFO */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Anime Sarlavhasi</label>
                            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-purple-600 transition-all" placeholder="Masalan: Naruto: Shippuden" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Ishlab chiqarilgan yil</label>
                                <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-purple-600" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Kirish turi</label>
                                <select value={access} onChange={e=>setAccess(e.target.value as any)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-purple-600 appearance-none">
                                    <option value="free">BEPUL (Daromadsiz)</option>
                                    <option value="premium">PREMIUM (Daromadli ✅)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Janrlar (Vergul bilan)</label>
                            <input value={genre} onChange={e=>setGenre(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-purple-600" placeholder="Shonen, Action, Fantasy" required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Qisqacha tavsif</label>
                            <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-sm h-32 outline-none focus:border-purple-600 resize-none" placeholder="Anime haqida ma'lumot..." required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Poster yuklash (JPG/PNG)</label>
                            <div className="relative group cursor-pointer border-2 border-dashed border-zinc-800 rounded-3xl p-10 flex flex-col items-center justify-center hover:border-purple-600/50 transition-all">
                                {posterFile ? (
                                    <img src={URL.createObjectURL(posterFile)} className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-40" alt="" />
                                ) : <ImageIcon size={40} className="text-zinc-700 mb-2"/>}
                                <span className="text-[10px] font-black uppercase text-zinc-500 relative z-10">{posterFile ? posterFile.name : 'Faylni tanlang'}</span>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setPosterFile(e.target.files?.[0] || null)} accept="image/*" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: EPISODES */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2"><Film size={16}/> Qismlar (Video fayllar)</h3>
                            <button type="button" onClick={handleAddEpisode} className="px-4 py-2 bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase rounded-xl border border-purple-600/30 hover:bg-purple-600 hover:text-white transition-all">+ Qo'shish</button>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {episodes.map((ep, idx) => (
                                <div key={idx} className="bg-zinc-900/50 border border-white/5 p-5 rounded-[2rem] flex flex-col gap-4 relative group">
                                    <div className="flex justify-between items-start">
                                        <input value={ep.title} onChange={e=>handleEpisodeChange(idx, 'title', e.target.value)} className="bg-transparent border-b border-zinc-800 text-white font-black text-sm outline-none focus:border-purple-600 pb-1" placeholder="Qism nomi"/>
                                        <button type="button" onClick={()=>handleRemoveEpisode(idx)} className="p-1.5 text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                    <div className="relative h-20 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center bg-black/20 hover:border-purple-600/30 transition-all cursor-pointer">
                                        <Film size={20} className="text-zinc-800 mr-2"/>
                                        <span className="text-[9px] font-black uppercase text-zinc-600 truncate max-w-[150px]">{ep.source ? (ep.source as any).name : 'Video yuklash (.MP4)'}</span>
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>handleEpisodeChange(idx, 'source', e.target.files?.[0] || null)} accept="video/mp4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-10 p-6 bg-purple-900/10 border border-purple-500/20 rounded-[2.5rem]">
                            <h4 className="font-black text-xs uppercase text-purple-400 flex items-center gap-2 mb-2"><Info size={14}/> Eslatma</h4>
                            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase font-bold">Loyihangiz adminlar tomonidan tekshiriladi va ma'qullangandan so'ng asosiy katalogda sizning nomingiz bilan paydo bo'ladi.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                    <button type="button" onClick={onClose} disabled={isUploading} className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:text-white transition-all">Bekor qilish</button>
                    <button type="submit" disabled={isUploading} className="flex-1 py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isUploading ? <LoadingSpinner /> : <><Save size={18}/>Moderatsiyaga yuborish</>}
                    </button>
                </div>
            </form>
        </div>
    );
};
