
import React, { useState, useEffect } from 'react';
import { UserIcon } from './components/icons/UserIcon';
import { EditIcon } from './components/icons/EditIcon';
import { DeleteIcon } from './components/icons/DeleteIcon';
import { EnterIcon } from './components/icons/EnterIcon';
import { UserProfile } from './types';
import { getAllUsers, deleteUser } from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';

interface UserManagementPageProps {
    onImpersonate?: (userId: string) => void;
}

const StatusBadge: React.FC<{ role: string }> = ({ role }) => {
    const colorClasses: Record<string, string> = {
        'admin': 'bg-red-500/20 text-red-400',
        'owner': 'bg-purple-500/20 text-purple-400',
        'manager': 'bg-yellow-500/20 text-yellow-400',
        'user': 'bg-blue-500/20 text-blue-400',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[role] || 'bg-gray-500/20 text-gray-400'}`}>{role.toUpperCase()}</span>;
}

const ActivityBadge: React.FC<{ lastActive: string; isOnline?: boolean }> = ({ lastActive, isOnline }) => {
    const now = new Date().getTime();
    const activeTime = new Date(lastActive).getTime();
    const diffDays = (now - activeTime) / (1000 * 60 * 60 * 24);

    let label = 'Yangi';
    let color = 'bg-gray-600 text-gray-300';

    if (isOnline) {
        label = 'Aktiv (Online)';
        color = 'bg-green-500/20 text-green-400 border border-green-500/30';
    } else if (diffDays < 7) {
        label = 'Aktiv';
        color = 'bg-blue-500/20 text-blue-400';
    } else if (diffDays < 30) {
        label = 'O\'rta';
        color = 'bg-yellow-500/20 text-yellow-400';
    } else {
        label = 'Passiv';
        color = 'bg-red-500/20 text-red-400';
    }

    return <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${color}`}>{label}</span>;
};

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ onImpersonate }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification } = useNotification();

    useEffect(() => {
        loadUsers();
        // Auto-refresh to keep online status current
        const interval = setInterval(loadUsers, 30000); 
        return () => clearInterval(interval);
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data);
            setIsLoading(false); // Only set false once initially loaded
        } catch (e) {
            console.error(e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Foydalanuvchilarni yuklab bo\'lmadi' });
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Haqiqatan ham bu foydalanuvchini o'chirmoqchimisiz?")) {
            try {
                await deleteUser(id);
                setUsers(users.filter(u => u.id !== id));
                addNotification({ type: 'success', title: 'O\'chirildi', message: 'Foydalanuvchi o\'chirildi' });
            } catch (e) {
                addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik' });
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-8">Foydalanuvchilarni Boshqarish (Real)</h1>

            {isLoading ? <LoadingSpinner /> : (
                <div className="bg-gray-800/70 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4 font-semibold">Foydalanuvchi</th>
                                <th className="p-4 font-semibold hidden sm:table-cell">ID</th>
                                <th className="p-4 font-semibold">Rol</th>
                                <th className="p-4 font-semibold">Holat (Online)</th>
                                <th className="p-4 font-semibold">Faollik</th>
                                <th className="p-4 font-semibold">Balans</th>
                                <th className="p-4 font-semibold">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                                    <td className="p-4 flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                                {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-gray-400"/>}
                                            </div>
                                            {/* Online Indicator Dot */}
                                            {user.is_online && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full animate-pulse"></span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{user.full_name || 'Ismsiz'}</p>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                            <p className="text-xs text-orange-400">@{user.username}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 font-mono text-xs hidden sm:table-cell">{user.short_id || 'N/A'}</td>
                                    <td className="p-4">
                                        <StatusBadge role={user.role} />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-green-500 animate-ping' : 'bg-gray-600'}`}></span>
                                            <span className={`text-xs font-medium ${user.is_online ? 'text-green-400' : 'text-gray-500'}`}>
                                                {user.is_online ? 'Online' : new Date(user.last_active || user.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <ActivityBadge lastActive={user.last_active || user.created_at} isOnline={user.is_online} />
                                    </td>
                                    <td className="p-4 text-white font-mono">{user.balance.toLocaleString()} UZS</td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {onImpersonate && (
                                                <button 
                                                    onClick={() => onImpersonate(user.id)}
                                                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors"
                                                    title="Profilga Kirish (Impersonate)"
                                                >
                                                    <EnterIcon className="w-5 h-5"/>
                                                </button>
                                            )}
                                            <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><DeleteIcon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};