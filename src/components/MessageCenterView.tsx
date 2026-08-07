import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Users, 
  Archive, 
  MessageSquare, 
  Phone, 
  Search as SearchIcon, 
  Menu,
  ChevronLeft,
  Circle,
  CheckCheck,
  Send,
  Smile,
  Paperclip,
  Mic,
  Camera,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { CommunityChatView } from './CommunityChatView';
import { supabase } from '../lib/supabase';

interface MessageCenterViewProps {
  user: UserProfile;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline?: boolean;
  isGroup?: boolean;
  isOfficial?: boolean;
  isVerified?: boolean;
}

export const MessageCenterView: React.FC<MessageCenterViewProps> = ({ user }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([
    { 
      id: 'global', 
      name: 'Anilo Chat', 
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=Anilo', 
      lastMessage: 'Guruhda birinchi bo\'lib suhbat boshlang!', 
      time: '09:00', 
      unread: 0,
      isGroup: true,
      isOfficial: true
    },
    { 
      id: 'archived', 
      name: 'Archived chats', 
      avatar: '', 
      lastMessage: 'TONGOTAR TAXI 24/7...', 
      time: '20:58', 
      unread: 62,
      isGroup: false
    },
    { 
      id: 'tech_mentor', 
      name: 'Tech Mentor...', 
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=tech', 
      lastMessage: 'Tech Mentor | </> | {#}: ...', 
      time: '28/07/2026', 
      unread: 0,
      isGroup: true,
      isVerified: true
    },
    { 
      id: 'wentric', 
      name: 'Wentric : Ma...', 
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=WM', 
      lastMessage: '# General 📑 Taklif Ya...', 
      time: '29/06/2026', 
      unread: 0,
      isGroup: true
    },
    { 
      id: 'firdavs', 
      name: 'Firdavs jigarm', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Firdavs', 
      lastMessage: 'Shu boya etgnmdek to...', 
      time: '20:58', 
      unread: 13,
      isOnline: true,
      isVerified: true
    },
    { 
      id: 'web_dev', 
      name: 'Web development...', 
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=web', 
      lastMessage: 'DBM: Do you also want ...', 
      time: '20:58', 
      unread: 43,
      isGroup: true
    },
    { 
      id: 'geografiya', 
      name: 'GEOGRAFIYA [milli...', 
      avatar: 'https://api.dicebear.com/7.x/jdenticon/svg?seed=geo', 
      lastMessage: 'Quiz Bot: 📊 [27/40] ...', 
      time: '20:58', 
      unread: 11211,
      isGroup: true
    }
  ]);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  return (
    <div className="flex h-full w-full bg-[#0E0E12] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl animate-fadeIn">
      {/* Sidebar - List of chats */}
      <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#16161c] ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 space-y-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/5 rounded-full transition text-gray-400">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 bg-white/5 rounded-2xl flex items-center px-4 py-2 gap-3 border border-white/5 focus-within:border-orange-500/50 transition-all">
              <SearchIcon className="w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search" 
                className="bg-transparent border-none focus:outline-none text-sm w-full text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`w-full flex items-center gap-3 p-3.5 hover:bg-white/5 transition-colors border-b border-white/5 relative ${selectedChatId === chat.id ? 'bg-orange-500/10' : ''}`}
            >
              <div className="relative flex-shrink-0">
                {chat.id === 'archived' ? (
                  <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[#16161c] shadow-lg shadow-emerald-500/20">
                    <Archive className="w-7 h-7 text-white" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/5">
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                  </div>
                )}
                {chat.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#16161c]" />}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-black text-sm text-gray-100 truncate">{chat.name}</span>
                    {chat.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />}
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-orange-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ml-2 shadow-lg shadow-orange-600/20">
                      {chat.unread > 999 ? '9k+' : chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat View */}
      <div className={`flex-1 flex flex-col bg-[#0E0E12] relative ${!selectedChatId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!selectedChatId ? (
          <div className="text-center space-y-6 opacity-40">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
              <MessageSquare className="w-12 h-12 text-orange-500/50" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">Select a chat to start messaging</p>
              <p className="text-xs text-gray-500 mt-2">Jamiyatimizga qo'shiling va fikrlaringizni ulashing!</p>
            </div>
          </div>
        ) : selectedChatId === 'global' ? (
          <CommunityChatView 
            user={user} 
            onBack={() => setSelectedChatId(null)} 
          />
        ) : (
          /* Placeholder for private chats */
          <div className="flex flex-col h-full">
            {/* Private Chat Header */}
            <header className="p-4 border-b border-white/5 bg-[#16161c]/80 backdrop-blur-xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChatId(null)} className="md:hidden p-2 text-gray-400 hover:text-white">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10">
                  <img src={selectedChat?.avatar} alt={selectedChat?.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    {selectedChat?.name} {selectedChat?.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />}
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-400">online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl"><Search className="w-5 h-5" /></button>
                <button className="p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl"><Phone className="w-5 h-5" /></button>
                <button className="p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </header>

            {/* Messages Area Placeholder */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-end bg-transparent opacity-50 text-center">
              <p className="text-xs text-gray-500 italic">This is a private conversation with {selectedChat?.name}</p>
              <div className="max-w-md mx-auto p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Notice</p>
                <p className="text-xs text-gray-400">Private messaging is currently being synchronized with our main database servers. Stay tuned!</p>
              </div>
            </div>

            {/* Input Placeholder */}
            <footer className="p-4 bg-[#16161c]/80 backdrop-blur-xl border-t border-white/5">
              <div className="max-w-4xl mx-auto flex items-end gap-3">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-end px-3 py-2.5 gap-2">
                  <button className="p-2 text-gray-500 hover:text-white"><Smile className="w-5.5 h-5.5" /></button>
                  <textarea 
                    placeholder="Message" 
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white resize-none max-h-32 py-1"
                    rows={1}
                  />
                  <button className="p-2 text-gray-500 hover:text-white"><Paperclip className="w-5.5 h-5.5" /></button>
                </div>
                <button className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-black rounded-full shadow-lg shadow-emerald-500/20">
                  <Mic className="w-6 h-6" />
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};
