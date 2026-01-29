
import React, { useState, useEffect } from 'react';
import { getAppConfig, updateAppConfig, getSocialLinks, addSocialLink, deleteSocialLink } from '../services/dbService';
import { useNotification } from '../hooks/useNotification';
import { LoadingSpinner } from './LoadingSpinner';
import { CreditCard, DollarSign, Save, RefreshCw, Database, Copy, Info, Link as LinkIcon, Trash2, Plus, Clock } from 'lucide-react';
import { InstagramIcon } from './icons/InstagramIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { TelegramIcon } from './icons/TelegramIcon';
import { SocialLink } from '../types';

export const AdminSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotification();

    // Form States
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    
    // Prices
    const [price1Month, setPrice1Month] = useState('');
    const [price3Month, setPrice3Month] = useState('');
    const [price6Month, setPrice6Month] = useState('');
    const [price1Year, setPrice1Year] = useState('');

    // Free Trial
    const [freeTrialMinutes, setFreeTrialMinutes] = useState('');

    // Social Links
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [newSocialPlatform, setNewSocialPlatform] = useState<SocialLink['platform']>('instagram');
    const [newSocialUrl, setNewSocialUrl] = useState('');
    const [newSocialLabel, setNewSocialLabel] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const config = await getAppConfig();
            setCardNumber(config['card_number'] || '8600 0000 0000 0000');
            setCardHolder(config['card_holder'] || 'ANILO UZ');
            
            setPrice1Month(config['price_1_oy'] || '9999');
            setPrice3Month(config['price_3_oy'] || '28500');
            setPrice6Month(config['price_6_oy'] || '51000');
            setPrice1Year(config['price_1_yil'] || '90000');

            setFreeTrialMinutes(config['free_trial_minutes'] || '60');

            const links = await getSocialLinks();
            setSocialLinks(links);
        } catch (error) {
            console.error(error);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Sozlamalarni yuklab bo\'lmadi' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateAppConfig('card_number', cardNumber);
            await updateAppConfig('card_holder', cardHolder.toUpperCase());
            await updateAppConfig('price_1_oy', price1Month);
            await updateAppConfig('price_3_oy', price3Month);
            await updateAppConfig('price_6_oy', price6Month);
            await updateAppConfig('price_1_yil', price1Year);
            await updateAppConfig('free_trial_minutes', freeTrialMinutes);

            addNotification({ type: 'success', title: 'Saqlandi', message: 'Barcha sozlamalar yangilandi.' });
        } catch (error) {
            console.error(error);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlashda xatolik yuz berdi.' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddSocialLink = async () => {
        if (!newSocialUrl || !newSocialLabel) {
            addNotification({ type: 'warning', title: 'Diqqat', message: 'URL va nomini kiriting.' });
            return;
        }
        try {
            await addSocialLink({ platform: newSocialPlatform, url: newSocialUrl, label: newSocialLabel });
            const updatedLinks = await getSocialLinks();
            setSocialLinks(updatedLinks);
            setNewSocialUrl(''); setNewSocialLabel('');
            addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Link muvaffaqiyatli qo\'shildi.' });
        } catch (e) { addNotification({ type: 'error', title: 'Xatolik', message: 'Linkni qo\'shib bo\'lmadi.' }); }
    };

    const handleDeleteSocialLink = async (id: number) => {
        if (!window.confirm("O'chirmoqchimisiz?")) return;
        try {
            await deleteSocialLink(id);
            setSocialLinks(prev => prev.filter(l => l.id !== id));
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Link o\'chirildi.' });
        } catch (e) { addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik.' }); }
    };

    const getSocialIcon = (platform: string) => {
        switch(platform) {
            case 'instagram': return <InstagramIcon className="w-5 h-5" />;
            case 'facebook': return <FacebookIcon className="w-5 h-5" />;
            case 'youtube': return <YouTubeIcon className="w-5 h-5" />;
            case 'telegram': return <TelegramIcon className="w-5 h-5" />;
            default: return null;
        }
    };

    const sqlCode = `-- 1. PROFIL JADVALI UCHUN RLS (ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eski qoidalarni tozalash (agar bo'lsa)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Owners can manage all profiles" ON public.profiles;

-- Hammaning profilini hamma ko'ra oladi
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Har kim faqat o'z profilini tahrirlay oladi
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- OWNER va ADMIN istalgan profilni boshqara oladi
CREATE POLICY "Admins and Owners can manage all profiles" 
ON public.profiles FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'owner')
);

-- 2. FANDUB UPLOADLARI UCHUN KENGAYTIRILGAN RUXSATLAR
-- Owner va Admin barcha yuklamalarni (uploads) ko'ra va boshqara oladi
ALTER TABLE public.fandub_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can manage own uploads" ON public.fandub_uploads;
DROP POLICY IF EXISTS "Admins and Owners can manage all fandubs" ON public.fandub_uploads;

-- Ijodkorlar o'z narsasini ko'radi/boshqaradi
CREATE POLICY "Creators can manage own uploads"
ON public.fandub_uploads FOR ALL
USING (auth.uid() = user_id);

-- Owner va Admin hammani narsasini boshqaradi
CREATE POLICY "Admins and Owners can manage all fandubs"
ON public.fandub_uploads FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'owner')
);

-- 3. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('posters', 'posters', true),
('videos', 'videos', true),
('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload config';`;

    const copySql = () => {
        navigator.clipboard.writeText(sqlCode);
        addNotification({ type: 'success', title: 'Nusxalandi', message: 'SQL kod nusxalandi. Supabase SQL Editorga tashlang.' });
    };

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Tizim Sozlamalari</h1>
                <button onClick={loadSettings} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors" title="Yangilash">
                    <RefreshCw size={20} />
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* FREE TRIAL SETTINGS */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                        <Clock className="text-yellow-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Bepul Sinov Davri</h2>
                    </div>
                    <div className="max-w-sm">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Davomiyligi (Daqiqa)</label>
                        <div className="relative">
                            <input type="number" value={freeTrialMinutes} onChange={(e) => setFreeTrialMinutes(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-4 pr-20 py-3 text-white focus:border-yellow-500 outline-none" />
                            <span className="absolute right-3 top-3 text-gray-500 text-sm font-bold">MIN</span>
                        </div>
                    </div>
                </div>

                {/* SOCIAL LINKS */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                        <LinkIcon className="text-blue-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Ijtimoiy Tarmoqlar</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                        <select value={newSocialPlatform} onChange={(e) => setNewSocialPlatform(e.target.value as any)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                            <option value="instagram">Instagram</option>
                            <option value="telegram">Telegram</option>
                            <option value="youtube">YouTube</option>
                            <option value="facebook">Facebook</option>
                        </select>
                        <input type="text" value={newSocialLabel} onChange={(e) => setNewSocialLabel(e.target.value)} placeholder="Nomi" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
                        <input type="text" value={newSocialUrl} onChange={(e) => setNewSocialUrl(e.target.value)} placeholder="URL" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
                        <button type="button" onClick={handleAddSocialLink} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">Qo'shish</button>
                    </div>
                    <div className="space-y-2">
                        {socialLinks.map(link => (
                            <div key={link.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-800 rounded-full text-gray-400">{getSocialIcon(link.platform)}</div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{link.label}</p>
                                        <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">{link.url}</a>
                                    </div>
                                </div>
                                <button type="button" onClick={() => link.id && handleDeleteSocialLink(link.id)} className="p-2 text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CARD INFO */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                        <CreditCard className="text-orange-500" size={24} />
                        <h2 className="text-xl font-bold text-white">To'lov Kartasi</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Karta Raqami" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none font-mono text-lg" />
                        <input type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Karta Egasi" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none uppercase" />
                    </div>
                </div>

                {/* SQL RECOVERY & RLS */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                        <div className="flex items-center gap-3">
                            <Database className="text-blue-500" size={24} />
                            <h2 className="text-xl font-bold text-white">Baza va RLS Tiklash</h2>
                        </div>
                        <button type="button" onClick={copySql} className="text-sm flex items-center gap-2 text-blue-400 hover:text-blue-300">
                            <Copy size={16} /> Nusxalash
                        </button>
                    </div>
                    <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30 flex gap-3 mb-4">
                        <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-200">
                            <b>RLS Qoidalari:</b> Ushbu SQL kod foydalanuvchilar o'z profilini boshqarishi va <b>Owner/Admin</b> barcha ma'lumotlarga (jumladan Fandub) kirishi uchun xavfsizlik qoidalarini o'rnatadi.
                        </p>
                    </div>
                    <div className="bg-black/50 p-4 rounded-lg font-mono text-[10px] text-green-400 overflow-x-auto max-h-64 border border-gray-700 relative group">
                        <pre>{sqlCode}</pre>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50">
                        {saving ? <LoadingSpinner /> : <Save size={20} />}
                        <span>Saqlash</span>
                    </button>
                </div>
            </form>
        </div>
    );
};
