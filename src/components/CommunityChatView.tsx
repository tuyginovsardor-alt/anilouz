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

    if (supabase) {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_name: user.name || 'ANILO EGA²',
          sender_avatar: user.avatar,
          is_admin: user.isPremium,
          content: msgContent,
          image_url: msgImage,
          quoted_sender: replyTo?.senderName,
          quoted_text: replyTo ? (replyTo.text || '[Rasm]') : undefined,
          user_color: user.isPremium ? 'text-yellow-400' : 'text-emerald-400',
          group_id: 'public'
        }]);

      if (error) {
        console.error('Xabar yuborishda xatolik:', error);
      }
    } else {
      // Fallback for local testing
      const timeString = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderName: user.name || 'ANILO FAN',
        senderAvatar: user.avatar,
        isAdmin: user.isPremium,
        isSelf: true,
        text: msgContent,
        image: msgImage,
        quotedSender: replyTo ? replyTo.senderName : undefined,
        quotedText: replyTo ? (replyTo.text || '[Rasm]') : undefined,
        timestamp: timeString,
        userColor: user.isPremium ? 'text-yellow-400' : 'text-emerald-400',
      };
      setMessages((prev) => [...prev, newMessage]);
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0f111a] text-white animate-fadeIn overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1600&auto=format&fit=crop" 
          alt="Chat Wallpaper" 
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f111a]/95 via-[#0f111a]/80 to-[#0f111a]/95 backdrop-blur-[1px]" />
      </div>

      {/* Header - Fixed to Top */}
      <header className="relative z-50 bg-[#1e1e28]/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-white/10 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center border border-white/20 shadow-inner">
              <Users className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                ANILO CHAT <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              </h1>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {isLoading ? 'Yuklanmoqda...' : `${messages.length} ta xabar`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2.5 text-gray-400 hover:text-white transition-colors"
            title="Xabarlarni qidirish"
          >
            <Search className="w-5 h-5" />
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1c1b24]/98 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-fadeIn">
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
                  <div className="h-[1px] bg-white/10 my-1" />
                  <button 
                    onClick={onBack}
                    className="px-4 py-3 text-left hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" /> Chiqish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="relative z-40 bg-[#181822]/95 backdrop-blur-md p-3 border-b border-white/10 flex items-center gap-2 animate-slideDown">
          <Search className="w-4 h-4 text-gray-400 ml-2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Xabarlarni izlash..."
            className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-transparent pb-8">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-gray-500">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-400/50" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400">Xabarlar mavjud emas</p>
              <p className="text-xs text-gray-600 mt-1">Guruhda birinchi bo'lib suhbat boshlang!</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isSelfMsg = msg.isSelf;
            const isAdminMsg = msg.isAdmin;
            
            return (
              <div 
                key={msg.id || index}
                className={`flex gap-2.5 w-full ${isSelfMsg ? 'justify-end' : 'justify-start'} animate-messageIn`}
              >
                {!isSelfMsg && (
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 mt-auto">
                    <img 
                      src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${msg.senderName}&background=random`}
                      alt={msg.senderName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[70%] ${isSelfMsg ? 'items-end' : 'items-start'}`}>
                  {!isSelfMsg && (
                    <span className={`text-[11px] font-black px-1 ${msg.userColor || (isAdminMsg ? 'text-yellow-400' : 'text-emerald-400')}`}>
                      {msg.senderName} {isAdminMsg && '👑'}
                    </span>
                  )}
                  
                  <div 
                    onClick={() => setReplyTo(msg)}
                    className={`relative p-3 rounded-2xl shadow-lg transition-transform active:scale-[0.98] cursor-pointer ${
                      isSelfMsg 
                        ? 'bg-gradient-to-br from-orange-500/90 to-orange-600/90 text-white rounded-br-xs border border-orange-400/30' 
                        : 'bg-[#1e1e28]/95 backdrop-blur-md border border-white/10 rounded-bl-xs text-gray-100'
                    }`}
                  >
                    {msg.quotedText && (
                      <div className={`border-l-2 ${isSelfMsg ? 'border-white/50 bg-white/10' : 'border-orange-500 bg-orange-500/10'} pl-2 py-1 mb-2 rounded-r-lg text-[10px] opacity-80`}>
                        <p className="font-bold truncate">{msg.quotedSender}</p>
                        <p className="truncate line-clamp-1">{msg.quotedText}</p>
                      </div>
                    )}

                    {msg.image && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/10">
                        <img src={msg.image} alt="Media" className="w-full h-auto max-h-72 object-cover" />
                      </div>
                    )}

                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    <div className={`flex items-center gap-1.5 self-end text-[9px] mt-1.5 font-mono ${isSelfMsg ? 'text-white/60' : 'text-gray-500'}`}>
                      <span>{msg.timestamp}</span>
                      {isSelfMsg && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input Area - Fixed to Bottom */}
      <footer className="relative z-50 bg-[#161622]/95 backdrop-blur-2xl border-t border-white/10 p-3 pb-6 shrink-0">
        {replyTo && (
          <div className="flex items-center justify-between bg-orange-500/10 border-l-4 border-orange-500 p-2.5 rounded-lg mb-3 text-xs animate-slideUp">
            <div className="flex items-center gap-2 overflow-hidden">
              <Reply className="w-4 h-4 text-orange-400" />
              <div className="truncate">
                <span className="font-bold text-orange-400">@{replyTo.senderName}: </span>
                <span className="text-gray-400 italic">{replyTo.text || '[Rasm]'}</span>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="flex items-center gap-2 p-2 mb-3 bg-black/40 border border-white/10 rounded-2xl overflow-x-auto custom-scrollbar animate-slideUp">
            {SAMPLE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setInputText(prev => prev + emoji)}
                className="text-lg hover:scale-125 transition p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2.5">
          <div className="flex-1 bg-black/40 border border-white/10 rounded-[22px] flex items-end px-3 py-1.5 gap-2 group focus-within:border-orange-500/50 transition-all">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 transition-colors ${showEmojiPicker ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
            >
              <Smile className="w-5 h-5" />
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
              placeholder="Xabar yozing..."
              rows={1}
              className="flex-1 bg-transparent py-2 text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none resize-none max-h-32 custom-scrollbar"
              style={{ minHeight: '38px' }}
            />

            <button 
              onClick={() => setShowImageModal(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() && !imageUrlInput}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-black rounded-full shadow-lg shadow-orange-500/20 active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-5 h-5 -mr-0.5" />
          </button>
        </div>
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

