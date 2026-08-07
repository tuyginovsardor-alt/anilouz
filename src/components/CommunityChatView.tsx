import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, MoreVertical, Trash2, Bell, Film, LogOut, Crown, Reply, 
  Smile, Image as ImageIcon, Mic, Send, ChevronDown, Sparkles, X, Search, Check, CheckCheck
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';

interface CommunityChatViewProps {
  user: UserProfile;
  onBack: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    senderName: 'subaru',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBe1B0dOYG3WaPw2iAZAOZvlhF4q9aODlFID_pJ0MXIAcV_Eiwqgbuc3ugTxTO9VN4tT_8WG69xsAOgHWG-FmRZ1e184YTPLfSGlNbmSlI2cA-Wa4nJidC269SubPYQ3fBCQpDEtRz6amPtdXfweVdYVfLIl5xYQ8vz917SJ81lIllyt0jMqeIlxia3cZDhAajr1LEdNDEsSccz-1fyXi7dV2U2FjC98dbVDzm_TpZbDPNdpg4gYCfegg',
    isAdmin: true,
    quotedSender: 'User',
    quotedText: 'Siz uchun 29 900 sum',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    text: "Solo Leveling 2-mavsum dublyaji bugun soat 20:00 da chiqadi! VIP a'zolar uchun primyera ochiq.",
    timestamp: '19:22',
    userColor: 'text-orange-400'
  },
  {
    id: '2',
    senderName: 'voidcipherx',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    isAdmin: false,
    quotedSender: 'subaru',
    quotedText: '[Image] Solo Leveling 2-mavsum',
    text: "Vipda nima bonus bo'ladi?",
    timestamp: '00:04',
    userColor: 'text-cyan-400'
  },
  {
    id: '3',
    senderName: 'subaru',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBe1B0dOYG3WaPw2iAZAOZvlhF4q9aODlFID_pJ0MXIAcV_Eiwqgbuc3ugTxTO9VN4tT_8WG69xsAOgHWG-FmRZ1e184YTPLfSGlNbmSlI2cA-Wa4nJidC269SubPYQ3fBCQpDEtRz6amPtdXfweVdYVfLIl5xYQ8vz917SJ81lIllyt0jMqeIlxia3cZDhAajr1LEdNDEsSccz-1fyXi7dV2U2FjC98dbVDzm_TpZbDPNdpg4gYCfegg',
    isAdmin: true,
    quotedSender: 'voidcipherx',
    quotedText: "Vipda nima bonus bo'ladi?",
    text: "Hozirda 4K Full HD sifat, reklamalarsiz tomosha qilish va primyeralarga 1-bo'lib kirish imkoniyati bor!",
    timestamp: '02:16',
    userColor: 'text-orange-400'
  },
  {
    id: '4',
    senderName: 'voidcipherx',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    isAdmin: false,
    quotedSender: 'subaru',
    quotedText: 'Hozirda 4K Full HD sifat, reklamalarsiz...',
    text: 'Xa unda ajoyib narsa kutib qolaman ishilaga omad 🤝🔥',
    timestamp: '17:05',
    userColor: 'text-cyan-400'
  }
];

const SAMPLE_EMOJIS = ['😊', '😂', '🔥', '❤️', '🤝', '👍', '🍿', '👑', '✨', '⚡', '😍', '🎉'];

