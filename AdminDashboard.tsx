
import React, { useState, useEffect } from 'react';
import { UsersIcon } from './components/icons/UsersIcon';
import { MovieIcon } from './components/icons/MovieIcon';
import { CrownIcon } from './components/icons/CrownIcon';
import { CommentIcon } from './components/icons/CommentIcon';
import { DashboardStats, ActivityLog } from './types';
import { getDashboardStats, getRecentActivity } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';

const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
}> = ({ icon, title, value, color }) => (
    <div className="bg-gray-800/70 p-6 rounded-lg flex items-center gap-6 border-l-4" style={{borderColor: color}}>
        <div className="p-3 rounded-full" style={{backgroundColor: `${color}20`}}>
            <span style={{color: color}}>{icon}</span>
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);


export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalMovies: 0,
        totalPremium: 0,
        totalReviews: 0
    });
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const dashboardStats = await getDashboardStats();
                setStats(dashboardStats);
                
                const recentActivities = await getRecentActivity();
                setActivities(recentActivities);
            } catch (e) {
                console.error("Dashboard data loading error", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
    }

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-8">Boshqaruv Paneli</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<UsersIcon className="w-8 h-8" />} title="Jami Foydalanuvchilar" value={stats.totalUsers} color="#34d399" />
                <StatCard icon={<MovieIcon className="w-8 h-8" />} title="Jami Animelar" value={stats.totalMovies} color="#60a5fa" />
                <StatCard icon={<CrownIcon className="w-8 h-8" />} title="Premium To'lovlar" value={stats.totalPremium} color="#facc15" />
                <StatCard icon={<CommentIcon className="w-8 h-8" />} title="Jami Izohlar" value={stats.totalReviews} color="#c084fc" />
            </div>

            <div className="bg-gray-800/70 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">So'nggi Faolliklar</h2>
                {activities.length === 0 ? (
                    <p className="text-gray-500">Hozircha faolliklar yo'q.</p>
                ) : (
                    <ul className="divide-y divide-gray-700">
                        {activities.map((activity) => (
                            <li key={activity.id} className="py-3 flex justify-between items-center">
                                <p>
                                    <span className="font-semibold text-orange-400">{activity.title}</span> {activity.description}
                                </p>
                                <span className="text-sm text-gray-500 whitespace-nowrap ml-4">{activity.time}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
