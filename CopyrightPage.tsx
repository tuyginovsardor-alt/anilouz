
import React from 'react';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { MapPin, Briefcase, Code, Crown } from 'lucide-react';

interface CopyrightPageProps {
    onBack: () => void;
}

export const CopyrightPage: React.FC<CopyrightPageProps> = ({ onBack }) => {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto py-8 px-4 pb-20">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
                <BackArrowIcon className="w-5 h-5" />
                <span>Bosh sahifaga qaytish</span>
            </button>

            {/* FOUNDERS SECTION */}
            <div className="mb-12">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <Crown className="text-yellow-500 fill-yellow-500" /> Loyiha Asoschilari
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Founder 1 */}
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-orange-500/30 p-6 rounded-[2rem] relative overflow-hidden group hover:border-orange-500/60 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-orange-900/20 rounded-2xl flex items-center justify-center mb-4 border border-orange-500/20 text-orange-500">
                                <Crown size={32} />
                            </div>
                            
                            <h3 className="text-2xl font-black text-white mb-1">Firdavs Abdurazzoqov</h3>
                            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-6">Loyiha Asoschisi (Founder)</p>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <MapPin size={18} className="text-zinc-500" />
                                    <span className="text-sm font-medium">Navoiy viloyati</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Briefcase size={18} className="text-zinc-500" />
                                    <span className="text-sm font-medium">Boshqaruv va Strategiya</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Founder 2 */}
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-blue-500/30 p-6 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/60 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20 text-blue-500">
                                <Code size={32} />
                            </div>
                            
                            <h3 className="text-2xl font-black text-white mb-1">Sardor Tuyginov</h3>
                            <p className="text-blue-500 text-xs font-bold uppercase tracking-[0.2em] mb-6">Texnik Direktor (Creator)</p>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <MapPin size={18} className="text-zinc-500" />
                                    <span className="text-sm font-medium">Samarqand viloyati</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Code size={18} className="text-zinc-500" />
                                    <span className="text-sm font-medium">Dasturlash va Rivojlantirish</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-500 mb-6 border-b border-gray-800 pb-4">
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
                        <br/>
                        &copy; Firdavs Abdurazzoqov & Sardor Tuyginov
                    </div>
                </div>
            </div>
        </div>
    );
};
