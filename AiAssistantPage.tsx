
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from './types';
import { ChatMessageItem } from './components/ChatMessageItem';
import { Send, Bot, Sparkles, Trash2 } from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Salom! Men Anilo botman. 🤖\n\nAnilo.uz anime portali bo'yicha savollaringizga javob beraman. Nima haqida bilmoqchisiz?",
      sender: Sender.Bot,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    inputRef.current?.focus();
  }, [messages, isTyping]);

  // Oddiy avto-javob mantiqi (AI ishlatilmaydi)
  const getAutoResponse = (text: string): string => {
      const lower = text.toLowerCase();
      
      if (lower.includes('salom') || lower.includes('assalom')) {
          return "Va alaykum assalom! Anilo.uz ga xush kelibsiz. Sizga qanday yordam bera olaman?";
      }
      if (lower.includes('narx') || lower.includes('pul') || lower.includes('to\'lov') || lower.includes('premium')) {
          return "Premium obuna narxlari:\n\n🔹 1 oy - 9,999 so'm\n🔹 3 oy - 28,500 so'm\n🔹 1 yil - 90,000 so'm\n\nHisobni 'Moliya' bo'limida to'ldirishingiz mumkin.";
      }
      if (lower.includes('reklama')) {
          return "Premium obuna olib reklamalardan qutulishingiz mumkin. Yoki reklamalarni tomosha qilib bizni qo'llab-quvvatlang!";
      }
      if (lower.includes('anime') || lower.includes('kino') || lower.includes('serial')) {
          return "Bizda eng so'nggi va ommabop animelar mavjud. 'Naruto', 'One Piece', 'Demon Slayer', 'Solo Leveling' va boshqalar. Qidiruv bo'limidan foydalaning.";
      }
      if (lower.includes('qanday') && (lower.includes('yuklash') || lower.includes('skachat'))) {
          return "Animelarni yuklab olish faqat Premium foydalanuvchilar uchun mavjud. Obuna bo'ling va istalgan joyda oflayn tomosha qiling.";
      }
      if (lower.includes('rahmat')) {
          return "Arzimaydi! Sizga maroqli hordiq tilayman. 😊";
      }
      
      return "Uzr, savolingizni tushunmadim. Iltimos, aniqroq yozing yoki quyidagi mavzulardan birini tanlang:\n\n1. Premium narxlar\n2. Anime qidirish\n3. Reklama\n4. Yuklab olish";
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.User,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // "Yozmoqda..." effektini berish uchun kechikish
    setTimeout(() => {
        const responseText = getAutoResponse(userMessage.text);
        
        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: responseText,
            sender: Sender.Bot,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
    }, 1000);
  };

  const handleClearChat = () => {
      setMessages([{
        id: Date.now().toString(),
        text: "Suhbat tozalandi. Savollaringiz bo'lsa bemalol so'rang.",
        sender: Sender.Bot,
        timestamp: Date.now()
      }]);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] animate-fade-in p-4">
      {/* Chat Container */}
      <div className="w-full max-w-md bg-gray-900/90 backdrop-blur-xl border border-gray-700 shadow-2xl rounded-3xl overflow-hidden flex flex-col h-[600px] relative ring-1 ring-white/10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/10">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                </div>
                <div>
                    <h2 className="font-bold text-white text-base flex items-center gap-2">
                        Anilo Bot
                        <Sparkles size={12} className="text-yellow-400" />
                    </h2>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Avto-Javob</p>
                </div>
            </div>
            <button 
                onClick={handleClearChat}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all"
                title="Suhbatni tozalash"
            >
                <Trash2 size={16} />
            </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} />
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
               <div className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-2xl rounded-tl-none flex items-center space-x-1 ml-9 shadow-md">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-gray-800 border-t border-gray-700">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Savol bering..."
              className="w-full pl-4 pr-10 py-3 bg-gray-900 border border-gray-600 rounded-full focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm text-white placeholder-gray-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-1.5 p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
