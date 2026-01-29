import React, { useState, useEffect, createContext, useContext } from 'react';
import { Share, PlusSquare, X, MoreVertical, Download, Smartphone } from 'lucide-react';

interface PWAContextType {
    isInstallable: boolean;
    installApp: () => void;
}

const PWAContext = createContext<PWAContextType>({
    isInstallable: false,
    installApp: () => {},
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Agar allaqachon o'rnatilgan bo'lsa
        window.addEventListener('appinstalled', () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const installApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstallable(false);
            }
        } else {
            // IOS yoki manual holat uchun ko'rsatma modalini ochish
            setShowModal(true);
        }
    };

    return (
        <PWAContext.Provider value={{ isInstallable, installApp }}>
            {children}
            {showModal && (
                <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                            <X size={24} />
                        </button>
                        
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                                <img src="logo.png" className="w-14 h-14 object-contain" alt="Icon" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Ilovani o'rnatish</h3>
                            
                            <div className="space-y-4 text-left w-full">
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white"><Share size={18}/></div>
                                    <span className="text-xs text-zinc-300">1. Brauzerda <span className="text-white font-bold">"Share"</span> yoki <span className="text-white font-bold">"Menu"</span> tugmasini bosing.</span>
                                </div>
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white"><Download size={18}/></div>
                                    <span className="text-xs text-zinc-300">2. <span className="text-white font-bold">"Add to Home Screen"</span> yoki <span className="text-white font-bold">"Install App"</span> ni tanlang.</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowModal(false)}
                                className="w-full mt-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-900/20"
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