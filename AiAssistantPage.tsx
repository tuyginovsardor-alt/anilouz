
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';

export const AiAssistantPage: React.FC = () => {
    const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
        { role: 'bot', text: "Salom! Men Anilo.uz AI yordamchisiman. Sizga qanday anime tanlashda yoki saytdan foydalanishda yordam bera olaman?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: userMsg,
                config: {
                    systemInstruction: "Siz Anilo.uz anime saytining aqlli yordamchisisiz. Faqat anime mavzusida va o'zbek tilida javob bering. Xushmuomala bo'ling."
                }
            });
            
            setMessages(prev => [...prev, { role: 'bot', text: response.text || "Kechirasiz, javob bera olmadim." }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'bot', text: "Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[80vh] flex flex-col glass-effect rounded-3xl overflow-hidden border border-white/5">
            <div className="bg-orange-600/10 p-4 border-b border-white/5 flex items-center gap-3">
                <Bot className="text-orange-500" />
                <div>
                    <h2 className="font-bold text-white">Anilo AI Assistant</h2>
                    <p className="text-[10px] text-orange-500 uppercase font-black">Online • Gemini Powered</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl flex gap-3 ${m.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-white/5 text-gray-200 rounded-bl-none border border-white/5'}`}>
                            <div className="shrink-0 mt-1">
                                {m.role === 'user' ? <User size={16}/> : <Bot size={16} className="text-orange-500"/>}
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-2 items-center">
                            <Sparkles size={16} className="text-orange-500 animate-spin" />
                            <span className="text-xs text-gray-500">AI o'ylamoqda...</span>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Xabar yozing..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button type="submit" disabled={loading} className="p-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl transition-all active:scale-95 disabled:opacity-50">
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};
