
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { useNotification } from '../hooks/useNotification';
import { supabase } from '../services/supabaseClient';
import { checkAndTrackRegistration, logDeviceLogin } from '../services/dbService';
import { Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
    onClose: () => void;
    onAuthSuccess: (role: UserRole) => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            // Check Profile & Role
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
        setLoading(true);
        try {
            await checkAndTrackRegistration(deviceId);
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            
            addNotification({ type: 'success', title: 'Tasdiqlash', message: 'Emailingizga tasdiqlash havolasi yuborildi.' });
            // For UX, maybe switch to login or show verify message
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
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050505] animate-fade-in">
            {/* Close Button Top Right (Optional but good UX) */}
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white">✕</button>

            <div className="w-full max-w-sm px-6 flex flex-col justify-center h-full">
                
                {/* Title */}
                <h2 className="text-3xl text-white text-center font-normal mb-10 tracking-wide">
                    {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                </h2>

                <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                    
                    {/* Email Input (Styled like Phone Input in Screenshot) */}
                    <div className="relative">
                        <label className="absolute -top-2.5 left-4 bg-[#050505] px-1 text-xs text-gray-400">
                            Email (Gmail)
                        </label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-transparent border border-gray-600 rounded-lg py-4 px-4 text-white text-lg focus:border-white outline-none transition-colors placeholder-gray-600"
                            placeholder="example@gmail.com"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <label className="absolute -top-2.5 left-4 bg-[#050505] px-1 text-xs text-gray-400">
                            Parol
                        </label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-transparent border border-gray-600 rounded-lg py-4 px-4 text-white text-lg focus:border-white outline-none transition-colors"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                        </button>
                    </div>

                    {/* Forgot Password Link */}
                    {mode === 'login' && (
                        <div className="text-right">
                            <button type="button" className="text-sm text-[#3b82f6] hover:text-blue-400 font-medium">
                                Parolni unutdingizmi?
                            </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-white text-black font-bold text-lg py-3.5 rounded-full mt-6 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading ? 'Yuklanmoqda...' : (mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish")}
                    </button>

                </form>

                {/* Toggle Register/Login */}
                <div className="mt-8 text-center">
                    <button 
                        onClick={toggleMode}
                        className="text-orange-500 font-bold text-sm hover:text-orange-400 uppercase tracking-wide"
                    >
                        {mode === 'login' ? "Ro'yxatdan o'tmoqchimisiz?" : "Kirishga qaytish"}
                    </button>
                </div>

            </div>
        </div>
    );
};
