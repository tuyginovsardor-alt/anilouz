import React from 'react';
import { BackArrowIcon } from './components/icons/BackArrowIcon';

interface CopyrightPageProps {
    onBack: () => void;
}

export const CopyrightPage: React.FC<CopyrightPageProps> = ({ onBack }) => {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto py-8 px-4">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
                <BackArrowIcon className="w-5 h-5" />
                <span>Bosh sahifaga qaytish</span>
            </button>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl">
                <h1 className="text-3xl md:text-4xl font-bold text-orange-500 mb-6 border-b border-gray-800 pb-4">
                    Mualliflik Huquqi va Foydalanish Shartlari
                </h1>

                <div className="space-y-6 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Umumiy Qoidalar</h2>
                        <p>
                            Anilo.uz platformasi O'zbekistondagi anime ixlosmandlari uchun yaratilgan onlayn portaldir. 
                            Saytda joylashtirilgan barcha materiallar (video, rasm, matn) faqat tanishuv va shaxsiy foydalanish uchun mo'ljallangan.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Kontent Egaligi</h2>
                        <p>
                            Saytdagi animelar va ularga tegishli intellektual mulk huquqlari ularning asl ijodkorlari va studiyalariga tegishlidir. 
                            Anilo.uz hech qanday materialga mualliflik huquqini da'vo qilmaydi. Bizning maqsadimiz — sifatli tarjima va qulay tomosha imkoniyatini yaratishdir.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Shikoyatlar (DMCA)</h2>
                        <p>
                            Agar siz biron bir kontentning qonuniy egasi bo'lsangiz va u saytimizda ruxsatsiz joylashtirilgan deb hisoblasangiz, 
                            iltimos, bizning "Murojaat" bo'limimiz orqali yoki admin@anilo.uz elektron pochtasi orqali biz bilan bog'laning. 
                            Tasdiqlangan so'rovlar asosida tegishli materiallar 24 soat ichida o'chirib tashlanadi.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Foydalanuvchi Javobgarligi</h2>
                        <p>
                            Saytdan foydalanish orqali siz ushbu qoidalarga rozilik bildirasiz. Saytdagi materiallarni tijoriy maqsadda ko'paytirish, 
                            sotish yoki tarqatish qat'iyan man etiladi.
                        </p>
                    </section>
                    
                    <div className="mt-8 pt-6 border-t border-gray-800 text-sm text-gray-500 text-center">
                        Oxirgi yangilanish: 2025-yil, Fevral.
                    </div>
                </div>
            </div>
        </div>
    );
};