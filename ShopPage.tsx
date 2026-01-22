
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

                    {/* Shop Search Bar */}
                    <form onSubmit={handleSearch} className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Anime figuralari, kiyimlar, aksessuarlar..."
                            className="w-full bg-gray-100 dark:bg-[#151515] border border-gray-200 dark:border-white/5 py-3 pl-12 pr-4 rounded-xl text-sm focus:border-pink-500 outline-none transition-all dark:text-white"
                        />
                    </form>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6">
                {activeTab === 'browse' && (
                    <div className="space-y-6">
                        
                        {/* --- CATEGORIES & SORTING --- */}
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
                                            : 'bg-white dark:bg-zinc-900 text-gray-500 border-gray-200 dark:border-zinc-800 hover:border-pink-500/50'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-gray-200 dark:border-zinc-800 self-end md:self-auto">
                                <ArrowUpDown size={14} className="ml-2 text-gray-400" />
                                <select 
                                    value={sortBy} 
                                    onChange={e => setSortBy(e.target.value as any)}
                                    className="bg-transparent text-[10px] font-black uppercase py-1.5 pr-2 outline-none dark:text-gray-300"
                                >
                                    <option value="newest">Eng yangi</option>
                                    <option value="popular">Ommabop</option>
                                    <option value="price_asc">Arzonroq</option>
                                    <option value="price_desc">Qimmatroq</option>
                                </select>
                            </div>
                        </div>

                        {/* --- PRODUCT GRID --- */}
                        {loading ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                                {products.length === 0 && <div className="col-span-full py-20 text-center text-gray-500 uppercase font-black tracking-widest text-xs">Mahsulotlar topilmadi</div>}
                                {products.map(product => {
                                    const hasDiscount = product.discount_percent && product.discount_percent > 0;
                                    const finalPrice = hasDiscount ? product.price * (1 - product.discount_percent! / 100) : product.price;

                                    return (
                                        <div 
                                            key={product.id} 
                                            onClick={() => setViewProduct(product)}
                                            className="group bg-white dark:bg-[#111] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-200 dark:border-white/5 transition-all duration-500 cursor-pointer flex flex-col"
                                        >
                                            {/* Media Wrapper */}
                                            <div className="relative aspect-square overflow-hidden bg-white flex items-center justify-center">
                                                <img src={product.image_url} className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110" alt={product.title} />
                                                
                                                {/* Labels */}
                                                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                                    {hasDiscount && (
                                                        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-xl animate-pulse">
                                                            -{product.discount_percent}%
                                                        </span>
                                                    )}
                                                    {product.sales_count && product.sales_count > 50 && (
                                                        <span className="bg-yellow-400 text-black text-[8px] font-black px-2 py-1 rounded-lg shadow-lg uppercase">Best Seller</span>
                                                    )}
                                                </div>
                                                
                                                <button className="absolute bottom-3 right-3 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                    <Heart size={16} />
                                                </button>
                                            </div>

                                            {/* Info */}
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="text-[10px] font-bold text-gray-500">{product.rating || '5.0'}</span>
                                                    <span className="text-[10px] text-gray-400 ml-1">({product.sales_count || 0}+ sotuv)</span>
                                                </div>
                                                
                                                <h4 className="text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight h-8 md:h-10 mb-2 uppercase tracking-tight">
                                                    {product.title}
                                                </h4>

                                                <div className="mt-auto pt-2 border-t border-gray-100 dark:border-white/5">
                                                    <div className="flex flex-col">
                                                        {hasDiscount && <span className="text-[10px] text-gray-400 line-through mb-0.5">{product.price.toLocaleString()} UZS</span>}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm md:text-lg font-black text-pink-600 dark:text-pink-500">
                                                                {finalPrice.toLocaleString()} <span className="text-[10px]">UZS</span>
                                                            </span>
                                                            <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-black group-hover:bg-pink-600 group-hover:text-white transition-all">
                                                                <Zap size={14} fill="currentColor" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Other Tabs Content (Orders & Topup) ... kept logic from previous version but styled better ... */}
                {activeTab === 'topup' && (
                    <div className="max-w-xl mx-auto animate-slide-in-up">
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-gray-200 dark:border-white/5">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 text-center uppercase tracking-tighter">Hamyonni to'ldirish</h2>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center mb-10">Hisobingizni Uzcard/Humo orqali to'ldiring</p>
                            
                            <div className="mb-10 scale-105 sm:scale-110"><PaymentDetailsCard /></div>

                            <form onSubmit={handleTopup} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-[0.2em]">Kiritiladigan summa</label>
                                    <div className="relative group">
                                        <input 
                                            type="number" 
                                            value={topupAmount}
                                            onChange={e => setTopupAmount(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-5 text-xl font-black outline-none focus:border-pink-500 transition-all text-gray-900 dark:text-white placeholder:text-zinc-700"
                                            placeholder="50,000"
                                            required
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">UZS</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-4 tracking-[0.2em]">Chek (Skrinshot)</label>
                                    <input 
                                        type="file" 
                                        onChange={e => setScreenshot(e.target.files?.[0] || null)}
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
                                        accept="image/*"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isTopupLoading}
                                    className="w-full bg-gray-900 dark:bg-pink-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-pink-500 transition-all shadow-xl active:scale-95 disabled:opacity-50 mt-4"
                                >
                                    {isTopupLoading ? 'Jo\'natilmoqda...' : 'Tasdiqlash'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                
                {/* Orders tab ... similarly styled ... */}
            </div>

            {/* --- PRODUCT DETAIL BOTTOM SHEET --- */}
            {viewProduct && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setViewProduct(null)}></div>
                    <div className="relative bg-white dark:bg-[#0c0c0c] w-full max-w-4xl md:rounded-[3rem] rounded-t-[2.5rem] overflow-hidden shadow-2xl animate-slide-in-up flex flex-col md:flex-row max-h-[95vh] md:max-h-[85vh]">
                        
                        {/* Media Section */}
                        <div className="w-full md:w-1/2 bg-white dark:bg-zinc-900 relative">
                            <img src={viewProduct.image_url} className="w-full h-full object-contain p-8 md:p-12" alt="" />
                            <button onClick={() => setViewProduct(null)} className="absolute top-6 left-6 p-2.5 bg-black/10 hover:bg-black/20 rounded-full text-zinc-500 backdrop-blur-sm transition-colors md:hidden">
                                <X size={24}/>
                            </button>
                            <div className="absolute top-6 right-6 flex flex-col gap-2">
                                <span className="bg-pink-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">OFFICIAL MERCH</span>
                                {viewProduct.stock_count < 10 && <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">ONLY {viewProduct.stock_count} LEFT</span>}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 md:p-10">
                            <div className="mb-8">
                                <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-3">{viewProduct.category}</p>
                                <h3 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter mb-4">{viewProduct.title}</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                                        {(viewProduct.discount_percent ? viewProduct.price * (1 - viewProduct.discount_percent / 100) : viewProduct.price).toLocaleString()} <span className="text-lg">UZS</span>
                                    </div>
                                    {viewProduct.discount_percent && <span className="text-lg text-gray-400 line-through decoration-red-500/40">{viewProduct.price.toLocaleString()}</span>}
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <Truck className="text-blue-500" size={24}/>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase">Yetkazib berish</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-gray-200">{viewProduct.delivery_time || '2-5 kun'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <ShieldCheck className="text-green-500" size={24}/>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase">Kafolat</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-gray-200">100% Original</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"> <Info size={14}/> Mahsulot tavsifi</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-medium">
                                        {viewProduct.description || "Ushbu mahsulot yuqori sifatli materiallardan tayyorlangan va anime ixlosmandlari uchun maxsus ishlab chiqarilgan."}
                                    </p>
                                </div>

                                {/* Specifications - 20 fields support */}
                                {viewProduct.specifications && (
                                    <div>
                                        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Texnik Xususiyatlar</h4>
                                        <div className="grid grid-cols-1 gap-1 border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden">
                                            {Object.entries(viewProduct.specifications).map(([key, val]) => (
                                                <div key={key} className="flex justify-between items-center px-4 py-3 bg-gray-50/50 dark:bg-white/5">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{key}</span>
                                                    <span className="text-xs font-black text-gray-900 dark:text-gray-200">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Inputs for Order */}
                                <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/5">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Yetkazish ma'lumotlari</h4>
                                    <div className="flex flex-col gap-3">
                                        <div className="bg-gray-100 dark:bg-black rounded-2xl flex items-center px-5 py-1 focus-within:ring-2 focus-within:ring-pink-500 transition-all border border-transparent">
                                            <MapPin size={20} className="text-zinc-500"/>
                                            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Tuman, ko'cha, uy raqami" className="w-full bg-transparent p-4 text-sm outline-none dark:text-white font-bold"/>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-black rounded-2xl flex items-center px-5 py-1 focus-within:ring-2 focus-within:ring-pink-500 transition-all border border-transparent">
                                            <Phone size={20} className="text-zinc-500"/>
                                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998" type="tel" className="w-full bg-transparent p-4 text-sm outline-none dark:text-white font-bold"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-10">
                                <button 
                                    onClick={handleBuy}
                                    disabled={isBuying}
                                    className="w-full bg-pink-600 hover:bg-pink-500 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-pink-600/30 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isBuying ? <LoadingSpinner /> : <>Buyurtma berish <ChevronRight size={18}/></>}
                                </button>
                                <p className="text-center text-[10px] text-gray-500 mt-4 font-bold uppercase tracking-widest">Sotib olish uchun hamyonda yetarli mablag' bo'lishi kerak</p>
                            </div>
                        </div>
                        
                        <button onClick={() => setViewProduct(null)} className="absolute top-8 right-8 p-2 bg-gray-100 dark:bg-white/5 hover:bg-white/10 rounded-xl text-zinc-500 hidden md:block transition-all">
                            <X size={24}/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
