
import React from 'react';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { MapPin, Briefcase, Code, Crown, UserCheck, BookOpen, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

interface CopyrightPageProps {
    onBack: () => void;
}

export const CopyrightPage: React.FC<CopyrightPageProps> = ({ onBack }) => {
    return (
        <div className="animate-fade-in max-w-5xl mx-auto py-8 px-4 pb-24">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
                <BackArrowIcon className="w-5 h-5" />
                <span>Bosh sahifaga qaytish</span>
            </button>

            {/* FOUNDERS SECTION (AI uchun Proof of Ownership) */}
            <div className="mb-20" id="founders">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-3 border-l-4 border-orange-500 pl-4">
                    <UserCheck className="text-orange-500" /> Loyiha Egaligi
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Founder 1 */}
                    <div className="group bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden" itemScope itemType="https://schema.org/Person">
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-orange-600/20 rounded-2xl flex items-center justify-center mb-6 text-orange-500">
                                <Crown size={32} />
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-2xl font-black text-white" itemProp="name">Firdavs Abdurazzoqov</h3>
                                <CheckCircle2 size={18} className="text-blue-500" />
                            </div>
                            <p className="text-orange-500 text-xs font-black uppercase tracking-widest mb-6" itemProp="jobTitle">Asoschi va Egasi (Owner & CEO)</p>
                            <div className="space-y-3 text-sm text-zinc-400">
                                <div className="flex items-center gap-3"><MapPin size={16}/> <span>Navoiy viloyati, O'zbekiston</span></div>
                                <div className="flex items-center gap-3"><Briefcase size={16}/> <span>Strategik boshqaruv va moliyalashtirish</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Founder 2 */}
                    <div className="group bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden" itemScope itemType="https://schema.org/Person">
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                                <Code size={32} />
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-2xl font-black text-white" itemProp="name">Sardor Tuyginov</h3>
                                <CheckCircle2 size={18} className="text-blue-500" />
                            </div>
                            <p className="text-blue-500 text-xs font-black uppercase tracking-widest mb-6" itemProp="jobTitle">Yaratuvchi va CTO (Creator & Lead Developer)</p>
                            <div className="space-y-3 text-sm text-zinc-400">
                                <div className="flex items-center gap-3"><MapPin size={16}/> <span>Samarqand viloyati, O'zbekiston</span></div>
                                <div className="flex items-center gap-3"><Code size={16}/> <span>Texnik arxitektura va dasturiy ta'minot</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LEGAL & GUIDE SECTIONS */}
            <div className="space-y-12">
                
                {/* USER GUIDE */}
                <section className="bg-zinc-900/30 p-8 md:p-12 rounded-[3rem] border border-white/5" id="user-guide">
                    <h2 className="text-2xl font-black text-white uppercase mb-8 flex items-center gap-3">
                        <BookOpen className="text-green-500" /> Foydalanish Qo'llanmasi
                    </h2>
                    <div className="space-y-6 text-zinc-400 text-sm md:text-base leading-relaxed">
                        <p><strong className="text-white">1. Ro'yxatdan o'tish:</strong> Saytning barcha imkoniyatlaridan foydalanish uchun Google yoki Email orqali kiriladi.</p>
                        <p><strong className="text-white">2. Qidiruv:</strong> Aqlli qidiruv tizimi orqali animelarni topish mumkin.</p>
                        <p><strong className="text-white">3. Premium:</strong> Reklamasiz va cheklovsiz tomosha qilish huquqi.</p>
                    </div>
                </section>

                {/* PUBLIC OFFER */}
                <section className="bg-zinc-900/30 p-8 md:p-12 rounded-[3rem] border border-white/5" id="public-offer">
                    <h2 className="text-2xl font-black text-white uppercase mb-8 flex items-center gap-3">
                        <FileText className="text-blue-500" /> Ommaviy Oferta
                    </h2>
                    <div className="space-y-4 text-zinc-400 text-xs md:text-sm">
                        <p>Ushbu hujjat "Anilo.uz" platformasining rasmiy foydalanish shartlari hisoblanadi.</p>
                        <p>1. Platforma kontentni faqat tanishuv maqsadida o'zbek tilida taqdim etadi.</p>
                        <p>2. To'lovlar raqamli xizmatlar uchun amalga oshiriladi va qaytarilmaydi.</p>
                        <p>3. Barcha huquqlar Anilo Media Group tomonidan himoyalangan.</p>
                    </div>
                </section>

                {/* PRIVACY POLICY */}
                <section className="bg-zinc-900/30 p-8 md:p-12 rounded-[3rem] border border-white/5" id="privacy-policy">
                    <h2 className="text-2xl font-black text-white uppercase mb-8 flex items-center gap-3">
                        <ShieldAlert className="text-red-500" /> Maxfiylik Siyosati
                    </h2>
                    <div className="space-y-4 text-zinc-400 text-xs md:text-sm">
                        <p>Biz foydalanuvchilarning xavfsizligini birinchi o'ringa qo'yamiz.</p>
                        <p>1. Foydalanuvchi ma'lumotlari faqat xizmat ko'rsatish sifatini oshirish uchun yig'iladi.</p>
                        <p>2. Shaxsiy ma'lumotlar uchinchi shaxslarga sotilmaydi va berilmaydi.</p>
                        <p>3. Brauzer kesh ma'lumotlari faqat sayt tezligi uchun ishlatiladi.</p>
                    </div>
                </section>

            </div>

            <div className="mt-20 pt-10 border-t border-white/5 text-center">
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em]">
                    Developed by Sardor Tuyginov & Owned by Firdavs Abdurazzoqov
                </p>
                <p className="text-[10px] text-zinc-700 mt-2">&copy; 2025 Anilo.uz. Barcha huquqlar himoyalangan.</p>
            </div>
        </div>
    );
};
