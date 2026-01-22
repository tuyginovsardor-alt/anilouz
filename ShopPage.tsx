
import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Wallet, CreditCard, X, ChevronRight, 
    MapPin, Phone, Search, Heart, Zap, ShieldCheck, 
    Filter, Tag, Star, Truck, Info, ArrowUpDown, Check
} from 'lucide-react';
import { getShopProducts, getShopWallet, createShopPaymentRequest, placeShopOrder, getMyShopOrders, uploadFile } from './services/dbService';
import { ShopProduct, ShopWallet, ShopOrder } from './types';
import { supabase } from './services/supabaseClient';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { PaymentDetailsCard } from './components/PaymentDetailsCard';

export const ShopPage: React.FC = () => {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [wallet, setWallet] = useState<ShopWallet | null>(null);
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'browse' | 'orders' | 'topup'>('browse');
    
    // Filters & Sorting
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');

    // Detailed View / Purchase
    const [viewProduct, setViewProduct] = useState<ShopProduct | null>(null);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [isBuying, setIsBuying] = useState(false);

    // Topup
    const [topupAmount, setTopupAmount] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isTopupLoading, setIsTopupLoading] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => { loadData(); }, [selectedCategory, sortBy]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const p = await getShopProducts(selectedCategory, sortBy, searchQuery);
            setProducts(p);
            
            if (user) {
                const [w, o] = await Promise.all([
                    getShopWallet(user.id),
                    getMyShopOrders(user.id)
                ]);
                setWallet(w);
                setOrders(o);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const handleBuy = async () => {
        if (!viewProduct || !wallet) return;
        const discount = viewProduct.discount_percent ? (viewProduct.price * viewProduct.discount_percent / 100) : 0;
        const finalPrice = viewProduct.price - discount;

        if (wallet.balance < finalPrice) {
            addNotification({ type: 'error', title: 'Xatolik', message: "Mablag' yetarli emas. Hisobni to'ldiring." });
            return;
        }
        if (!address || !phone) {
            addNotification({ type: 'warning', title: 'Diqqat', message: "Manzil va telefonni kiriting." });
            return;
        }

        setIsBuying(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await placeShopOrder(user!.id, viewProduct.id, finalPrice, address, phone);
            addNotification({ type: 'success', title: 'Muvaffaqiyatli', message: "Buyurtma qabul qilindi!" });
            setViewProduct(null);
            loadData();
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally { setIsBuying(false); }
    };

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topupAmount || !screenshot) {
            addNotification({ type: 'warning', title: 'Diqqat', message: "Barcha maydonlarni to'ldiring." });
            return;
        }
        setIsTopupLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Foydalanuvchi aniqlanmadi");
            const publicUrl = await uploadFile(screenshot, 'posters');
            await createShopPaymentRequest(user.id, Number(topupAmount), publicUrl);
            addNotification({ type: 'success', title: 'Yuborildi', message: 'To\'lov cheki tekshirishga yuborildi.' });
            setTopupAmount(''); setScreenshot(null); setActiveTab('browse');
        } catch (err: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: err.message || "Xatolik yuz berdi." });
        } finally { setIsTopupLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#050505] pb-24 animate-fade-in font-sans">
            
            {/* --- TOP STICKY NAVIGATION --- */}
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 py-3">
                <div className="container mx-auto flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setSelectedCategory('all'); setActiveTab('browse')}}>
                            <div className="w-9 h-9 bg-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3">
                                <ShoppingBag size={20} fill="currentColor" />
                            </div>
                            <h1 className="text-xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
                                Anilo<br/><span className="text-pink-500 text-[10px] tracking-[0.2em]">STORE</span>
                            </h1>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div onClick={() => setActiveTab('topup')} className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10">
                                <Wallet size={14} className="text-pink-500"/>
                                <span className="text-xs font-black text-gray-900 dark:text-white">{(wallet?.balance || 0).toLocaleString()} UZS</span>
                            </div>
                            <button onClick={() => setActiveTab('orders')} className="p-2.5 relative bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10">
                                <CreditCard size={18} className="text-gray-600 dark:text-gray-300"/>
                                {orders.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black">{orders.length}</span>}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Anime figuralari, kiyimlar..."
                            className="w-full bg-gray-100 dark:bg-[#151515] border border-gray-200 dark:border-white/5 py-3 pl-12 pr-4 rounded-xl text-sm focus:border-pink-500 outline-none transition-all dark:text-white"
                        />
                    </form>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6">
                {activeTab === 'browse' && (
                    <div className="space-y-6">
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[
                                    { id: 'all', label: 'Barchasi' },
                                    { id: 'figure', label: 'Figuralar' },
                                    { id: 'clothing', label: 'Kiyimlar' },
                                    { id: 'accessory', label: 'Aksessuarlar' },
                                ].map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            selectedCategory === cat.id 
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' 
                                            : 'bg-white dark:bg-zinc-900 text-gray-500 border-gray-200 dark:border-zinc-800'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-gray-200 dark:border-zinc-800 self-end md:self-auto">
                                <ArrowUpDown size={14} className="ml-2 text-gray-400" />
                                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent text-[10px] font-black uppercase py-1.5 pr-2 outline-none dark:text-gray-300">
                                    <option value="newest">Yangi</option>
                                    <option value="popular">Ommabop</option>
                                    <option value="price_asc">Arzon</option>
                                    <option value="price_desc">Qimmat</option>
                                </select>
                            </div>
                        </div>

                        {loading ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                                {products.map(product => {
                                    const hasDiscount = product.discount_percent && product.discount_percent > 0;
                                    const finalPrice = hasDiscount ? product.price * (1 - product.discount_percent! / 100) : product.price;

                                    return (
                                        <div key={product.id} onClick={() => setViewProduct(product)} className="group bg-white dark:bg-[#111] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-200 dark:border-white/5 transition-all duration-500 cursor-pointer flex flex-col">
                                            <div className="relative aspect-square overflow-hidden bg-white flex items-center justify-center p-4">
                                                <img src={product.image_url} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" alt="" />
                                                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                                    {hasDiscount && <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg">-{product.discount_percent}%</span>}
                                                    {product.sales_count && product.sales_count > 50 && <span className="bg-yellow-400 text-black text-[8px] font-black px-2 py-1 rounded-lg uppercase">Best Seller</span>}
                                                </div>
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="text-[10px] font-bold text-gray-500">{product.rating || '5.0'}</span>
                                                </div>
                                                <h4 className="text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 line-clamp-2 h-8 md:h-10 mb-2 uppercase">{product.title}</h4>
                                                <div className="mt-auto pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        {hasDiscount && <span className="text-[10px] text-gray-400 line-through">{product.price.toLocaleString()}</span>}
                                                        <span className="text-sm md:text-lg font-black text-pink-600 dark:text-pink-500">{finalPrice.toLocaleString()} UZS</span>
                                                    </div>
                                                    <Zap size={14} className="text-pink-500 fill-current" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- PRODUCT DETAIL MODAL (UBUY STYLE) --- */}
            {viewProduct && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewProduct(null)}></div>
                    <div className="relative bg-white dark:bg-[#0c0c0c] w-full max-w-4xl md:rounded-[3rem] rounded-t-[2.5rem] overflow-hidden shadow-2xl animate-slide-in-up flex flex-col md:flex-row max-h-[95vh] md:max-h-[85vh]">
                        
                        <div className="w-full md:w-1/2 bg-white dark:bg-zinc-900 relative p-8">
                            <img src={viewProduct.image_url} className="w-full h-full object-contain" alt="" />
                            <button onClick={() => setViewProduct(null)} className="absolute top-6 left-6 p-2.5 bg-black/10 rounded-full md:hidden"><X size={24}/></button>
                        </div>

                        <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <div className="mb-8">
                                <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-2">{viewProduct.category}</p>
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase mb-4">{viewProduct.title}</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl font-black text-pink-600">{(viewProduct.discount_percent ? viewProduct.price * (1 - viewProduct.discount_percent / 100) : viewProduct.price).toLocaleString()} UZS</div>
                                    {viewProduct.discount_percent && <span className="text-lg text-gray-400 line-through">{viewProduct.price.toLocaleString()}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-3">
                                    <Truck className="text-blue-500" size={20}/><div className="text-[10px] font-bold text-gray-500 uppercase">Yetkazish: {viewProduct.delivery_time || '2-4 kun'}</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-3">
                                    <ShieldCheck className="text-green-500" size={20}/><div className="text-[10px] font-bold text-gray-500 uppercase">100% Original</div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-xs font-black text-zinc-500 uppercase mb-3 flex items-center gap-2"> <Info size={14}/> Tavsif</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{viewProduct.description}</p>
                                </div>

                                {viewProduct.specifications && Object.keys(viewProduct.specifications).length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-black text-zinc-500 uppercase mb-4">Texnik Xususiyatlar</h4>
                                        <div className="border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden">
                                            {Object.entries(viewProduct.specifications).map(([key, val]) => (
                                                <div key={key} className="flex justify-between items-center px-4 py-3 bg-gray-50/50 dark:bg-white/5 border-b border-white/5 last:border-0">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{key}</span>
                                                    <span className="text-xs font-black text-gray-900 dark:text-gray-200">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/5">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase">Yetkazish manzili</h4>
                                    <div className="flex flex-col gap-3">
                                        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Shahar, tuman, ko'cha" className="bg-gray-100 dark:bg-black rounded-2xl p-4 text-sm outline-none border border-transparent focus:border-pink-500 text-white"/>
                                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon (+998)" type="tel" className="bg-gray-100 dark:bg-black rounded-2xl p-4 text-sm outline-none border border-transparent focus:border-pink-500 text-white"/>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-10">
                                <button onClick={handleBuy} disabled={isBuying} className="w-full bg-pink-600 hover:bg-pink-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50">
                                    {isBuying ? 'Kutilmoqda...' : 'Sotib Olish'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
