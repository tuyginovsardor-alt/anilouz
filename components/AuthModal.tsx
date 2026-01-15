
import React, { useState, useEffect } from 'react';
import { UserRole, LegalDocType } from '../types';
import { useNotification } from '../hooks/useNotification';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { supabase } from '../services/supabaseClient';
import { checkAndTrackRegistration, logDeviceLogin } from '../services/dbService';
import { LegalDocs } from './LegalDocs';

interface AuthModalProps {
    onClose: () => void;
    onAuthSuccess: (role: UserRole) => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [registerStep, setRegisterStep] = useState(1); // 1: Creds, 2: OTP, 3: Profile
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    
    // Agreement States
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeSecurity, setAgreeSecurity] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    // Document Viewer State
    const [viewingDoc, setViewingDoc] = useState<LegalDocType | null>(null);

    // Resend Timer
    const [resendTimer, setResendTimer] = useState(0);
    
    // Device Identifier
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
            addNotification({ type: 'error', title: 'Kirishda xatolik', message: error.message || 'Email yoki parol noto\'g\'ri.' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
            // Redirect happens automatically
        } catch (error: any) {
            console.error("Google login error:", error);
            addNotification({ type: 'error', title: 'Google Xatolik', message: 'Google orqali kirishda xatolik yuz berdi.' });
        }
    };

    const finalizeLogin = async (userId: string) => {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
        try {
            await logDeviceLogin(userId, deviceId);
            addNotification({ type: 'info', title: 'Yangi Seans', message: 'Qurilma ro\'yxatga olindi.' });
        } catch (logError: any) {
            if (logError.message.includes('bloklangan')) {
                await supabase.auth.signOut();
                throw logError;
            }
        }
        const role = profile?.role || 'user';
        onAuthSuccess(role);
        addNotification({ type: 'success', title: 'Muvaffaqiyatli!', message: `Xush kelibsiz!` });
    };

    const handleRegisterStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!agreePrivacy || !agreeSecurity || !agreeTerms) {
            addNotification({ type: 'warning', title: 'Rozilik Kerak', message: 'Iltimos, barcha qoidalar va shartlarga rozilik bildiring.' });
            return;
        }

        if (!email || password.length < 6) {
            addNotification({ type: 'warning', title: 'Diqqat', message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.' });
            return;
        }

        setLoading(true);
        try {
            // 1. Device Check
            const { count } = await checkAndTrackRegistration(deviceId);
            if (count >= 3) {
                addNotification({ type: 'warning', title: 'Ogohlantirish', message: 'Juda ko\'p hisob ochishga urinish. Admin xabardor qilindi.' });
            }

            // 2. Attempt Sign Up
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            
            if (error) throw error;

            // Check if user exists (Supabase sometimes returns success even if user exists but unconfirmed)
            if (data.user && data.user.identities?.length === 0) {
                 addNotification({ type: 'warning', title: 'Email Band', message: 'Bu email allaqachon ro\'yxatdan o\'tgan. Iltimos, kirish oynasidan foydalaning.' });
                 return;
            }

            setRegisterStep(2);
            setResendTimer(60);
            addNotification({ type: 'info', title: 'Kod yuborildi', message: 'Tasdiqlash kodi emailingizga yuborildi.' });

        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({ type: 'signup', email: email });
            if (error) throw error;
            setResendTimer(60);
            addNotification({ type: 'success', title: 'Yuborildi', message: 'Yangi kod yuborildi.' });
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
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: 'Email tasdiqlandi.' });
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
            if (!user) throw new Error("Foydalanuvchi topilmadi");

            const fullName = `${firstName} ${lastName}`.trim();
            const { error } = await supabase.from('profiles').update({ username, full_name: fullName, device_id: deviceId }).eq('id', user.id);
            if (error) throw error;

            await logDeviceLogin(user.id, deviceId);
            onAuthSuccess('user');
            addNotification({ type: 'success', title: 'Tabriklaymiz!', message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz.' });
        } catch (error: any) {
             addNotification({ type: 'error', title: 'Xatolik', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setRegisterStep(1);
    };

    const renderProgressBar = () => (
        <div className="flex gap-2 mb-6 justify-center">
            {[1, 2, 3].map((step) => (
                <div key={step} className={`h-2 rounded-full transition-all duration-300 ${step <= registerStep ? 'bg-orange-500 w-8' : 'bg-gray-700 w-4'}`} />
            ))}
        </div>
    );

    return (
        <>
            {viewingDoc && <LegalDocs type={viewingDoc} onClose={() => setViewingDoc(null)} />}
            
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
                <div className="bg-gray-900 border border-orange-500/30 rounded-2xl shadow-2xl w-full max-w-md m-4 p-8 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    {mode === 'register' && registerStep > 1 && (
                        <button onClick={() => setRegisterStep(prev => prev - 1)} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                            <ChevronLeftIcon className="w-5 h-5" /> <span className="text-sm">Orqaga</span>
                        </button>
                    )}

                    <h2 className="text-3xl font-bold text-center text-white mb-2">{mode === 'login' ? 'Xush Kelibsiz' : "Ro'yxatdan o'tish"}</h2>
                    <p className="text-center text-gray-400 text-sm mb-6">{mode === 'login' ? 'Hisobingizga kiring.' : 'Yangi hisob yarating.'}</p>

                    {mode === 'register' && renderProgressBar()}

                    {mode === 'login' ? (
                        <div className="space-y-5">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Parol" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                <button type="submit" disabled={loading} className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-white transition-all flex items-center justify-center">
                                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Kirish'}
                                </button>
                            </form>
                            
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-700"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">YOKI</span>
                                <div className="flex-grow border-t border-gray-700"></div>
                            </div>

                            <button onClick={handleGoogleLogin} className="w-full py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                <GoogleIcon /> Google orqali kirish
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {registerStep === 1 && (
                                <form onSubmit={handleRegisterStep1} className="space-y-5 animate-fade-in">
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Parol" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                    
                                    <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-sm text-gray-300">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} className="mt-1 w-4 h-4 accent-orange-500" />
                                            <span>Men <span onClick={(e) => {e.preventDefault(); setViewingDoc('privacy')}} className="text-orange-400 hover:underline font-bold">Maxfiylik Siyosati</span> bilan tanishib chiqdim va roziman.</span>
                                        </label>
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={agreeSecurity} onChange={e => setAgreeSecurity(e.target.checked)} className="mt-1 w-4 h-4 accent-orange-500" />
                                            <span>Men <span onClick={(e) => {e.preventDefault(); setViewingDoc('security')}} className="text-orange-400 hover:underline font-bold">Xavfsizlik Qoidalari</span> ga rozilik bildiraman.</span>
                                        </label>
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-1 w-4 h-4 accent-orange-500" />
                                            <span>Men <span onClick={(e) => {e.preventDefault(); setViewingDoc('terms')}} className="text-orange-400 hover:underline font-bold">Foydalanish Shartlari (Javobgarlik)</span> ni qabul qilaman.</span>
                                        </label>
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded-xl font-bold text-white transition-all flex items-center justify-center">
                                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Davom etish'}
                                    </button>

                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-gray-700"></div>
                                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">YOKI</span>
                                        <div className="flex-grow border-t border-gray-700"></div>
                                    </div>

                                    <button type="button" onClick={handleGoogleLogin} className="w-full py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                        <GoogleIcon /> Google orqali (Avtomatik Rozilik)
                                    </button>
                                </form>
                            )}

                            {registerStep === 2 && (
                                <form onSubmit={handleRegisterStep2} className="space-y-5 animate-fade-in">
                                    <div className="text-center mb-4"><span className="text-orange-400 font-semibold">{email}</span><p className="text-xs text-gray-500 mt-1">manziliga kod yuborildi.</p></div>
                                    <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="000000" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-center text-2xl tracking-widest font-mono text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-white flex items-center justify-center">{loading ? '...' : 'Tasdiqlash'}</button>
                                    <div className="text-center mt-2"><button type="button" onClick={handleResendCode} disabled={resendTimer > 0 || loading} className="text-sm text-gray-400 hover:text-white underline">{resendTimer > 0 ? `Qayta yuborish: ${resendTimer}s` : "Kodni qayta yuborish"}</button></div>
                                </form>
                            )}

                            {registerStep === 3 && (
                                <form onSubmit={handleRegisterStep3} className="space-y-5 animate-fade-in">
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())} required placeholder="@username" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Ism" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Familiya" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-white flex items-center justify-center">{loading ? '...' : 'Tugatish'}</button>
                                </form>
                            )}
                        </div>
                    )}

                    <div className="text-center mt-8 pt-4 border-t border-gray-800">
                        <p className="text-gray-400 text-sm">{mode === 'login' ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}</p>
                        <button onClick={toggleMode} className="mt-1 text-orange-400 hover:text-orange-300 font-semibold transition-colors text-sm">{mode === 'login' ? "Ro'yxatdan o'tish" : "Tizimga kirish"}</button>
                    </div>
                </div>
            </div>
        </>
    );
};