export const CommunityChatView: React.FC<CommunityChatViewProps> = ({ user, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (customImageUrl?: string) => {
    if (!inputText.trim() && !customImageUrl) return;

    const timeString = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderName: user.name || 'ANILO FAN',
      senderAvatar: user.avatar,
      isAdmin: user.isPremium,
      isSelf: true,
      text: inputText,
      image: customImageUrl,
      quotedSender: replyTo ? replyTo.senderName : undefined,
      quotedText: replyTo ? (replyTo.text || '[Rasm]') : undefined,
      timestamp: timeString,
      userColor: 'text-emerald-400',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setReplyTo(null);
    setShowEmojiPicker(false);
    setShowImageModal(false);
    setImageUrlInput('');
  };

  const handleSelectImage = (url: string) => {
    handleSendMessage(url);
  };

  const handleClearChat = () => {
    if (confirm("Chat xabarlarini tozalashni xohlaysizmi?")) {
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

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-[#0f111a] text-white flex flex-col justify-between overflow-hidden animate-fadeIn">
      {/* Background Image with Dark Vignette Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1600&auto=format&fit=crop" 
          alt="Chat Wallpaper" 
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f111a]/90 via-[#0f111a]/75 to-[#0f111a]/95 backdrop-blur-[2px]" />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-4xl mx-auto flex-1">
        
        {/* TOP NAVIGATION BAR */}
        <header className="bg-[#1e1e28]/70 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-20 border-b border-white/10 shadow-lg">
          <button 
            onClick={onBack}
            className="text-orange-400 font-semibold flex items-center gap-1.5 hover:text-orange-300 transition-colors text-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Orqaga</span>
          </button>

          <div className="flex flex-col items-center cursor-pointer" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-1">
                ANILO CHAT <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              </h1>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Anilo.uz Jamiyati • {messages.length} xabar</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-300 hover:text-white rounded-full bg-white/5 backdrop-blur-sm transition-colors"
              title="Xabarlarni qidirish"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Menu Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-300 hover:text-white rounded-full bg-white/5 backdrop-blur-sm transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#1c1b24]/95 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl z-50 animate-fadeIn">
                  <div className="flex flex-col py-1.5 text-xs font-medium">
                    <button 
                      onClick={handleClearChat}
                      className="px-4 py-2.5 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-orange-400"
                    >
                      <Trash2 className="w-4 h-4" /> Chatni tozalash
                    </button>
                    <button 
                      onClick={() => {
                        setNotificationsEnabled(!notificationsEnabled);
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-2.5 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-200"
                    >
                      <Bell className="w-4 h-4 text-orange-400" /> 
                      {notificationsEnabled ? 'Bildirishnomalarni o\'chirish' : 'Bildirishnomalarni yoqish'}
                    </button>
                    <button 
                      onClick={() => {
                        setShowImageModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-2.5 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-200"
                    >
                      <Film className="w-4 h-4 text-orange-400" /> Media galereya
                    </button>
                    <div className="h-[1px] bg-white/10 my-1" />
                    <button 
                      onClick={onBack}
                      className="px-4 py-2.5 text-left hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" /> Suhbatni tark etish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SEARCH BAR (Toggleable) */}
        {isSearchOpen && (
          <div className="bg-[#181822]/90 backdrop-blur-md p-3 border-b border-white/10 flex items-center gap-2 animate-fadeIn">
            <Search className="w-4 h-4 text-gray-400 ml-2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suhbatdan xabar izlash..."
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* CHAT MESSAGES AREA */}
        <main className="flex-1 overflow-y-auto p-4 space-y-5 pb-32 custom-scrollbar">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-gray-400">
              <Sparkles className="w-8 h-8 text-orange-400 mx-auto opacity-70" />
              <p className="text-sm font-semibold">Xabarlar topilmadi</p>
              <p className="text-xs text-gray-500">Birinchi bo'lib xabar yuboring!</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelfMsg = msg.isSelf;
              const isAdminMsg = msg.isAdmin;

              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 w-full ${isSelfMsg ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Left Avatar for non-self */}
                  {!isSelfMsg && (
                    <img 
                      src={msg.senderAvatar} 
                      alt={msg.senderName}
                      className={`w-9 h-9 rounded-full object-cover border mt-auto shadow-md ${
                        isAdminMsg ? 'border-orange-500/80 ring-2 ring-orange-500/30' : 'border-white/20'
                      }`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop';
                      }}
                    />
                  )}

                  {/* Bubble Content Container */}
                  <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[70%] ${isSelfMsg ? 'items-end' : 'items-start'}`}>
                    
                    {/* Sender Header */}
                    <div className="flex items-center gap-1.5 px-1">
                      <span className={`font-bold text-xs ${msg.userColor || (isAdminMsg ? 'text-orange-400' : 'text-cyan-400')}`}>
                        @{msg.senderName}
                      </span>
                      {isAdminMsg && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow" title="Admin / VIP" />
                      )}
                    </div>

                    {/* Glass Bubble Styling */}
                    <div 
                      onClick={() => setReplyTo(msg)}
                      className={`relative group p-3.5 rounded-2xl cursor-pointer transition-all ${
                        isSelfMsg 
                          ? 'bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-600/25 border border-orange-500/40 rounded-br-xs shadow-[0_4px_16px_rgba(255,140,0,0.12)]' 
                          : isAdminMsg
                            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-900/20 border border-amber-500/35 rounded-bl-xs shadow-[0_4px_16px_rgba(255,183,125,0.1)]'
                            : 'bg-white/10 border border-white/15 rounded-bl-xs backdrop-blur-md shadow-md hover:bg-white/15'
                      }`}
                    >
                      {/* Quoted Reply Block */}
                      {msg.quotedText && (
                        <div className="border-l-2 border-orange-400 pl-2.5 py-1 mb-2 bg-black/30 rounded-r-lg text-xs text-gray-300">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-orange-300">
                            <Reply className="w-3 h-3" />
                            <span>{msg.quotedSender}</span>
                          </div>
                          <p className="truncate text-[11px] text-gray-400 mt-0.5">{msg.quotedText}</p>
                        </div>
                      )}

                      {/* Image Attachment inside Message */}
                      {msg.image && (
                        <div className="mb-2.5 rounded-xl overflow-hidden border border-white/15 shadow-lg max-h-60">
                          <img 
                            src={msg.image} 
                            alt="Attached" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Text & Timestamp */}
                      <div className="flex flex-col gap-1">
                        {msg.text && (
                          <p className="text-xs sm:text-sm leading-relaxed text-gray-100 font-medium whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        )}
                        <div className={`flex items-center gap-1.5 self-end text-[10px] text-white/50 font-mono mt-0.5`}>
                          <span>{msg.timestamp}</span>
                          {isSelfMsg && (
                            <CheckCheck className="w-3.5 h-3.5 text-orange-400" />
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right Avatar for self */}
                  {isSelfMsg && (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-orange-500/60 ring-2 ring-orange-500/20 mt-auto shadow-md"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop';
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </main>

        {/* FLOATING ACTION BUTTON (Scroll to bottom) */}
        <button 
          onClick={scrollToBottom}
          className="fixed bottom-24 right-4 sm:right-8 bg-[#181824]/90 backdrop-blur-md border border-white/20 text-white p-3 rounded-full shadow-2xl z-30 hover:bg-orange-500 hover:text-black transition active:scale-95"
          title="Pastga tushish"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* INPUT FOOTER AREA */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#161622]/90 backdrop-blur-xl border-t border-white/10 p-3 pb-5 max-w-4xl mx-auto shadow-2xl">
          
          {/* Quoted Banner when Replying */}
          {replyTo && (
            <div className="flex items-center justify-between bg-orange-500/15 border-l-4 border-orange-500 p-2.5 rounded-lg mb-2 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <Reply className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-orange-400">@{replyTo.senderName}: </span>
                  <span className="text-gray-300">{replyTo.text || '[Media]'}</span>
                </div>
              </div>
              <button 
                onClick={() => setReplyTo(null)}
                className="p-1 text-gray-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Emoji Quick Picker */}
          {showEmojiPicker && (
            <div className="flex items-center gap-2 p-2.5 mb-2 bg-[#1c1b26] border border-white/15 rounded-2xl overflow-x-auto custom-scrollbar animate-fadeIn">
              {SAMPLE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setInputText((prev) => prev + emoji)}
                  className="text-lg hover:scale-125 transition p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Main Input Row */}
          <div className="flex items-end gap-2">
            {/* Emoji Toggle */}
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-3 rounded-full transition ${
                showEmojiPicker ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-orange-400 hover:bg-white/5'
              }`}
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Image Attachment Toggle */}
            <button 
              onClick={() => setShowImageModal(!showImageModal)}
              className="p-3 text-gray-400 hover:text-orange-400 hover:bg-white/5 rounded-full transition"
              title="Rasm biriktirish"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Textarea */}
            <div className="flex-1 relative">
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
                className="w-full bg-black/40 border border-white/15 rounded-2xl py-3 px-4 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none custom-scrollbar min-h-[44px] max-h-[120px]"
              />
            </div>

            {/* Audio Recording simulator */}
            <button 
              onClick={() => {
                setIsRecording(!isRecording);
                if (!isRecording) {
                  alert("Ovozli xabar yozib olinmoqda... (Mikrofon simulyatsiyasi)");
                } else {
                  handleSendMessage();
                }
              }}
              className={`p-3 rounded-full transition ${
                isRecording ? 'bg-red-600 text-white animate-pulse' : 'text-gray-400 hover:text-orange-400 hover:bg-white/5'
              }`}
              title="Ovozli xabar"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() && !imageUrlInput}
              className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black rounded-full transition-all w-11 h-11 flex items-center justify-center shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 -mr-0.5" />
            </button>
          </div>
        </footer>

      </div>

      {/* MODAL: Image Upload / Sample Image Selector */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#1c1b24] border border-orange-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-400" />
                Rasm ulashish
              </h3>
              <button onClick={() => setShowImageModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs text-gray-300 font-semibold">
                Rasm internet havolasi (URL):
              </label>
              <input 
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-400 mb-2">
                Tayyor anime rasmlaridan tanlash:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                ].map((url, i) => (
                  <img 
                    key={i}
                    src={url}
                    alt="Preset"
                    onClick={() => handleSelectImage(url)}
                    className="w-full h-20 object-cover rounded-xl border-2 border-transparent hover:border-orange-500 cursor-pointer transition transform hover:scale-105"
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (imageUrlInput.trim()) {
                  handleSendMessage(imageUrlInput.trim());
                }
              }}
              disabled={!imageUrlInput.trim()}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs shadow-lg disabled:opacity-50"
            >
              Yuborish
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
