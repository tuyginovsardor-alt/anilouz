
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from './types';
import { ChatMessageItem } from './components/ChatMessageItem';
import { Send, Bot, Sparkles, Trash2, ChevronLeft, Zap } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Salom! Men Anilo.uz aqlli yordamchisiman. 🤖\n\nSizga sayt, animelar yoki loyiha asoschilari haqida ma'lumot bera olaman. Qanday yordam kerak?",
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
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: Sender.User,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userText,
        config: {
          systemInstruction: `Siz Anilo.uz anime portalining rasmiy yordamchisiz. 
          Sizning vazifangiz foydalanuvchilarga sayt haqida ma'lumot berish. 
          
          MUHIM MA'LUMOTLAR:
          - Loyiha asoschisi va rahbari (CEO): Firdavs Abdurazzoqov. U Navoiy viloyatidan.
          - Loyiha yaratuvchisi va texnik direktori (CTO/Creator): Sardor Tuyginov. U Samarqand viloyatidan.
          - Saytning maqsadi: O'zbekistonda professional anime dublyajini rivojlantirish va eng sara animelarni o'zbek tilida taqdim etish.
          - Premium narxlar: 1 oy - 9,999 so'm, 3 oy - 28,500 so'm, 1 yil - 90,000 so'm.
          - Bot har doim xushmuomala bo'lishi va asoschilar haqida so'rashsa, g'urur bilan javob berishi kerak.
          - Javoblaringizni o'zbek tilida, qisqa va tushunarli qilib yozing. Emoji ishlating.`,
          temperature: 0.7,
        },
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text || "Uzr, hozirda javob bera olmayman. Birozdan so'ng urinib ko'ring.",
        sender: Sender.Bot,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Aloqada xatolik yuz berdi. Iltimos, internetingizni tekshiring.",
        sender: Sender.Bot,
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Suhbatni tozalashni istaysizmi?")) {
      setMessages([{
        id: Date.now().toString(),
        text: "Suhbat tozalandi. Savollaringiz bo'lsa bemalol so'rang.",
        sender: Sender.Bot,
        timestamp: Date.now()
      }]);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#050505] animate-fade-in relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="flex-none p-4 border-b border-white/5 bg-black/80 backdrop-blur-md z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Bot size={20} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full animate-pulse"></div>
              </div>
              <div>
                  <h2 className="font-black text-white text-sm flex items-center gap-2 tracking-tight uppercase">
                      Anilo GPT
                      <Sparkles size={12} className="text-blue-400" />
                  </h2>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Smart Assistant</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-500/20">
                  <Zap size={10} className="text-blue-400 fill-blue-400" />
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Powered by Gemini 3</span>
              </div>
              <button 
                  onClick={handleClearChat}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
              >
                  <Trash2 size={18} />
              </button>
          </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
             <div className="bg-zinc-900 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center space-x-1.5 ml-9">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input section */}
      <div className="flex-none p-4 bg-black border-t border-white/5 pb-safe">
        <form onSubmit={handleSend} className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "AI o'ylamoqda..." : "Savol bering (masalan: Asoschilar kim?)"}
            className="w-full pl-5 pr-12 py-4 bg-zinc-900 border border-white/10 rounded-2xl focus:border-blue-500 outline-none text-sm text-white placeholder-zinc-600 transition-all font-medium disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-blue-600/20"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-center text-[8px] text-zinc-600 uppercase tracking-widest mt-2">AI xato qilishi mumkin. Muhim ma'lumotlarni tekshiring.</p>
      </div>
    </div>
  );
};
