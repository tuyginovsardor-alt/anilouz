import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../services/dbService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: { email: string; name?: string; avatar?: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    if (isRegister && password.length < 6) {
      setErrorMsg("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const data = await signUpWithEmail(email.trim(), password.trim(), fullName.trim());
        setSuccessMsg("Ro'yxatdan muvaffaqiyatli o'tdingiz! Tizimga kirishingiz mumkin.");
        if (data?.user) {
          onAuthSuccess?.({
            email: data.user.email || email,
            name: fullName || data.user.email?.split('@')[0] || 'Foydalanuvchi',
          });
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else {
        const data = await signInWithEmail(email.trim(), password.trim());
        setSuccessMsg("Tizimga muvaffaqiyatli kirdingiz!");
        if (data?.user) {
          onAuthSuccess?.({
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Foydalanuvchi',
          });
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setErrorMsg('Email yoki parol xato kiritildi.');
      } else if (msg.includes('User already registered')) {
        setErrorMsg("Ushbu email allaqachon ro'yxatdan o'tgan.");
      } else {
        setErrorMsg(msg || "Tizimga kirishda xatolik yuz berdi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const data: any = await signInWithGoogle();
      if (data?.user) {
        setSuccessMsg("Google orqali tizimga kirdingiz!");
        onAuthSuccess?.({
          email: data.user.email || 'user@gmail.com',
          name: data.user.user_metadata?.full_name || 'Google Foydalanuvchisi',
        });
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setErrorMsg(err.message || "Google orqali kirishda xatolik yuz berdi.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#12121A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient glow background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-3">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            ANILO<span className="text-orange-500">.UZ</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isRegister ? "Yangi hisob yaratish" : "Hisobingizga xush kelibsiz"}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-[#1A1A26] p-1 rounded-2xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              !isRegister
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Kirish</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              isRegister
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ro'yxatdan o'tish</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium text-center">
            {successMsg}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Ism va familiya
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ali Valiyev"
                  className="w-full bg-[#181824] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
              Email manzili
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full bg-[#181824] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
              Parol
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181824] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? "Ro'yxatdan o'tish" : "Tizimga kirish"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#12121A] text-[10px] font-bold uppercase tracking-widest text-gray-500">
            yoki
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading}
          className="w-full py-3 px-4 rounded-xl bg-[#181824] hover:bg-[#222232] border border-white/10 text-white font-bold text-xs transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google orqali kirish</span>
        </button>

      </div>
    </div>
  );
};
