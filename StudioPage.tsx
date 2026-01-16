import React, { useState, useEffect } from 'react';
import { Mic, Search, Star, MessageCircle, ChevronRight, Play } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { UserProfile } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';

interface StudioPageProps {
    onArtistClick: (userId: string) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({ onArtistClick }) => {
    const [artists, setArtists] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchArtists = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'dub');
            setArtists((data || []) as UserProfile[]);
            setIsLoading(false);
        };
        fetchArtists();
    }, []);

    const filtered = artists.filter(a => 
        a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-32 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white">
                        ANILO <span className="text-orange-600">STUDIO</span>
                    </h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">O'zbek dublyaj ustalari hamjamiyati</p>
                </div>
                
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Ustalarni qidiring..."
                        className="w-full bg-zinc-900/50 border border-white/5 py-4 pl-12 pr-6 rounded-full text-white focus:border-orange-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map(artist => (
                    <div 
                        key={artist.id}
                        onClick={() => onArtistClick(artist.id)}
                        className="group bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 hover:border-orange-600/30 transition-all cursor-pointer relative overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-zinc-800 overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                                {artist.avatar_url ? (
                                    <img src={artist.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Mic className="text-zinc-600"/></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{artist.full_name}</h3>
                                <p className="text-orange-500 text-xs font-bold mt-1">@{artist.username}</p>
                                <div className="flex items-center gap-2 mt-3 text-zinc-500">
                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                    <span className="text-[10px] font-black uppercase">Ovoz reytingi: 4.9</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center relative z-10">
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <span className="block text-white font-black text-sm">24</span>
                                    <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Anime</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-white font-black text-sm">1.2K</span>
                                    <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Muxlislar</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500 group-hover:text-orange-500 transition-colors">
                                <span className="text-[10px] font-black uppercase tracking-widest">Profil</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800">
                        <p className="text-zinc-600 font-black uppercase tracking-[0.2em]">Hech kim topilmadi</p>
                    </div>
                )}
            </div>

            {/* PROMOTIONAL BANNER */}
            <div className="mt-24 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-10 border border-white/5">
                <div className="max-w-2xl text-center md:text-left space-y-6">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Dublyaj ustalari qatoriga qo'shiling!</h2>
                    <p className="text-zinc-300 text-lg opacity-80">O'z ovozingiz bilan minglab tomoshalar va muxlislarga ega bo'ling. Biz eng iqtidorli ijodkorlarni qo'llab-quvvatlaymiz.</p>
                    <button className="px-10 py-5 bg-white text-black hover:bg-orange-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl active:scale-95">Murojaat yuborish</button>
                </div>
                <div className="w-64 h-64 bg-zinc-900 rounded-full flex items-center justify-center border-8 border-white/5 relative">
                    <Mic size={100} className="text-orange-600 animate-pulse" />
                    <div className="absolute inset-0 bg-orange-600/10 rounded-full blur-3xl animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};