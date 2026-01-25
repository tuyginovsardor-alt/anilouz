
import React, { useState, useEffect } from 'react';
import { CrownIcon } from './icons/CrownIcon';
import { TicketIcon } from './icons/TicketIcon';
import { buySubscription, redeemPromocode, getAppConfig } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../hooks/useNotification';
import { LoadingSpinner } from './LoadingSpinner';
import { Check, Star, Zap, Shield } from 'lucide-react';

type PlanDuration = '1-oy' | '3-oy' | '6-oy' | '1-yil';

interface PlanDetails {
    price: number;
    originalPrice?: number;
    label: string;
    description: string;
    accentColor: string;
    icon: React.ReactNode;
    features: string[];
    isPopular?: boolean;
}

interface SubscriptionPlansProps {
    onPlanSelect?: (plan: string) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onPlanSelect }) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanDuration>('3-oy'); // Default popular
    const [isLoading, setIsLoading] = useState(false);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState<{value: number, type: 'percentage' | 'fixed'} | null>(null);
    const { addNotification } = useNotification();
    
    const [plans, setPlans] = useState<Record<PlanDuration, PlanDetails>>({
        '1-oy': { 
            price: 9999, label: 'SILVER', description: 'Boshlash uchun',
            accentColor: 'border-zinc-500 text-zinc-400 shadow-zinc-500/20',
            icon: <Shield className="w-6 h-6 text-zinc-400" />,
            features: ['HD Sifat (720p)', '1 ta qurilma', 'Reklamasiz']
        },
        '3-oy': { 
            price: 28500, label: 'GOLD', description: 'Eng ommabop', isPopular: true,
            accentColor: 'border-yellow-500 text-yellow-400 shadow-yellow-500/40',
            icon: <CrownIcon className="w-6 h-6 text-yellow-400" />,
            features: ['Full HD (1080p)', '2 ta qurilma', 'Reklamasiz', 'Tezkor yuklash']
        },
        '6-oy': { 
            price: 51000, label: 'PLATINUM', description: 'Kino ixlosmandlari',
            accentColor: 'border-cyan-500 text-cyan-400 shadow-cyan-500/30',
            icon: <Star className="w-6 h-6 text-cyan-400" />,
            features: ['4K Ultra HD', '3 ta qurilma', 'Oflayn rejim (Beta)', 'VIP Support']
        },
        '1-yil': { 
            price: 90000, label: 'OBSIDIAN', description: 'Maksimal tejash',
            accentColor: 'border-purple-600 text-purple-500 shadow-purple-600/40',
            icon: <Zap className="w-6 h-6 text-purple-500" />,
            features: ['Barcha imkoniyatlar', '5 ta qurilma', 'Eksklyuziv premyeralar', 'Beta funksiyalar']
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
                    '3-oy': { ...prev['3-oy'], price: p3, originalPrice: p3 * 1.2 },
                    '6-oy': { ...prev['6-oy'], price: p6, originalPrice: p6 * 1.25 },
                    '1-yil': { ...prev['1-yil'], price: p12, originalPrice: p12 * 1.3 },
                }));
            } catch (e) { console.error("Failed to load prices", e); }
        };
        fetchPrices();
    }, []);
    
    const activePlan = plans[selectedPlan];
    let finalPrice = activePlan.price;
    if (discount) {
        finalPrice = discount.type === 'percentage' 
            ? Math.round(activePlan.price * (1 - discount.value / 100)) 
            : Math.max(0, activePlan.price - discount.value);
    }

    const handleAction = async () => {
        if (onPlanSelect) {
            onPlanSelect(selectedPlan);
            return;
        }

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
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            if (error.message.includes("Mablag' yetarli emas")) {
                 addNotification({ type: 'error', title: 'Mablag\' yetarli emas', message: "Hisobingizni to'ldiring." });
            } else {
                addNotification({ type: 'error', title: 'Xatolik', message: error.message });
            }
            setIsLoading(false);
        }
    };

    const handleRedeemPromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode) return;
        setIsLoading(true);
        try {
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
        } finally { setIsLoading(false); }
    };

    return (
        <section className="relative w-full max-w-7xl mx-auto px-2">
            
            {/* Promo Trigger */}
            {!onPlanSelect && (
                <div className="flex justify-end mb-6">
                    <button onClick={() => setShowPromoModal(true)} className="flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest hover:text-white transition-colors bg-orange-900/20 px-4 py-2 rounded-full border border-orange-500/30">
                        <TicketIcon className="w-4 h-4"/> Promokod
                    </button>
                </div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24 lg:mb-10">
                {(Object.keys(plans) as PlanDuration[]).map((key) => {
                    const plan = plans[key];
                    const isSelected = selectedPlan === key;
                    const isPop = plan.isPopular;

                    return (
                        <div 
                            key={key} 
                            onClick={() => setSelectedPlan(key)}
                            className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden group
                                ${isSelected 
                                    ? `bg-[#121212] border-2 ring-2 ring-offset-2 ring-offset-black ring-opacity-60 scale-[1.02] z-10 ${plan.accentColor.split(' ')[0]}` // Extract border class
                                    : 'bg-[#0a0a0a] border border-white/10 hover:border-white/20 hover:bg-[#121212]'
                                }
                            `}
                            style={{ minHeight: '320px' }}
                        >
                            {/* Popular Badge */}
                            {isPop && (
                                <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-600 to-yellow-400 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg">
                                    Ommabop
                                </div>
                            )}

                            {/* Header */}
                            <div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/5 ${isSelected ? 'scale-110' : ''}`}>
                                    {plan.icon}
                                </div>
                                <h3 className={`text-2xl font-black uppercase tracking-tight mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{plan.label}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-6">{plan.description}</p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-white text-black' : 'bg-white/10 text-gray-500'}`}>
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                        <span className={isSelected ? 'text-gray-200' : ''}>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Price */}
                            <div className="mt-auto">
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-black tracking-tighter ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                        {formatCurrency(discount && isSelected ? finalPrice : plan.price)}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">UZS</span>
                                </div>
                                {(plan.originalPrice || (discount && isSelected)) && (
                                    <p className="text-[10px] text-gray-600 line-through font-medium">
                                        {formatCurrency(plan.price)}
                                    </p>
                                )}
                            </div>

                            {/* Selection Indicator (Mobile mostly) */}
                            <div className={`absolute bottom-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-white bg-white text-black' : 'border-gray-700 bg-transparent'}`}>
                                {isSelected && <Check size={14} strokeWidth={4} />}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sticky Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-xl border-t border-white/10 flex flex-col sm:flex-row justify-between items-center z-[60] md:relative md:bg-transparent md:border-none md:p-0 md:justify-end md:mt-8">
                <div className="w-full sm:w-auto flex justify-between items-center sm:block mb-3 sm:mb-0 md:mr-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left sm:text-right">Jami to'lov</p>
                    <p className="text-2xl font-black text-white text-right">{formatCurrency(finalPrice)}</p>
                </div>
                <button 
                    onClick={handleAction}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isLoading ? <LoadingSpinner /> : (onPlanSelect ? 'TANLASH VA KIRISH' : 'TO\'LOV QILISH')}
                </button>
            </div>

            {/* Promo Modal */}
            {showPromoModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-6 backdrop-blur-md" onClick={() => setShowPromoModal(false)}>
                    <div className="bg-[#121212] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-black text-white mb-2">Promokod</h3>
                        <p className="text-zinc-500 text-xs mb-6 font-bold uppercase tracking-wide">Maxsus kodingizni kiriting</p>
                        
                        <form onSubmit={handleRedeemPromo}>
                            <input 
                                type="text" 
                                value={promoCode} 
                                onChange={e => setPromoCode(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white mb-4 focus:border-orange-500 focus:outline-none font-mono uppercase text-center font-bold tracking-widest text-lg"
                                placeholder="ANILO2025"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 py-4 bg-zinc-800 rounded-xl text-white hover:bg-zinc-700 font-bold text-xs uppercase">Bekor</button>
                                <button type="submit" disabled={isLoading || !promoCode} className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 uppercase text-xs tracking-widest shadow-lg">
                                    OK
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};
