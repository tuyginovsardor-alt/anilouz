
// ... existing imports

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const data = await getDashboardStats();
            // Bildirishnomalarni RPC orqali olamiz
            const { data: counts } = await supabase.rpc('get_admin_counts');
            setStats({ ...data, pendingFandub: counts?.fandub_pending || 0 });
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;

    return (
        <div className="animate-fade-in space-y-10 pb-10">
            {/* Bildirishnoma (Banner) */}
            {stats?.pendingFandub > 0 && (
                <div className="bg-purple-600 p-4 rounded-2xl flex justify-between items-center animate-pulse shadow-lg shadow-purple-900/40">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-white" />
                        <p className="text-white font-black uppercase text-xs tracking-widest">
                            Yangi {stats.pendingFandub} ta Fandub yuklamalari kutilmoqda!
                        </p>
                    </div>
                    <button className="px-5 py-2 bg-white text-purple-600 rounded-xl font-black text-[10px] uppercase">Tekshirish</button>
                </div>
            )}

            {/* STAT CARDS - Rest of the component follows... */}
            {/* ... */}
        </div>
    );
};
