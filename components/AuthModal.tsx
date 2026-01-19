
import React, { useState, useEffect } from 'react';
import { UserRole, LegalDocType } from '../types';
import { useNotification } from '../hooks/useNotification';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { supabase } from '../services/supabaseClient';
import { checkAndTrackRegistration, logDeviceLogin } from '../services/dbService';
import { LegalDocs } from './LegalDocs';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
    onClose: () => void;
    onAuthSuccess: (role: UserRole) => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [registerStep, setRegisterStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    
    // Legal
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeSecurity, setAgreeSecurity] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<LegalDocType | null>(null);

    const [resendTimer, setResendTimer] = useState(0);
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

    useEffect(() => {
        if (resendTimer > 0) {
            const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [resendTimer]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await finalizeLogin(data.user.id);
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: error.message || 'Email yoki parol noto\'g\'ri.' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Google Xatolik', message: 'Google orqali kirishda xatolik yuz berdi.' });
        }
    };

    const finalizeLogin = async (userId: string) => {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
        try {
            await logDeviceLogin(userId, deviceId);
        } catch (logError: any) {
            if (logError.message.includes('bloklangan')) {
                await supabase.auth.signOut();
                throw logError;
            }
        }
        const role = (profile as any)?.role || 'user';
        onAuthSuccess(role);
        addNotification({ type: 'success', title: 'Muvaffaqiyatli!', message: `Xush kelibsiz!` });
    };

    const handleRegisterStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreePrivacy || !agreeSecurity || !agreeTerms) {
            addNotification({ type: 'warning', title: 'Rozilik Kerak', message: 'Barcha qoidalarga rozilik bildiring.' });
            return;
        }
        if (!email || password.length < 6) return;

        setLoading(true);
        try {
            const { count } = await checkAndTrackRegistration(deviceId);
            if (count >= 3) addNotification({ type: 'warning', title: 'Limit', message: 'Ko\'p hisob ochishga urinish.' });

            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            if (data.user && data.user.identities?.length === 0) {
                 addNotification({ type: 'warning', title: 'Band', message: 'Email ro\'yxatdan o\'tgan. Kirishga o\'ting.' });
                 return;
            }
            setRegisterStep(2);
            setResendTimer(60);
            addNotification({ type: 'info', title: 'Kod yuborildi', message: 'Tasdiqlash kodi emailingizga ketdi.' });
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({ email, token: verificationCode, type: 'signup' });
            if (error) throw error;
            setRegisterStep(3);
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Kod noto\'g\'ri.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStep3 = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");
            const fullName = `${firstName} ${lastName}`.trim();
            const { error } = await supabase.from('profiles').update({ username, full_name: fullName, device_id: deviceId } as any).eq('id', user.id);
            if (error) throw error;
            await logDeviceLogin(user.id, deviceId);
            onAuthSuccess('user');
        } catch (error: any) {
             addNotification({ type: 'error', title: 'Xatolik', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {viewingDoc && <LegalDocs type={viewingDoc} onClose={() => setViewingDoc(null)} />}
            
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
                
                <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden animate-slide-in-up" onClick={e => e.stopPropagation()}>
                    
                    {/* Decorative Top Gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-red-500 to-purple-600"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    {/* Header */}
                    <div className="text-center mb-10 mt-4">
                        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">
                            {mode === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
                        </h2>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            {mode === 'login' ? 'Profilingizga xush kelibsiz' : 'Yangi hisob yarating'}
                        </p>
                    </div>

                    {mode === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">Email (Gmail)</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                                    <input 
                                        type="email" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        required 
                                        placeholder="example@gmail.com" 
                                        className="w-full bg-[#151515] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-orange-500 outline-none transition-all placeholder:text-zinc-700 font-medium" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-widest">Parol</label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        required 
                                        placeholder="••••••••" 
                                        className="w-full bg-[#151515] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white text-sm focus:border-orange-500 outline-none transition-all placeholder:text-zinc-700 font-medium" 
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                                <div className="text-right">
                                    <button type="button" className="text-[10px] font-bold text-zinc-500 hover:text-orange-500 transition-colors">Parolni unutdingizmi?</button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow-lg mt-4 disabled:opacity-50">
                                {loading ? 'KIRILMOQDA...' : 'KIRISH'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-5">
                            {registerStep === 1 && (
                                <form onSubmit={handleRegisterStep1} className="space-y-5">
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" className="w-full bg-[#151515] border border-white/5 rounded-2xl py-4 pl-12 text-white text-sm focus:border-orange-500 outline-none placeholder:text-zinc-700" />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Parol (min 6)" className="w-full bg-[#151515] border border-white/5 rounded-2xl py-4 pl-12 text-white text-sm focus:border-orange-500 outline-none placeholder:text-zinc-700" />
                                    </div>
                                    
                                    <div className="space-y-3 p-4 bg-zinc-900/50 rounded-2xl border border-white/5 text-[10px] text-zinc-400">
                                        {[{l: 'Maxfiylik Siyosati', s: setAgreePrivacy, v: agreePrivacy, d: 'privacy'}, {l: 'Xavfsizlik Qoidalari', s: setAgreeSecurity, v: agreeSecurity, d: 'security'}, {l: 'Foydalanish Shartlari', s: setAgreeTerms, v: agreeTerms, d: 'terms'}].map((item, i) => (
                                            <label key={i} className="flex items-center gap-3 cursor-pointer">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${item.v ? 'bg-orange-600 border-orange-600' : 'border-zinc-600'}`}>
                                                    <input type="checkbox" checked={item.v} onChange={e => item.s(e.target.checked)} className="hidden" />
                                                    {item.v && <ShieldCheck size={10} className="text-white"/>}
                                                </div>
                                                <span><strong onClick={(e) => {e.preventDefault(); setViewingDoc(item.d as any)}} className="text-white hover:text-orange-500 underline">{item.l}</strong> ga roziman.</span>
                                            </label>
                                        ))}
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all">{loading ? '...' : 'DAVOM ETISH'}</button>
                                </form>
                            )}

                            {registerStep === 2 && (
                                <form onSubmit={handleRegisterStep2} className="space-y-5 text-center">
                                    <p className="text-zinc-400 text-sm">Biz <span className="text-white font-bold">{email}</span> ga kod yubordik.</p>
                                    <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} required placeholder="000000" className="w-full bg-[#151515] border border-white/5 rounded-2xl py-4 text-center text-white text-2xl tracking-[0.5em] font-mono focus:border-orange-500 outline-none" />
                                    <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-500 transition-all">{loading ? '...' : 'TASDIQLASH'}</button>
                                </form>
                            )}

                            {registerStep === 3 && (
                                <form onSubmit={handleRegisterStep3} className="space-y-5">
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="@username" className="w-full bg-[#151515] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm focus:border-orange-500 outline-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Ism" className="w-full bg-[#151515] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm focus:border-orange-500 outline-none" />
                                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Familiya" className="w-full bg-[#151515] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm focus:border-orange-500 outline-none" />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-500 transition-all">TUGATISH</button>
                                </form>
                            )}
                        </div>
                    )}

                    {registerStep === 1 && (
                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            {mode === 'login' ? (
                                <p className="text-zinc-500 text-xs font-bold">Hisobingiz yo'qmi? <button onClick={() => {setMode('register'); setRegisterStep(1)}} className="text-white hover:text-orange-500 ml-1 transition-colors uppercase tracking-wider">Ro'yxatdan o'tish</button></p>
                            ) : (
                                <p className="text-zinc-500 text-xs font-bold">Hisobingiz bormi? <button onClick={() => setMode('login')} className="text-white hover:text-orange-500 ml-1 transition-colors uppercase tracking-wider">Kirish</button></p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
