
import React, { useState } from 'react';
import { createTsPayTransaction } from './services/tspayService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { CreditCard, Zap, Loader2, AlertCircle, CheckCircle, ShieldCheck, Smartphone, Send, MessageCircle, Clock, UserCheck, ExternalLink } from 'lucide-react';

export const BillingPage: React.FC = () => {
    const [tsAmount, setTsAmount] = useState('');
    const [isTsPayLoading, setIsTsPayLoading] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    const { addNotification } = useNotification();

    const handleTsPaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLastError(null);
        setRedirectUrl(null);

        const amountNum = Number(tsAmount);
        if (!tsAmount || amountNum < 1000) {
            addNotification({ type: 'warning', title: 'Diqqat', message: "Minimal summa 1000 so'm." });
            return;
        }

        setIsTsPayLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Avval tizimga kiring.");

            const res = await createTsPayTransaction(amountNum, user.id);
            
            if (res.status === 'success' && res.transaction?.url) {
                const payUrl = res.transaction.url;
                setRedirectUrl(payUrl);
                
                addNotification({ 
                    type: 'success', 
                    title: 'Tayyor', 
                    message: "To'lov sahifasiga o'tilmoqda..." 
                });
                
                // Avtomatik redirect
                setTimeout(() => {
                    window.location.href = payUrl;
                }, 1000);
            } else {
                // Agar server xatolik qaytarsa, uni aniq ko'rsatamiz
                const detailMsg = res.message || "TsPay serveri so'rovni rad etdi. Kalit noto'g'ri bo'lishi mumkin.";
                throw new Error(detailMsg);
            }
        } catch (e: any) {
            console.error("Payment Error:", e);
            const errorMsg = e.message || "Tizimda kutilmagan xatolik yuz berdi.";
            setLastError(errorMsg);
            addNotification({ type: 'error', title: 'Xatolik', message: errorMsg });
        } finally {
            setIsTsPayLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto px-4 pt-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">Hisobni To'ldirish</h1>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Xavfsiz to'lovlar tizimi TsPay terminali orqali</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div className="bg-[#0f172a] border border-blue-500/20 rounded-[3rem] p-1 shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
                    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-[2.8rem] p-8 h-full flex flex-col relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                    <Zap className="text-yellow-400 fill-current" />
                                    <span>TSPAY AUTOMATIC</span>
                                </h2>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">Instant Top-up • UZCARD / HUMO</p>
                            </div>
                            <div className="bg-blue-900/30 p-3 rounded-2xl border border-blue-500/20">
                                <Smartphone className="text-blue-400" size={24} />
                            </div>
                        </div>

                        <form onSubmit={handleTsPaySubmit} className="space-y-6 flex-1 flex flex-col">
                            <div className="relative group/input">
                                <label className="text-[9px] font-black text-blue-300 uppercase tracking-widest absolute -top-2 left-5 bg-[#0b1120] px-2 z-10">Summa (UZS)</label>
                                <input type="number" value={tsAmount} onChange={e => setTsAmount(e.target.value)} className={`w-full bg-[#1e293b]/50 border ${lastError ? 'border-red-500/50' : 'border-blue-500/30'} rounded-2xl p-6 text-white font-mono text-3xl outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700`} placeholder="10000" />
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    {[5000, 15000, 50000].map(val => (
                                        <button key={val} type="button" onClick={() => setTsAmount(val.toString())} className="py-2.5 rounded-xl bg-blue-900/20 border border-blue-500/20 text-blue-300 text-[10px] font-black hover:bg-blue-500 hover:text-white transition-all uppercase">{(val/1000)}k</button>
                                    ))}
                                </div>
                            </div>
                            
                            {lastError && (
                                <div className="flex items-start gap-3 text-red-400 text-xs bg-red-900/20 p-5 rounded-2xl border border-red-500/20 animate-fade-in">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-black uppercase text-[10px] mb-1">Serverda Xatolik:</p>
                                        <p className="leading-relaxed">{lastError}</p>
                                    </div>
                                </div>
                            )}

                            {redirectUrl ? (
                                <div className="space-y-4 mt-auto">
                                    <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                                        <CheckCircle className="text-green-500 mx-auto mb-3" size={40} />
                                        <p className="text-white font-black text-sm uppercase tracking-tight mb-4">Redirect tayyor</p>
                                        <a href={redirectUrl} className="w-full inline-flex items-center justify-center gap-3 text-black bg-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl">SAYTGA O'TISH <ExternalLink size={16}/></a>
                                    </div>
                                </div>
                            ) : (
                                <button type="submit" disabled={isTsPayLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-auto">
                                    {isTsPayLoading ? <><Loader2 className="animate-spin" size={20} /> <span>YUKLANMOQDA...</span></> : <><CreditCard size={20} /> TO'LOVNI BOSHLASH</>}
                                </button>
                            )}
                        </form>

                        <div className="mt-8 flex items-center justify-center gap-2 text-[9px] text-zinc-500 font-black uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-green-500" /> 100% Xavfsiz to'lov tizimi
                        </div>
                    </div>
                </div>

                <div className="bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-[3rem] p-1 shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#229ED9]/20 rounded-full blur-[100px]"></div>
                    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-[2.8rem] p-8 h-full flex flex-col items-center text-center relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-[#229ED9] to-[#0088cc] rounded-3xl flex items-center justify-center mb-8 shadow-2xl rotate-3">
                            <Send size={36} className="text-white ml-1" fill="white" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Qo'lda to'ldirish</h2>
                        <p className="text-[#229ED9] font-black text-[9px] uppercase tracking-widest mb-10 bg-[#229ED9]/10 px-4 py-1.5 rounded-full border border-[#229ED9]/20">Telegram @anilo_ega</p>
                        <div className="space-y-4 w-full text-left mb-10 flex-1">
                            {[
                                { icon: <Clock size={20}/>, t: "Tezkor Yordam", d: "Adminlar 24/7 aloqada" },
                                { icon: <ShieldCheck size={20}/>, t: "Xavfsizlik", d: "Manual tasdiqlash kafolati" },
                                { icon: <UserCheck size={20}/>, t: "Tasdiqlash", d: "Chek orqali to'ldirish" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                                    <div className="text-[#229ED9]">{item.icon}</div>
                                    <div><p className="text-white font-black text-[10px] uppercase">{item.t}</p><p className="text-zinc-500 text-[10px] mt-0.5">{item.d}</p></div>
                                </div>
                            ))}
                        </div>
                        <a href="https://t.me/anilo_ega" target="_blank" className="w-full bg-[#229ED9] hover:bg-[#1e8abc] text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 group"><MessageCircle size={20} className="group-hover:scale-110 transition-transform" /> ADMIN BILAN BOG'LANISH</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
