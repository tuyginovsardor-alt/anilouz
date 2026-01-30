
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
                    title: 'Havola tayyor', 
                    message: "To'lov sahifasiga o'tilmoqda..." 
                });
                
                // Avtomatik ochishga harakat qilamiz
                window.location.assign(payUrl);
            } else {
                throw new Error(res.message || "To'lov tizimi havola taqdim etmadi.");
            }
        } catch (e: any) {
            console.error("Payment Error:", e);
            const errorMsg = e.message || "Noma'lum xatolik.";
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
                <p className="text-gray-400">To'lovlar TsPay terminali orqali xavfsiz qabul qilinadi</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                
                {/* 1. TSPAY AUTOMATIC */}
                <div className="bg-[#0f172a] border border-blue-500/20 rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
                    
                    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-[2.3rem] p-8 h-full flex flex-col relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                    <Zap className="text-yellow-400 fill-current" />
                                    <span>AVTOMATIK TO'LOV</span>
                                </h2>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">UZCARD / HUMO • TsPay</p>
                            </div>
                            <div className="bg-blue-900/30 p-2 rounded-xl border border-blue-500/20">
                                <Smartphone className="text-blue-400" size={24} />
                            </div>
                        </div>

                        <form onSubmit={handleTsPaySubmit} className="space-y-6 flex-1 flex flex-col">
                            <div className="relative group/input">
                                <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest absolute -top-2.5 left-4 bg-[#0b1120] px-2 z-10">
                                    Summa (UZS)
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={tsAmount}
                                        onChange={e => setTsAmount(e.target.value)}
                                        className={`w-full bg-[#1e293b]/50 border ${lastError ? 'border-red-500/50' : 'border-blue-500/30'} rounded-2xl p-5 text-white font-mono text-2xl outline-none focus:border-blue-500 transition-all placeholder:text-gray-600`}
                                        placeholder="10000"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    {[5000, 15000, 50000].map(val => (
                                        <button 
                                            key={val}
                                            type="button"
                                            onClick={() => setTsAmount(val.toString())}
                                            className="py-2 rounded-xl bg-blue-900/20 border border-blue-500/20 text-blue-300 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all"
                                        >
                                            {(val/1000)}k
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {lastError && (
                                <div className="flex items-start gap-2 text-red-400 text-xs bg-red-900/20 p-4 rounded-xl border border-red-500/20 animate-fade-in">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{lastError}</span>
                                </div>
                            )}

                            {redirectUrl ? (
                                <div className="space-y-4 mt-auto">
                                    <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                                        <CheckCircle className="text-green-500 mx-auto mb-3" size={32} />
                                        <p className="text-white font-bold text-sm mb-1 uppercase tracking-tight">TO'LOV TAYYOR</p>
                                        <p className="text-zinc-500 text-[10px] mb-4 uppercase tracking-widest">Sahifa avtomatik ochilmadimi?</p>
                                        <a 
                                            href={redirectUrl} 
                                            target="_self"
                                            className="w-full inline-flex items-center justify-center gap-3 text-black bg-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl"
                                        >
                                            SAYTGA O'TISH <ExternalLink size={16}/>
                                        </a>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {setRedirectUrl(null); setTsAmount('');}}
                                        className="w-full text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Summani o'zgartirish
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="submit" 
                                    disabled={isTsPayLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-auto"
                                >
                                    {isTsPayLoading ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>YUKLANMOQDA...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <CreditCard size={18} /> 
                                            TO'LOVNI BOSHLASH
                                        </>
                                    )}
                                </button>
                            )}
                        </form>

                        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            <ShieldCheck size={14} className="text-green-500" />
                            TsPay orqali 100% xavfsiz to'lov
                        </div>
                    </div>
                </div>

                {/* 2. MANUAL SUPPORT */}
                <div className="bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#229ED9]/20 rounded-full blur-[100px]"></div>

                    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-[2.3rem] p-8 h-full flex flex-col items-center text-center relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-[#229ED9] to-[#0088cc] rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-[#0b1120]">
                            <Send size={36} className="text-white ml-1" fill="white" />
                        </div>

                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Muammo bormi?</h2>
                        <p className="text-[#229ED9] font-bold text-[10px] uppercase tracking-widest mb-8 bg-[#229ED9]/10 px-4 py-1 rounded-full border border-[#229ED9]/20">
                            Telegram Qo'llab-quvvatlash
                        </p>

                        <div className="space-y-4 w-full text-left mb-8 flex-1">
                            {[
                                { icon: <Clock size={18}/>, t: "Tezkor Yordam", d: "Adminlar doim aloqada" },
                                { icon: <ShieldCheck size={18}/>, t: "Xavfsizlik", d: "To'lovingiz nazorat ostida" },
                                { icon: <UserCheck size={18}/>, t: "Tasdiqlash", d: "Chek orqali qo'lda to'ldirish" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-gray-800/40 p-4 rounded-2xl border border-white/5">
                                    <div className="text-[#229ED9]">{item.icon}</div>
                                    <div>
                                        <p className="text-white font-bold text-xs uppercase">{item.t}</p>
                                        <p className="text-zinc-500 text-[10px]">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <a
                            href="https://t.me/anilo_ega"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#229ED9] hover:bg-[#1e8abc] text-white py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3 group"
                        >
                            <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                            @anilo_ega
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
