
import React, { useState, useEffect } from 'react';
import { CrownIcon } from './icons/CrownIcon';
import { TicketIcon } from './icons/TicketIcon';
import { buySubscription, redeemPromocode, getAppConfig } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../hooks/useNotification';
import { LoadingSpinner } from './LoadingSpinner';
import { Check, Zap, Star, Shield, Clock } from 'lucide-react';

type PlanDuration = '1-oy' | '3-oy' | '6-oy' | '1-yil';

interface PlanDetails {
    price: number;
    monthlyPrice?: number;
    label: string;
    features: string[];
    isBest?: boolean;
    gradient: string;
    icon: React.ReactNode;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
};

export const SubscriptionPlans: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState<{value: number, type: 'percentage' | 'fixed'} | null>(null);
    const { addNotification } = useNotification();
    
    const [plans, setPlans] = useState<Record<PlanDuration, PlanDetails>>({
        '1-oy': { 
            price: 9999, 
            label: 'START', 
            features: ['HD Sifat (720p)', 'Cheksiz tomosha', 'Reklamali'], 
            gradient: 'from-blue-600 to-blue-800',
            icon: <Zap size={24} className="text-blue-200"/>
        },
        '3-oy': { 
            price: 28500, 
            label: 'STANDART', 
            features: ['FULL HD (1080p)', 'Kam reklama', 'Tarixni saqlash', 'Tezkor player'],
            gradient: 'from-purple-600 to-purple-800',
            icon: <Star size={24} className="text-purple-200"/>
        },
        '6-oy': { 
            price: 51000, 
            label: 'MAX', 
            features: ['4K ULTRA HD', 'Reklamasiz', 'Barcha qurilmalarda', 'Premyeralar'],
            isBest: true,
            gradient: 'from-orange-500 to-red-600',
            icon: <CrownIcon className="w-6 h-6 text-yellow-200"/>
        },
        '1-yil': { 
            price: 90000, 
            label: 'VIP', 
            features: ['1 Yil davomida VIP', 'Eksklyuziv status', 'VIP Support', 'Eng arzon narx'],
            gradient: 'from-zinc-800 to-black border border-orange-500/50',
            icon: <Shield size={24} className="text-zinc-400"/>
        },
    });

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const config = await getAppConfig();
                const p1 = Number(config['price_1_oy']) || 9999;
                const p3 = Number(config['price_3_oy']) || 28500;
                const p6 = Number(config['price_6_oy']) || 51000;
                const p12 = Number(config['price_1_yil']) || 90000;

                setPlans(prev => ({
                    '1-oy': { ...prev['1-oy'], price: p1 },
                    '3-oy': { ...prev['3-oy'], price: p3 },
                    '6-oy': { ...prev['6-oy'], price: p6 },
                    '1-yil': { ...prev['1-yil'], price: p12 },
                }));
            } catch (e) { console.error(e); }
        };
        fetchPrices();
    }, []);

    const handleBuy = async (planKey: PlanDuration) => {
        const activePlan = plans[planKey];
        let finalPrice = activePlan.price;
        if (discount) {
            if (discount.type === 'percentage') finalPrice = Math.round(activePlan.price * (1 - discount.value / 100));
            else finalPrice = Math.max(0, activePlan.price - discount.value);
        }

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'warning', title: 'Kirish kerak', message: "Iltimos, avval tizimga kiring." });
                setIsLoading(false);
                return;
            }
            await buySubscription(user.id, planKey, finalPrice);
            addNotification({ type: 'success', title: 'Tabriklaymiz!', message: "Premium obuna faollashtirildi." });
            setTimeout(() => { window.location.reload(); }, 1500);
        } catch (error: any) {
            if (error.message.includes("Mablag' yetarli emas")) {
                 addNotification({ type: 'error', title: 'Mablag\' yetarli emas', message: "Hisobingizni to'ldiring." });
            } else {
                addNotification({ type: 'error', title: 'Xatolik', message: "Xatolik yuz berdi" });
            }
            setIsLoading(false);
        }
    };

    const handleRedeemPromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode) return;
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'warning', title: 'Kirish kerak', message: "Tizimga kiring" });
                return;
            }
            const result = await redeemPromocode(user.id, promoCode.toUpperCase());
            setDiscount({ value: result.discount || 0, type: result.type });
            setShowPromoModal(false);
            addNotification({ type: 'success', title: 'Qabul qilindi', message: 'Chegirma qo\'llanilidi!' });
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="relative w-full max-w-5xl mx-auto">
            {/* Promo Banner */}
            <div 
                onClick={() => setShowPromoModal(true)}
                className="mb-10 bg-zinc-900 border border-white/10 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-orange-500/50 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <TicketIcon className="w-5 h-5"/>
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">Promokod bormi?</p>
                        <p className="text-zinc-500 text-xs">Chegirma olish uchun bosing</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                    KIRITISH
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(Object.keys(plans) as PlanDuration[]).map((key) => {
                    const plan = plans[key];
                    const isBest = plan.isBest;
                    
                    return (
                        <div 
                            key={key} 
                            className={`relative flex flex-col justify-between p-6 rounded-[2rem] transition-transform hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${isBest ? 'bg-zinc-900 ring-2 ring-orange-600 shadow-orange-900/20' : 'bg-zinc-900 border border-white/5'}`}
                        >
                            {isBest && (
                                <div className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                                    Eng Ommabop
                                </div>
                            )}

                            <div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${plan.gradient} shadow-lg`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">{plan.label}</h3>
                                
                                <div className="mt-4 mb-6">
                                    <span className="text-2xl font-black text-white">{formatCurrency(plan.price)}</span>
                                    <span className="text-xs text-zinc-500 font-bold block mt-1">/ {key.replace('-', ' ')}</span>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-xs font-medium text-zinc-400">
                                            <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-white">
                                                <Check size={10} />
                                            </div>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                onClick={() => handleBuy(key)}
                                disabled={isLoading}
                                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                                    isBest 
                                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20' 
                                    : 'bg-white text-black hover:bg-gray-200'
                                }`}
                            >
                                {isLoading ? '...' : 'Tanlash'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Promo Modal */}
            {showPromoModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 backdrop-blur-md" onClick={() => setShowPromoModal(false)}>
                    <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <h3 className="text-2xl font-black text-white mb-2 relative z-10">Promokod</h3>
                        <p className="text-zinc-500 text-xs mb-6 relative z-10">Maxsus chegirma kodingizni kiriting</p>
                        
                        <form onSubmit={handleRedeemPromo} className="relative z-10">
                            <input 
                                type="text" 
                                value={promoCode} 
                                onChange={e => setPromoCode(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white mb-4 focus:border-orange-500 focus:outline-none font-mono uppercase text-center font-bold tracking-widest text-lg"
                                placeholder="CODE2025"
                                autoFocus
                            />
                            <button type="submit" disabled={isLoading || !promoCode} className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 uppercase text-xs tracking-widest">
                                {isLoading ? '...' : 'Tasdiqlash'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};
