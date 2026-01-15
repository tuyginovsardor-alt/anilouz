
import React, { useState } from 'react';
import { PaymentDetailsCard } from './components/PaymentDetailsCard';
import { createPaymentRequest, uploadFile } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';

type Status = 'idle' | 'loading' | 'pending' | 'error';

export const BillingPage: React.FC = () => {
    const [amount, setAmount] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
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

            {status === 'pending' ? renderStatusMessage() : (
                 <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4 sm:p-8 max-w-2xl mx-auto">
                    <p className="text-center text-gray-400 mb-6 text-sm sm:text-base">1. Quyidagi karta raqamiga kerakli summani o'tkazing. <br/> 2. To'lov chekini skrinshot qiling. <br/> 3. Ma'lumotlarni to'ldirib, so'rov yuboring.</p>
                    
                    <div className="mb-8">
                        <PaymentDetailsCard />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-md font-semibold text-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
                            >
                                Tasdiqlashni so'rash
                            </button>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
};
