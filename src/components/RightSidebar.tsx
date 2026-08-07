import React, { useState } from 'react';
import { TrendingUp, Compass, Star, Heart, History, Clock, ChevronRight, Calendar } from 'lucide-react';
import { TOP_ANIME, SCHEDULE } from '../types';

export const RightSidebar: React.FC = () => {
    const [topAnimeTab, setTopAnimeTab] = useState<'day' | 'week' | 'month' | 'year'>('day');

    return (
        <div className="flex flex-col gap-8 sticky top-24 h-fit">
            {/* TEZ KO'RISH */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-6">TEZ KO'RISH</h3>
                <div className="space-y-4">
                    {[
                        { label: 'Eng yangi seriyalar', icon: <TrendingUp size={16} /> },
                        { label: 'Eng ko\'p ko\'rilgan', icon: <Compass size={16} /> },
                        { label: 'Eng yaxshi reyting', icon: <Star size={16} /> },
                        { label: 'Tavsiya etilgan', icon: <Star size={16} className="text-orange-500" /> },
                        { label: 'Sevimlilarim', icon: <Heart size={16} /> },
                        { label: 'Tarixim', icon: <History size={16} /> },
                        { label: 'Keyinroq ko\'rish', icon: <Clock size={16} /> },
                    ].map((item, i) => (
                        <button key={i} className="w-full flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-orange-500/80 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                    {item.icon}
                                </div>
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">{item.label}</span>
                            </div>
                            <ChevronRight size={14} className="text-zinc-600 group-hover:text-orange-500" />
                        </button>
                    ))}
                </div>
            </div>

            {/* TOP ANIME */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-6">TOP ANIME</h3>
                
                {/* Tabs */}
                <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                    {(['Kun', 'Hafta', 'Oy', 'Yil'] as const).map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setTopAnimeTab(tab.toLowerCase() as any)}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                topAnimeTab === tab.toLowerCase() ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {TOP_ANIME.map((anime, i) => (
                        <div key={anime.id} className="flex items-center gap-4 group cursor-pointer">
                            <div className={`text-xl font-black ${i === 0 ? 'text-orange-500' : i === 1 ? 'text-orange-400' : i === 2 ? 'text-orange-300' : 'text-zinc-700'} w-4`}>
                                {i + 1}
                            </div>
                            <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/5">
                                <img src={anime.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-zinc-300 line-clamp-2 group-hover:text-white transition-colors leading-tight">{anime.title}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-black text-orange-600 bg-orange-600/10 px-1.5 rounded">{anime.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all">
                    Barchasini ko'rish
                </button>
            </div>

            {/* JADVAL */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">JADVAL</h3>
                    <Calendar size={14} className="text-orange-500" />
                </div>
                <div className="space-y-6">
                    {SCHEDULE.map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="text-orange-600 font-black text-xs tabular-nums bg-orange-600/10 px-2 py-1 rounded-lg">
                                {item.time}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-zinc-300 line-clamp-1 group-hover:text-white transition-colors leading-tight mb-1">{item.title}</h4>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.episode}-qism</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all">
                    To'liq jadval
                </button>
            </div>
        </div>
    );
};
