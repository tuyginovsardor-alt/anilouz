
import React, { useState, useEffect } from 'react';
import { CrownIcon } from './icons/CrownIcon';
import { TicketIcon } from './icons/TicketIcon';
import { buySubscription, redeemPromocode, getAppConfig } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../hooks/useNotification';
import { LoadingSpinner } from './LoadingSpinner';
import { Check, Zap, PlayCircle, Film, Tv } from 'lucide-react';

// Define plan types
type PlanDuration = '1-oy' | '3-oy' | '6-oy' | '1-yil';

interface PlanDetails {
    price: number;
    originalPrice?: number;
    monthlyPrice?: number;
    label: string;
    features: string[];
    isBest?: boolean;
    color: string;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
};

export const SubscriptionPlans: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<PlanDuration>('1-oy');
    const [isLoading, setIsLoading] = useState(false);
    const [isPricesLoading, setIsPricesLoading] = useState(true);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState<{value: number, type: 'percentage' | 'fixed'} | null>(null);
    const { addNotification } = useNotification();
    
    const [plans, setPlans] = useState<Record<PlanDuration, PlanDetails>>({
        '1-oy': { price: 9999, label: 'START', features: ['1000+ Anime', '720p Sifat', 'Reklamali'], color: 'blue' },
        '3-oy': { price: 28500, label: 'STANDART', features: ['Barcha Animelar', '1080p Sifat', 'Kam reklama', 'Tarix saqlash'], color: 'green' },
        '6-oy': { price: 51000, label: 'MAX', features: ['4K Ultra HD', 'Reklamasiz', 'Tezkor player', 'Eksklyuziv'], isBest: true, color: 'orange' },
        '1-yil': { price: 90000, label: 'ULTRA', features: ['Barcha imkoniyatlar', 'Offline ko\'rish (iOS)', 'VIP Support', 'Yopiq premyeralar'], color: 'purple' },
    });

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const config = await getAppConfig();
                const p1 = Number(config['price_1_oy']) || 9999;
                const p3 = Number(config['price_3_oy']) || 28500;
                const p6 = Number(config['price_6_oy']) || 51000;
                const p12 = Number(config['price_1_yil']) || 90000;

                setPlans({
                    '1-oy': {
                        price: p1,
                        label: 'START (1 oy)',
                        features: ['1000+ Anime', '720p Sifat', 'Reklamali'],
                        color: 'gray'
                    },
                    '3-oy': {
                        price: p3,
                        label: 'STANDART (3 oy)',
                        features: ['Barcha Animelar', '1080p Sifat', 'Kam reklama'],
                        color: 'blue'
                    },
                    '6-oy': {
                        price: p6,
                        label: 'MAX (6 oy)',
                        features: ['4K Ultra HD', 'Reklamasiz', 'Barcha qurilmalarda'],
                        isBest: true,
                        color: 'yellow' // Gold theme
                    },
                    '1-yil': {
                        price: p12,
                        label: 'ULTRA (1 yil)',
                        features: ['1 yil davomida VIP', 'Reklamasiz', 'Eng arzon narx'],
                        color: 'purple'
                    },
                });
            } catch (e) {
                console.error("Failed to load prices", e);
            } finally {
                setIsPricesLoading(false);
            }
        };
        fetchPrices();
    }, []);
    
    // Feature Icons Map
    const FeatureIcon = () => <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center"><Check size={12} className="text-white"/></div>;

    const handleBuy = async (planKey: PlanDuration) => {
        const activePlan = plans[planKey];
        let finalPrice = activePlan.price;
        
        if (discount) {
            if (discount.type === 'percentage') {
                finalPrice = Math.round(activePlan.price * (1 - discount.value / 100));
            } else {
                finalPrice = Math.max(0, activePlan.price - discount.value);
            }
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
            addNotification({ type: 'success', title: 'Muvaffaqiyatli!', message: "Premium obuna faollashtirildi." });
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

    if (isPricesLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;

    return (
        <section className="relative px-2">
            <div className="max-w-xl mx-auto space-y-4">
                
                {/* Promo Button */}
                <button 
                    onClick={() => setShowPromoModal(true)} 
                    className="w-full bg-[#f4b308] text-black font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 mb-6 hover:bg-[#eab308] transition-colors"
                >
                    <TicketIcon className="w-5 h-5"/> Promokod
                </button>

                {(Object.keys(plans) as PlanDuration[]).map((planKey) => {
                    const plan = plans[planKey];
                    let finalPrice = plan.price;
                    if (discount) {
                        if (discount.type === 'percentage') finalPrice = Math.round(plan.price * (1 - discount.value / 100));
                        else finalPrice = Math.max(0, plan.price - discount.value);
                    }

                    // Card Styles based on plan type
                    const isMax = plan.isBest;
                    const cardBg = isMax 
                        ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-t-2 border-[#f4b308]' 
                        : 'bg-zinc-900 border border-white/5';
                    const iconColor = isMax ? 'text-[#f4b308]' : 'text-zinc-500';

                    return (
                        <div key={planKey} className={`relative rounded-3xl p-5 shadow-2xl ${cardBg} transition-transform active:scale-[0.98]`}>
                            {isMax && (
                                <div className="absolute -top-3 left-6 bg-[#f4b308] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(244,179,8,0.4)]">
                                    Eng Ommabop
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                                {/* Left Side: Icon & Info */}
                                <div className="flex gap-4 items-center">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-black/40 ${isMax ? 'border border-[#f4b308]/30' : ''}`}>
                                        {planKey === '1-oy' ? <Tv className={iconColor} size={24}/> : 
                                         planKey === '1-yil' ? <CrownIcon className={iconColor} width={24} height={24}/> :
                                         <Zap className={iconColor} size={24}/>
                                        }
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                            {plan.isBest && <span className="text-[#f4b308]">⚡</span>} 
                                            {plan.label.split(' ')[0]}
                                        </h3>
                                        
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                            {plan.features.slice(0, 2).map((feat, i) => (
                                                <span key={i} className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                                                    <span className="w-1 h-1 bg-zinc-600 rounded-full"></span> {feat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Price & Button */}
                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-right">
                                        {discount && <span className="text-[10px] line-through text-zinc-500 block">{formatCurrency(plan.price)}</span>}
                                        <span className={`text-xl font-black ${isMax ? 'text-[#f4b308]' : 'text-white'}`}>
                                            {formatCurrency(finalPrice)} <span className="text-[10px] text-zinc-500 font-normal">UZS</span>
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleBuy(planKey)}
                                        disabled={isLoading}
                                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isMax 
                                            ? 'bg-white text-black hover:bg-gray-200' 
                                            : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                        }`}
                                    >
                                        {isLoading ? '...' : 'Faollashtirish'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Promo Modal */}
            {showPromoModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowPromoModal(false)}>
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black text-white mb-1">Promokod</h3>
                        <p className="text-xs text-zinc-500 mb-4">Chegirma kodi mavjudmi?</p>
                        <form onSubmit={handleRedeemPromo}>
                            <input 
                                type="text" 
                                value={promoCode} 
                                onChange={e => setPromoCode(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mb-4 focus:border-[#f4b308] focus:outline-none font-mono uppercase text-center font-bold tracking-widest"
                                placeholder="CODE2025"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl text-white font-bold text-xs hover:bg-zinc-700 uppercase">Yopish</button>
                                <button type="submit" disabled={isLoading || !promoCode} className="flex-1 py-3 bg-[#f4b308] text-black font-black rounded-xl hover:bg-[#eab308] uppercase text-xs">
                                    {isLoading ? '...' : 'Tekshirish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};
