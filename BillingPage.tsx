
import React, { useState } from 'react';
import { PaymentDetailsCard } from './components/PaymentDetailsCard';
import { createPaymentRequest, uploadFile, recordTsPaySuccess } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { createTsPayTransaction } from './services/tspayService';
import { CreditCard, Zap } from 'lucide-react';

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
                
                // Redirect user to TsPay
                window.location.href = response.transaction.url;
            } else {
                throw new Error(response.message || "To'lov havolasini olib bo'lmadi.");
            }

        } catch (e: any) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'TsPay bilan aloqa yo\'q.' });
            setIsTsPayLoading(false);
        }
    };

    const renderStatusMessage = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center p-4 bg-blue-900/30 text-blue-300 rounded-lg">
                        <div className="animate-pulse">Chek yuklanmoqda...</div>
                    </div>
                );
            case 'pending':
                return (
                    <div className="text-center p-4 bg-green-900/30 text-green-300 rounded-lg">
                        <h3 className="font-bold">So'rovingiz muvaffaqiyatli yuborildi!</h3>
                        <p className="text-sm">To'lovingiz adminlar tomonidan tekshirilgach (odatda 15 daqiqa ichida), balansingizga pul tushadi.</p>
                        <button onClick={() => setStatus('idle')} className="mt-2 text-sm underline hover:text-white">Yana to'ldirish</button>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center p-4 bg-red-900/30 text-red-300 rounded-lg">
                        <h3 className="font-bold">Xatolik!</h3>
                        <p className="text-sm">{error}</p>
                        <button onClick={() => setStatus('idle')} className="mt-2 text-sm underline hover:text-white">Qayta urinish</button>
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
                <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                    
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-400 fill-yellow-400" />
                        Tezkor To'lov (TsPay)
                    </h2>
                    <p className="text-sm text-gray-300 mb-6">
                        Ushbu usul orqali to'lov qilsangiz, balansingiz <b>avtomatik</b> va <b>darhol</b> to'ldiriladi.
                    </p>

                    <form onSubmit={handleTsPaySubmit} className="space-y-4 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Summa (UZS)</label>
                            <input 
                                type="number" 
                                value={tsAmount}
                                onChange={e => setTsAmount(e.target.value)}
                                placeholder="Min: 1000"
                                className="w-full bg-black/40 border border-blue-500/30 rounded-xl p-4 text-white font-bold text-lg focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isTsPayLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isTsPayLoading ? 'Yo\'naltirilmoqda...' : <><CreditCard size={18}/> TsPay orqali to'lash</>}
                        </button>
                        <p className="text-[10px] text-gray-500 text-center">Xavfsiz to'lov • UzCard / Humo</p>
                    </form>
                </div>

                {/* 2. MANUAL UPLOAD */}
                {status === 'pending' ? renderStatusMessage() : (
                     <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
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
                                    className="w-full px-4 py-3 text-lg bg-gray-800 border-2 border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-white"
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
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600/20 file:text-orange-400 hover:file:bg-orange-600/30"
                                 />
                            </div>
                            
                            {renderStatusMessage()}
                            
                            {status !== 'loading' && status !== 'error' && (
                                <button 
                                    type="submit"
                                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold text-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
                                >
                                    Chekni Yuborish
                                </button>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
