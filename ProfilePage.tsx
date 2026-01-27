
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getUserHistory, updateUserProfile, uploadAvatar } from './services/dbService';
import { UserProfile, Movie } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { VerifiedBadge } from './components/VerifiedBadge';
import { 
    Phone, Info, AtSign, Calendar, Edit2, Camera, 
    ArrowLeft, MoreVertical, Check, Image as ImageIcon,
    Clock, Wallet
} from 'lucide-react';
import { Page } from './App';
import { MovieCard } from './components/MovieCard';

interface ProfilePageProps {
    viewUserId?: string | null;
    onMainNavigate?: (page: Page) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ viewUserId, onMainNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Movie[]>([]);
  const { addNotification } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Telegram style fields
  const [editForm, setEditForm] = useState({ 
      full_name: '', 
      username: '', 
      phone: '', 
      bio: '' 
  });
  
  const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');
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
            bio: profileData?.bio || '',
        });

        const historyData = await getUserHistory(targetUserId);
        setHistory(historyData);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
      if (!profile) return;
      // Basic validation
      if (!editForm.full_name.trim()) return addNotification({ type: 'warning', title: 'Xatolik', message: 'Ism kiritish shart' });

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
      if (!viewUserId && isEditing) fileInputRef.current?.click();
      else if (!viewUserId && !isEditing) {
          // Just show photo preview logic if needed, or trigger edit
          // For now, allow upload only in edit mode or always? 
          // Telegram allows changing photo anytime.
          fileInputRef.current?.click(); 
      }
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
          document.dispatchEvent(new Event('profileUpdated'));
      } catch (error: any) {
          addNotification({ type: 'error', title: 'Yuklashda xato', message: error.message });
      } finally {
          setIsUploadingAvatar(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  if (loading && !profile) return <div className="flex justify-center py-20 bg-[#1c1c1d] min-h-screen"><LoadingSpinner /></div>;

  const isMyProfile = !viewUserId;
  const bgColor = "#1c1c1d"; // Telegram Dark Background
  const cardColor = "#2c2c2e"; // Telegram Card/Section Background

  return (
    <div className="min-h-screen pb-20 animate-fade-in font-sans" style={{ backgroundColor: bgColor }}>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* --- HEADER (Telegram Style) --- */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#1c1c1d]/90 backdrop-blur-md">
          <button onClick={() => onMainNavigate && onMainNavigate('dashboard')} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
          </button>
          
          <div className="flex gap-4 text-white">
              {isMyProfile && (
                  isEditing ? (
                      <button onClick={handleSave} className="p-2 text-blue-400 hover:bg-white/10 rounded-full transition-colors">
                          <Check size={24} />
                      </button>
                  ) : (
                      <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <Edit2 size={22} />
                      </button>
                  )
              )}
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <MoreVertical size={24} />
              </button>
          </div>
      </div>

      {/* --- AVATAR & NAME SECTION --- */}
      <div className="flex flex-col items-center pt-2 pb-8">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-32 h-32 rounded-full overflow-hidden bg-black border border-white/5 relative">
                  {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-4xl font-bold">
                          {profile?.full_name?.charAt(0) || 'U'}
                      </div>
                  )}
                  
                  {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <LoadingSpinner />
                      </div>
                  )}
                  
                  {isMyProfile && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera className="text-white w-8 h-8" />
                      </div>
                  )}
              </div>
          </div>

          <div className="mt-4 text-center px-4 w-full">
              {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.full_name}
                    onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                    className="bg-transparent border-b border-blue-500 text-center text-2xl font-bold text-white w-full outline-none pb-1"
                    placeholder="Ism Familiya"
                    autoFocus
                  />
              ) : (
                  <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                      {profile?.full_name || 'Foydalanuvchi'}
                      {(['admin', 'owner', 'dub'].includes(profile?.role || '')) && (
                          <VerifiedBadge type="gold" className="w-5 h-5" />
                      )}
                  </h1>
              )}
              
              <p className="text-gray-400 text-sm mt-1">
                  {profile?.is_online ? <span className="text-blue-400">online</span> : 'yaqinda kirgan'}
              </p>
          </div>
      </div>

      {/* --- INFO LIST SECTION --- */}
      <div className="mx-0 md:mx-4 mb-6">
          <div className="rounded-none md:rounded-xl overflow-hidden" style={{ backgroundColor: cardColor }}>
              
              {/* Phone */}
              <div className="flex items-center p-4 border-b border-[#3a3a3c] hover:bg-white/5 transition-colors">
                  <div className="mr-5 text-gray-400"><Phone size={22} /></div>
                  <div className="flex-1">
                      {isEditing ? (
                          <input 
                            type="text" 
                            value={editForm.phone}
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                            className="bg-transparent text-white text-base w-full outline-none border-b border-blue-500"
                            placeholder="+998 90 123 45 67"
                          />
                      ) : (
                          <p className="text-blue-400 text-base">{profile?.phone || 'Kiritilmagan'}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-0.5">Mobil raqam</p>
                  </div>
              </div>

              {/* Bio */}
              <div className="flex items-center p-4 border-b border-[#3a3a3c] hover:bg-white/5 transition-colors">
                  <div className="mr-5 text-gray-400"><Info size={22} /></div>
                  <div className="flex-1">
                      {isEditing ? (
                          <textarea 
                            value={editForm.bio}
                            onChange={e => setEditForm({...editForm, bio: e.target.value})}
                            className="bg-transparent text-white text-base w-full outline-none border-b border-blue-500 resize-none h-10"
                            placeholder="O'zingiz haqingizda..."
                          />
                      ) : (
                          <p className="text-white text-base whitespace-pre-wrap">{profile?.bio || 'Tarjimayi hol mavjud emas'}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-0.5">Tarjimayi hol</p>
                  </div>
              </div>

              {/* Username */}
              <div className="flex items-center p-4 border-b border-[#3a3a3c] hover:bg-white/5 transition-colors">
                  <div className="mr-5 text-gray-400"><AtSign size={22} /></div>
                  <div className="flex-1">
                      {isEditing ? (
                          <input 
                            type="text" 
                            value={editForm.username}
                            onChange={e => setEditForm({...editForm, username: e.target.value})}
                            className="bg-transparent text-white text-base w-full outline-none border-b border-blue-500"
                            placeholder="username"
                          />
                      ) : (
                          <p className="text-blue-400 text-base">@{profile?.username || 'username'}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-0.5">Foydalanuvchi nomi</p>
                  </div>
              </div>

              {/* Date */}
              <div className="flex items-center p-4 hover:bg-white/5 transition-colors">
                  <div className="mr-5 text-gray-400"><Calendar size={22} /></div>
                  <div className="flex-1">
                      <p className="text-white text-base">{new Date(profile?.created_at || Date.now()).toLocaleDateString()}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Ro'yxatdan o'tgan sana</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- TABS (POSTS / MEDIA STYLE) --- */}
      <div className="mt-4">
          <div className="flex border-b border-[#3a3a3c] bg-[#1c1c1d]">
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide text-center relative ${activeTab === 'history' ? 'text-blue-400' : 'text-gray-500'}`}
              >
                  Ko'rilganlar
                  {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide text-center relative ${activeTab === 'saved' ? 'text-blue-400' : 'text-gray-500'}`}
              >
                  Moliya
                  {activeTab === 'saved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>}
              </button>
          </div>

          <div className="min-h-[200px]">
              {activeTab === 'history' && (
                  <div className="grid grid-cols-3 gap-0.5">
                      {history.map(movie => (
                          <div key={movie.id} className="aspect-[2/3] relative bg-gray-800 cursor-pointer">
                              <img src={movie.posterUrl} className="w-full h-full object-cover" alt="" />
                              <div className="absolute inset-0 bg-black/20 flex items-end p-1">
                                  <span className="text-[10px] text-white font-bold drop-shadow-md line-clamp-1">{movie.title}</span>
                              </div>
                          </div>
                      ))}
                      {history.length === 0 && (
                          <div className="col-span-3 py-10 flex flex-col items-center text-gray-500">
                              <Clock size={40} className="mb-2 opacity-50"/>
                              <p className="text-sm">Tarix bo'sh</p>
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'saved' && (
                  <div className="p-4">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white shadow-lg mb-4">
                          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Mening Balansim</p>
                          <h2 className="text-3xl font-bold">{(profile?.balance || 0).toLocaleString()} <span className="text-lg">UZS</span></h2>
                      </div>
                      
                      <div className="space-y-2">
                          <button className="w-full py-3 bg-[#2c2c2e] rounded-lg text-blue-400 font-bold text-sm flex items-center justify-center gap-2">
                              <Wallet size={18} />
                              Hisobni to'ldirish
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};
