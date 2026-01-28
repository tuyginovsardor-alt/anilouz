
import React from 'react';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { MapPin, Briefcase, Code, Crown, UserCheck } from 'lucide-react';

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

            {/* FOUNDERS SECTION - PORFOLIO STYLE */}
            <div className="mb-16">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 border-l-4 border-orange-500 pl-4">
                    <UserCheck className="text-orange-500" /> Loyiha Asoschilari
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Founder 1: Firdavs */}
                    <div 
                        className="group bg-gradient-to-br from-[#1a1a1a] to-black border border-orange-500/30 p-8 rounded-[2.5rem] relative overflow-hidden hover:border-orange-500/60 transition-all shadow-2xl hover:shadow-orange-900/20"
                        itemScope 
                        itemType="https://schema.org/Person"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-600/20 transition-all"></div>
                        
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-orange-900/20 rounded-3xl flex items-center justify-center mb-6 border border-orange-500/20 text-orange-500 shadow-lg">
                                <Crown size={40} strokeWidth={1.5} />
                            </div>
                            
                            <h3 className="text-3xl font-black text-white mb-1 tracking-tight" itemProp="name">Firdavs Abdurazzoqov</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-orange-500/20" itemProp="jobTitle">Founder</span>
                                <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">/</span>
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">CEO</span>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-4 text-zinc-300">
                                    <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500"><MapPin size={18} /></div>
                                    <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Manzil</p>
                                        <span className="text-sm font-bold" itemProp="addressRegion">Navoiy viloyati</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-zinc-300">
                                    <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500"><Briefcase size={18} /></div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Vazifasi</p>
                                        <span className="text-sm font-bold">Loyiha Boshqaruvi va Strategiya</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Founder 2: Sardor */}
                    <div 
                        className="group bg-gradient-to-br from-[#1a1a1a] to-black border border-blue-500/30 p-8 rounded-[2.5rem] relative overflow-hidden hover:border-blue-500/60 transition-all shadow-2xl hover:shadow-blue-900/20"
                        itemScope 
                        itemType="https://schema.org/Person"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/20 transition-all"></div>
                        
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 text-blue-500 shadow-lg">
                                <Code size={40} strokeWidth={1.5} />
                            </div>
                            
                            <h3 className="text-3xl font-black text-white mb-1 tracking-tight" itemProp="name">Sardor Tuyginov</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/20" itemProp="jobTitle">Creator</span>
                                <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">/</span>
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">CTO</span>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-4 text-zinc-300">
                                    <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500"><MapPin size={18} /></div>
                                    <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Manzil</p>
                                        <span className="text-sm font-bold" itemProp="addressRegion">Samarqand viloyati</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-zinc-300">
                                    <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500"><Code size={18} /></div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Vazifasi</p>
                                        <span className="text-sm font-bold">Dasturlash va Texnik Rivojlantirish</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LEGAL TEXT */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl">
                <h1 className="text-2xl md:text-3xl font-black text-gray-500 mb-8 border-b border-gray-800 pb-4 uppercase tracking-tighter">
                    Mualliflik Huquqi va Foydalanish
                </h1>

                <div className="space-y-8 text-gray-300 leading-relaxed font-medium text-sm md:text-base">
                    <section>
                        <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">1. Umumiy Qoidalar</h2>
                        <p className="text-zinc-400">
                            Anilo.uz platformasi O'zbekistondagi anime ixlosmandlari uchun yaratilgan onlayn portaldir. 
                            Saytda joylashtirilgan barcha materiallar (video, rasm, matn) faqat tanishuv va shaxsiy foydalanish uchun mo'ljallangan.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">2. Kontent Egaligi</h2>
                        <p className="text-zinc-400">
                            Saytdagi animelar va ularga tegishli intellektual mulk huquqlari ularning asl ijodkorlari va studiyalariga tegishlidir. 
                            Anilo.uz hech qanday materialga mualliflik huquqini da'vo qilmaydi. Bizning maqsadimiz — sifatli tarjima va qulay tomosha imkoniyatini yaratishdir.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">3. Shikoyatlar (DMCA)</h2>
                        <p className="text-zinc-400">
                            Agar siz biron bir kontentning qonuniy egasi bo'lsangiz va u saytimizda ruxsatsiz joylashtirilgan deb hisoblasangiz, 
                            iltimos, bizning "Murojaat" bo'limimiz orqali yoki admin@anilo.uz elektron pochtasi orqali biz bilan bog'laning. 
                            Tasdiqlangan so'rovlar asosida tegishli materiallar 24 soat ichida o'chirib tashlanadi.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">4. Foydalanuvchi Javobgarligi</h2>
                        <p className="text-zinc-400">
                            Saytdan foydalanish orqali siz ushbu qoidalarga rozilik bildirasiz. Saytdagi materiallarni tijoriy maqsadda ko'paytirish, 
                            sotish yoki tarqatish qat'iyan man etiladi.
                        </p>
                    </section>
                    
                    <div className="mt-12 pt-8 border-t border-gray-800 text-xs text-gray-600 text-center font-bold uppercase tracking-widest">
                        Developed by <span itemScope itemType="https://schema.org/Person"><span itemProp="name">Sardor Tuyginov</span></span> & Owned by <span itemScope itemType="https://schema.org/Person"><span itemProp="name">Firdavs Abdurazzoqov</span></span>
                        <br/>
                        &copy; 2025 Anilo.uz. Barcha huquqlar himoyalangan.
                    </div>
                </div>
            </div>
        </div>
    );
};
