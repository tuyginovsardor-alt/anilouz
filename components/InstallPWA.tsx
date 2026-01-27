
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Download, X, Star, Share, PlusSquare } from 'lucide-react';

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
    const [isStandalone, setIsStandalone] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        setIsStandalone(isStandaloneMode);

        // Check platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Handle Android/Desktop install prompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!isStandaloneMode) {
                // Avtomatik banner ko'rsatish (agar xohlasangiz)
                // setShowBanner(true); 
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const installApp = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowBanner(false);
            }
        } else {
            // Fallback just in case
            alert("Ilovani brauzer menyusi orqali o'rnatishingiz mumkin.");
        }
    };

    // IOS Instructions Modal
    const IOSModal = () => (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={() => setShowIOSInstructions(false)}>
            <div className="bg-[#1a1a1a] w-full max-w-sm rounded-[2rem] p-6 border border-white/10 relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-zinc-400">
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 mb-4 shadow-2xl">
                        <img src="/logo.png" alt="App Icon" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">iPhone-ga o'rnatish</h3>
                    <p className="text-sm text-zinc-400 mb-6">Ushbu ilovani yuklab olish uchun quyidagi amallarni bajaring:</p>
                    
                    <div className="w-full space-y-4 text-left">
                        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
                            <div className="text-blue-500"><Share size={24} /></div>
                            <div className="text-sm text-white">
                                1. Pastdagi <span className="font-bold text-blue-400">"Ulashish"</span> tugmasini bosing.
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
                            <div className="text-white"><PlusSquare size={24} /></div>
                            <div className="text-sm text-white">
                                2. <span className="font-bold">"Ekran"ga qo'shish</span> (Add to Home Screen) ni tanlang.
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <button onClick={() => setShowIOSInstructions(false)} className="text-orange-500 font-bold text-sm">Tushundim</button>
                </div>
            </div>
        </div>
    );

    // Floating Banner (Optional - shows at bottom if prompted)
    const FloatingBanner = () => {
        if (!deferredPrompt && !showBanner) return null;
        if (isStandalone) return null;

        return (
            <div className="fixed inset-x-0 bottom-20 z-[90] px-4 md:hidden pointer-events-none">
                <div className="bg-[#121212] border border-orange-500/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between pointer-events-auto animate-slide-in-up">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-lg border border-white/10 p-0.5">
                            <img src="/logo.png" className="w-full h-full object-cover rounded-md"/>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Anilo.uz</p>
                            <p className="text-zinc-500 text-[10px]">Rasmiy Ilova</p>
                        </div>
                    </div>
                    <button 
                        onClick={installApp}
                        className="bg-white text-black px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider"
                    >
                        O'rnatish
                    </button>
                    <button onClick={() => setDeferredPrompt(null)} className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-zinc-700 text-zinc-400">
                        <X size={12}/>
                    </button>
                </div>
            </div>
        )
    };

    return (
        <PWAContext.Provider value={{ isInstallable: !!deferredPrompt || isIOS, isIOS, installApp }}>
            {children}
            {showIOSInstructions && <IOSModal />}
            <FloatingBanner /> 
        </PWAContext.Provider>
    );
};

// Default export for backward compatibility if needed, but prefer named export
export const InstallPWA = () => {
    const { isInstallable, installApp } = usePWA();
    if (!isInstallable) return null;
    return null; // Logic moved to provider/hooks
};
