
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Users, Film, CreditCard, MessageSquare, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        users: 0,
        movies: 0,
        payments: 0,
        tickets: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [u, m, p, t] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('movies').select('*', { count: 'exact', head: true }),
                    supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
                    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
                ]);

                setStats({
                    users: u.count || 0,
                    movies: m.count || 0,
                    payments: p.count || 0,
                    tickets: t.count || 0
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <LoadingSpinner />;

    const cards = [
        { label: 'Jami Foydalanuvchilar', value: stats.users, icon: <Users className="text-blue-500" />, color: 'from-blue-500/10 to-transparent' },
        { label: 'Barcha Animelar', value: stats.movies, icon: <Film className="text-orange-500" />, color: 'from-orange-500/10 to-transparent' },
        { label: 'Tasdiqlangan To\'lovlar', value: stats.payments, icon: <CreditCard className="text-green-500" />, color: 'from-green-500/10 to-transparent' },
        { label: 'Ochiq Murojaatlar', value: stats.tickets, icon: <MessageSquare className="text-red-500" />, color: 'from-red-500/10 to-transparent' },
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-8">Statistika</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {cards.map((card, i) => (
                    <div key={i} className={`bg-gray-800/40 border border-gray-700 p-6 rounded-2xl bg-gradient-to-br ${card.color}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-900/50 rounded-xl">{card.icon}</div>
                            <TrendingUp className="text-gray-600 w-4 h-4" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{card.value.toLocaleString()}</h3>
                    </div>
                ))}
            </div>
            
            <div className="bg-gray-800/20 border border-gray-800 p-10 rounded-3xl text-center">
                <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="text-orange-500 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Anilo Platformasi Faol</h2>
                <p className="text-gray-400 max-w-md mx-auto">Tizim barqaror ishlamoqda. Foydalanuvchilar soni va tomoshalar ko'rsatkichi oshmoqda.</p>
            </div>
        </div>
    );
};
