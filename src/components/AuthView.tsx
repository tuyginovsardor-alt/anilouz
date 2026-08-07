import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onSuccess();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        setSuccessMsg("Ro'yxatdan o'tish muvaffaqiyatli! Iltimos, elektron pochtangizni tasdiqlang.");
      }
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E12] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-orange-500 shadow-[0_0_40px_rgba(255,107,0,0.3)] bg-[#181820] mb-4">
            <img 
              src="https://i.postimg.cc/1XYBLxjY/photo-2026-06-01-00-29-48.jpg" 
              alt="ANILO Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            ANILO<span className="text-orange-500">.UZ</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">Anime olamiga xush kelibsiz!</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#161622]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              Kirish
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              Ro'yxatdan o'tish
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">To'liq ismingiz</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ismingizni kiriting..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email manzilingiz</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@misol.com"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Maxfiy so'z</label>
                {isLogin && (
                  <button type="button" className="text-xs font-bold text-orange-400 hover:text-orange-300">
                    Unutdingizmi?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-start gap-3 text-sm"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:scale-[1.02] active:scale-[0.98] py-4 rounded-2xl text-black font-black tracking-widest uppercase transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "KIRISH" : "DAVOM ETISH"}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Social Auth */}
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Yoki orqali kirish</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl transition-all font-bold text-sm">
                <Chrome className="w-5 h-5" />
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl transition-all font-bold text-sm">
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-gray-500 text-xs px-8 leading-relaxed">
          Ro'yxatdan o'tish orqali siz bizning <span className="text-orange-500/80 underline">Foydalanish shartlari</span> va <span className="text-orange-500/80 underline">Maxfiylik siyosatimizga</span> rozilik bildirasiz.
        </p>
      </motion.div>
    </div>
  );
};
