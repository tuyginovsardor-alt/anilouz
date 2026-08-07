import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  MessageSquare, 
  Archive, 
  ChevronLeft,
  Search as SearchIcon, 
  ArrowLeft,
  Pin,
  Smile,
  Paperclip,
  Mic,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import { CommunityChatView } from './CommunityChatView';

interface MessageCenterViewProps {
  user: UserProfile;
  onChatOpenStateChange?: (isOpen: boolean) => void;
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

export const MessageCenterView: React.FC<MessageCenterViewProps> = ({ user, onChatOpenStateChange }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([
    { 
      id: 'global', 
      name: 'Anilo Chat', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCahoS-Y66_CT4POhbawjQcmx7T_NxdpvOyfxo49_oCjaAUW0W_14zwGC83pxzh8LKFU7dwAXbznjdQJyo2jEQWmrncSUE4_sgZAYruogQcIezWBcF-HjDlSCuC4RN1FA-V2CPMeo2HESbSeuKE2WlDJGE55f-B3WBM-8DXm3i1EMZBeEfG4p10g-SyaM8Rd1WAxKb5R2CkeCnDFa4I3puxVT4fd3bDQ1GFEIkqeH_KiAwtxLgnFLZPPQ', 
      lastMessage: 'Guruhda birinchi bo\'lib suhbat boshlang!', 
      time: '09:00', 
      unread: 0,
      isGroup: true,
      isOfficial: true,
      isVerified: true
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
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfrN5OJ1rOijavH-VoQLJAzd2PZioNWLJa105qlVRvGyXslk79pHuF7Ta7-2dUNez90FN9ynsIBBCzqr6HfJxZjxYuRHKwk5EuHrZtBCY0HlWDYn-Ya0-i2gJiE1KGzmeca-T8FRF4mu57iefmOoefFYFKPXJhW6xur3dd-ivE8-ZfnrKOIhWy19KgmsdzdQevPEniNdAhUg22KIM2-_cICoBNzQHgMNDfaGAYMapb6-kSWiUWs_KBFA', 
      lastMessage: 'Tech Mentor | </> | {#}: ...', 
      time: '28/07/2026', 
      unread: 0,
      isGroup: true,
      isVerified: true
    },
    { 
      id: 'firdavs', 
      name: 'Firdavs jigarm', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5IFOVyaofofBbTBJP9VnSVevvzjXLOENlBtZ47Xss2Q-6DXlD-mgbD_WgtMYOkCv16bHf2IEXQ-bhWc5zG-fynRzEixrG0MeLXr2KzfGYymsIXVQ4kQBC1cwWG6qhNOB_mudivd5wqFIHXASmeNR5FdV2_BNgHZ2YqIPTBoP52psERjyMkGbMsXpoxyYS_kgFATJheSKXNWdy4izE-mzxJaX1K24jqQM2Qsx44DdbQ5EtNfe-ameOiw', 
      lastMessage: 'Shu boya etgnmdek to...', 
      time: '20:58', 
      unread: 13,
      isOnline: true,
      isVerified: true
    }
  ]);

  useEffect(() => {
    onChatOpenStateChange?.(selectedChatId !== null);
  }, [selectedChatId, onChatOpenStateChange]);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  return (
    <div className="flex h-full w-full bg-[#0c141d] text-[#dbe3f0] antialiased">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-[380px] lg:w-[260px] flex-shrink-0 border-r border-[#2e353f] flex flex-col bg-[#182029] ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-4 border-b border-[#2e353f] bg-[#0c141d] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden">
              <img 
                src={user.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBKU28xU8mpQAKO2wmFlDTRIXt14DGizxOs-rtasJPZMDavES24ZPKXL-kc4kdc0uAO1NsaF59BrplZ81sqPas-H1SgYaFVCqLzFyovy4gTSap0pCxY8CAbp2Sp1LXEidhwV3mzdOns190atrKRJ7HNYfTCuyvVJRNKl2aXvX3ycxXqriuCgYy8i79Ld7-EpYnRbO3aGZyqvVM8TXWUvmb_F0a4_uNs_-TcwlD-tczBA3fYwg-UMOBjxw"}
                className="w-8 h-8 rounded-full border border-[#2e353f]" 
                alt="Profile"
              />
            </button>
            <span className="md:hidden text-lg font-bold">Chat</span>
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-[#e2bfb0]" />
              </div>
              <input 
                type="text" 
                placeholder="Qidirish..." 
                className="w-full bg-[#232b34] border border-[#2e353f] text-[#dbe3f0] text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] placeholder:text-[#e2bfb0]/50"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`w-full flex items-center gap-4 p-4 hover:bg-[#232b34] transition-colors border-b border-[#2e353f]/50 relative group ${selectedChatId === chat.id ? 'bg-[#141c25]' : ''}`}
            >
              {selectedChatId === chat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff6b00]" />}
              <div className="relative shrink-0">
                {chat.id === 'archived' ? (
                  <div className="w-14 h-14 rounded-full bg-emerald-600/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                    <Archive className="w-7 h-7" />
                  </div>
                ) : (
                  <img src={chat.avatar} alt={chat.name} className="w-14 h-14 rounded-full object-cover bg-[#182029] border border-[#2e353f]" />
                )}
                {chat.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#141c25] rounded-full" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`text-base font-bold truncate group-hover:text-[#ff6b00] transition-colors ${selectedChatId === chat.id ? 'text-[#ff6b00]' : 'text-[#dbe3f0]'}`}>
                    {chat.name}
                    {chat.isVerified && <ShieldCheck className="inline-block ml-1 w-4 h-4 text-[#ff6b00] fill-current" />}
                  </h3>
                  <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${chat.unread > 0 ? 'text-[#ff6b00]' : 'text-[#e2bfb0]'}`}>{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#e2bfb0] truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="bg-[#ff6b00] text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center ml-2">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-[#0c141d] relative ${!selectedChatId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!selectedChatId ? (
          <div className="text-center space-y-6 opacity-30">
            <div className="w-24 h-24 rounded-[2.5rem] bg-[#182029] flex items-center justify-center mx-auto border border-[#2e353f]">
              <MessageSquare className="w-12 h-12 text-[#ff6b00]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#dbe3f0] uppercase tracking-widest">Suhbatni tanlang</p>
              <p className="text-xs text-[#e2bfb0] mt-2">Jamiyatimizga qo'shiling va fikrlaringizni ulashing!</p>
            </div>
          </div>
        ) : selectedChatId === 'global' ? (
          <CommunityChatView user={user} onBack={() => setSelectedChatId(null)} />
        ) : (
          <div className="flex flex-col h-full">
            <header className="p-4 border-b border-[#2e353f] bg-[#0c141d] flex items-center justify-between z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChatId(null)} className="text-[#dbe3f0] hover:bg-[#2e353f] p-2 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <img src={selectedChat?.avatar} alt={selectedChat?.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-base font-bold text-[#dbe3f0] flex items-center gap-1.5">
                    {selectedChat?.name} {selectedChat?.isVerified && <ShieldCheck className="w-4 h-4 text-[#ff6b00] fill-current" />}
                  </h1>
                  <span className="text-xs text-[#ffb693] font-bold">online</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-[#ffb693] hover:bg-[#2e353f] p-2 rounded-full transition-colors"><Search className="w-5 h-5" /></button>
                <button className="text-[#e2bfb0] hover:bg-[#2e353f] p-2 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </header>

            <div className="bg-[#232b34] px-6 py-2 flex items-center gap-3 border-l-4 border-[#ff6b00] shrink-0">
              <div className="text-[#ff6b00]">
                <Pin className="w-4 h-4 fill-current" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] text-[#ff6b00] font-bold uppercase tracking-wider">Pinned Message</p>
                <p className="text-xs text-[#dbe3f0] truncate">Yangi loyihalar ustida ishlayapmiz, tez kunda yangiliklar bo'ladi! 🔥</p>
              </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 bg-[#0c141d] bg-[radial-gradient(#2e353f_1px,transparent_1px)] bg-[size:20px_20px] custom-scrollbar">
              <div className="flex justify-center my-2">
                <span className="bg-[#2e353f] text-[#e2bfb0] text-[11px] font-bold px-3 py-1 rounded-full opacity-80 uppercase tracking-widest">Today</span>
              </div>
              <div className="flex items-end gap-2 max-w-[85%] self-start">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1">
                  <img src={selectedChat?.avatar} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="bg-[#182029] p-3 rounded-2xl rounded-bl-sm shadow-sm flex flex-col border border-[#2e353f]/30">
                  <p className="text-sm text-[#dbe3f0]">Salom! Kechagi loyiha bo'yicha qanday yangiliklar bor?</p>
                  <div className="flex justify-end items-center mt-1">
                    <span className="text-[10px] text-[#e2bfb0]">09:15</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-2 max-w-[85%] self-end">
                <div className="bg-[#ff6b00] text-white p-3 rounded-2xl rounded-br-sm shadow-xl flex flex-col relative">
                  <p className="text-sm font-medium">Assalomu alaykum. Hamma narsa tayyor, hozir fayllarni jo'nataman.</p>
                  <div className="flex justify-end items-center mt-1 gap-1">
                    <span className="text-[10px] text-white opacity-80">09:17</span>
                    <CheckCheck className="w-3.5 h-3.5 text-white opacity-90" />
                  </div>
                </div>
              </div>
            </main>

            <footer className="bg-[#232b34] px-4 py-3 flex items-center gap-2 border-t border-[#2e353f] z-20 sticky bottom-0">
              <button className="text-[#e2bfb0] hover:text-[#ff6b00] transition-colors p-2 shrink-0">
                <Paperclip className="w-5.5 h-5.5" />
              </button>
              <div className="flex-1 bg-[#182029] rounded-full px-4 py-2 flex items-center border border-[#2e353f] focus-within:border-[#ff6b00] transition-colors">
                <input 
                  type="text" 
                  placeholder="Xabaringizni yozing..." 
                  className="w-full bg-transparent border-none outline-none text-sm text-[#dbe3f0] placeholder:text-[#e2bfb0]/50 focus:ring-0 p-0"
                />
                <button className="text-[#e2bfb0] hover:text-[#ff6b00] transition-colors p-1 shrink-0 ml-2">
                  <Smile className="w-5.5 h-5.5" />
                </button>
              </div>
              <button className="bg-[#ff6b00] hover:brightness-110 text-white p-3 rounded-full shrink-0 transition-transform active:scale-95 shadow-lg shadow-[#ff6b00]/20">
                <Mic className="w-6 h-6 fill-current" />
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};
