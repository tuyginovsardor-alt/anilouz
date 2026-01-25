
import React, { useState, useEffect } from 'react';
import { CrownIcon } from './icons/CrownIcon';
import { TicketIcon } from './icons/TicketIcon';
import { buySubscription, redeemPromocode, getAppConfig } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../hooks/useNotification';
import { LoadingSpinner } from './LoadingSpinner';
import { Check } from 'lucide-react';

type PlanDuration = '1-oy' | '3-oy' | '6-oy' | '1-yil';

interface PlanDetails {
    price: number;
    originalPrice?: number;
    monthlyPrice?: number;
    label: string;
    color: string;
    texture: string;
    perks: string[];
}

interface SubscriptionPlansProps {
    onPlanSelect?: (plan: string) => void; // Optional prop for handling guest clicks
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
};

// Card Component
const PlanCard: React.FC<{ 
    planKey: PlanDuration, 
    details: PlanDetails, 
    selected: boolean, 
    onClick: () => void,
    discount?: { value: number, type: 'percentage' | 'fixed' } | null
}> = ({ planKey, details, selected, onClick, discount }) => {
    
    let finalPrice = details.price;
    if (discount) {
        if (discount.type === 'percentage') finalPrice = Math.round(details.price * (1 - discount.value / 100));
        else finalPrice = Math.max(0, details.price - discount.value);
    }

    return (
        <div 
            onClick={onClick}
            className={`relative w-full aspect-[1.58/1] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group perspective-1000 shadow-xl ${selected ? 'ring-4 ring-offset-2 ring-offset-black ring-orange-500 z-10 scale-[1.02]' : 'opacity-90 hover:opacity-100 hover:scale-[1.01]'}`}
        >
            {/* Background & Texture */}
            <div className={`absolute inset-0 bg-gradient-to-br ${details.color}`}></div>
            <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: `url("${details.texture}")`, backgroundSize: 'cover' }}></div>
            
            {/* Content */}
            <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-white font-sans">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest italic">{details.label}</h3>
                        <p className="text-[8px] sm:text-[10px] font-bold opacity-70 tracking-[0.2em] uppercase">Premium Pass</p>
                    </div>
                    <CrownIcon className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
                </div>

                <div className="space-y-1 my-2">
                    {details.perks.slice(0,2).map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] sm:text-xs font-bold opacity-90">
                            <Check size={12} strokeWidth={4} /> {p}
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-baseline gap-1 sm:gap-2">
                            <span className="text-2xl sm:text-3xl font-black tracking-tighter shadow-black drop-shadow-md">{formatCurrency(finalPrice)}</span>
                            <span className="text-[10px] sm:text-xs font-bold">UZS</span>
                        </div>
                        {(details.originalPrice || discount) && (
                            <p className="text-[10px] sm:text-xs line-through opacity-50">{formatCurrency(details.price)}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onPlanSelect }) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanDuration>('1-oy');
    const [isLoading, setIsLoading] = useState(false);
    const [isPricesLoading, setIsPricesLoading] = useState(true);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState<{value: number, type: 'percentage' | 'fixed'} | null>(null);
    const { addNotification } = useNotification();
    
    const [plans, setPlans] = useState<Record<PlanDuration, PlanDetails>>({
        '1-oy': { 
            price: 9999, label: 'SILVER', 
            color: 'from-gray-400 via-gray-200 to-gray-500', 
            texture: 'https://www.transparenttextures.com/patterns/brushed-alum.png',
            perks: ['HD Sifat', 'Cheksiz tomosha'] 
        },
        '3-oy': { 
            price: 28500, label: 'GOLD', 
            color: 'from-yellow-400 via-yellow-200 to-yellow-600', 
            texture: 'https://www.transparenttextures.com/patterns/gold-scale.png',
            perks: ['Full HD', 'Reklamasiz']
        },
        '6-oy': { 
            price: 51000, label: 'PLATINUM', 
            color: 'from-slate-400 via-slate-200 to-slate-500', 
            texture: 'https://www.transparenttextures.com/patterns/carbon-fibre.png',
            perks: ['4K Ultra HD', 'Barcha qurilmalarda']
        },
        '1-yil': { 
            price: 90000, label: 'OBSIDIAN', 
            color: 'from-gray-900 via-black to-gray-800 border border-white/20', 
            texture: 'https://www.transparenttextures.com/patterns/dark-matter.png',
            perks: ['VIP Status', 'Eng arzon narx']
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
            } catch (e) {
                console.error("Failed to load prices", e);
            } finally {
                setIsPricesLoading(false);
            }
        };
        fetchPrices();
    }, []);
    
    const activePlan = plans[selectedPlan];
    let finalPrice = activePlan.price;
    if (discount) {
        if (discount.type === 'percentage') {
            finalPrice = Math.round(activePlan.price * (1 - discount.value / 100));
        } else {
            finalPrice = Math.max(0, activePlan.price - discount.value);
        }
    }

    const handleAction = async () => {
        // Agar onPlanSelect prop berilgan bo'lsa (Guest mode), uni chaqiramiz
        if (onPlanSelect) {
            onPlanSelect(selectedPlan);
            return;
        }

        // Aks holda standart to'lov jarayoni
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addNotification({ type: 'warning', title: 'Kirish kerak', message: "Iltimos, avval tizimga kiring." });
                setIsLoading(false);
                return;
            }

            await buySubscription(user.id, selectedPlan, finalPrice);
            addNotification({ type: 'success', title: 'Muvaffaqiyatli!', message: "Premium obuna faollashtirildi." });
            
            setTimeout(() => {
                window.location.reload(); 
            }, 1500);

        } catch (error: any) {
            console.error(error);
            if (error.message.includes("Mablag' yetarli emas")) {
                 addNotification({ type: 'error', title: 'Mablag\' yetarli emas', message: "Hisobingizni to'ldiring." });
            } else {
                addNotification({ type: 'error', title: 'Xatolik', message: error.message || "Xatolik yuz berdi" });
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
        <section className="relative w-full max-w-6xl mx-auto">
            
            {/* Promo Trigger - Only show if not in guest select mode */}
            {!onPlanSelect && (
                <div className="flex justify-end mb-6">
                    <button onClick={() => setShowPromoModal(true)} className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest hover:text-white transition-colors">
                        <TicketIcon className="w-5 h-5"/> Promokod
                    </button>
                </div>
            )}

            {/* Cards Grid - Responsive: 1 column on mobile, 2 on tablet, 4 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-24 sm:mb-10">
                {(Object.keys(plans) as PlanDuration[]).map((key) => (
                    <PlanCard 
                        key={key} 
                        planKey={key} 
                        details={plans[key]} 
                        selected={selectedPlan === key} 
                        onClick={() => setSelectedPlan(key)} 
                        discount={discount}
                    />
                ))}
            </div>

            {/* Sticky Action Button (Mobile) or Standard Button (Desktop) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-between items-center z-[60] md:relative md:bg-transparent md:border-none md:p-0 md:justify-end">
                <div className="md:hidden">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Jami to'lov</p>
                    <p className="text-lg font-black text-white">{formatCurrency(finalPrice)}</p>
                </div>
                <button 
                    onClick={handleAction}
                    disabled={isLoading}
                    className="w-auto px-8 md:px-12 py-3 md:py-4 bg-white text-black rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isLoading ? <LoadingSpinner /> : (
                        <>
                            <span>{onPlanSelect ? 'Tanlash va Kirish' : 'To\'lov Qilish'}</span>
                            <span className="hidden md:inline">| {formatCurrency(finalPrice)}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Promo Modal */}
            {showPromoModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-6 backdrop-blur-md" onClick={() => setShowPromoModal(false)}>
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
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 py-4 bg-zinc-800 rounded-xl text-white hover:bg-zinc-700 font-bold text-xs uppercase">Bekor qilish</button>
                                <button type="submit" disabled={isLoading || !promoCode} className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 uppercase text-xs tracking-widest shadow-lg">
                                    {isLoading ? '...' : 'Tasdiqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};
