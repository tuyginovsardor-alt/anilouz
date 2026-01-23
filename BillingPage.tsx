
import React, { useState } from 'react';
import { PaymentDetailsCard } from './components/PaymentDetailsCard';
import { createPaymentRequest, uploadFile } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { createTsPayTransaction } from './services/tspayService';
import { CreditCard, Zap, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

export const BillingPage: React.FC = () => {
    const [amount, setAmount] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'pending' | 'error'>('idle');
    
    // TsPay State
    const [tsAmount, setTsAmount] = useState('');
    const [isTsPayLoading, setIsTsPayLoading] = useState(false);

    const { addNotification } = useNotification();

    const handleTsPaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tsAmount || Number(tsAmount) < 1000) {
            addNotification({ type: 'warning', title: 'Diqqat', message: "Minimal summa 1000 so'm." });
            return;
        }

        setIsTsPayLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Avval tizimga kiring.");

            // Edge Function orqali xavfsiz tranzaksiya yaratish
            const res = await createTsPayTransaction(Number(tsAmount), user.id);
            
            if (res.status === 'success' && res.transaction?.url) {
                // To'lov ID sini saqlab qo'yamiz (App.tsx da tekshirish uchun)
                localStorage.setItem('tspay_pending_id', String(res.transaction.id));
                localStorage.setItem('tspay_pending_amount', tsAmount);
                
                addNotification({ type: 'success', title: 'Tayyor', message: "To'lov sahifasiga o'tilmoqda..." });
                window.location.href = res.transaction.url;
            } else {
                throw new Error(res.message || "To'lov tizimida xatolik yuz berdi.");
            }
        } catch (e: any) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally {
            setIsTsPayLoading(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !screenshot) return;
        setStatus('loading');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const publicUrl = await uploadFile(screenshot, 'posters'); 
            await createPaymentRequest(user!.id, Number(amount), publicUrl);
            setStatus('pending');
            addNotification({ type: 'success', title: 'Yuborildi', message: 'Adminlar tekshirgach hisobingiz to\'ldiriladi.' });
        } catch (err: any) {
            setStatus('error');
            addNotification({ type: 'error', title: 'Xatolik', message: err.message });
        }
    };

    return (
        <div className="animate-fade-in pb-10">
            <h1 className="text-3xl font-bold text-white mb-8">Hisobni To'ldirish</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. TSPAY (EDGE FUNCTION) */}
                <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-blue-500/30 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                    <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
                        <Zap size={28} className="text-yellow-400 fill-current" /> Avtomatik To'lov
                    </h2>
                    <p className="text-zinc-300 text-sm mb-8 leading-relaxed">
                        To'lov summasini kiriting. <b>UzCard, Humo, Click yoki Payme</b> orqali to'lovni amalga oshiring. Balans avtomatik to'ldiriladi.
                    </p>

                    <form onSubmit={handleTsPaySubmit} className="space-y-5 relative z-10">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">Summa (UZS)</label>
                            <input 
                                type="number" 
                                value={tsAmount}
                                onChange={e => setTsAmount(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold text-xl outline-none focus:border-blue-500 transition-all"
                                placeholder="10,000"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isTsPayLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isTsPayLoading ? <Loader2 className="animate-spin" /> : <><CreditCard size={18}/> To'lovga O'tish</>}
                        </button>
                    </form>
                </div>

                {/* 2. MANUAL (CHEK YUKLASH) */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8">
                    <h2 className="text-2xl font-black text-white mb-6">Manual To'lov</h2>
                    <PaymentDetailsCard />
                    <form onSubmit={handleManualSubmit} className="mt-8 space-y-5">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Summa" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500" />
                        <input type="file" onChange={e => setScreenshot(e.target.files?.[0] || null)} className="w-full text-xs text-zinc-500" accept="image/*" />
                        <button type="submit" disabled={status === 'loading'} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                            {status === 'loading' ? 'Yuklanmoqda...' : 'Chekni yuborish'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
