import React, { useState } from 'react';
import { Crown, X, Check, ShieldCheck, Zap, Sparkles, Tv, Download } from 'lucide-react';
import { UserProfile } from '../types';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpgradeSuccess: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeSuccess,
}) => {
  if (!isOpen) return null;

  const [selectedPlan, setSelectedPlan] = useState<'1m' | '3m' | '1y'>('3m');
  const [selectedPayment, setSelectedPayment] = useState<'payme' | 'click' | 'uzum'>('payme');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const plans = [
    {
      id: '1m',
      title: '1 Oy',
      price: '25,000 UZS',
      subtext: 'Har oy to\'lanadi',
      save: null
    },
    {
      id: '3m',
      title: '3 Oy',
      price: '65,000 UZS',
      subtext: '21,600 UZS / oyiga',
      save: '15% TEJASH',
      badge: 'Ommabop'
    },
    {
      id: '1y',
      title: '1 Yil',
      price: '220,000 UZS',
      subtext: '18,300 UZS / oyiga',
      save: '30% TEJASH',
      badge: 'Eng zambay'
    }
  ];

  const benefits = [
    'Barcha animelarni reklamasiz tomosha qilish',
    'Yangi qismlarni birinchi bo\'lib 4K Ultra HD sifatda ko\'rish',
    'Anilo Studio tomonidan eksklyuziv O\'zbekcha dublyajlar',
    'Cheksiz oflayn yuklab olish imkoniyati',
    'Barcha qurilmalardan bir vaqtda foydalanish'
  ];

  const handleSubscribe = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      onUpgradeSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1C1612] via-[#141210] to-[#0E0E12] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-amber-500/10 blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 animate-bounce">
              <Sparkles className="w-8 h-8 fill-amber-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Tashakkur! Premium Obuna Faollashtirildi 🎉
            </h2>
            <p className="text-sm text-gray-300">
              Endi siz barcha animelarni reklamasiz va yuqori 4K sifatda tomosha qilishingiz mumkin!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                ANILO PREMIUM VIP
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Cheksiz Anime Olamiga Qadam Qo'ying
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Reklamalardan holi, 4K video va O'zbekcha ommabop dublyajlar
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-3 gap-3">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as any)}
                    className={`relative p-3 sm:p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between text-center ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {p.save && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-orange-600 text-white font-extrabold text-[9px] uppercase tracking-wider whitespace-nowrap shadow">
                        {p.save}
                      </span>
                    )}

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{p.title}</h4>
                      <p className="text-xs sm:text-base font-extrabold text-amber-400 mb-1">{p.price}</p>
                    </div>

                    <p className="text-[10px] text-gray-400 mt-2">{p.subtext}</p>
                  </div>
                );
              })}
            </div>

            {/* Benefits list */}
            <div className="space-y-2 py-2">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400">To'lov usuli:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'payme', label: 'Payme' },
                  { id: 'click', label: 'Click' },
                  { id: 'uzum', label: 'Uzum Pay' },
                ].map((pay) => (
                  <button
                    key={pay.id}
                    onClick={() => setSelectedPayment(pay.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      selectedPayment === pay.id
                        ? 'bg-amber-500 text-black border-amber-400 font-extrabold'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {pay.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-orange-500/30 transition transform active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? 'To\'lov amalga oshirilmoqda...' : 'PREMIUM OBUNA BO\'LISH'}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
