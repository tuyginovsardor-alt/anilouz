import React, { useEffect, useState } from 'react';
import { UserIcon } from './components/icons/UserIcon';
import { EditIcon } from './components/icons/EditIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getUserHistory, updateUserProfile, getUserSessions } from './services/dbService';
import { UserProfile, UserDevice } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { VerifiedBadge } from './components/VerifiedBadge';
import { Monitor, Hash, Phone, Mail, Award, Mic } from 'lucide-react';
import { Page } from './App';

interface ProfilePageProps {
    viewUserId?: string | null;
    onMainNavigate?: (page: Page) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ viewUserId, onMainNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyCount, setHistoryCount] = useState(0);
  const [sessions, setSessions] = useState<UserDevice[]>([]);
  const { addNotification } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', username: '', phone: '' });

  useEffect(() => { loadData(); }, [viewUserId]);

  const loadData = async () => {
    try {
      let targetUserId = viewUserId;
      if (!targetUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) targetUserId = user.id;
      }

      if (targetUserId) {
        const profileData = await getUserProfile(targetUserId);
        setProfile(profileData as UserProfile);
        setEditForm({
            full_name: profileData?.full_name || '',
            username: profileData?.username || '',
            phone: profileData?.phone || '',
        });

        const history = await getUserHistory(targetUserId);
        setHistoryCount(history.length);

        const activeSessions = await getUserSessions(targetUserId);
        setSessions(activeSessions);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
      if (!profile) return;
      setLoading(true);
      try {
          await updateUserProfile(profile.id, editForm);
          setProfile({ ...profile, ...editForm });
          setIsEditing(false);
          addNotification({ type: 'success', title: 'Saqlandi', message: 'Profil yangilandi.' });
      } catch (error: any) {
          addNotification({ type: 'error', title: 'Xatolik', message: error.message });
      } finally { setLoading(false); }
  };

  if (loading && !profile) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const isPrivileged = ['admin', 'owner', 'manager'].includes(profile?.role || '');
  const isDubRole = profile?.role === 'dub';

  return (
    <div className="animate-fade-in pb-10 space-y-8">
      <div className="bg-gray-900/40 border border-gray-800 rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* Avatar */}
          <div className="relative group">
            <div className={`w-32 h-32 sm:w-44 sm:h-44 bg-gray-800 rounded-full flex items-center justify-center border-4 ${isPrivileged || isDubRole ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.2)]' : 'border-gray-700'} overflow-hidden transition-all duration-500`}>
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-16 h-16 text-gray-600" />
               )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#0a0a0c] p-2 rounded-full border border-gray-800">
                <VerifiedBadge type={isPrivileged || isDubRole ? 'gold' : 'silver'} className="w-8 h-8" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter mb-2">
                        {profile?.full_name || 'Foydalanuvchi'}
                    </h2>
                    <p className="text-orange-500 font-bold text-lg">@{profile?.username || 'username'}</p>
                </div>
                <div className="flex gap-3">
                    {isDubRole && !viewUserId && (
                        <button 
                            onClick={() => onMainNavigate?.('dub-dashboard')}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-purple-900/40"
                        >
                            <Mic size={16} /> Studio Xona
                        </button>
                    )}
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all">
                            <EditIcon className="w-4 h-4" /> Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><CloseIcon className="w-5 h-5"/></button>
                            <button onClick={handleSave} className="p-3 bg-green-500/10 text-green-500 rounded-full hover:bg-green-500 hover:text-white transition-all"><CheckIcon className="w-5 h-5"/></button>
                        </div>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl animate-fade-in">
                    <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="bg-gray-800/50 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:border-orange-500 outline-none text-sm" placeholder="Ism Familiya" />
                    <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="bg-gray-800/50 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:border-orange-500 outline-none text-sm" placeholder="Username" />
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="bg-gray-800/50 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:border-orange-500 outline-none text-sm" placeholder="Telefon" />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Hash size={10}/> ID</p>
                        <p className="text-white font-black text-sm">{profile?.short_id || '---'}</p>
                    </div>
                    <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Award size={10}/> Status</p>
                        <p className="text-white font-black text-[11px] uppercase truncate">{profile?.role === 'dub' ? 'Artist' : profile?.role}</p>
                    </div>
                    <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800 col-span-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Mail size={10}/> Email</p>
                        <p className="text-white font-black text-sm truncate">{profile?.email}</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-12 pt-12 border-t border-gray-800/50 grid grid-cols-3 gap-4">
            <div className="text-center">
                <p className="text-2xl sm:text-4xl font-black text-white">{historyCount}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Seen</p>
            </div>
            <div className="text-center border-x border-gray-800/50">
                <p className="text-2xl sm:text-4xl font-black text-orange-500">{(profile?.balance || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">UZS</p>
            </div>
            <div className="text-center">
                <p className="text-2xl sm:text-4xl font-black text-white">0</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reviews</p>
            </div>
        </div>
      </div>
      
      {/* Sessions and other sections remain same... */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-[2.5rem] p-8">
        <h3 className="text-lg font-black tracking-widest uppercase text-white mb-6 flex items-center gap-3">
            <Monitor size={20} className="text-orange-500"/> Active Devices
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {sessions.map(s => (
                <div key={s.id} className="min-w-[240px] bg-gray-800/30 border border-gray-800 p-5 rounded-3xl">
                    <div className="flex justify-between mb-4">
                        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center"><Monitor size={18}/></div>
                        <span className="text-[9px] font-black uppercase px-2 py-1 bg-green-500/10 text-green-500 rounded-lg">Online</span>
                    </div>
                    <p className="text-white font-bold text-sm truncate mb-1">{s.device_name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">ID: {s.device_id.slice(0,12)}...</p>
                </div>
            ))}
        </div>
      </div>

      {!isDubRole && (
          <div className="pt-10">
              <h2 className="text-2xl font-black text-center text-white mb-10">Upgrade to Premium</h2>
              <SubscriptionPlans />
          </div>
      )}
    </div>
  );
};