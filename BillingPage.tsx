
import React, { useState } from 'react';
import { PaymentDetailsCard } from './components/PaymentDetailsCard';
import { createPaymentRequest, uploadFile, recordTsPaySuccess } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { createTsPayTransaction } from './services/tspayService';
import { CreditCard, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'idle' | 'loading' | 'pending' | 'error';

export const BillingPage: React.FC = () => {
    const [amount, setAmount] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    
    // TsPay State
    const [tsAmount, setTsAmount] = useState('');
    const [isTsPayLoading, setIsTsPayLoading] = useState(false);

    const { addNotification } = useNotification();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !screenshot) {
            setError("Iltimos, barcha maydonlarni to'ldiring.");
            return;
        }

        setStatus('loading');
        setError(null);

        try {
            // 1. Upload Screenshot
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

            // 'receipts' bucketiga yuklash
            const publicUrl = await uploadFile(screenshot, 'receipts'); 

            // 2. Create DB Record
            await createPaymentRequest(user.id, Number(amount), publicUrl);

            setStatus('pending');
            addNotification({
                type: 'success',
                title: 'So\'rov yuborildi',
                message: 'To\'lov cheki adminlarga yuborildi. Tez orada balansingiz yangilanadi.',
            });
            
            // Reset form
            setAmount('');
            setScreenshot(null);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Noma'lum xatolik yuz berdi.";
            setError(`Xatolik: ${errorMessage}`);
            setStatus('error');
            addNotification({
                type: 'error',
                title: 'Xatolik',
                message: errorMessage,
            });
        }
    };

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

            const response = await createTsPayTransaction(Number(tsAmount), user.id);
            
            if (response.status === 'success' && response.transaction.url) {
                // To'lov jarayonini kuzatish uchun local storagega yozib qo'yamiz
                localStorage.setItem('tspay_pending_id', String(response.transaction.id));
                localStorage.setItem('tspay_pending_amount', tsAmount);
                
                addNotification({ type: 'success', title: 'Tayyor', message: "To'lov sahifasiga yo'naltirilmoqdasiz..." });
                
                // Redirect user to TsPay after slight delay
                setTimeout(() => {
                    window.location.href = response.transaction.url;
                }, 1000);
            } else {
                throw new Error(response.message || "To'lov havolasini olib bo'lmadi.");
            }

        } catch (e: any) {
            console.error("Payment Init Error:", e);
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'TsPay bilan aloqa yo\'q.' });
            setIsTsPayLoading(false);
        }
    };

    const renderStatusMessage = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center p-4 bg-blue-900/30 text-blue-300 rounded-lg flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <div className="animate-pulse">Chek yuklanmoqda...</div>
                    </div>
                );
            case 'pending':
                return (
                    <div className="text-center p-4 bg-green-900/30 text-green-300 rounded-lg border border-green-500/30">
                        <h3 className="font-bold flex items-center justify-center gap-2 mb-2">
                            <CheckCircle size={20} /> So'rovingiz qabul qilindi!
                        </h3>
                        <p className="text-sm">To'lovingiz adminlar tomonidan tekshirilgach (odatda 15 daqiqa ichida), balansingizga pul tushadi.</p>
                        <button onClick={() => setStatus('idle')} className="mt-4 text-sm bg-green-800 hover:bg-green-700 px-4 py-2 rounded text-white transition-colors">Yana to'ldirish</button>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center p-4 bg-red-900/30 text-red-300 rounded-lg border border-red-500/30">
                        <h3 className="font-bold flex items-center justify-center gap-2 mb-2">
                            <AlertCircle size={20} /> Xatolik!
                        </h3>
                        <p className="text-sm">{error}</p>
                        <button onClick={() => setStatus('idle')} className="mt-4 text-sm underline hover:text-white">Qayta urinish</button>
                    </div>
                );
            default:
                return null;
        }
    }


    return (
        <div className="animate-fade-in pb-10">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-8 text-center sm:text-left">
                Hisobni To'ldirish
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. TSPAY AUTOMATIC */}
                <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700"></div>
                    
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/40">
                            <Zap size={20} className="fill-current" />
                        </div>
                        Tezkor To'lov (TsPay)
                    </h2>
                    <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                        UzCard yoki Humo kartalari orqali xavfsiz to'lov. Balansingiz <b>avtomatik</b> va <b>darhol</b> to'ldiriladi.
                    </p>

                    <form onSubmit={handleTsPaySubmit} className="space-y-4 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Summa (UZS)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={tsAmount}
                                    onChange={e => setTsAmount(e.target.value)}
                                    placeholder="Masalan: 15000"
                                    className="w-full bg-black/40 border border-blue-500/30 rounded-xl p-4 text-white font-bold text-xl focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 pl-4"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">UZS</span>
                            </div>
                        </div>
                        
                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isTsPayLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 flex items-center justify-center gap-3 active:scale-95"
                            >
                                {isTsPayLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Yo'naltirilmoqda...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={20}/> 
                                        <span>To'lov qilish</span>
                                    </>
                                )}
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-center gap-3 mt-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <img src="https://logobank.uz:8005/media/logos_png/Uzcard-01.png" alt="Uzcard" className="h-6 object-contain" />
                            <img src="https://logobank.uz:8005/media/logos_png/Humo-01.png" alt="Humo" className="h-6 object-contain" />
                        </div>
                    </form>
                </div>

                {/* 2. MANUAL UPLOAD */}
                <div className={`transition-all duration-500 ${status === 'pending' ? 'bg-green-900/10' : 'bg-gray-900/50'} backdrop-blur-sm border border-gray-800 rounded-2xl p-6`}>
                    {status === 'pending' ? renderStatusMessage() : (
                        <>
                            <h2 className="text-xl font-bold text-white mb-4">Manual To'lov (Chek bilan)</h2>
                            <p className="text-gray-400 mb-6 text-sm">Agarda avtomatik to'lov ishlamasa, karta raqamiga o'tkazib chek yuboring.</p>
                            
                            <div className="mb-8">
                                <PaymentDetailsCard />
                            </div>

                            <form onSubmit={handleManualSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">To'lov qilingan summa (UZS)</label>
                                    <input 
                                        id="amount"
                                        type="number" 
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="15000"
                                        required
                                        disabled={status === 'loading'}
                                        className="w-full px-4 py-3 text-lg bg-gray-800 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-white transition-all"
                                    />
                                </div>

                                <div>
                                     <label htmlFor="screenshot" className="block text-sm font-medium text-gray-300 mb-2">To'lov cheki (skrinshot)</label>
                                     <input 
                                        id="screenshot"
                                        type="file" 
                                        accept="image/*"
                                        required
                                        disabled={status === 'loading'}
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-orange-600/20 file:text-orange-400 hover:file:bg-orange-600/30 cursor-pointer"
                                     />
                                </div>
                                
                                {renderStatusMessage()}
                                
                                {status !== 'loading' && status !== 'error' && (
                                    <button 
                                        type="submit"
                                        className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-white border border-gray-700 hover:border-gray-500"
                                    >
                                        Chekni Yuborish
                                    </button>
                                )}
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
