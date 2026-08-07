import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, X, Upload, Film, Image as ImageIcon, 
  Trash2, Save, AlertCircle, CheckCircle2, CloudUpload 
} from 'lucide-react';
import { Anime, Episode } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdminViewProps {
  onClose: () => void;
  onAnimeAdded: (anime: Anime) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onClose, onAnimeAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [rating, setRating] = useState(0);
  const [genres, setGenres] = useState<string>('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [studio, setStudio] = useState('');
  const [status, setStatus] = useState<'Ongoing' | 'Yakunlangan'>('Ongoing');
  
  // Episode upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUploadToExternal = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // The user mentioned apibot.wentric.uz as backend
      const formData = new FormData();
      formData.append('file', file);

      // Simulation of upload progress if the API doesn't support it directly
      const interval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 500);

      const response = await fetch('https://apibot.wentric.uz/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (!response.ok) throw new Error("Yuklashda xatolik yuz berdi");
      
      const data = await response.json();
      // Assume the response contains the file URL
      if (data.url) {
        setVideoUrl(data.url);
        setSuccess("Fayl muvaffaqiyatli yuklandi!");
      }
    } catch (err: any) {
      setError(err.message || "Faylni yuklashda xatolik");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleAddAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Insert Anime
      const animeData = {
        title,
        titleOriginal: originalTitle,
        year: Number(year),
        rating: Number(rating),
        genres: genres.split(',').map(g => g.trim()),
        description,
        posterImage: posterUrl,
        bannerImage: bannerUrl,
        videoUrl: videoUrl,
        studio,
        status,
        totalEpisodes: 1,
        episodeCount: status === 'Ongoing' ? "1-qism" : "1-qism (Tugallangan)",
        releaseYear: Number(year),
        voiceovers: ["Anilo Studio"],
      };

      const { data: animeInsert, error: insertError } = await supabase
        .from('anime')
        .insert([animeData])
        .select();

      if (insertError) throw insertError;
      
      const newlyCreatedAnime = animeInsert[0];

      // 2. Insert Episode (to episodes table if it exists)
      const episodeData = {
        anime_id: newlyCreatedAnime.id,
        number: 1,
        title: '1-qism',
        duration: '24:00',
        videoUrl: videoUrl,
        thumbnail: posterUrl
      };

      // Try to insert into episodes table
      try {
        await supabase.from('episodes').insert([episodeData]);
      } catch (e) {
        console.warn("Episodes table may not exist or error inserting:", e);
      }

      setSuccess("Anime muvaffaqiyatli qo'shildi!");
      
      // Combine for UI state
      const fullAnime: Anime = {
        ...newlyCreatedAnime,
        episodes: [
          {
            id: 'ep-1',
            number: 1,
            title: '1-qism',
            duration: '24:00',
            videoUrl: videoUrl,
            thumbnail: posterUrl
          }
        ]
      };

      onAnimeAdded(fullAnime);
      
      // Reset form
      setTitle('');
      setOriginalTitle('');
      setGenres('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-[#161622] border border-white/10 rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Yangi Anime Qo'shish</h2>
              <p className="text-xs text-gray-400">Supabase va Apibot integratsiyasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-gray-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleAddAnime} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* General Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                Asosiy Ma'lumotlar
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 ml-1">Sarlavha (O'zbekcha)</label>
                  <input 
                    required value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Masalan: Naruto"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 ml-1">Asl nomi (Yaponcha/Inglizcha)</label>
                  <input 
                    value={originalTitle} onChange={e => setOriginalTitle(e.target.value)}
                    placeholder="Masalan: ナルト"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 ml-1">Yili</label>
                    <input 
                      type="number" required value={year} onChange={e => setYear(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 ml-1">Reyting (0-10)</label>
                    <input 
                      type="number" step="0.1" required value={rating} onChange={e => setRating(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 ml-1">Janrlar (vergul bilan ajrating)</label>
                  <input 
                    required value={genres} onChange={e => setGenres(e.target.value)}
                    placeholder="Sarguzasht, Jangari, Komediya"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 ml-1">Tavsif (Description)</label>
                  <textarea 
                    required value={description} onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Anime haqida qisqacha ma'lumot..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-orange-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Media & Upload */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                Media va Fayllar
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 ml-1 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" /> Poster Image URL
                  </label>
                  <input 
                    required value={posterUrl} onChange={e => setPosterUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 ml-1 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" /> Banner Image URL
                  </label>
                  <input 
                    required value={bannerUrl} onChange={e => setBannerUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3 p-6 bg-black/40 border border-dashed border-white/10 rounded-[24px]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                      <Film className="w-3.5 h-3.5" /> Video Fayl (Mp4)
                    </label>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">API BOT</span>
                  </div>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={e => e.target.files?.[0] && handleUploadToExternal(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="bg-white/5 border border-white/10 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 group-hover:bg-white/10 transition-all">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <CloudUpload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-gray-300">Faylni tanlang yoki tashlang</span>
                      <span className="text-[10px] text-gray-500">Maksimal: 2GB (apibot.wentric.uz)</span>
                    </div>
                  </div>

                  {uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-gray-400">Yuklanmoqda...</span>
                        <span className="text-indigo-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 mt-4">
                    <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-wider">Video URL (To'g'ridan-to'g'ri)</label>
                    <input 
                      value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                      placeholder="https://apibot.wentric.uz/v/..."
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 px-4 text-white focus:border-orange-500 outline-none text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Status Messages */}
          <div className="mt-8">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm mb-4"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm mb-4"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-black/20 border-t border-white/5 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            Bekor qilish
          </button>
          <button 
            onClick={handleAddAnime}
            disabled={loading || isUploading}
            className="bg-orange-500 hover:bg-orange-400 text-black px-10 py-3 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>SAQLASH</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
