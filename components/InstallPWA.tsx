
import React, { useState, useEffect } from 'react';
import { Download, X, Star } from 'lucide-react';

export const InstallPWA: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Brauzerning standart install oynasini to'xtatamiz
            e.preventDefault();
            setDeferredPrompt(e);
            // Agar foydalanuvchi hali o'rnatmagan bo'lsa, oynani ko'rsatamiz
            if (!localStorage.getItem('pwa_install_dismissed')) {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleClose = () => {
        setIsVisible(false);
        // Eslatmani 1 kunga yopib qo'yamiz
        // localStorage.setItem('pwa_install_dismissed', 'true'); 
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[300] p-4 animate-slide-in-up">
            <div className="bg-[#121212] border border-white/10 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-4 relative z-10">
                    {/* App Icon */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0 bg-black">
                        <img src="/logo.png" alt="Anilo App" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black text-lg leading-tight">Anilo.uz</h3>
                        <p className="text-zinc-400 text-xs font-medium mb-1">Anime Olami Ilovasi</p>
                        <div className="flex items-center gap-1">
                            <div className="flex text-yellow-500">
                                <Star size={10} fill="currentColor" />
                                <Star size={10} fill="currentColor" />
                                <Star size={10} fill="currentColor" />
                                <Star size={10} fill="currentColor" />
                                <Star size={10} fill="currentColor" />
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold ml-1">4.9</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleClose} 
                        className="absolute top-0 right-0 p-2 text-zinc-600 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-5 flex gap-3 relative z-10">
                    <button 
                        onClick={handleInstallClick}
                        className="flex-1 bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/10"
                    >
                        <Download size={16} />
                        O'rnatish
                    </button>
                </div>
            </div>
        </div>
    );
};
