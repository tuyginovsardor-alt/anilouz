
import React, { useState, useEffect } from 'react';
import { UsersIcon } from './components/icons/UsersIcon';
import { MovieIcon } from './components/icons/MovieIcon';
import { CrownIcon } from './components/icons/CrownIcon';
import { CommentIcon } from './components/icons/CommentIcon';
import { AdminDetailedStats } from './services/dbService';
import { getDashboardStats } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { User, MessageCircle, Star, Clock, Zap } from 'lucide-react';

const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subValue?: string;
    color: string;
    gradient: string;
}> = ({ icon, title, value, subValue, color, gradient }) => (
    <div className={`relative overflow-hidden bg-gray-800/40 border border-gray-700 p-6 rounded-3xl transition-all hover:scale-[1.02] group`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div className="p-3 rounded-2xl bg-gray-900/50 text-white shadow-inner" style={{color: color}}>{icon}</div>
            {subValue && <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-black/30 px-2 py-1 rounded-lg">{subValue}</span>}
        </div>
        <div className="mt-5 relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-white mt-1 tracking-tight">{value.toLocaleString()}</h3>
        </div>
    </div>
);


export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminDetailedStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (e) {
            console.error("Dashboard data error", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
    }

    return (
        <div className="animate-fade-in space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Boshqaruv Paneli</h1>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Jonli Statistika va Faolliklar</p>
                </div>
                <button onClick={loadData} className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                    <Zap size={14} className="text-orange-500"/> YANGILASH
                </button>
            </div>
            
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={<UsersIcon className="w-6 h-6" />} 
                    title="Jami Foydalanuvchi" 
                    value={stats?.totalUsers || 0} 
                    subValue={`${stats?.freeUsers || 0} FREE`}
                    color="#60a5fa" 
                    gradient="from-blue-500 to-cyan-500"
                />
                <StatCard 
                    icon={<CrownIcon className="w-6 h-6" />} 
                    title="Premium Hisoblar" 
                    value={stats?.premiumUsers || 0} 
                    subValue="AKTIV"
                    color="#fbbf24" 
                    gradient="from-yellow-400 to-orange-500"
                />
                <StatCard 
                    icon={<MovieIcon className="w-6 h-6" />} 
                    title="Jami Animelar" 
                    value={stats?.totalMovies || 0} 
                    subValue="KATALOG"
                    color="#f472b6" 
                    gradient="from-pink-500 to-purple-600"
                />
                <StatCard 
                    icon={<CommentIcon className="w-6 h-6" />} 
                    title="Jami Izohlar" 
                    value={stats?.totalReviews || 0} 
                    subValue="FIKRLAR"
                    color="#34d399" 
                    gradient="from-green-400 to-emerald-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* RECENT USERS */}
                <div className="lg:col-span-4 bg-gray-800/40 border border-gray-700 rounded-[2.5rem] p-8">
                    <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                        Yaqinda Kirganlar
                    </h2>
                    <div className="space-y-5">
                        {stats?.recentUsers.length === 0 && <p className="text-gray-500 text-xs italic text-center py-10">Hozircha ma'lumot yo'q</p>}
                        {stats?.recentUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden p-0.5">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} className="w-full h-full object-cover rounded-[14px]" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 rounded-[14px]"><User size={18}/></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate w-32">{user.full_name || 'Ismsiz'}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">@{user.username}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <div className={`w-1.5 h-1.5 rounded-full ${user.is_online ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`}></div>
                                        <span className={`text-[10px] font-black uppercase ${user.is_online ? 'text-green-400' : 'text-zinc-600'}`}>{user.is_online ? 'Online' : 'Oflayn'}</span>
                                    </div>
                                    <p className="text-[9px] text-zinc-600 mt-0.5">{user.last_active ? new Date(user.last_active).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '---'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all">Barcha foydalanuvchilar &rarr;</button>
                </div>

                {/* RECENT REVIEWS */}
                <div className="lg:col-span-8 bg-gray-800/40 border border-gray-700 rounded-[2.5rem] p-8">
                    <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                        So'nggi Izohlar
                    </h2>
                    <div className="space-y-4">
                        {stats?.recentComments.length === 0 && <p className="text-gray-500 text-xs italic text-center py-20">Hozircha izohlar yo'q</p>}
                        {stats?.recentComments.map(rev => (
                            <div key={rev.id} className="bg-black/30 border border-white/5 p-5 rounded-3xl hover:border-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden">
                                             {rev.profiles?.avatar_url ? (
                                                <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-700"><User size={20}/></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{rev.profiles?.full_name || 'Foydalanuvchi'}</p>
                                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-tighter">Anime: {rev.movies?.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                                        <Star size={10} fill="currentColor" className="text-yellow-500" />
                                        <span className="text-[10px] font-black text-yellow-500">{rev.rating}.0</span>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm line-clamp-2 italic leading-relaxed">"{rev.comment}"</p>
                                <div className="flex justify-end mt-2">
                                    <span className="text-[9px] text-zinc-700 font-bold uppercase flex items-center gap-1"> <Clock size={10}/> {new Date(rev.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
