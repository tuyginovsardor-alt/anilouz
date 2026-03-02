
import React, { useEffect, useState } from 'react';
import { 
    CheckCircle2, XCircle, Smartphone, Globe, Zap, 
    ShieldCheck, RefreshCw, Bell, Download, Share2,
    Layout, Layers, Activity, Info
} from 'lucide-react';
import { motion } from 'motion/react';

export const PWAReportPage: React.FC = () => {
    const [swStatus, setSwStatus] = useState<'loading' | 'active' | 'inactive'>('loading');
    const [manifest, setManifest] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg && reg.active) {
                    setSwStatus('active');
                } else {
                    setSwStatus('inactive');
                }
            });
        } else {
            setSwStatus('inactive');
        }

        // Check Manifest
        fetch('/manifest.json')
            .then(res => res.json())
            .then(data => setManifest(data))
            .catch(() => setManifest(null));

        // Check Standalone mode
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }, []);

    const features = [
        { 
            name: 'Service Worker', 
            status: swStatus === 'active', 
            desc: 'Oflayn ishlash va keshni boshqarish',
            icon: Zap
        },
        { 
            name: 'Web Manifest', 
            status: !!manifest, 
            desc: 'Ilova ma\'lumotlari va ikonkalari',
            icon: Layout
        },
        { 
            name: 'Standalone Mode', 
            status: isStandalone, 
            desc: 'Ilova kabi alohida oynada ochilish',
            icon: Smartphone
        },
        { 
            name: 'HTTPS / Secure', 
            status: window.location.protocol === 'https:', 
            desc: 'Xavfsiz ulanish va ma\'lumotlar himoyasi',
            icon: ShieldCheck
        },
        { 
            name: 'Push Notifications', 
            status: 'Notification' in window, 
            desc: 'Tezkor xabarnomalar yuborish imkoniyati',
            icon: Bell
        },
        { 
            name: 'Background Sync', 
            status: 'SyncManager' in window, 
            desc: 'Internet ulanganda ma\'lumotlarni sinxronlash',
            icon: RefreshCw
        },
        { 
            name: 'Share Target', 
            status: !!manifest?.share_target, 
            desc: 'Boshqa ilovalardan ma\'lumot qabul qilish',
            icon: Share2
        },
        { 
            name: 'Protocol Handlers', 
            status: !!manifest?.protocol_handlers, 
            desc: 'Maxsus havolalar (web+anilo) bilan ishlash',
            icon: Globe
        },
        { 
            name: 'Launch Handler', 
            status: !!manifest?.launch_handler, 
            desc: 'Ilovani ochilish mantiqini boshqarish',
            icon: Layers
        },
        { 
            name: 'App Shortcuts', 
            status: !!manifest?.shortcuts && manifest.shortcuts.length > 0, 
            desc: 'Ilova belgisini bosib turganda chiqadigan tezkor tugmalar',
            icon: Zap
        }
    ];

    const activeFeatures = features.filter(f => f.status).length;
    const totalScore = Math.round((activeFeatures / features.length) * 100);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 pb-20">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-black mb-2 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent"
                        >
                            Anilo PWA Report Card
                        </motion.h1>
                        <p className="text-gray-400">Ilovaning Progressiv Web App (PWA) imkoniyatlari va holati tahlili.</p>
                    </div>
                    
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#111] border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4"
                    >
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">PWA Score</p>
                            <p className="text-3xl font-black text-orange-500">{totalScore}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 flex items-center justify-center">
                            <span className="text-xs font-bold">{activeFeatures}/{features.length}</span>
                        </div>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {features.map((f, i) => (
                        <motion.div 
                            key={f.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#111] border border-white/5 p-6 rounded-2xl flex items-start gap-4"
                        >
                            <div className={`p-3 rounded-xl ${f.status ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                <f.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-lg">{f.name}</h3>
                                    {f.status ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {manifest && (
                    <section className="bg-[#111] border border-white/5 p-8 rounded-3xl mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <Info className="w-6 h-6 text-orange-500" />
                            <h2 className="text-2xl font-bold">Manifest Ma'lumotlari</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Ilova Nomi</label>
                                <p className="text-lg font-medium">{manifest.name}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Qisqa Nom</label>
                                <p className="text-lg font-medium">{manifest.short_name}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Tavsif</label>
                                <p className="text-gray-400 leading-relaxed">{manifest.description}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Mavzu Rangi</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: manifest.theme_color }}></div>
                                    <p className="font-mono">{manifest.theme_color}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">ID</label>
                                <p className="font-mono text-sm text-orange-400">{manifest.id}</p>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/5">
                            <h3 className="text-lg font-bold mb-4">Ikonkalar</h3>
                            <div className="flex flex-wrap gap-4">
                                {manifest.icons?.map((icon: any, idx: number) => (
                                    <div key={idx} className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                                        <img src={icon.src} alt="icon" className="w-12 h-12" />
                                        <span className="text-[10px] font-mono text-gray-500">{icon.sizes}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section className="bg-orange-500/5 border border-orange-500/10 p-8 rounded-3xl mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        Keyingi Qadamlar
                    </h2>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                            <span><strong>Maskable Icons:</strong> Ilova ikonkasini barcha qurilmalarda chiroyli ko'rinishi uchun "maskable" formatda tayyorlash.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                            <span><strong>Real Screenshots:</strong> Picsum o'rniga ilovaning haqiqiy interfeysidan olingan rasmlarni manifestga qo'shish.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                            <span><strong>Offline Content:</strong> Oflayn rejimda ko'rish uchun keshda saqlanadigan sahifalar sonini ko'paytirish.</span>
                        </li>
                    </ul>
                </section>

                <footer className="text-center text-gray-600 text-sm">
                    <p>© 2026 Anilo.uz - Barcha huquqlar himoyalangan.</p>
                    <p className="mt-1">PWABuilder tahlili asosida optimallashtirildi.</p>
                </footer>
            </div>
        </div>
    );
};
