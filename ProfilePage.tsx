




import React, { useEffect, useState } from 'react';
import { UserIcon } from './components/icons/UserIcon';
import { EditIcon } from './components/icons/EditIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getUserHistory, updateUserProfile, getUserSessions, getATCWallet } from './services/dbService';
import { UserProfile, UserDevice, ATCWallet } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { VerifiedBadge } from './components/VerifiedBadge';
import { MonitorIcon } from './components/icons/MonitorIcon';
import { GiftIcon } from './components/icons/GiftIcon';
import { Page } from './App';

interface ProfilePageProps {
    viewUserId?: string | null;
    onMainNavigate?: (page: Page) => void; // New prop
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ viewUserId, onMainNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyCount, setHistoryCount] = useState(0);
  const [sessions, setSessions] = useState<UserDevice[]>([]);
  const [wallet, setWallet] = useState<ATCWallet | null>(null); // New wallet state
  const { addNotification } = useNotification();

  // Auth user email fallback
  const [authEmail, setAuthEmail] = useState<string>('');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    phone: '',
  });

  const isImpersonating = !!viewUserId;

  useEffect(() => {
    loadData();
  }, [viewUserId]);

  const loadData = async () => {
    try {
      let targetUserId = viewUserId;
      let email = '';

      if (!targetUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              targetUserId = user.id;
              email = user.email || '';
          }
      }

      if (targetUserId) {
        // Auth emailini saqlab olamiz
        setAuthEmail(email);

        const profileData = await getUserProfile(targetUserId);
        
        // Profil ma'lumotlarini to'g'rilash (null bo'lsa bo'sh string)
        const effectiveProfile = {
             ...profileData,
             // Agar bazada email null bo'lsa, auth emaildan foydalanamiz (faqat o'z profili bo'lsa)
             email: profileData?.email || (viewUserId ? 'Hidden' : email) || '',
             full_name: profileData?.full_name || '',
             username: profileData?.username || '',
             phone: profileData?.phone || '',
        } as UserProfile;

        setProfile(effectiveProfile);

        setEditForm({
            full_name: effectiveProfile.full_name || '',
            username: effectiveProfile.username || '',
            phone: effectiveProfile.phone || '',
        });

        const history = await getUserHistory(targetUserId);
        setHistoryCount(history.length);

        const activeSessions = await getUserSessions(targetUserId);
        setSessions(activeSessions);

        // Get Wallet for Contest info
        try {
            const w = await getATCWallet(targetUserId);
            setWallet(w);
        } catch (e) { console.error("Wallet fetch error", e); }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
      if (!profile) return;
      
      try {
          setLoading(true);
          
          // 1. Formani validatsiya qilish
          if (editForm.username && editForm.username.length < 3) {
             throw new Error("Username kamida 3 ta belgidan iborat bo'lishi kerak.");
          }

          // 2. Bazaga saqlash
          await updateUserProfile(profile.id, {
              full_name: editForm.full_name,
              username: editForm.username,
              phone: editForm.phone
          });
          
          // 3. Lokal holatni yangilash
          setProfile({ 
              ...profile, 
              full_name: editForm.full_name,
              username: editForm.username,
              phone: editForm.phone
          });
          setIsEditing(false);
          
          addNotification({
              type: 'success',
              title: 'Saqlandi',
              message: 'Profil ma\'lumotlari muvaffaqiyatli yangilandi.'
          });
      } catch (error: any) {
          console.error("Save error:", error);
          addNotification({
              type: 'error',
              title: 'Xatolik',
              message: error.message || 'Ma\'lumotlarni saqlashda xatolik yuz berdi.'
          });
      } finally {
          setLoading(false);
      }
  };

  const handleCancel = () => {
      setIsEditing(false);
      // Formani asl holatiga qaytarish
      if (profile) {
          setEditForm({
              full_name: profile.full_name || '',
              username: profile.username || '',
              phone: profile.phone || '',
          });
      }
  };

  if (loading && !profile) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  // Badge turini aniqlash
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager';
  const badgeType = isPrivileged ? 'gold' : 'silver';
  
  const roleNames: Record<string, string> = {
    user: 'Foydalanuvchi',
    admin: 'Admin',
    manager: 'Menejer',
    owner: 'Tizim Egasi',
    support: 'Support',
    accountant: 'Hisobchi'
  };

  const displayRole = profile?.role ? (roleNames[profile.role] || profile.role) : 'Foydalanuvchi';

  // Contest Access check
  const canAccessContest = ['premium', 'admin', 'owner', 'manager'].includes(profile?.role || '');

  return (
    <div className="animate-fade-in pb-10">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-8">
        {isImpersonating ? `Foydalanuvchi Profili` : `Mening Profilim`}
      </h1>
      
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto relative shadow-2xl">
        
        {/* Tahrirlash tugmalari */}
        {!isEditing ? (
            <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors z-10"
                title="Profilni tahrirlash"
            >
                <EditIcon className="w-6 h-6" />
            </button>
        ) : (
            <div className="absolute top-6 right-6 flex gap-2 z-10">
                <button 
                    onClick={handleCancel}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Bekor qilish"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleSave}
                    className="p-2 text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Saqlash"
                >
                    <CheckIcon className="w-6 h-6" />
                </button>
            </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Avatar Section */}
          <div className="relative flex-shrink-0 mx-auto md:mx-0 group">
            <div className={`w-32 h-32 sm:w-40 sm:h-40 bg-gray-800 rounded-full flex items-center justify-center border-4 overflow-hidden shadow-lg transition-all duration-300 ${badgeType === 'gold' ? 'border-yellow-500/50 shadow-yellow-500/20' : 'border-gray-600/50'}`}>
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-16 h-16 text-gray-500" />
               )}
            </div>
            {/* Badge Icon */}
            <div className="absolute bottom-2 right-2 bg-gray-900 rounded-full p-1 shadow-md">
                <VerifiedBadge type={badgeType} className="w-8 h-8" />
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-grow w-full">
            {isEditing ? (
                <div className="space-y-5 animate-fade-in max-w-md">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Ism Familiya</label>
                        <input 
                            type="text" 
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                            placeholder="Ismingizni kiriting"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Foydalanuvchi nomi (Username)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-2.5 text-gray-500">@</span>
                            <input 
                                type="text" 
                                value={editForm.username}
                                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                placeholder="username"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Telefon raqam</label>
                        <input 
                            type="tel" 
                            value={editForm.phone}
                            placeholder="+998 90 123 45 67"
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>
                </div>
            ) : (
                <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            {profile?.full_name || 'Ism kiritilmagan'}
                        </h2>
                        <VerifiedBadge type={badgeType} className="w-6 h-6 mt-1" />
                    </div>
                    
                    <p className="text-orange-400 font-medium text-lg mb-6">
                        @{profile?.username || 'username'}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-800/40 p-5 rounded-xl border border-gray-700/50">
                         
                         {/* ID Raqam Bloki */}
                         <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                                <span className="text-4xl font-black text-gray-700">#</span>
                            </div>
                            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold block mb-1">ID Raqam</span>
                            <span className="text-white font-mono text-2xl tracking-widest font-bold text-orange-500">
                                {profile?.short_id ? profile.short_id : <span className="text-sm text-gray-500">...</span>}
                            </span>
                         </div>

                         {/* Telefon Bloki */}
                         <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold block mb-1">Telefon</span>
                            <span className="text-white text-lg font-medium">
                                {profile?.phone || <span className="text-gray-500 italic text-sm">Kiritilmagan</span>}
                            </span>
                         </div>

                         {/* Email va Status Bloki */}
                         <div className="sm:col-span-2 bg-gray-900/60 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                            <div>
                                <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold block mb-1">Email</span>
                                <span className="text-white text-base truncate max-w-[200px] sm:max-w-xs block">
                                    {profile?.email || authEmail || 'Email topilmadi'}
                                </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border flex items-center gap-1 ${badgeType === 'gold' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                                <div className={`w-2 h-2 rounded-full ${badgeType === 'gold' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
                                {displayRole}
                            </span>
                         </div>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* CONTEST CARD (NEW) */}
        <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-orange-500/30 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/3"></div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                        <GiftIcon className="w-6 h-6 text-orange-500" />
                        AniConcurs - Yutuqli O'yinlar
                    </h3>
                    <p className="text-gray-400 text-sm mt-2 max-w-md">
                        Aksiya sotib oling, vazifalarni bajaring va ATC tokenlarni yig'ing. Qimmatbaho sovrinlar sizni kutmoqda!
                    </p>
                    {wallet && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-gray-700">
                            <span className="text-xs text-gray-400">Balans:</span>
                            <span className="text-orange-400 font-bold font-mono">{wallet.balance.toFixed(1)} ATC</span>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => {
                         if (canAccessContest) {
                             if (onMainNavigate) {
                                 onMainNavigate('aniconcurs');
                             } else {
                                 // Fallback if prop is missing
                                 window.location.href = '/?page=aniconcurs';
                             }
                         } else {
                             addNotification({ type: 'warning', title: 'Faqat Premium', message: 'Konkursda qatnashish uchun Premium obuna kerak.' });
                             const plansEl = document.getElementById('subscription-plans');
                             plansEl?.scrollIntoView({ behavior: 'smooth' });
                         }
                    }}
                    className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 whitespace-nowrap ${canAccessContest ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500' : 'bg-gray-700 cursor-not-allowed opacity-70'}`}
                >
                    {canAccessContest ? 'Konkursga Kirish' : 'Premium Kerak'}
                </button>
            </div>
        </div>

        {/* Active Sessions - REDESIGNED: Horizontal Slider */}
        <div className="mt-8 bg-gray-800/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MonitorIcon className="w-5 h-5 text-blue-400" />
                Faol Seanslar
            </h3>
            
            {sessions.length === 0 && <p className="text-gray-500 text-sm">Ma'lumot yo'q</p>}

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {sessions.map(session => (
                    <div key={session.id} className="bg-gray-900/80 p-4 rounded-xl border border-gray-700 min-w-[240px] sm:min-w-[260px] flex-shrink-0 shadow-lg">
                         <div className="flex justify-between items-start mb-2">
                             <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                                <MonitorIcon className="w-6 h-6" />
                             </div>
                             <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${session.is_blocked ? 'bg-red-900/30 text-red-400 border-red-500/30' : 'bg-green-900/30 text-green-400 border-green-500/30'}`}>
                                {session.is_blocked ? 'Bloklangan' : 'Faol'}
                            </span>
                         </div>
                         <p className="text-white font-medium truncate mb-1" title={session.device_name}>{session.device_name}</p>
                         <p className="text-xs text-gray-500 font-mono truncate mb-3">ID: {session.device_id}</p>
                         <p className="text-[10px] text-gray-400">Oxirgi: {new Date(session.last_active).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Statistika */}
        <div className="mt-8 border-t border-gray-800 pt-8 grid grid-cols-3 gap-4 text-center">
            <div className="group hover:bg-gray-800/50 p-4 rounded-xl transition-colors">
                <p className="text-3xl font-bold text-white group-hover:text-orange-400 transition-colors">{historyCount}</p>
                <p className="text-xs text-gray-500 uppercase font-semibold mt-2">Ko'rilganlar</p>
            </div>
            <div className="group hover:bg-gray-800/50 p-4 rounded-xl transition-colors border-l border-r border-gray-800">
                <p className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">{profile?.balance?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 uppercase font-semibold mt-2">Balans (UZS)</p>
            </div>
            <div className="group hover:bg-gray-800/50 p-4 rounded-xl transition-colors">
                <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">0</p>
                <p className="text-xs text-gray-500 uppercase font-semibold mt-2">Izohlar</p>
            </div>
        </div>
      </div>
      
      {!isImpersonating && (
          <div className="mt-12" id="subscription-plans">
            <h2 className="text-2xl font-bold text-center text-white mb-8">Obunani yangilash</h2>
            <SubscriptionPlans />
          </div>
      )}
    </div>
  );
};