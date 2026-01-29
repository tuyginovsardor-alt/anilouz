import React, { useState, useEffect, createContext, useContext } from 'react';
import { Share, PlusSquare, X, MoreVertical, Download, Smartphone } from 'lucide-react';

interface PWAContextType {
    isInstallable: boolean;
    isIOS: boolean;
    installApp: () => void;
}

const PWAContext = createContext<PWAContextType>({
    isInstallable: false,
    isIOS: false,
    installApp: () => {},
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // iOS tekshiruvi
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIos);

        // Standalone rejimda ekanligini tekshirish
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

        // Android/Chrome o'rnatish hodisasi
        const handleBeforeInstallPrompt = (e: any) => {
            console.log('[PWA] beforeinstallprompt event fired');
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const installApp = async () => {
        if (isIOS) {
            setShowInstructions(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            // Agar browser prompt bermasa, qo'llanmani chiqaramiz
            setShowInstructions(true);
        }
    };

    return (
        <PWAContext.Provider value={{ isInstallable: true, isIOS, installApp }}>
            {children}
            {showInstructions && (
                <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl">
                        <button onClick={() => setShowInstructions(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                            <X size={24} />
                        </button>
                        
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                                <img src="logo.png" className="w-14 h-14 object-contain" alt="App Icon" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Ilovani o'rnatish</h3>
                            
                            {isIOS ? (
                                <div className="space-y-4 text-left">
                                    <p className="text-sm text-zinc-400 leading-relaxed">iPhone-da ilovani o'rnatish uchun:</p>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                                        <Share className="text-blue-500 shrink-0" size={24} />
                                        <span className="text-xs text-white">1. <span className="font-black">"Ulashish"</span> (Share) tugmasini bosing.</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                                        <PlusSquare className="text-white shrink-0" size={24} />
                                        <span className="text-xs text-white">2. <span className="font-black">"Ekran"ga qo'shish</span> (Add to Home Screen) tanlang.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-left">
                                    <p className="text-sm text-zinc-400 leading-relaxed">Brauzer menyusidan foydalaning:</p>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                                        <MoreVertical className="text-zinc-500 shrink-0" size={24} />
                                        <span className="text-xs text-white">1. Brauzerning <span className="font-black">"Uch nuqta"</span> menyusiga kiring.</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                                        <Download className="text-green-500 shrink-0" size={24} />
                                        <span className="text-xs text-white">2. <span className="font-black">"Ilovani o'rnatish"</span> (Install App) tugmasini bosing.</span>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={() => setShowInstructions(false)}
                                className="w-full mt-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                            >
                                Tushundim
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PWAContext.Provider>
    );
};