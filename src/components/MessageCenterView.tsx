import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MoreVertical, 
  Send, 
  Archive, 
  ChevronLeft,
  Search as SearchIcon, 
  ArrowLeft,
  Pin,
  Smile,
  Paperclip,
  Mic,
  ShieldCheck,
  CheckCheck,
  Image as ImageIcon,
  Check,
  X,
  Phone,
  Video
} from 'lucide-react';
import { UserProfile } from '../types';
import { CommunityChatView } from './CommunityChatView';

interface MessageCenterViewProps {
  user: UserProfile;
  onChatOpenStateChange?: (isOpen: boolean) => void;
}

interface DirectMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  isRead?: boolean;
  image?: string;
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
  messages?: DirectMessage[];
}

export const MessageCenterView: React.FC<MessageCenterViewProps> = ({ user, onChatOpenStateChange }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      id: 'tech_mentor', 
      name: 'Tech Mentor (Anilo Admin)', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfrN5OJ1rOijavH-VoQLJAzd2PZioNWLJa105qlVRvGyXslk79pHuF7Ta7-2dUNez90FN9ynsIBBCzqr6HfJxZjxYuRHKwk5EuHrZtBCY0HlWDYn-Ya0-i2gJiE1KGzmeca-T8FRF4mu57iefmOoefFYFKPXJhW6xur3dd-ivE8-ZfnrKOIhWy19KgmsdzdQevPEniNdAhUg22KIM2-_cICoBNzQHgMNDfaGAYMapb6-kSWiUWs_KBFA', 
      lastMessage: 'Assalomu alaykum! Sayt yoki animelar bo\'yicha qanday yordam kerak?', 
      time: '09:15', 
      unread: 1,
      isOnline: true,
      isVerified: true,
      messages: [
        {
          id: 'm1',
          text: 'Assalomu alaykum! Anilo.uz platformasiga xush kelibsiz!',
          sender: 'them',
          time: '09:10',
          isRead: true
        },
        {
          id: 'm2',
          text: 'Yangi 4K animelar va o\'zbekcha dublyajlar yuklandi. Savollaringiz bo\'lsa bemalol yozing!',
          sender: 'them',
          time: '09:15',
          isRead: true
        }
      ]
    },
    { 
      id: 'firdavs', 
      name: 'Firdavs (Dublyaj Aktyori)', 
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5IFOVyaofofBbTBJP9VnSVevvzjXLOENlBtZ47Xss2Q-6DXlD-mgbD_WgtMYOkCv16bHf2IEXQ-bhWc5zG-fynRzEixrG0MeLXr2KzfGYymsIXVQ4kQBC1cwWG6qhNOB_mudivd5wqFIHXASmeNR5FdV2_BNgHZ2YqIPTBoP52psERjyMkGbMsXpoxyYS_kgFATJheSKXNWdy4izE-mzxJaX1K24jqQM2Qsx44DdbQ5EtNfe-ameOiw', 
      lastMessage: 'Shu boya etganimdek yangi qism ovozlashtirildi 🔥', 
      time: '20:58', 
      unread: 0,
      isOnline: true,
      isVerified: true,
      messages: [
        {
          id: 'm1',
          text: 'Salom do\'stim! Solo Leveling va Jujutsu Kaisen yangi qismini ko\'rdingmi?',
          sender: 'them',
          time: '20:55',
          isRead: true
        },
        {
          id: 'm2',
          text: 'Shu boya etganimdek yangi qism ovozlashtirildi 🔥',
          sender: 'them',
          time: '20:58',
          isRead: true
        }
      ]
    },
    { 
      id: 'archived', 
      name: 'Arxiv xabarlar', 
      avatar: '', 
      lastMessage: 'Oldingi saqlangan bildirishnomalar', 
      time: '18:30', 
      unread: 0,
      isGroup: false,
      messages: [
        {
          id: 'm1',
          text: 'Bu yerda arxivlangan va eski muhim xabarlar joylashgan.',
          sender: 'them',
          time: '18:30',
          isRead: true
        }
      ]
    }
  ]);

  useEffect(() => {
    onChatOpenStateChange?.(selectedChatId !== null);
  }, [selectedChatId, onChatOpenStateChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, selectedChatId]);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedChatId) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const newMsgText = inputText.trim();

    const newMsg: DirectMessage = {
      id: 'msg-' + Date.now(),
      text: newMsgText,
      sender: 'me',
      time: timeStr,
      isRead: false
    };

    setChats(prevChats => prevChats.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          lastMessage: newMsgText,
          time: timeStr,
          messages: [...(c.messages || []), newMsg]
        };
      }
      return c;
    }));

    setInputText('');
    setShowEmojiPicker(false);

    // Simulated quick response from the other person
    if (selectedChatId !== 'global') {
      setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        const replies = [
          "Rahmat! Xabaringizni qabul qildim 👍",
          "Ajoyib! Bugun yangi qismni saytga joylaymiz 🔥",
          "Tushunarli! Anilo.uz ni kuzatib boring, tez orada yangi yangiliklar bo'ladi ✨",
          "Ha albatta, taklifingiz uchun minnatdormiz! 🚀"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const autoReplyMsg: DirectMessage = {
          id: 'reply-' + Date.now(),
          text: randomReply,
          sender: 'them',
          time: replyTime,
          isRead: true
        };

        setChats(prev => prev.map(c => {
          if (c.id === selectedChatId) {
            return {
              ...c,
              lastMessage: randomReply,
              time: replyTime,
              messages: [...(c.messages || []), autoReplyMsg]
            };
          }
          return c;
        }));
      }, 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const EMOJIS = ['😊', '😂', '🔥', '❤️', '👍', '🎉', '🍿', '👑', '✨', '⚡', '😍', '🤝'];

  return (
    <div className="flex h-full w-full bg-[#0c141d] text-[#dbe3f0] antialiased">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-[380px] lg:w-[320px] flex-shrink-0 border-r border-[#2e353f]/30 flex flex-col bg-[#0c141d] ${selectedChatId ? 'hidden md:flex' : 'flex h-full'}`}>
        <header className="p-4 bg-[#0c141d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-[#182029]">
               <img src={user.avatar || 'https://ui-avatars.com/api/?name=User'} className="w-full h-full object-cover" alt="Me" />
            </div>
            <h1 className="text-[20px] font-bold text-white tracking-tight">Chat</h1>
          </div>
          <button className="text-white/80 hover:text-white p-2">
            <Search className="w-5 h-5" />
          </button>
        </header>

        <div className="px-4 mb-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4.5 h-4.5 text-[#e2bfb0]/30" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, contacts, or messages..." 
              className="w-full bg-[#182029] border border-transparent text-[#dbe3f0] text-[14px] rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:bg-[#232b34] transition-colors placeholder:text-[#e2bfb0]/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => {
                setSelectedChatId(chat.id);
                // mark as read
                setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-4 hover:bg-[#182029]/50 transition-colors relative group text-left ${selectedChatId === chat.id ? 'bg-[#182029]/80' : ''}`}
            >
              {chat.id === 'global' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff6b00]" />}
              <div className="relative shrink-0">
                {chat.id === 'archived' ? (
                  <div className="w-14 h-14 rounded-full bg-[#182029] text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <Archive className="w-6 h-6" />
                  </div>
                ) : (
                  <img src={chat.avatar || 'https://ui-avatars.com/api/?name=' + chat.name} alt={chat.name} className="w-14 h-14 rounded-full object-cover bg-[#182029] border border-white/5" />
                )}
                {chat.isOnline && <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#0c141d] rounded-full" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`text-[15px] font-bold truncate tracking-tight ${selectedChatId === chat.id ? 'text-white' : 'text-[#dbe3f0]'}`}>
                    {chat.name}
                    {chat.isVerified && <ShieldCheck className="inline-block ml-1 w-4 h-4 text-[#ff6b00] fill-current" />}
                  </h3>
                  <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${chat.unread > 0 ? 'text-[#ff6b00]' : 'text-[#e2bfb0]/40'}`}>{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[13px] text-[#e2bfb0]/60 truncate leading-snug">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="bg-[#ff6b00] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.4rem] text-center ml-2 shadow-lg shadow-orange-500/20">
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
              <Send className="w-12 h-12 text-[#ff6b00] -rotate-45" />
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
            <header className="p-4 border-b border-[#2e353f]/30 bg-[#0c141d] flex items-center justify-between z-10 sticky top-0 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChatId(null)} className="text-[#dbe3f0] hover:bg-white/5 p-2 rounded-full transition-colors md:hidden">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/5">
                  <img src={selectedChat?.avatar || 'https://ui-avatars.com/api/?name=' + selectedChat?.name} alt={selectedChat?.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-[15px] font-bold text-white flex items-center gap-1.5 tracking-tight">
                    {selectedChat?.name} {selectedChat?.isVerified && <ShieldCheck className="w-4 h-4 text-[#ff6b00] fill-current" />}
                  </h1>
                  <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="text-white/70 hover:text-white hover:bg-white/5 p-2 rounded-full transition-colors"><Search className="w-5.5 h-5.5" /></button>
                <button className="text-white/70 hover:text-white hover:bg-white/5 p-2 rounded-full transition-colors"><MoreVertical className="w-5.5 h-5.5" /></button>
              </div>
            </header>

            {/* Private Message Chat History */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3.5 bg-[#0c141d] custom-scrollbar">
              <div className="flex justify-center my-2">
                <span className="bg-[#182029] text-[#e2bfb0] text-[10px] font-bold px-4 py-1 rounded-full opacity-60 uppercase tracking-widest border border-white/5">
                  Bugun
                </span>
              </div>

              {(!selectedChat?.messages || selectedChat.messages.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <div className="w-16 h-16 rounded-2xl bg-[#182029] flex items-center justify-center mb-4 border border-white/5">
                    <Send className="w-8 h-8 text-[#ff6b00] -rotate-45" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-tighter">Suhbatni boshlang</h2>
                  <p className="text-xs text-center mt-2 max-w-[200px]">Xabar yozing va suhbatdosh bilan muloqot qiling!</p>
                </div>
              ) : (
                selectedChat.messages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div 
                        className={`max-w-[82%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-lg relative flex flex-col gap-1 ${
                          isMe 
                            ? 'bg-[#ff6b00] text-black font-medium rounded-br-none' 
                            : 'bg-[#182029] text-[#dbe3f0] border border-white/5 rounded-bl-none'
                        }`}
                      >
                        <p className="text-[13.5px] leading-relaxed break-words">{msg.text}</p>
                        <div className={`flex items-center justify-end gap-1 text-[9.5px] font-mono mt-0.5 ${isMe ? 'text-black/60' : 'text-[#e2bfb0]/50'}`}>
                          <span>{msg.time}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 ml-0.5 text-black/70" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </main>

            {/* Emoji bar */}
            {showEmojiPicker && (
              <div className="bg-[#182029] border-t border-white/5 px-4 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="text-xl hover:scale-125 transition-transform p-1 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Footer */}
            <footer className="bg-[#0c141d] px-4 py-4 flex items-center gap-3 border-t border-[#2e353f]/30 z-20">
              <div className="flex-1 bg-[#182029] rounded-2xl px-4 py-2.5 flex items-center border border-[#2e353f]/50 focus-within:border-[#ff6b00]/30 transition-all shadow-inner">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`transition-colors p-1 shrink-0 mr-2 ${showEmojiPicker ? 'text-[#ff6b00]' : 'text-[#e2bfb0]/60 hover:text-[#ff6b00]'}`}
                  type="button"
                >
                  <Smile className="w-6 h-6" />
                </button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Xabaringizni yozing..." 
                  className="w-full bg-transparent border-none outline-none text-[14px] text-[#dbe3f0] placeholder:text-[#e2bfb0]/30 focus:ring-0 p-0"
                />
                <button 
                  type="button"
                  onClick={() => setInputText(prev => prev + ' 🎬 ')}
                  className="text-[#e2bfb0]/60 hover:text-[#ff6b00] transition-colors p-1 shrink-0 ml-2"
                  title="Anime stiker"
                >
                  <ImageIcon className="w-5.5 h-5.5" />
                </button>
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-[#232b34] hover:bg-[#ff6b00] hover:text-black text-white disabled:opacity-40 p-3.5 rounded-2xl shrink-0 transition-all active:scale-90 shadow-lg group"
                type="button"
              >
                <Send className="w-5.5 h-5.5 -rotate-[30deg] translate-x-0.5 -translate-y-0.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

