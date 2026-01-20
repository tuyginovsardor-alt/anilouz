
import React, { useEffect, useState } from 'react';
import { UserIcon } from './components/icons/UserIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getUserHistory, updateUserProfile, getUserSessions } from './services/dbService';
import { UserProfile, UserDevice } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { VerifiedBadge } from './components/VerifiedBadge';
import { Monitor, Hash, Phone, Mail, Award, Mic, Edit2, Camera } from 'lucide-react';
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
    <div className="animate-fade-in pb-20">
      
      {/* 1. Header Card (New Design) */}
      <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>

        <div className="relative z-10 flex flex-col items-center">
            
            {/* Avatar Section */}
            <div className="relative mb-6">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 bg-gradient-to-tr from-orange-500 to-red-600 shadow-2xl shadow-orange-500/20">
                    <div className="w-full h-full rounded-full bg-black border-4 border-black overflow-hidden">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600"><UserIcon className="w-16 h-16"/></div>
                        )}
                    </div>
                </div>
                {isEditing && (
                    <button className="absolute bottom-2 right-2 p-2 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-colors">
                        <Camera size={16} />
                    </button>
                )}
                {!isEditing && (
                    <div className="absolute -bottom-2 -right-2 bg-zinc-900 p-2 rounded-full border border-zinc-800">
                        <VerifiedBadge type={isPrivileged || isDubRole ? 'gold' : 'silver'} className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* Name & Username */}
            {!isEditing ? (
                <>
                    <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight text-center">{profile?.full_name || 'Foydalanuvchi'}</h2>
                    <p className="text-orange-500 font-bold text-sm mt-1">@{profile?.username || 'username'}</p>
                </>
            ) : (
                <div className="w-full max-w-sm space-y-3 mb-4">
                    <input 
                        type="text" 
                        value={editForm.full_name} 
                        onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-center font-bold text-white focus:border-orange-500 outline-none"
                        placeholder="Ism Familiya"
                    />
                    <input 
                        type="text" 
                        value={editForm.username} 
                        onChange={e => setEditForm({...editForm, username: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-center text-orange-500 font-bold focus:border-orange-500 outline-none"
                        placeholder="@username"
                    />
                </div>
            )}

            {/* Edit / Save Buttons */}
            <div className="mt-6 flex gap-3">
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs font-bold text-white uppercase tracking-widest transition-all flex items-center gap-2">
                        <Edit2 size={14} /> Tahrirlash
                    </button>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-zinc-800 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-700">Bekor qilish</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-orange-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 shadow-lg shadow-orange-600/20">Saqlash</button>
                    </>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-8 mt-10 w-full max-w-lg border-t border-white/5 pt-8">
                <div className="text-center">
                    <p className="text-2xl font-black text-white">{historyCount}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ko'rildi</p>
                </div>
                <div className="text-center border-x border-white/5">
                    <p className="text-2xl font-black text-orange-500">{(profile?.balance || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Balans (UZS)</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-black text-white">0</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sharhlar</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-zinc-500"><Mail size={20}/></div>
              <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</p>
                  <p className="text-white font-bold text-sm truncate w-48">{profile?.email}</p>
              </div>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-zinc-500"><Phone size={20}/></div>
              <div className="flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Telefon</p>
                  {isEditing ? (
                      <input 
                        type="tel" 
                        value={editForm.phone} 
                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                        className="bg-transparent border-b border-zinc-700 text-white font-bold text-sm w-full focus:border-orange-500 outline-none"
                        placeholder="+998..."
                      />
                  ) : (
                      <p className="text-white font-bold text-sm">{profile?.phone || "Kiritilmagan"}</p>
                  )}
              </div>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-zinc-500"><Hash size={20}/></div>
              <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ID Raqam</p>
                  <p className="text-white font-bold text-sm">{profile?.short_id || "---"}</p>
              </div>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-zinc-500"><Award size={20}/></div>
              <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Maqom</p>
                  <p className="text-white font-bold text-sm uppercase">{profile?.role}</p>
              </div>
          </div>
      </div>

      {/* 3. Special Access */}
      {isDubRole && !viewUserId && (
          <button 
            onClick={() => onMainNavigate?.('dub-dashboard')}
            className="w-full mt-4 p-6 bg-gradient-to-r from-purple-900 to-blue-900 rounded-[2rem] border border-purple-500/30 flex items-center justify-between group hover:scale-[1.01] transition-transform shadow-2xl"
          >
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/40">
                      <Mic size={24} />
                  </div>
                  <div className="text-left">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Studio Xona</h3>
                      <p className="text-[10px] text-purple-200 font-bold uppercase tracking-widest">Ovoz berish va Statistika</p>
                  </div>
              </div>
              <div className="bg-white/10 p-2 rounded-full text-white group-hover:bg-white group-hover:text-purple-900 transition-colors">
                  <ArrowRightIcon />
              </div>
          </button>
      )}

      {/* 4. Active Sessions */}
      <div className="mt-8">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Monitor size={16} className="text-orange-500"/> Faol Qurilmalar
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {sessions.map(s => (
                <div key={s.id} className="min-w-[200px] bg-zinc-900 border border-white/5 p-5 rounded-[2rem]">
                    <div className="flex justify-between mb-3">
                        <Monitor size={18} className="text-zinc-600"/>
                        <span className="text-[9px] font-black uppercase px-2 py-1 bg-green-900/30 text-green-400 rounded-lg">Online</span>
                    </div>
                    <p className="text-white font-bold text-xs truncate">{s.device_name}</p>
                    <p className="text-[9px] text-zinc-500 font-mono mt-1">{s.device_id.slice(0,12)}...</p>
                </div>
            ))}
        </div>
      </div>

      {!isDubRole && (
          <div className="pt-10">
              <h2 className="text-xl font-black text-center text-white mb-8 uppercase tracking-widest">Premiumga o'tish</h2>
              <SubscriptionPlans />
          </div>
      )}
    </div>
  );
};

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);
