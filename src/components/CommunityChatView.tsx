import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, MoreVertical, Trash2, Bell, Film, LogOut, Crown, Reply, 
  Smile, Image as ImageIcon, Mic, Send, ChevronDown, Sparkles, X, Search, CheckCheck, Users
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { supabase } from '../lib/supabase';

interface CommunityChatViewProps {
  user: UserProfile;
  onBack: () => void;
}

export const CommunityChatView: React.FC<CommunityChatViewProps> = ({ user, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch messages from Supabase
  useEffect(() => {
    const fetchMessages = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Xabarlarni yuklashda xatolik:', error);
      } else if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          senderName: m.sender_name || 'ANILO FAN',
          senderAvatar: m.sender_avatar || '',
          isAdmin: m.is_admin,
          isSelf: m.sender_name === user.name, // Simple check for now
          text: m.content,
          image: m.image_url,
          timestamp: new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          userColor: m.user_color,
          quotedSender: m.quoted_sender,
          quotedText: m.quoted_text
        })));
      }
      setIsLoading(false);
      setTimeout(() => scrollToBottom('auto'), 100);
    };

    fetchMessages();

    // Real-time subscription
    if (supabase) {
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMessage = payload.new;
          const formattedMsg: ChatMessage = {
            id: newMessage.id,
            senderName: newMessage.sender_name,
            senderAvatar: newMessage.sender_avatar,
            isAdmin: newMessage.is_admin,
            isSelf: newMessage.sender_name === user.name, 
            text: newMessage.content,
            image: newMessage.image_url,
            timestamp: new Date(newMessage.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
            userColor: newMessage.user_color,
            quotedSender: newMessage.quoted_sender,
            quotedText: newMessage.quoted_text
          };
          setMessages((prev) => {
            if (prev.find(p => p.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });
          scrollToBottom();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user.name]);

  const handleSendMessage = async (customImageUrl?: string) => {
    if (!inputText.trim() && !customImageUrl) return;

    const msgContent = inputText;
    const msgImage = customImageUrl || imageUrlInput;

    const isAdmin = user.role === 'admin' || user.role === 'owner';
    const timeString = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    
    const localNewMessage: ChatMessage = {
      id: 'local-' + Date.now(),
      senderName: user.name || 'ANILO FAN',
      senderAvatar: user.avatar,
      isAdmin: isAdmin,
      isSelf: true,
      text: msgContent,
      image: msgImage,
      quotedSender: replyTo ? replyTo.senderName : undefined,
      quotedText: replyTo ? (replyTo.text || '[Rasm]') : undefined,
      timestamp: timeString,
      userColor: isAdmin ? 'text-yellow-400' : 'text-emerald-400',
    };

    // Immediate optimistic local update
    setMessages((prev) => [...prev, localNewMessage]);
    setTimeout(() => scrollToBottom('smooth'), 50);

    if (supabase) {
      try {
        await supabase
          .from('messages')
          .insert([{
            sender_name: user.name || 'ANILO EGA²',
            sender_avatar: user.avatar,
            is_admin: isAdmin,
            content: msgContent,
            image_url: msgImage,
            quoted_sender: replyTo?.senderName,
            quoted_text: replyTo ? (replyTo.text || '[Rasm]') : undefined,
            user_color: isAdmin ? 'text-yellow-400' : 'text-emerald-400',
            group_id: 'public'
          }]);
      } catch (e) {
        console.warn("Supabase message save note:", e);
      }
    }

    setInputText('');
    setReplyTo(null);
    setShowEmojiPicker(false);
    setShowImageModal(false);
    setImageUrlInput('');
  };

  const handleSelectImage = (url: string) => {
    handleSendMessage(url);
  };

  const handleClearChat = async () => {
    if (confirm("Chat xabarlarini tozalashni xohlaysizmi? (Faqat sizda tozalanadi)")) {
      setMessages([]);
      setIsMenuOpen(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery.trim()) return true;
    const textMatch = msg.text?.toLowerCase().includes(searchQuery.toLowerCase());
    const senderMatch = msg.senderName.toLowerCase().includes(searchQuery.toLowerCase());
    return textMatch || senderMatch;
  });

  const SAMPLE_EMOJIS = ['😊', '😂', '🔥', '❤️', '🤝', '👍', '🍿', '👑', '✨', '⚡', '😍', '🎉'];

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto bg-[#14141f]/40 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 overflow-hidden animate-fadeIn relative shadow-2xl">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1600&auto=format&fit=crop" 
          alt="Chat Wallpaper" 
          className="w-full h-full object-cover opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f111a]/90 via-[#0f111a]/60 to-[#0f111a]/90" />
      </div>

      {/* Header */}
      <header className="relative z-20 bg-[#1e1e28]/95 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center border border-white/20 shadow-lg shadow-orange-500/20">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xs sm:text-base font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                Anilo.chat <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-orange-400" />
              </h1>
              <p className="text-[9px] sm:text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {isLoading ? 'Yuklanmoqda...' : `${messages.length} ta xabar`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-1.5 sm:p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
            title="Xabarlarni qidirish"
          >
            <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 sm:p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
            >
              <MoreVertical className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1c1b24]/98 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-fadeIn">
                <div className="flex flex-col py-1.5 text-xs font-semibold">
                  <button 
                    onClick={handleClearChat}
                    className="px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-orange-400"
                  >
                    <Trash2 className="w-4 h-4" /> Chatni tozalash (Local)
                  </button>
                  <button 
                    onClick={() => {
                      setNotificationsEnabled(!notificationsEnabled);
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-200"
                  >
                    <Bell className={`w-4 h-4 ${notificationsEnabled ? 'text-orange-400' : 'text-gray-500'}`} /> 
                    {notificationsEnabled ? 'Bildirishnomalar: ON' : 'Bildirishnomalar: OFF'}
                  </button>
                  <button 
                    onClick={() => {
                      setShowImageModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-200"
                  >
                    <Film className="w-4 h-4 text-orange-400" /> Media galereya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="relative z-20 bg-[#181822]/95 backdrop-blur-md p-2.5 sm:p-3 border-b border-white/10 flex items-center gap-2 animate-slideDown">
          <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 ml-2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Xabarlarni izlash..."
            className="flex-1 bg-transparent text-[10px] sm:text-xs text-white placeholder-gray-500 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-white">
              <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar bg-transparent pb-10">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-gray-500 opacity-60">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-white/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400/50" />
            </div>
            <div>
              <p className="text-xs sm:text-base font-black text-gray-400 uppercase tracking-widest">Suhbatni boshlang</p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-2">Jamiyatimizga qo'shiling va fikrlaringizni ulashing!</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isSelfMsg = msg.isSelf;
            const isAdminMsg = msg.isAdmin;
            
            return (
              <div 
                key={msg.id || index}
                className={`flex gap-2 sm:gap-3 w-full ${isSelfMsg ? 'justify-end' : 'justify-start'} animate-messageIn`}
              >
                {!isSelfMsg && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 mt-auto shadow-md">
                    <img 
                      src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${msg.senderName}&background=random`}
                      alt={msg.senderName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className={`flex flex-col gap-1 sm:gap-1.5 max-w-[88%] sm:max-w-[75%] ${isSelfMsg ? 'items-end' : 'items-start'}`}>
                  {!isSelfMsg && (
                    <span className={`text-[9px] sm:text-[11px] font-black px-1.5 ${msg.userColor || (isAdminMsg ? 'text-yellow-400' : 'text-emerald-400')}`}>
                      {msg.senderName} {isAdminMsg && '👑'}
                    </span>
                  )}
                  
                  <div 
                    onClick={() => setReplyTo(msg)}
                    className={`relative p-2.5 sm:p-4 rounded-[1.2rem] sm:rounded-2xl shadow-xl transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer group ${
                      isSelfMsg 
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-black font-medium rounded-br-none border border-orange-400/30' 
                        : 'bg-[#1e1e28]/98 backdrop-blur-md border border-white/10 rounded-bl-none text-gray-100'
                    }`}
                  >
                    {msg.quotedText && (
                      <div className={`border-l-2 sm:border-l-3 ${isSelfMsg ? 'border-black/30 bg-black/5' : 'border-orange-500 bg-orange-500/10'} pl-2 sm:pl-3 py-1 sm:py-1.5 mb-2 sm:mb-2.5 rounded-r-xl text-[9px] sm:text-[10px] opacity-80 backdrop-blur-sm`}>
                        <p className="font-black truncate uppercase tracking-tighter opacity-70">{msg.quotedSender}</p>
                        <p className="truncate line-clamp-1 italic">{msg.quotedText}</p>
                      </div>
                    )}

                    {msg.image && (
                      <div className="mb-2 sm:mb-2.5 rounded-lg sm:rounded-xl overflow-hidden border border-black/10 shadow-inner">
                        <img src={msg.image} alt="Media" className="w-full h-auto max-h-60 sm:max-h-80 object-cover" />
                      </div>
                    )}

                    <p className="text-[11px] sm:text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    <div className={`flex items-center gap-1 sm:gap-1.5 self-end text-[8px] sm:text-[9px] mt-1.5 sm:mt-2 font-mono ${isSelfMsg ? 'text-black/50' : 'text-gray-500'}`}>
                      <span>{msg.timestamp}</span>
                      {isSelfMsg && <CheckCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input Area */}
      <footer className="relative z-20 bg-[#161622]/98 backdrop-blur-2xl border-t border-white/10 p-3 sm:p-5 shrink-0">
        {replyTo && (
          <div className="flex items-center justify-between bg-orange-500/10 border-l-4 border-orange-500 p-2 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 text-[10px] sm:text-xs animate-slideUp backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
              <Reply className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-orange-400" />
              <div className="truncate">
                <span className="font-black text-orange-400 uppercase tracking-tighter text-[9px] sm:text-[10px]">@{replyTo.senderName}ga javob: </span>
                <span className="text-gray-400 italic block truncate">{replyTo.text || '[Rasm]'}</span>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 sm:p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition">
              <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[1.2rem] sm:rounded-[1.8rem] flex items-end px-2 sm:px-4 py-1.5 sm:py-2.5 gap-0.5 sm:gap-1 focus-within:border-orange-500/50 focus-within:bg-white/10 transition-all shadow-inner">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors ${showEmojiPicker ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Smile className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
            </button>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Fikringizni yozing..."
              rows={1}
              className="flex-1 bg-transparent py-2 sm:py-2.5 text-[11px] sm:text-sm text-white placeholder-gray-600 focus:outline-none resize-none max-h-32 custom-scrollbar"
              style={{ minHeight: '36px' }}
            />

            <button 
              onClick={() => setShowImageModal(true)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg sm:rounded-xl transition-colors"
            >
              <ImageIcon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
            </button>
          </div>

          <button 
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() && !imageUrlInput}
            className="w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-black rounded-xl sm:rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-5 sm:w-7 h-5 sm:h-7 -mr-0.5" />
          </button>
        </div>

        {showEmojiPicker && (
          <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 mt-3 sm:mt-5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl overflow-x-auto custom-scrollbar animate-slideUp">
            {SAMPLE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setInputText(prev => prev + emoji)}
                className="text-lg sm:text-2xl hover:scale-135 transition p-1 sm:p-2 active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </footer>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#1c1b24] border border-white/10 rounded-[32px] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Rasm ulashish</h3>
              <button onClick={() => setShowImageModal(false)} className="p-2 text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input 
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Rasm havolasi (URL)..."
              className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500"
            />

            <div className="grid grid-cols-3 gap-2">
              {[
                'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400',
                'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
              ].map((url, i) => (
                <img 
                  key={i}
                  src={url}
                  alt="Sample"
                  onClick={() => handleSelectImage(url)}
                  className="w-full h-16 object-cover rounded-xl border-2 border-transparent hover:border-orange-500 cursor-pointer transition"
                />
              ))}
            </div>

            <button
              onClick={() => handleSendMessage()}
              className="w-full py-3.5 rounded-2xl bg-orange-500 text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition"
            >
              Yuborish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

