import React from 'react';
import { 
  Users, Film, CreditCard, MessageSquare, ShieldAlert, 
  ChevronRight, ArrowUpRight, Activity, Terminal, Sparkles, RefreshCw, X
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

const StatCard: React.FC<{ label: string, value: string, icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
  <div className="relative group bg-[#111115] border border-white/5 p-6 rounded-[2rem] overflow-hidden hover:border-orange-500/30 transition-all duration-500">
    <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity`}></div>
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 bg-black/50 border border-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <ArrowUpRight className="text-zinc-800 group-hover:text-orange-500 transition-colors" size={20} />
    </div>
    <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{value}</h3>
    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
  </div>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col animate-fadeIn overflow-hidden">
      {/* Header */}
      <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">ANILO ADMIN</h1>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Tizim nazorati va moderatsiya</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 rounded-2xl bg-white/5 hover:bg-red-500 hover:text-white transition-all text-gray-400 active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 custom-scrollbar">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-[#111115] to-transparent p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-1 bg-orange-600 rounded-full"></span>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Administrator</span>
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Xush Kelibsiz!</h2>
            <p className="text-zinc-500 text-sm mt-1 max-w-md">Barcha moderatsiya asboblari va statistik ma'lumotlar shu yerda jamlangan.</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-600/5 to-transparent pointer-events-none" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Foydalanuvchilar" value="1,245" icon={<Users className="text-blue-500" />} color="from-blue-600 to-transparent" />
          <StatCard label="Anime Katalog" value="298" icon={<Film className="text-orange-500" />} color="from-orange-600 to-transparent" />
          <StatCard label="Tranzaksiyalar" value="89.4M" icon={<CreditCard className="text-green-500" />} color="from-green-600 to-transparent" />
          <StatCard label="Ticketlar" value="12" icon={<MessageSquare className="text-red-500" />} color="from-red-600 to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Moderation Section */}
          <div className="lg:col-span-2 bg-[#111115] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#16161c]">
              <div className="flex items-center gap-3">
                <Activity className="text-orange-500" size={20}/>
                <h3 className="text-lg font-black uppercase text-white">Moderatsiya</h3>
              </div>
              <span className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black text-zinc-400">3 PENDING</span>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <Film className="w-12 h-12 text-zinc-700" />
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Hozircha yangi so'rovlar yo'q</p>
            </div>
          </div>

          {/* AI Logs Terminal */}
          <div className="bg-[#0a0a0f] border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-3">
                <Terminal size={16} className="text-orange-500" /> AI Server Logs
              </h3>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-3 pr-2 custom-scrollbar">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-zinc-500">
                <span className="text-orange-500/50">[09:22:15]</span> AI Guard monitoring active...
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-zinc-500">
                <span className="text-orange-500/50">[09:25:32]</span> Security scan complete. 0 threats.
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-zinc-500">
                <span className="text-orange-500/50">[09:30:10]</span> Database backup generated successfully.
              </div>
            </div>
            <button className="mt-6 w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2">
              <Sparkles size={14} /> RUN SECURITY SCAN
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
