
import React, { useState, useEffect } from 'react';
import { ToggleSwitch } from './components/ToggleSwitch';
import { supabase } from './services/supabaseClient';
import { getUserProfile, updateUserProfile, updateUserPassword, updateUserEmail } from './services/dbService';
import { UserProfile } from './types';
import { useNotification } from './hooks/useNotification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CloseIcon } from './components/icons/CloseIcon';

const SettingsSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 border-b border-gray-800 pb-2 mb-4">{title}</h2>
        <div className="space-y-4">{children}</div>
    </div>
);

const SettingsItem: React.FC<{label: string, description: string, control: React.ReactNode}> = ({label, description, control}) => (
    <div className="flex items-center justify-between">
        <div>
            <h3 className="text-md font-medium text-white">{label}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div>{control}</div>
    </div>
);

export const SettingsPage: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();
    const [authEmail, setAuthEmail] = useState('');

    // Modals
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    
    // Modal Forms
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setAuthEmail(user.email || '');
                const dbProfile = await getUserProfile(user.id);
                setProfile(dbProfile);
            }
        } catch (e) {
            console.error("Error loading settings:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUpdate = async (field: 'email_notifications' | 'push_notifications', value: boolean) => {
        if (!profile) return;
        
        // Optimistic UI update
        setProfile(prev => prev ? ({ ...prev, [field]: value }) : null);

        try {
            await updateUserProfile(profile.id, { [field]: value });
            // No notification needed for toggle switches usually, or maybe a small one
        } catch (e) {
            console.error(e);
            // Revert on error
            setProfile(prev => prev ? ({ ...prev, [field]: !value }) : null);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Sozlamani saqlab bo\'lmadi.' });
        }
    };

    const handleLanguageChange = async (value: string) => {
        if (!profile) return;
        setProfile(prev => prev ? ({ ...prev, language: value }) : null);
        try {
            await updateUserProfile(profile.id, { language: value });
            addNotification({ type: 'success', title: 'Til o\'zgardi', message: 'Sahifani yangilash tavsiya etiladi.' });
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Tilni saqlab bo\'lmadi.' });
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            addNotification({ type: 'warning', title: 'Xatolik', message: 'Parol kamida 6 ta belgi bo\'lishi kerak.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            addNotification({ type: 'warning', title: 'Xatolik', message: 'Parollar mos kelmadi.' });
            return;
        }

        setIsSaving(true);
        try {
            await updateUserPassword(newPassword);
            addNotification({ type: 'success', title: 'Muvaffaqiyatli', message: 'Parol yangilandi.' });
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Parolni o\'zgartirib bo\'lmadi.' });
        } finally {
            setIsSaving(false);
        }
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.includes('@')) return;

        setIsSaving(true);
        try {
            await updateUserEmail(newEmail);
            addNotification({ type: 'info', title: 'Tasdiqlash kerak', message: `Tasdiqlash havolasi ${newEmail} va eski emailingizga yuborildi.` });
            setShowEmailModal(false);
            setNewEmail('');
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Emailni o\'zgartirib bo\'lmadi.' });
        } finally {
            setIsSaving(false);
        }
    }

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-8">
                Sozlamalar
            </h1>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
                <SettingsSection title="Hisob">
                    <SettingsItem 
                        label="Elektron pochta" 
                        description={authEmail || "Email yo'q"}
                        control={<button onClick={() => setShowEmailModal(true)} className="text-sm text-orange-400 hover:underline hover:text-orange-300">O'zgartirish</button>}
                    />
                    <SettingsItem 
                        label="Parol" 
                        description="••••••••••••"
                        control={<button onClick={() => setShowPasswordModal(true)} className="text-sm text-orange-400 hover:underline hover:text-orange-300">O'zgartirish</button>}
                    />
                </SettingsSection>
                
                <SettingsSection title="Bildirishnomalar">
                    <SettingsItem 
                        label="Email bildirishnomalari" 
                        description="Yangi animelar va tavsiyalar haqida xabarlar."
                        control={
                            <ToggleSwitch 
                                checked={profile?.email_notifications ?? true} 
                                onChange={(val) => handleToggleUpdate('email_notifications', val)} 
                            />
                        }
                    />
                    <SettingsItem 
                        label="Push bildirishnomalari" 
                        description="Brauzer orqali tezkor xabarlar."
                        control={
                            <ToggleSwitch 
                                checked={profile?.push_notifications ?? true} 
                                onChange={(val) => handleToggleUpdate('push_notifications', val)} 
                            />
                        }
                    />
                </SettingsSection>

                <SettingsSection title="Ko'rinish">
                    <SettingsItem 
                        label="Til" 
                        description="Interfeys tili"
                        control={
                            <select 
                                value={profile?.language || 'uz'}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-md text-sm p-2 focus:ring-orange-500 focus:border-orange-500 text-white outline-none"
                            >
                                <option value="uz">O'zbekcha (Lotin)</option>
                                <option value="ru">Русский</option>
                                <option value="en">English</option>
                            </select>
                        }
                    />
                </SettingsSection>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Parolni o'zgartirish</h3>
                            <button onClick={() => setShowPasswordModal(false)}><CloseIcon className="w-6 h-6 text-gray-400 hover:text-white"/></button>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Yangi parol" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-orange-500 outline-none"
                                required
                                minLength={6}
                            />
                            <input 
                                type="password" 
                                placeholder="Parolni tasdiqlang" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-orange-500 outline-none"
                                required
                                minLength={6}
                            />
                            <button type="submit" disabled={isSaving} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded transition-colors disabled:opacity-50">
                                {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowEmailModal(false)}>
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Emailni o'zgartirish</h3>
                            <button onClick={() => setShowEmailModal(false)}><CloseIcon className="w-6 h-6 text-gray-400 hover:text-white"/></button>
                        </div>
                        <p className="text-sm text-yellow-500 mb-4 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                            Diqqat: Email o'zgarganda, yangi emailga tasdiqlash havolasi yuboriladi. Tasdiqlamaguningizcha eski email o'z kuchida qoladi.
                        </p>
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <input 
                                type="email" 
                                placeholder="Yangi email manzil" 
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-orange-500 outline-none"
                                required
                            />
                            <button type="submit" disabled={isSaving} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded transition-colors disabled:opacity-50">
                                {isSaving ? 'Yuborilmoqda...' : 'Tasdiqlash kodini yuborish'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
