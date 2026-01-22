
import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Package, CreditCard, Plus, Trash2, Check, X, 
    Image as ImageIcon, Film, Settings, List, ChevronRight, Edit3, Save, Video, Star, Clock, Truck
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

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('0');
    const [rating, setRating] = useState('5.0');
    const [delivery, setDelivery] = useState('2-5 kun');
    const [desc, setDesc] = useState('');
    const [cat, setCat] = useState<ShopProduct['category']>('other');
    const [image, setImage] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [specs, setSpecs] = useState<{ key: string, value: string }[]>([
        { key: 'Brend', value: '' },
        { key: 'Material', value: '' }
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

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return addNotification({ type: 'warning', title: 'Diqqat', message: 'Rasm yuklang.' });
        setIsSaving(true);
        try {
            const imageUrl = await uploadFile(image, 'posters');
            const specsObj: Record<string, string> = {};
            specs.forEach(s => { if (s.key && s.value) specsObj[s.key] = s.value; });

            await createShopProduct({
                title, 
                price: Number(price), 
                discount_percent: Number(discount),
                rating: Number(rating),
                delivery_time: delivery,
                description: desc,
                category: cat, 
                image_url: imageUrl, 
                specifications: specsObj,
                is_active: true
            });

            addNotification({ type: 'success', title: 'Tayyor', message: "Mahsulot yaratildi." });
            setIsModalOpen(false);
            loadData();
        } catch (e) { console.error(e); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="animate-fade-in space-y-10 pb-32 max-w-7xl mx-auto p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-600 rounded-2xl flex items-center justify-center text-white">
                        <ShoppingBag size={24} />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Store Admin</h1>
                </div>
                
                <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-white/5">
                    {['products', 'orders', 'payments'].map((t: any) => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-pink-600 text-white' : 'text-zinc-500'}`}>{t}</button>
                    ))}
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-8">
                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black uppercase text-white">Mahsulotlar</h2>
                                <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all">Qo'shish</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(p => (
                                    <div key={p.id} className="bg-black/40 p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                                        <img src={p.image_url} className="w-16 h-16 rounded-xl object-cover" alt="" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{p.title}</p>
                                            <p className="text-pink-500 font-black">{p.price.toLocaleString()} UZS</p>
                                            {p.discount_percent && <p className="text-[10px] text-red-500 font-bold">-{p.discount_percent}% Discount</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Other admin tabs... */}
                </div>
            )}

            {/* PRODUCT CREATOR MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <form onSubmit={handleCreateProduct} className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-[3rem] p-10 overflow-y-auto max-h-[90vh] animate-slide-in-up">
                        <h2 className="text-3xl font-black uppercase text-white mb-8">Yangi mahsulot</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nomi" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="Narxi" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white" required />
                                    <input value={discount} onChange={e => setDiscount(e.target.value)} type="number" placeholder="Chegirma %" className="w-full bg-black border border-white/10 rounded-xl p-4 text-red-500 font-bold" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={rating} onChange={e => setRating(e.target.value)} placeholder="Reyting (ex: 4.8)" className="w-full bg-black border border-white/10 rounded-xl p-4 text-yellow-500" />
                                    <input value={delivery} onChange={e => setDelivery(e.target.value)} placeholder="Yetkazish (ex: 2 kun)" className="w-full bg-black border border-white/10 rounded-xl p-4 text-blue-400" />
                                </div>
                                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tavsif" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white h-32" />
                                <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} className="w-full text-zinc-500" accept="image/*" />
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-black text-pink-500 uppercase text-xs">Xususiyatlar (Maks 20 ta)</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {specs.map((s, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input value={s.key} onChange={e => {const n=[...specs]; n[i].key=e.target.value; setSpecs(n)}} placeholder="Nom (ex: Material)" className="flex-1 bg-zinc-900 border-none rounded-lg p-2 text-xs text-white" />
                                            <input value={s.value} onChange={e => {const n=[...specs]; n[i].value=e.target.value; setSpecs(n)}} placeholder="Qiymat" className="flex-1 bg-zinc-900 border-none rounded-lg p-2 text-xs text-white" />
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setSpecs([...specs, {key:'', value:''}])} className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-[10px] text-zinc-500 uppercase font-black">+ Qo'shish</button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isSaving} className="w-full bg-pink-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs mt-10">
                            {isSaving ? 'Saqlanmoqda...' : 'Mahsulotni qo\'shish'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
