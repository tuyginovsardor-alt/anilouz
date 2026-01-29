
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { useNotification } from '../hooks/useNotification';
import { supabase } from '../services/supabaseClient';
import { checkAndTrackRegistration, logDeviceLogin } from '../services/dbService';
import { Eye, EyeOff, Mail, Lock, Check } from 'lucide-react';
import { GoogleIcon } from './icons/GoogleIcon';
import { LegalDocType } from '../App';

interface AuthModalProps {
    onClose: () => void;
    onAuthSuccess: (role: UserRole) => void;
    onOpenLegal?: (type: LegalDocType) => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess, onOpenLegal }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false); // Rozilik holati
    
    // Device Tracking
    const [deviceId, setDeviceId] = useState('');
    const { addNotification } = useNotification();

    useEffect(() => {
        let storedId = localStorage.getItem('anilo_device_id');
        if (!storedId) {
            storedId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('anilo_device_id', storedId);
        }
        setDeviceId(storedId);
    }, []);

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (error) throw error;
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Google Xatolik', message: error.message || 'Google orqali kirishda xatolik.' });
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
            await logDeviceLogin(data.user.id, deviceId);
            
            const role = (profile as any)?.role || 'user';
            onAuthSuccess(role);
            addNotification({ type: 'success', title: 'Xush kelibsiz', message: `Tizimga kirdingiz!` });
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Email yoki parol noto\'g\'ri.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAgreed) {
            addNotification({ type: 'warning', title: 'Diqqat', message: 'Davom etish uchun shartlarga rozilik berishingiz kerak.' });
            return;
        }
        setLoading(true);
        try {
            await checkAndTrackRegistration(deviceId);
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            
            addNotification({ type: 'success', title: 'Tasdiqlash', message: 'Emailingizga tasdiqlash havolasi yuborildi.' });
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setEmail('');
        setPassword('');
        setIsAgreed(false);
    };

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden animate-slide-in-up" onClick={e => e.stopPropagation()}>
                
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-600/20 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px] pointer-events-none"></div>

                <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-10">✕</button>

                <div className="text-center mb-8 mt-2 relative z-10">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">
                        {mode === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
                    </h2>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                        {mode === 'login' ? 'Profilingizga xush kelibsiz' : 'Yangi hisob yarating'}
                    </p>
                </div>

                <div className="space-y-6 relative z-10">
                    <button 
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-black py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
                    >
                        <GoogleIcon width="20" height="20" />
                        <span>Google bilan davom etish</span>
                    </button>

                    <div className="flex items-center gap-4 text-xs text-zinc-600 font-bold uppercase tracking-widest">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <span>Yoki</span>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>

                    <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18}/>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-[#151515] border border-white/5 group-focus-within:border-orange-500/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-zinc-700 font-medium"
                                    placeholder="example@gmail.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">Parol</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18}/>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-[#151515] border border-white/5 group-focus-within:border-orange-500/50 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none transition-all placeholder:text-zinc-700 font-medium"
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <div className="flex items-start gap-3 mt-4 px-1 animate-fade-in">
                                <button 
                                    type="button"
                                    onClick={() => setIsAgreed(!isAgreed)}
                                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isAgreed ? 'bg-orange-600 border-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-zinc-900 border-white/10'}`}
                                >
                                    {isAgreed && <Check size={14} className="text-white" strokeWidth={4} />}
                                </button>
                                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                                    Men "Anilo.uz" platformasining{' '}
                                    <button type="button" onClick={() => onOpenLegal?.('terms')} className="text-orange-500 hover:underline">Ommaviy Oferta</button>{' '}
                                    shartlariga va{' '}
                                    <button type="button" onClick={() => onOpenLegal?.('privacy')} className="text-orange-500 hover:underline">Maxfiylik Siyosati</button>{' '}
                                    qoidalariga to'liq roziman.
                                </p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading || (mode === 'register' && !isAgreed)}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'register' && !isAgreed ? 'bg-zinc-800 text-zinc-600' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20'}`}
                        >
                            {loading ? 'Yuklanmoqda...' : (mode === 'login' ? 'Tizimga Kirish' : 'Hisob Yaratish')}
                        </button>
                    </form>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
                    <button 
                        onClick={toggleMode}
                        className="text-zinc-400 hover:text-white text-xs font-bold transition-colors"
                    >
                        {mode === 'login' ? (
                            <>Hisobingiz yo'qmi? <span className="text-orange-500">Ro'yxatdan o'tish</span></>
                        ) : (
                            <>Hisobingiz bormi? <span className="text-orange-500">Kirish</span></>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
