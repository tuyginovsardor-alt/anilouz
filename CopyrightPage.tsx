
import React, { useState, useEffect } from 'react';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { 
    ShieldCheck, FileText, UserCheck, BookOpen, 
    Lock, Copyright, MapPin, Mail, CheckCircle2,
    Scale, AlertCircle, Award, Layout, ChevronRight
} from 'lucide-react';

interface CopyrightPageProps {
    onBack: () => void;
}

type DocSection = 'founders' | 'privacy' | 'offer' | 'rules' | 'copyright';

export const CopyrightPage: React.FC<CopyrightPageProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState<DocSection>('founders');

    // Scroll to top when section changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSection]);

    const SidebarLink = ({ id, icon, label }: { id: DocSection, icon: React.ReactNode, label: string }) => (
        <button 
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                activeSection === id 
                ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/20 translate-x-2' 
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
        >
            <div className="flex items-center gap-3">
                <span className={activeSection === id ? 'text-white' : 'text-orange-500'}>{icon}</span>
                <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            </div>
            <ChevronRight size={16} className={`transition-transform ${activeSection === id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
        </button>
    );

    const OfficialSeal = () => (
        <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-col items-center">
            <div className="relative w-32 h-32 opacity-80 select-none">
                <div className="absolute inset-0 border-4 border-blue-900 rounded-full flex items-center justify-center">
                    <div className="absolute inset-2 border border-blue-900 rounded-full"></div>
                    <div className="text-blue-900 text-[8px] font-black absolute top-2 left-1/2 -translate-x-1/2 tracking-widest text-center leading-none">
                        O'ZBEKISTON RESPUBLIKASI
                    </div>
                    <div className="text-blue-900 font-black text-lg text-center rotate-[-10deg] leading-none">
                        ANILO.UZ<br/>
                        <span className="text-[10px] font-bold">PLATFORMASI</span>
                    </div>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-blue-900 text-[8px] font-black uppercase tracking-widest">
                        TASDIQLANGAN
                    </div>
                </div>
            </div>
            <p className="text-zinc-600 text-[10px] font-bold mt-4 uppercase tracking-[0.3em]">Elektron Hujjat #AN-2025-LGL</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white animate-fade-in font-sans">
            
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest group"
                >
                    <div className="p-2 bg-zinc-900 rounded-full group-hover:bg-orange-600 transition-colors">
                        <BackArrowIcon className="w-4 h-4" />
                    </div>
                    <span>Bosh sahifaga qaytish</span>
                </button>
                <div className="flex items-center gap-2">
                    <Award className="text-orange-500" size={18} />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Official Legal Portal</span>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 py-10 lg:py-16">
                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* SIDEBAR */}
                    <aside className="w-full lg:w-80 flex-shrink-0 space-y-2">
                        <div className="mb-8 px-2">
                            <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Huquqiy Markaz</h1>
                            <p className="text-zinc-500 text-xs font-medium">Barcha rasmiy kelishuvlar va loyiha ma'lumotlari shu yerda jamlangan.</p>
                        </div>
                        <SidebarLink id="founders" icon={<UserCheck size={20}/>} label="Loyiha Asoschilari" />
                        <SidebarLink id="offer" icon={<FileText size={20}/>} label="Ommaviy Oferta" />
                        <SidebarLink id="privacy" icon={<Lock size={20}/>} label="Maxfiylik Siyosati" />
                        <SidebarLink id="rules" icon={<Scale size={20}/>} label="Foydalanish Qoidalari" />
                        <SidebarLink id="copyright" icon={<Copyright size={20}/>} label="Mualliflik Huquqi" />
                    </aside>

                    {/* CONTENT AREA */}
                    <main className="flex-1 bg-zinc-900/30 border border-white/5 rounded-[3rem] p-8 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
                        
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 animate-fade-in">
                            
                            {/* 1. ASOSCHILAR SECTION */}
                            {activeSection === 'founders' && (
                                <div className="space-y-12">
                                    <div className="border-l-4 border-orange-600 pl-6 mb-12">
                                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Loyiha Egalari</h2>
                                        <p className="text-zinc-400 text-sm">"Anilo.uz" platformasining rivojlanishi uchun mas'ul ijodiy va texnik jamoa.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Founder 1 */}
                                        <div className="group bg-black/40 border border-white/10 p-8 rounded-[2.5rem] hover:border-orange-500/50 transition-all duration-500">
                                            <div className="w-20 h-20 bg-orange-600/20 rounded-3xl flex items-center justify-center mb-6 text-orange-500">
                                                <UserCheck size={40} />
                                            </div>
                                            <h3 className="text-2xl font-black text-white mb-1">Firdavs Abdurazzoqov</h3>
                                            <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-6">Owner & CEO</p>
                                            <div className="space-y-4 text-sm text-zinc-400">
                                                <div className="flex items-center gap-3"><MapPin size={16} className="text-zinc-600" /> <span>Navoiy viloyati, O'zbekiston</span></div>
                                                <div className="flex items-center gap-3"><Mail size={16} className="text-zinc-600" /> <span>admin@anilo.uz</span></div>
                                                <p className="pt-4 border-t border-white/5 leading-relaxed">Loyiha asoschisi, strategik rivojlanish va moliyaviy masalalar bo'yicha bosh mas'ul.</p>
                                            </div>
                                        </div>

                                        {/* Founder 2 */}
                                        <div className="group bg-black/40 border border-white/10 p-8 rounded-[2.5rem] hover:border-blue-500/50 transition-all duration-500">
                                            <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mb-6 text-blue-500">
                                                <Layout size={40} />
                                            </div>
                                            <h3 className="text-2xl font-black text-white mb-1">Sardor Tuyginov</h3>
                                            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-6">Creator & CTO</p>
                                            <div className="space-y-4 text-sm text-zinc-400">
                                                <div className="flex items-center gap-3"><MapPin size={16} className="text-zinc-600" /> <span>Samarqand viloyati, O'zbekiston</span></div>
                                                <div className="flex items-center gap-3"><CheckCircle2 size={16} className="text-zinc-600" /> <span>Lead Developer</span></div>
                                                <p className="pt-4 border-t border-white/5 leading-relaxed">Platforma arxitektori, dasturiy ta'minotni yaratuvchisi va texnik rivojlantirish bo'yicha mas'ul.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                            {/* 2. OMMAVIY OFFERTA */}
                            {activeSection === 'offer' && (
                                <div className="space-y-8">
                                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8 flex items-center gap-4">
                                        <FileText className="text-orange-500" size={32} /> Ommaviy Oferta
                                    </h2>
                                    <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 text-sm leading-relaxed">
                                        <div className="bg-zinc-800/50 p-6 rounded-2xl border-l-4 border-orange-500">
                                            <p>Ushbu hujjat "Anilo.uz" platformasi va foydalanuvchi o'rtasidagi rasmiy huquqiy kelishuv hisoblanadi.</p>
                                        </div>
                                        <section className="space-y-4">
                                            <h4 className="text-white font-black uppercase tracking-widest text-xs">1. Umumiy qoidalar</h4>
                                            <p>1.1. Platformadan foydalanish uchun foydalanuvchi ushbu oferta shartlarini so'zsiz qabul qilishi lozim.</p>
                                            <p>1.2. Platformadagi barcha xizmatlar (obuna, ARK trading, konkurslar) faqat tanishuv va ko'ngilochar maqsadlarda taqdim etiladi.</p>
                                        </section>
                                        <section className="space-y-4">
                                            <h4 className="text-white font-black uppercase tracking-widest text-xs">2. To'lovlar va Premium obuna</h4>
                                            <p>2.1. Premium obuna uchun amalga oshirilgan to'lovlar, agar texnik nosozliklar platforma aybi bilan yuzaga kelmasa, qaytarilmaydi.</p>
                                            <p>2.2. To'lov tizimlari (Payme, Click) orqali amalga oshirilgan tranzaktsiyalar ushbu tizimlarning o'z qoidalari bilan tartibga solinadi.</p>
                                        </section>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                            {/* 3. MAXFIYLIK SIYOSATI */}
                            {activeSection === 'privacy' && (
                                <div className="space-y-8">
                                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8 flex items-center gap-4">
                                        <Lock className="text-blue-500" size={32} /> Maxfiylik Siyosati
                                    </h2>
                                    <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 text-sm leading-relaxed">
                                        <div className="bg-zinc-800/50 p-6 rounded-2xl border-l-4 border-blue-500">
                                            <p>Biz foydalanuvchilarimizning xavfsizligini va ma'lumotlar daxlsizligini oliy maqsad deb bilamiz.</p>
                                        </div>
                                        <section className="space-y-4">
                                            <h4 className="text-white font-black uppercase tracking-widest text-xs">1. Ma'lumotlarni yig'ish</h4>
                                            <p>1.1. Siz ro'yxatdan o'tganingizda biz sizning elektron pochtangiz, IP manzilingiz va qurilma ma'lumotlaringizni xavfsizlik maqsadida saqlaymiz.</p>
                                            <p>1.2. To'lov karta ma'lumotlari bizning serverlarimizda saqlanmaydi.</p>
                                        </section>
                                        <section className="space-y-4">
                                            <h4 className="text-white font-black uppercase tracking-widest text-xs">2. Ma'lumotlarni himoya qilish</h4>
                                            <p>2.1. Barcha ma'lumotlar SSL shifrlash protokollari orqali himoyalangan.</p>
                                            <p>2.2. Ma'lumotlar uchinchi shaxslarga sotilmaydi yoki ijaraga berilmaydi.</p>
                                        </section>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                            {/* 4. QOIDALAR */}
                            {activeSection === 'rules' && (
                                <div className="space-y-8">
                                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8 flex items-center gap-4">
                                        <Scale className="text-yellow-500" size={32} /> Foydalanish Qoidalari
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-2xl">
                                            <h4 className="text-red-500 font-bold mb-3 flex items-center gap-2"> <AlertCircle size={16}/> Taqiqlanadi</h4>
                                            <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4">
                                                <li>Haqoratli username yoki sharhlar qoldirish</li>
                                                <li>Botlardan foydalanish yoki tizimni aldash</li>
                                                <li>Bitta qurilmada ko'plab akkaunt ochish</li>
                                                <li>Platforma kontentini ko'chirib, boshqa joyda tarqatish</li>
                                            </ul>
                                        </div>
                                        <div className="p-6 bg-green-900/10 border border-green-500/20 rounded-2xl">
                                            <h4 className="text-green-500 font-bold mb-3 flex items-center gap-2"> <CheckCircle2 size={16}/> Ruxsat beriladi</h4>
                                            <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4">
                                                <li>Animelarni yuqori sifatda ko'rish</li>
                                                <li>Konkurslarda ishtirok etish</li>
                                                <li>Ijodkorlarga yordam berish va obuna bo'lish</li>
                                                <li>Ilovani yuklab olish va do'stlar bilan ulashish</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                            {/* 5. MUALLIFLIK HUQUQI */}
                            {activeSection === 'copyright' && (
                                <div className="space-y-8">
                                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8 flex items-center gap-4">
                                        <Copyright className="text-purple-500" size={32} /> Mualliflik Huquqi
                                    </h2>
                                    <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 text-sm leading-relaxed">
                                        <p>3.1. "Anilo.uz" platformasidagi barcha matnlar, logotiplar, va dasturiy kodlar <strong>ANILO MEDIA GROUP</strong> mulki hisoblanadi.</p>
                                        <p>3.2. Platformada taqdim etilayotgan animelar o'zbek tiliga dublyaj qilingan bo'lib, ular faqat shaxsiy foydalanish (non-commercial) uchun mo'ljallangan.</p>
                                        <p>3.3. Agar siz biron bir kontent mualliflik huquqingizni buzmoqda deb hisoblasangiz, iltimos, <strong>copyright@anilo.uz</strong> manziliga murojaat qiling.</p>
                                    </div>
                                    <div className="p-10 bg-zinc-800/30 rounded-[3rem] text-center border border-white/5">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-4">Developed by</p>
                                        <p className="text-2xl font-['Metal_Mania'] text-white tracking-widest mb-2">ANILO.UZ TEAM</p>
                                        <p className="text-xs text-zinc-500 italic">2023 - 2025 Barcha huquqlar himoyalangan.</p>
                                    </div>
                                    <OfficialSeal />
                                </div>
                            )}

                        </div>
                    </main>

                </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="bg-black py-8 border-t border-white/5 text-center px-4">
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em] max-w-2xl mx-auto">
                    Diqqat: Ushbu sahifa platformaning rasmiy huquqiy portali hisoblanadi. Undagi barcha ma'lumotlar qonuniy kuchga ega va foydalanuvchi roziligini tasdiqlaydi.
                </p>
            </div>
        </div>
    );
};
