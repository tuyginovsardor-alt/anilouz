import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  ArrowUpRight, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  FileText, 
  Film, 
  Users, 
  Eye, 
  TrendingUp, 
  HelpCircle,
  X,
  Send,
  Edit2,
  Check
} from 'lucide-react';
import { UserProfile, FandubProfile, FandubPayout, Anime } from '../types';
import { supabase } from '../lib/supabase';

interface FandubDashboardViewProps {
  user: UserProfile;
  allAnime: Anime[];
  onBack: () => void;
}

export const FandubDashboardView: React.FC<FandubDashboardViewProps> = ({ user, allAnime, onBack }) => {
  // Studio Profile state
  const [studioProfile, setStudioProfile] = useState<FandubProfile>({
    id: user.fandubInfo?.id || 'fd-1',
    userId: user.id || 'u-1',
    studioName: user.fandubInfo?.studioName || 'Anilo Dubbing Studio',
    handle: user.fandubInfo?.handle || '@AniloDubbing',
    logoUrl: user.fandubInfo?.logoUrl || user.avatar || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop',
    bio: user.fandubInfo?.bio || 'Rasmiy Anilo.uz dublyaj jamoasi. Eng so\'nggi va sifatli 4K animelar o\'zbek tilida!',
    cardNumber: user.fandubInfo?.cardNumber || '8600 1234 5678 9012',
    balance: user.fandubInfo?.balance ?? 1250000,
    totalEarned: user.fandubInfo?.totalEarned ?? 4800000,
    isVerified: true,
    commissionAgreed: user.fandubInfo?.commissionAgreed ?? true,
    subscribersCount: 14200,
    totalViews: 342000
  });

  const [payouts, setPayouts] = useState<FandubPayout[]>([
    {
      id: 'po-1',
      fandubId: 'fd-1',
      amount: 500000,
      netAmount: 460000,
      platformFee: 25000,
      autoPayFee: 15000,
      cardNumber: '8600 **** **** 9012',
      status: 'completed',
      requestedAt: '2026-08-10 14:30',
      processedAt: '2026-08-10 15:00'
    },
    {
      id: 'po-2',
      fandubId: 'fd-1',
      amount: 1000000,
      netAmount: 920000,
      platformFee: 50000,
      autoPayFee: 30000,
      cardNumber: '8600 **** **** 9012',
      status: 'completed',
      requestedAt: '2026-08-01 11:20',
      processedAt: '2026-08-01 12:10'
    }
  ]);

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState<string>('200000');
  const [cardNumber, setCardNumber] = useState<string>(studioProfile.cardNumber || '8600 1234 5678 9012');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(studioProfile.commissionAgreed);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Studio Edit Form
  const [editName, setEditName] = useState(studioProfile.studioName);
  const [editHandle, setEditHandle] = useState(studioProfile.handle);
  const [editBio, setEditBio] = useState(studioProfile.bio);
  const [editLogo, setEditLogo] = useState(studioProfile.logoUrl);

  const numAmount = parseFloat(withdrawAmount) || 0;
  const autoPayFee = numAmount * 0.03; // 3%
  const platformFee = numAmount * 0.05; // 5%
  const netAmount = numAmount - autoPayFee - platformFee; // 92%

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (numAmount < 50000) {
      setStatusMsg({ type: 'error', text: "Minimal yechib olish summasi 50,000 UZS!" });
      return;
    }

    if (numAmount > studioProfile.balance) {
      setStatusMsg({ type: 'error', text: "Mavjud balansda bu miqdordagidan kamroq mablag' bor!" });
      return;
    }

    if (!agreeTerms) {
      setStatusMsg({ type: 'error', text: "Iltimos, komissiya shartnomasiga rozilik bildiring!" });
      return;
    }

    const newPayout: FandubPayout = {
      id: 'po-' + Date.now(),
      fandubId: studioProfile.id,
      amount: numAmount,
      netAmount: netAmount,
      platformFee: platformFee,
      autoPayFee: autoPayFee,
      cardNumber: cardNumber,
      status: 'pending',
      requestedAt: new Date().toLocaleString('uz-UZ')
    };

    setPayouts([newPayout, ...payouts]);
    setStudioProfile(prev => ({
      ...prev,
      balance: prev.balance - numAmount
    }));

    setStatusMsg({ type: 'success', text: "So'rov yuborildi! Admin 1-2 soat ichida kartangizga pul o'tkazadi." });
    setTimeout(() => {
      setShowPayoutModal(false);
      setStatusMsg(null);
    }, 2000);
  };

  const handleSaveStudioProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setStudioProfile(prev => ({
      ...prev,
      studioName: editName,
      handle: editHandle,
      bio: editBio,
      logoUrl: editLogo,
      cardNumber: cardNumber
    }));
    setShowEditModal(false);
  };

  const handleAcceptContract = () => {
    setStudioProfile(prev => ({ ...prev, commissionAgreed: true }));
    setAgreeTerms(true);
    setShowContractModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1219] text-[#dbe3f0] p-4 sm:p-6 md:p-8 animate-fadeIn font-['Plus_Jakarta_Sans']">
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 rounded-xl bg-[#182029] hover:bg-[#232b34] text-gray-300 hover:text-white transition"
            >
              ← Bosh sahifaga
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Film className="w-6 h-6 text-[#ff6b00]" />
              Fandub Studio Dashbordi
            </h1>
          </div>

          <button 
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#182029] hover:bg-[#232b34] border border-white/10 text-xs font-bold text-white transition"
          >
            <Edit2 className="w-4 h-4 text-[#ff6b00]" />
            <span>Studio Profilini Tahrirlash</span>
          </button>
        </div>

        {/* Studio Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#182029] via-[#141c25] to-[#10171e] p-6 border border-white/10 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#ff6b00]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
            <img 
              src={studioProfile.logoUrl} 
              alt={studioProfile.studioName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#ff6b00]/50 shadow-xl"
            />

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black text-white">{studioProfile.studioName}</h2>
                {studioProfile.isVerified && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/40">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Studio
                  </span>
                )}
              </div>

              <p className="text-xs font-mono text-[#ff6b00]">{studioProfile.handle}</p>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">{studioProfile.bio}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs">
                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white">{studioProfile.subscribersCount?.toLocaleString()}</span>
                  <span className="text-gray-400">obunachilar</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">{studioProfile.totalViews?.toLocaleString()}</span>
                  <span className="text-gray-400">ko'rishlar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Status Banner */}
        {!studioProfile.commissionAgreed ? (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Shartnoma tasdiqlanmagan</h4>
                <p className="text-xs text-amber-200/80">Pulni yechib olish va daromad olish uchun 8% komissiya shartnomasiga rozilik bering.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowContractModal(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 transition"
            >
              Shartnomani Ko'rish
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span><strong>8% Komissiya Shartnomasi faol:</strong> (3% avtoto'lov + 5% platforma infratuzilmasi, 92% sof foyda sizda).</span>
            </div>
            <button 
              onClick={() => setShowContractModal(true)}
              className="text-emerald-400 hover:underline font-bold shrink-0"
            >
              Batafsil
            </button>
          </div>
        )}

        {/* Financial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main Available Balance */}
          <div className="p-6 rounded-3xl bg-[#182029] border border-white/10 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#ff6b00]/10 rounded-full blur-2xl group-hover:bg-[#ff6b00]/20 transition-all" />
            
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#ff6b00]" />
                Mavjud Yechib Olish Balansi
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight">
                {studioProfile.balance.toLocaleString()} <span className="text-lg font-normal text-[#ff6b00]">UZS</span>
              </h3>
            </div>

            <button 
              onClick={() => {
                if (!studioProfile.commissionAgreed) {
                  setShowContractModal(true);
                } else {
                  setShowPayoutModal(true);
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-[#ff6b00] hover:bg-[#ff8533] text-black font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-[#ff6b00]/20"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>Pulni Kartaga Yechib Olish</span>
            </button>
          </div>

          {/* Total Earned */}
          <div className="p-6 rounded-3xl bg-[#182029] border border-white/10 space-y-2 shadow-xl flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Jami Ishlab Topilgan
            </span>
            <h3 className="text-3xl font-black text-white">
              {studioProfile.totalEarned.toLocaleString()} <span className="text-lg font-normal text-emerald-400">UZS</span>
            </h3>
            <p className="text-[11px] text-gray-400">Obunalar va pullik dublyaj epizodlaridan kelgan sof daromad</p>
          </div>

          {/* Revenue Distribution Rule */}
          <div className="p-6 rounded-3xl bg-[#182029] border border-white/10 space-y-3 shadow-xl">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              Daromad Taqsiroti
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-black/30">
                <span className="text-gray-300">Fandub Sof Foydasi:</span>
                <span className="font-bold text-emerald-400 text-sm">92%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-black/30">
                <span className="text-gray-300">Platforma Infratuzilmasi:</span>
                <span className="font-bold text-blue-400">5%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-black/30">
                <span className="text-gray-300">Avtoto'lov Shlyuzi:</span>
                <span className="font-bold text-amber-400">3%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payout History & Dubbed Animes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Payout Request History */}
          <div className="p-6 rounded-3xl bg-[#182029] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#ff6b00]" />
                Pul Yechish Tarixi ({payouts.length})
              </h3>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {payouts.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-[#141c25] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{p.amount.toLocaleString()} UZS</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      p.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {p.status === 'completed' ? '✅ Bajarildi' : p.status === 'rejected' ? '❌ Rad etildi' : '⏳ Kutilmoqda'}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Karta: {p.cardNumber}</span>
                    <span>{p.requestedAt}</span>
                  </div>

                  <div className="text-[10px] text-gray-500 flex justify-between pt-1 border-t border-white/5">
                    <span>Sof tushgan: <strong className="text-emerald-400">{p.netAmount.toLocaleString()} UZS</strong></span>
                    <span>Komissiya (8%): {(p.platformFee + p.autoPayFee).toLocaleString()} UZS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dubbed Animes Catalog */}
          <div className="p-6 rounded-3xl bg-[#182029] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Film className="w-5 h-5 text-[#ff6b00]" />
                Ovozlashtirilgan Animelar ({allAnime.length})
              </h3>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {allAnime.slice(0, 5).map((anime) => (
                <div key={anime.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#141c25] border border-white/5">
                  <img src={anime.posterImage} alt={anime.title} className="w-12 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{anime.title}</h4>
                    <p className="text-[10px] text-gray-400">{anime.episodeCount} | {anime.status}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#ff6b00]/20 text-[#ff6b00] font-bold">
                        {anime.rating} ★
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold">
                        {anime.studio}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* PAYOUT REQUEST MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#182029] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Wallet className="w-6 h-6 text-[#ff6b00]" />
                Pul Yechib Olish
              </h3>
              <p className="text-xs text-gray-400">Balansdan bank kartangizga pul o'tkazing.</p>
            </div>

            {statusMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                statusMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Summa (UZS):</label>
                <input 
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Masalan: 200000"
                  className="w-full bg-[#141c25] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
                  required
                />
                <p className="text-[10px] text-gray-500">Mavjud balans: {studioProfile.balance.toLocaleString()} UZS</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Bank Karta Raqami:</label>
                <input 
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="8600 0000 0000 0000"
                  className="w-full bg-[#141c25] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
                  required
                />
              </div>

              {/* Commission Live Breakdown */}
              <div className="p-3.5 rounded-2xl bg-[#141c25] border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>So'ralgan summa:</span>
                  <span className="font-bold text-white">{numAmount.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Avtoto'lov shlyuzi (3%):</span>
                  <span>-{autoPayFee.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>Platforma komissiyasi (5%):</span>
                  <span>-{platformFee.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-t border-white/10 pt-1.5 text-sm">
                  <span>Kartaga tushadigan sof summa (92%):</span>
                  <span>{netAmount > 0 ? netAmount.toLocaleString() : 0} UZS</span>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-white/20 text-[#ff6b00] focus:ring-[#ff6b00]"
                />
                <span>Komissiya va platforma qoidalariga roziman</span>
              </label>

              <button 
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#ff6b00] hover:bg-[#ff8533] text-black font-black text-sm transition"
              >
                Yuborish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONTRACT AGREEMENT MODAL */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#182029] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowContractModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#ff6b00]" />
                Anilo.uz & Fandub Hamkorlik Shartnomasi
              </h3>
              <p className="text-xs text-gray-400">Dublyaj studiyalari va Anilo.uz platformasi o'rtasidagi rasmiy kelishuv.</p>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed bg-[#141c25] p-4 rounded-2xl border border-white/5 max-h-[250px] overflow-y-auto custom-scrollbar">
              <p><strong>1. Daromad taqsimoti:</strong> Fandub jamoalari o'zlarining obunachilaridan tushgan daromadning <strong>92% ulushiga</strong> ega bo'lishadi.</p>
              <p><strong>2. Komissiya va xarajatlar:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>3% - Bank va avtoto'lov to'lov tizimlari komissiyasi.</li>
                <li>5% - Anilo.uz serverlari va yuqori tezlikdagi CDN infratuzilmasi texnik ta'minoti.</li>
              </ul>
              <p><strong>3. To'lov tartibi:</strong> Pul yechish so'rovi yuborilgach, mablag' 1-2 soat ichida ko'rsatilgan Uzcard/Humocard bank kartasiga o'tkaziladi.</p>
              <p><strong>4. Mualliflik va kontent sifati:</strong> Fandub studiyasi ovozlashtirish sifatiga va yuklanayotgan kontentning platforma qoidalariga mosligiga javobgar hisoblanadi.</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleAcceptContract}
                className="flex-1 py-3 rounded-2xl bg-[#ff6b00] hover:bg-[#ff8533] text-black font-black text-xs transition"
              >
                Roziman va Shartnomani Imzolash ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDIO PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#182029] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#ff6b00]" />
              Studio Profilini Tahrirlash
            </h3>

            <form onSubmit={handleSaveStudioProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-300">Studio Nomi:</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="w-full bg-[#141c25] border border-white/10 rounded-xl px-3 py-2 text-white mt-1" 
                  required 
                />
              </div>

              <div>
                <label className="font-bold text-gray-300">Studio Handle (Teg):</label>
                <input 
                  type="text" 
                  value={editHandle} 
                  onChange={(e) => setEditHandle(e.target.value)} 
                  className="w-full bg-[#141c25] border border-white/10 rounded-xl px-3 py-2 text-white mt-1" 
                  required 
                />
              </div>

              <div>
                <label className="font-bold text-gray-300">Logo Rasm Havolasi (URL):</label>
                <input 
                  type="text" 
                  value={editLogo} 
                  onChange={(e) => setEditLogo(e.target.value)} 
                  className="w-full bg-[#141c25] border border-white/10 rounded-xl px-3 py-2 text-white mt-1" 
                  required 
                />
              </div>

              <div>
                <label className="font-bold text-gray-300">Studio Haqida Bio:</label>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)} 
                  className="w-full bg-[#141c25] border border-white/10 rounded-xl px-3 py-2 text-white mt-1 h-20" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 rounded-2xl bg-[#ff6b00] text-black font-black text-xs transition"
              >
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
