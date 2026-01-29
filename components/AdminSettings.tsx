
import React, { useState, useEffect } from 'react';
import { getAppConfig, updateAppConfig, getSocialLinks, addSocialLink, deleteSocialLink } from '../services/dbService';
import { useNotification } from '../hooks/useNotification';
import { LoadingSpinner } from './LoadingSpinner';
import { CreditCard, Save, RefreshCw, Database, Copy, Info, Link as LinkIcon, Trash2, Clock } from 'lucide-react';
import { InstagramIcon } from './icons/InstagramIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { TelegramIcon } from './icons/TelegramIcon';
import { SocialLink } from '../types';

export const AdminSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotification();

    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [price1Month, setPrice1Month] = useState('');
    const [price3Month, setPrice3Month] = useState('');
    const [price6Month, setPrice6Month] = useState('');
    const [price1Year, setPrice1Year] = useState('');
    const [freeTrialMinutes, setFreeTrialMinutes] = useState('');
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
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Sozlamalar yangilandi.' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlashda xatolik.' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddSocialLink = async () => {
        if (!newSocialUrl || !newSocialLabel) return;
        try {
            await addSocialLink({ platform: newSocialPlatform, url: newSocialUrl, label: newSocialLabel });
            loadSettings();
            setNewSocialUrl(''); setNewSocialLabel('');
        } catch (e) {}
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

    const sqlCode = `-- 1. PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins and Owners have full access to profiles" ON public.profiles;
CREATE POLICY "Admins and Owners have full access to profiles" ON public.profiles FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'owner')
);

-- 2. FANDUB RLS
ALTER TABLE public.fandub_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators can manage their own uploads" ON public.fandub_uploads;
CREATE POLICY "Creators can manage their own uploads" ON public.fandub_uploads FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins and Owners can manage all uploads" ON public.fandub_uploads;
CREATE POLICY "Admins and Owners can manage all uploads" ON public.fandub_uploads FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'owner')
);

-- 3. SAVED MOVIES RLS
ALTER TABLE public.saved_movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own saved movies" ON public.saved_movies;
CREATE POLICY "Users can manage their own saved movies" ON public.saved_movies FOR ALL USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload config';`;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Tizim Sozlamalari</h1>
                <button onClick={loadSettings} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all"><RefreshCw size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-10">
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-500"><Database size={24}/></div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">SQL va RLS Sozlamalari</h2>
                    </div>
                    <p className="text-zinc-500 text-sm mb-6">Ushbu kodni Supabase SQL Editorga joylang. Bu Owner va Adminlarga to'liq huquq beradi.</p>
                    <div className="relative group">
                        <pre className="bg-black p-6 rounded-3xl text-[10px] text-green-500 font-mono overflow-x-auto border border-white/5 max-h-64">{sqlCode}</pre>
                        <button type="button" onClick={() => {navigator.clipboard.writeText(sqlCode); addNotification({type:'success', title:'Nusxalandi', message:'SQL kod buferga olindi'})}} className="absolute top-4 right-4 p-3 bg-zinc-900 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={18}/></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-orange-600/20 rounded-2xl text-orange-500"><CreditCard size={24}/></div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">To'lov Ma'lumotlari</h2>
                        </div>
                        <div className="space-y-4">
                            <input value={cardNumber} onChange={e=>setCardNumber(e.target.value)} placeholder="Karta raqami" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-mono" />
                            <input value={cardHolder} onChange={e=>setCardHolder(e.target.value)} placeholder="Karta egasi" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white uppercase" />
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-yellow-600/20 rounded-2xl text-yellow-500"><Clock size={24}/></div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Bepul Sinov</h2>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-4">Davomiyligi (Daqiqa)</label>
                             <input type="number" value={freeTrialMinutes} onChange={e=>setFreeTrialMinutes(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white font-bold" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={saving} className="px-12 py-5 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-orange-900/20 transition-all active:scale-95 disabled:opacity-50">
                        {saving ? <LoadingSpinner /> : 'Barcha o\'zgarishlarni saqlash'}
                    </button>
                </div>
            </form>
        </div>
    );
};
