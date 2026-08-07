
import React from 'react';
import { Instagram, Send, Youtube, Disc as Discord, ShieldCheck, FileText, Info, Phone } from 'lucide-react';
import { Page } from '../types';

interface FooterProps {
    onNavigate: (page: Page) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    return (
        <footer className="bg-[#080808] border-t border-white/5 pt-20 pb-10 mt-20">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* BIZ HAQIMIZDA */}
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Biz Haqimizda</h4>
                        <ul className="space-y-4">
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Biz haqimizda</button></li>
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Huquqiy ma'lumotlar</button></li>
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Reklama</button></li>
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Bog'lanish</button></li>
                        </ul>
                    </div>

                    {/* HUQUQIY MA'LUMOTLAR */}
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Huquqiy Ma'lumotlar</h4>
                        <ul className="space-y-4">
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Foydalanish shartlari</button></li>
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Maxfiylik siyosati</button></li>
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Hamkorlik shartlari</button></li>
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Mualliflik huquqi</button></li>
                        </ul>
                    </div>

                    {/* REKLAMA */}
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Reklama</h4>
                        <ul className="space-y-4">
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Reklama turlari</button></li>
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Hamkorlik shakllari</button></li>
                            <li><button onClick={() => onNavigate('copyright')} className="text-zinc-500 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors">Ilova yuklab olish</button></li>
                        </ul>
                    </div>

                    {/* ILOVA YUKLAB OLING */}
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Ilova Yuklab Oling</h4>
                        <div className="flex flex-col gap-3">
                            <a href="#" className="block transition-transform active:scale-95">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-10 opacity-70 hover:opacity-100 transition-opacity" />
                            </a>
                            <a href="#" className="block transition-transform active:scale-95">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-10 opacity-70 hover:opacity-100 transition-opacity" />
                            </a>
                        </div>
                        <div className="mt-8 flex items-center gap-4">
                            <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Instagram size={18} /></a>
                            <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Send size={18} /></a>
                            <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Youtube size={20} /></a>
                            <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Discord size={18} /></a>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-600/10 flex items-center justify-center text-orange-500">
                             <ShieldCheck size={16} />
                        </div>
                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">
                            © 2026 Anilo.uz. Barcha huquqlar himoyalangan.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-20">
                         <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                         <div className="w-2 h-2 rounded-full bg-orange-500/50"></div>
                         <div className="w-2 h-2 rounded-full bg-orange-500/20"></div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
