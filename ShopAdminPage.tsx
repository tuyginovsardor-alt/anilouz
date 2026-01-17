import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, CreditCard, Plus, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';
import { getAdminShopProducts, createShopProduct, updateShopProduct, getShopPayments, approveShopPayment, getAllShopOrders, updateOrderStatus, uploadFile } from './services/dbService';
import { ShopProduct, ShopPayment, ShopOrder } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';

export const ShopAdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'payments'>('products');
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [payments, setPayments] = useState<ShopPayment[]>([]);
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Product Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [cat, setCat] = useState<ShopProduct['category']>('other');
    const [image, setImage] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'products') setProducts(await getAdminShopProducts());
            else if (activeTab === 'payments') setPayments(await getShopPayments());
            else if (activeTab === 'orders') setOrders(await getAllShopOrders());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return;
        setIsSaving(true);
        try {
            const url = await uploadFile(image, 'posters');
            await createShopProduct({
                title, price: Number(price), category: cat, image_url: url, is_active: true
            });
            addNotification({ type: 'success', title: 'Qo\'shildi', message: "Mahsulot yaratildi." });
            setIsModalOpen(false);
            loadData();
        } catch (e) { console.error(e); }
        finally { setIsSaving(false); }
    };

    const handleApprovePayment = async (p: ShopPayment) => {
        if (!confirm("To'lovni tasdiqlaysizmi?")) return;
        try {
            await approveShopPayment(p.id, p.user_id, p.amount);
            addNotification({ type: 'success', title: 'Bajarildi', message: "Hisob to'ldirildi." });
            loadData();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="animate-fade-in space-y-8 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h1 className="text-3xl font-black uppercase tracking-tighter text-orange-500">Shop Admin Panel</h1>
                <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5">
                    {[
                        { id: 'products', label: 'Mahsulotlar', icon: <ShoppingBag size={16}/> },
                        { id: 'orders', label: 'Buyurtmalar', icon: <Package size={16}/> },
                        { id: 'payments', label: 'To\'lovlar', icon: <CreditCard size={16}/> },
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="bg-zinc-900 border border-white/5 rounded-[3rem] overflow-hidden">
                    {activeTab === 'products' && (
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Katalog</h2>
                                <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">
                                    <Plus size={16} className="inline mr-2"/> Yangi mahsulot
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(p => (
                                    <div key={p.id} className="bg-black/40 p-4 rounded-[2rem] border border-white/5 flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800">
                                            <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm uppercase">{p.title}</p>
                                            <p className="text-orange-500 font-bold">{p.price.toLocaleString()} UZS</p>
                                        </div>
                                        <button className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    <tr>
                                        <th className="p-6">Foydalanuvchi</th>
                                        <th className="p-6">Summa</th>
                                        <th className="p-6">Chek</th>
                                        <th className="p-6">Holat</th>
                                        <th className="p-6">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payments.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-all">
                                            <td className="p-6">
                                                <p className="font-bold text-sm">{p.profiles?.full_name}</p>
                                                <p className="text-[10px] text-zinc-500">@{p.profiles?.username}</p>
                                            </td>
                                            <td className="p-6 font-black text-orange-500">{p.amount.toLocaleString()} UZS</td>
                                            <td className="p-6">
                                                <a href={p.screenshot_url} target="_blank" className="text-blue-500 hover:underline text-xs">Rasmni ko'rish</a>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                {p.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleApprovePayment(p)} className="p-2 bg-green-600 text-white rounded-lg"><Check size={16}/></button>
                                                        <button className="p-2 bg-red-600 text-white rounded-lg"><X size={16}/></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleCreateProduct} className="relative bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[3rem] p-10 space-y-6">
                        <h2 className="text-2xl font-black uppercase">Yangi Mahsulot</h2>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nomi" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-orange-500" required />
                        <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="Narxi (UZS)" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-orange-500" required />
                        <select value={cat} onChange={e => setCat(e.target.value as any)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-orange-500">
                            <option value="clothing">Kiyim</option>
                            <option value="accessory">Aksessuar</option>
                            <option value="figure">Haykalcha</option>
                            <option value="other">Boshqa</option>
                        </select>
                        <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} className="w-full text-zinc-500" required />
                        <button type="submit" disabled={isSaving} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest">{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                    </form>
                </div>
            )}
        </div>
    );
};