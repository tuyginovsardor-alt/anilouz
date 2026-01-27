
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

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
            }
        } else {
            alert("Ilovani brauzer menyusi (Uch nuqta -> Ilovani o'rnatish) orqali o'rnatishingiz mumkin.");
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
                    <p className="text-sm text-zinc-400 mb-6">Quyidagi amallarni bajaring:</p>
                    
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

    // Floating Banner OLIB TASHLANDI - Dizayn buzilmasligi uchun

    return (
        <PWAContext.Provider value={{ isInstallable: (!!deferredPrompt || isIOS) && !isStandalone, isIOS, installApp }}>
            {children}
            {showIOSInstructions && <IOSModal />}
        </PWAContext.Provider>
    );
};

// Default export placeholder if needed
export const InstallPWA = () => null;
