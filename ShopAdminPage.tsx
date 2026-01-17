import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Package, CreditCard, Plus, Trash2, Check, X, 
    Image as ImageIcon, Film, Settings, List, ChevronRight, Edit3, Save, Video
} from 'lucide-react';
import { 
    getAdminShopProducts, createShopProduct, updateShopProduct, 
    getShopPayments, approveShopPayment, getAllShopOrders, 
    updateOrderStatus, uploadFile 
} from './services/dbService';
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
    const [desc, setDesc] = useState('');
    const [cat, setCat] = useState<ShopProduct['category']>('other');
    const [image, setImage] = useState<File | null>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Dynamic Specs (The 20+ fields requested)
    const [specs, setSpecs] = useState<{ key: string, value: string }[]>([
        { key: 'Material', value: '' },
        { key: 'Rang', value: '' },
        { key: 'O\'lcham', value: '' }
    ]);

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

    const handleAddSpec = () => {
        if (specs.length >= 20) return addNotification({ type: 'warning', title: 'Limit', message: 'Maksimal 20 ta xususiyat kiritish mumkin.' });
        setSpecs([...specs, { key: '', value: '' }]);
    };

    const handleRemoveSpec = (index: number) => {
        setSpecs(specs.filter((_, i) => i !== index));
    };

    const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = val;
        setSpecs(newSpecs);
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return addNotification({ type: 'warning', title: 'Diqqat', message: 'Rasm tanlanishi shart.' });
        
        setIsSaving(true);
        try {
            // 1. Upload Media
            const imageUrl = await uploadFile(image, 'posters');
            let videoUrl = '';
            if (video) videoUrl = await uploadFile(video, 'videos');

            // 2. Format Specs Object
            const specsObj: Record<string, string> = {};
            specs.forEach(s => {
                if (s.key && s.value) specsObj[s.key] = s.value;
            });

            await createShopProduct({
                title, 
                price: Number(price), 
                description: desc,
                category: cat, 
                image_url: imageUrl, 
                video_url: videoUrl,
                specifications: specsObj,
                is_active: true
            });

            addNotification({ type: 'success', title: 'Tayyor', message: "Mahsulot qo'shildi." });
            setIsModalOpen(false);
            resetForm();
            loadData();
        } catch (e) { 
            console.error(e); 
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlashda xatolik yuz berdi.' });
        } finally { setIsSaving(false); }
    };

    const resetForm = () => {
        setTitle(''); setPrice(''); setDesc(''); setCat('other');
        setImage(null); setVideo(null);
        setSpecs([{ key: 'Material', value: '' }, { key: 'Rang', value: '' }, { key: 'O\'lcham', value: '' }]);
    }

    const handleApprovePayment = async (p: ShopPayment) => {
        if (!confirm("Ushbu to'lovni tasdiqlaysizmi? Foydalanuvchi hisobiga pul tushadi.")) return;
        try {
            await approveShopPayment(p.id, p.user_id, p.amount);
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: "Hisob to'ldirildi." });
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleUpdateOrder = async (id: number, status: string) => {
        await updateOrderStatus(id, status);
        addNotification({ type: 'info', title: 'Yangilandi', message: 'Buyurtma holati o\'zgartirildi.' });
        loadData();
    }

    return (
        <div className="animate-fade-in space-y-10 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-pink-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-pink-600/30">
                        <ShoppingBag size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Shop Manager</h1>
                        <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.3em]">Advanced Store Control</p>
                    </div>
                </div>
                
                <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-white/5 shadow-xl">
                    {[
                        { id: 'products', label: 'Mahsulotlar', icon: <List size={16}/> },
                        { id: 'orders', label: 'Buyurtmalar', icon: <Package size={16}/> },
                        { id: 'payments', label: 'Hisob To\'ldirish', icon: <CreditCard size={16}/> },
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-200'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> : (
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
                    {activeTab === 'products' && (
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Mahsulotlar Katalogi</h2>
                                <button onClick={() => setIsModalOpen(true)} className="px-8 py-3 bg-white text-black hover:bg-pink-600 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95">
                                    <Plus size={18} className="inline mr-2"/> Yangi Mahsulot
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {products.map(p => (
                                    <div key={p.id} className="group bg-black/40 p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 hover:border-pink-500/40 transition-all">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shadow-2xl">
                                            <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-white uppercase tracking-tight truncate">{p.title}</p>
                                            <p className="text-pink-500 font-black text-lg">{p.price.toLocaleString()} UZS</p>
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Kategoriya: {p.category}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button className="p-2 text-zinc-600 hover:text-pink-500 transition-colors bg-white/5 rounded-lg"><Edit3 size={18}/></button>
                                            <button className="p-2 text-zinc-600 hover:text-red-500 transition-colors bg-white/5 rounded-lg"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/60 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    <tr>
                                        <th className="p-8">Foydalanuvchi</th>
                                        <th className="p-8">Summa</th>
                                        <th className="p-8">Check</th>
                                        <th className="p-8">Holat</th>
                                        <th className="p-8 text-right">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payments.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-all group">
                                            <td className="p-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-zinc-500 text-xs uppercase">
                                                        {p.profiles?.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-sm uppercase">{p.profiles?.full_name}</p>
                                                        <p className="text-[10px] text-zinc-500">@{p.profiles?.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8 font-black text-pink-500 text-lg">{p.amount.toLocaleString()} UZS</td>
                                            <td className="p-8">
                                                <a href={p.screenshot_url} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-700 transition-all">
                                                    <ImageIcon size={14}/> Ko'rish
                                                </a>
                                            </td>
                                            <td className="p-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                                    p.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-8 text-right">
                                                {p.status === 'pending' && (
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={() => handleApprovePayment(p)} className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all active:scale-90"><Check size={20}/></button>
                                                        <button className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-90"><X size={20}/></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/60 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    <tr>
                                        <th className="p-8">Buyurtma</th>
                                        <th className="p-8">Foydalanuvchi</th>
                                        <th className="p-8">Manzil & Tel</th>
                                        <th className="p-8">Holat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {orders.map(order => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-all">
                                            <td className="p-8">
                                                <div className="flex items-center gap-4">
                                                    <img src={order.products?.image_url} className="w-12 h-12 rounded-xl object-cover" />
                                                    <div>
                                                        <p className="text-pink-500 font-black text-xs uppercase tracking-widest mb-1">#{order.id}</p>
                                                        <p className="font-bold text-white text-sm uppercase">{order.products?.title}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <p className="font-bold text-white text-sm">{order.profiles?.full_name}</p>
                                                <p className="text-xs text-zinc-500">ID: {order.profiles?.short_id}</p>
                                            </td>
                                            <td className="p-8">
                                                <p className="text-xs text-zinc-300 font-medium leading-relaxed max-w-[200px]">{order.delivery_address}</p>
                                                <p className="text-pink-500 font-black text-sm mt-1">{order.phone_number}</p>
                                            </td>
                                            <td className="p-8">
                                                <select 
                                                    value={order.status} 
                                                    onChange={e => handleUpdateOrder(order.id, e.target.value)}
                                                    className="bg-black border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-pink-500"
                                                >
                                                    <option value="processing">Jarayonda</option>
                                                    <option value="shipped">Yo'lda</option>
                                                    <option value="delivered">Yetkazildi</option>
                                                    <option value="cancelled">Rad etildi</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* PRODUCT CREATOR MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <form onSubmit={handleCreateProduct} className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-[4rem] p-10 md:p-16 overflow-y-auto max-h-[90vh] custom-scrollbar animate-slide-in-up">
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">Yangi Mahsulot</h2>
                                <p className="text-pink-500 text-[10px] font-black uppercase tracking-widest mt-2">To'liq ma'lumotlarni kiriting</p>
                            </div>
                            {!isSaving && <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><X size={32}/></button>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Nomi</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Mahsulot nomi..." className="w-full bg-black border border-white/5 rounded-[2rem] p-5 text-white font-bold outline-none focus:border-pink-500 transition-all" required />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Narxi (UZS)</label>
                                        <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="50 000" className="w-full bg-black border border-white/5 rounded-[2rem] p-5 text-white font-bold outline-none focus:border-pink-500 transition-all" required />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Kategoriya</label>
                                        <select value={cat} onChange={e => setCat(e.target.value as any)} className="w-full bg-black border border-white/5 rounded-[2rem] p-5 text-white font-bold outline-none focus:border-pink-500 transition-all appearance-none">
                                            <option value="clothing">Kiyimlar</option>
                                            <option value="accessory">Aksessuarlar</option>
                                            <option value="figure">Haykalchalar</option>
                                            <option value="other">Boshqa</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Tavsif (Mazmun)</label>
                                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mahsulot haqida batafsil..." rows={4} className="w-full bg-black border border-white/5 rounded-[2rem] p-5 text-white font-medium outline-none focus:border-pink-500 transition-all h-32" />
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4 flex items-center gap-2"> <ImageIcon size={14}/> Asosiy Rasm</label>
                                        <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} className="w-full text-zinc-500 text-xs" accept="image/*" required />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4 flex items-center gap-2"> <Film size={14}/> Reklama Videosi (Opsional)</label>
                                        <input type="file" onChange={e => setVideo(e.target.files?.[0] || null)} className="w-full text-zinc-500 text-xs" accept="video/*" />
                                    </div>
                                </div>
                            </div>

                            {/* ADVANCED SPECIFICATIONS (The 20 fields part) */}
                            <div className="space-y-8 bg-black/40 p-10 rounded-[3.5rem] border border-white/5">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-pink-500 flex items-center gap-2"> <Settings size={18}/> Xususiyatlar ({specs.length}/20)</h4>
                                    <button type="button" onClick={handleAddSpec} className="p-2 bg-pink-600 text-white rounded-xl shadow-lg active:scale-90"><Plus size={20}/></button>
                                </div>
                                
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                    {specs.map((spec, idx) => (
                                        <div key={idx} className="flex gap-3 animate-fade-in">
                                            <input 
                                                value={spec.key} 
                                                onChange={e => handleSpecChange(idx, 'key', e.target.value)} 
                                                placeholder="Nomi (Masalan: Bo'yi)" 
                                                className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-pink-500" 
                                            />
                                            <input 
                                                value={spec.value} 
                                                onChange={e => handleSpecChange(idx, 'value', e.target.value)} 
                                                placeholder="Qiymati (Masalan: 180sm)" 
                                                className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-pink-500" 
                                            />
                                            <button type="button" onClick={() => handleRemoveSpec(idx)} className="p-2 text-zinc-700 hover:text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-4 italic">Har bir mahsulot uchun 20 tagacha dinamik parametr kiritish imkoniyati.</p>
                            </div>
                        </div>

                        <div className="mt-16">
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-pink-600/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-4"
                            >
                                {isSaving ? <LoadingSpinner /> : <><Save size={20}/> Mahsulotni Katalogga Joylash</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};