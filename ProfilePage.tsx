
import React, { useEffect, useState, useRef } from 'react';
import { UserIcon } from './components/icons/UserIcon';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getUserHistory, updateUserProfile, getUserSessions, uploadAvatar } from './services/dbService';
import { UserProfile, UserDevice } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { VerifiedBadge } from './components/VerifiedBadge';
import { Monitor, Hash, Phone, Mail, Award, Edit2, Camera, Loader2 } from 'lucide-react';
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', username: '', phone: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarClick = () => {
      if (!viewUserId) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !profile) return;

      setIsUploadingAvatar(true);
      try {
          const publicUrl = await uploadAvatar(file);
          await updateUserProfile(profile.id, { avatar_url: publicUrl });
          setProfile({ ...profile, avatar_url: publicUrl });
          addNotification({ type: 'success', title: 'Muvaffaqiyatli', message: 'Profil rasmi yangilandi.' });
          
          // Dispatch event to update global header/nav icons
          document.dispatchEvent(new Event('profileUpdated'));
      } catch (error: any) {
          addNotification({ type: 'error', title: 'Yuklashda xato', message: error.message });
      } finally {
          setIsUploadingAvatar(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  if (loading && !profile) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const isPrivileged = ['admin', 'owner', 'manager'].includes(profile?.role || '');
  const isDubRole = profile?.role === 'dub' || profile?.role === 'fandub';

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* 1. Header Card */}
      <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>

        <div className="relative z-10 flex flex-col items-center">
            
            {/* Avatar Section */}
            <div className="relative mb-6">
                <div 
                    onClick={handleAvatarClick}
                    className={`w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 bg-gradient-to-tr from-orange-500 to-red-600 shadow-2xl shadow-orange-500/20 cursor-pointer group transition-transform active:scale-95`}
                >
                    <div className="w-full h-full rounded-full bg-black border-4 border-black overflow-hidden relative">
                        {isUploadingAvatar ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        ) : null}
                        
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600"><UserIcon className="w-16 h-16"/></div>
                        )}
                        
                        {/* Hover Overlay */}
                        {!viewUserId && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="text-white w-8 h-8" />
                            </div>
                        )}
                    </div>
                </div>
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
            {!viewUserId && (
                <div className="mt-6 flex gap-3">
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs font-bold text-white uppercase tracking-widest transition-all flex items-center gap-2">
                            <Edit2 size={14} /> Tahrirlash
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-zinc-800 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-700">Bekor</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-orange-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 shadow-lg shadow-orange-600/20">Saqlash</button>
                        </>
                    )}
                </div>
            )}

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

      {!viewUserId && !isDubRole && (
          <div className="pt-10">
              <h2 className="text-xl font-black text-center text-white mb-8 uppercase tracking-widest">Premiumga o'tish</h2>
              <SubscriptionPlans />
          </div>
      )}
    </div>
  );
};
