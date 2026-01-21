
import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Wallet, CreditCard, X, ChevronRight, 
    MapPin, Phone, Search, Heart, Zap, Truck, ShieldCheck, 
    Filter, Tag
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
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    
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

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const [p, w] = await Promise.all([
                getShopProducts(),
                user ? getShopWallet(user.id) : Promise.resolve(null)
            ]);
            setProducts(p);
            setWallet(w);
            if (user) setOrders(await getMyShopOrders(user.id));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleBuy = async () => {
        if (!viewProduct || !wallet) return;
        if (wallet.balance < viewProduct.price) {
            addNotification({ type: 'error', title: 'Xatolik', message: "Mablag' yetarli emas. Iltimos, hisobingizni to'ldiring." });
            return;
        }
        if (!address || !phone) {
            addNotification({ type: 'warning', title: 'Diqqat', message: "Manzil va telefonni kiriting." });
            return;
        }

        setIsBuying(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await placeShopOrder(user!.id, viewProduct.id, viewProduct.price, address, phone);
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

            addNotification({
                type: 'success',
                title: 'So\'rov yuborildi',
                message: 'To\'lov cheki tekshirishga yuborildi. Tez orada balansingiz yangilanadi.',
            });
            
            setTopupAmount('');
            setScreenshot(null);
            setActiveTab('browse');
        } catch (err: any) {
            console.error(err);
            addNotification({ type: 'error', title: 'Xatolik', message: err.message || "Yuklashda xatolik yuz berdi." });
        } finally {
            setIsTopupLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.category === selectedCategory);

    // Random sale calculation for demo (In real app, add discount_price to DB)
    const getDiscount = (price: number) => Math.floor(price * 1.2); 

    return (
        <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#050505] pb-32 animate-fade-in font-sans">
            
            {/* --- HEADER BAR --- */}
            <div className="sticky top-0 z-30 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 px-4 py-3 shadow-sm">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="text-orange-500" size={24} />
                        <h1 className="text-xl font-black italic tracking-tighter text-gray-900 dark:text-white">ANILO <span className="text-orange-500">SHOP</span></h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div 
                            onClick={() => setActiveTab('topup')}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                        >
                            <Wallet size={16} className="text-gray-600 dark:text-gray-300"/>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{(wallet?.balance || 0).toLocaleString()}</span>
                        </div>
                        <button onClick={() => setActiveTab('orders')} className="p-2 relative">
                            <ShoppingBag size={24} className="text-gray-600 dark:text-gray-300"/>
                            {orders.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-2 md:px-4 mt-4">
                {activeTab === 'browse' && (
                    <div className="space-y-6">
                        
                        {/* --- HERO BANNER (Valentine's Style) --- */}
                        <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 shadow-xl flex items-center p-6 md:p-10">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            <div className="relative z-10 text-white w-2/3">
                                <span className="bg-yellow-400 text-black text-[10px] md:text-xs font-black px-2 py-1 rounded uppercase tracking-widest mb-2 inline-block">Special Offer</span>
                                <h2 className="text-3xl md:text-5xl font-black uppercase leading-none mb-2 drop-shadow-md">Summer <br/>Sale</h2>
                                <p className="text-sm md:text-lg font-medium opacity-90 mb-4">Eng sara anime figuralarga <br/>70% gacha chegirma!</p>
                                <button className="bg-white text-red-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-transform active:scale-95 shadow-lg">
                                    Ko'rish
                                </button>
                            </div>
                            <div className="absolute right-[-20px] bottom-[-20px] w-40 md:w-60 opacity-90">
                                {/* Placeholder for anime character png */}
                                <img src="https://i.imgur.com/8y9q1Xh.jpg" className="mask-image-gradient w-full object-contain mix-blend-overlay" alt="" /> 
                            </div>
                        </div>

                        {/* --- CATEGORY PILLS --- */}
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { id: 'all', label: 'Barchasi', icon: <Filter size={14}/> },
                                { id: 'figure', label: 'Figuralar', icon: <img src="https://img.icons8.com/color/48/naruto.png" className="w-4 h-4"/> },
                                { id: 'clothing', label: 'Kiyimlar', icon: <Tag size={14}/> },
                                { id: 'accessory', label: 'Aksessuarlar', icon: <Zap size={14}/> },
                            ].map(cat => (
                                <button 
                                    key={cat.id} 
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap border transition-all ${
                                        selectedCategory === cat.id 
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg transform scale-105' 
                                        : 'bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'
                                    }`}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* --- PRODUCT GRID (Tokyo Style) --- */}
                        <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-red-600 rounded-full"></span> New Arrivals
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                                {filteredProducts.map(product => {
                                    const oldPrice = getDiscount(product.price);
                                    return (
                                        <div 
                                            key={product.id} 
                                            onClick={() => setViewProduct(product)}
                                            className="group bg-white dark:bg-[#151515] rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 dark:border-white/5 transition-all duration-300 cursor-pointer flex flex-col"
                                        >
                                            {/* Image Area */}
                                            <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-900">
                                                <img 
                                                    src={product.image_url} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                    alt={product.title} 
                                                />
                                                {/* Badges */}
                                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                    <span className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded shadow-sm">NEW</span>
                                                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm">10% OFF</span>
                                                </div>
                                                {/* Wishlist */}
                                                <button className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/50 rounded-full text-gray-400 hover:text-red-500 transition-colors backdrop-blur-sm">
                                                    <Heart size={16} />
                                                </button>
                                            </div>

                                            {/* Content Area */}
                                            <div className="p-3 flex flex-col flex-1">
                                                <h4 className="text-xs md:text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 mb-1 min-h-[2.5em]">
                                                    {product.title}
                                                </h4>
                                                
                                                <div className="mt-auto">
                                                    <div className="flex items-baseline gap-2 mb-3">
                                                        <span className="text-red-600 font-black text-sm md:text-lg">
                                                            {product.price.toLocaleString()}
                                                        </span>
                                                        <span className="text-gray-400 text-[10px] line-through decoration-red-500/50">
                                                            {oldPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    
                                                    <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20 active:scale-95">
                                                        Buy Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="max-w-2xl mx-auto space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mening Buyurtmalarim</h2>
                        {orders.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-[#151515] rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800">
                                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500 text-sm">Buyurtmalar tarixi bo'sh</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-[#151515] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex gap-4">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={order.products?.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{order.products?.title}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Sana: {new Date(order.created_at).toLocaleDateString()}</p>
                                        <p className="text-sm font-black text-red-500 mt-2">{order.amount_paid.toLocaleString()} UZS</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'topup' && (
                    <div className="max-w-xl mx-auto">
                        <div className="bg-white dark:bg-[#151515] p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center">Hamyonni to'ldirish</h2>
                            <p className="text-gray-500 text-xs text-center mb-8">Xaridlar uchun balansingizni oshiring</p>
                            
                            <PaymentDetailsCard />

                            <form onSubmit={handleTopup} className="mt-8 space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Summa</label>
                                    <input 
                                        type="number" 
                                        value={topupAmount}
                                        onChange={e => setTopupAmount(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-4 text-lg font-bold outline-none focus:border-orange-500 transition-all text-gray-900 dark:text-white"
                                        placeholder="50 000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chek rasmi</label>
                                    <input 
                                        type="file" 
                                        onChange={e => setScreenshot(e.target.files?.[0] || null)}
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
                                        accept="image/*"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isTopupLoading}
                                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {isTopupLoading ? 'Jo\'natilmoqda...' : 'Tasdiqlash'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* PRODUCT BOTTOM SHEET MODAL */}
            {viewProduct && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewProduct(null)}></div>
                    <div className="relative bg-white dark:bg-[#121212] w-full max-w-2xl md:rounded-3xl rounded-t-[2rem] overflow-hidden shadow-2xl animate-slide-in-up flex flex-col max-h-[90vh]">
                        
                        {/* Modal Header Image */}
                        <div className="relative h-64 md:h-80 bg-gray-100 dark:bg-zinc-900 flex-shrink-0">
                            <img src={viewProduct.image_url} className="w-full h-full object-contain p-4" alt="" />
                            <button onClick={() => setViewProduct(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 p-2 rounded-full text-white backdrop-blur-sm transition-colors">
                                <X size={20}/>
                            </button>
                            {/* Badges */}
                            <div className="absolute bottom-4 left-4 flex gap-2">
                                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">SALE</span>
                                <span className="bg-white/90 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">{viewProduct.category}</span>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">{viewProduct.title}</h3>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <p className="text-3xl font-black text-red-600">{viewProduct.price.toLocaleString()} <span className="text-sm text-gray-500 font-bold">UZS</span></p>
                                <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                    <CheckCircle2 size={12}/> In Stock
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                                {viewProduct.description || "Tavsif mavjud emas."}
                            </p>

                            {/* Specs */}
                            {viewProduct.specifications && (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {Object.entries(viewProduct.specifications).map(([key, val]) => (
                                        <div key={key} className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">{key}</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{val}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Form */}
                            <div className="space-y-4 border-t border-gray-100 dark:border-white/10 pt-6">
                                <div className="flex gap-3">
                                    <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center px-3">
                                        <MapPin size={18} className="text-gray-400"/>
                                        <input 
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            placeholder="Manzil"
                                            className="w-full bg-transparent p-3 text-sm outline-none text-gray-900 dark:text-white font-medium"
                                        />
                                    </div>
                                    <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center px-3">
                                        <Phone size={18} className="text-gray-400"/>
                                        <input 
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="Telefon"
                                            type="tel"
                                            className="w-full bg-transparent p-3 text-sm outline-none text-gray-900 dark:text-white font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Bottom Action */}
                        <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#121212]">
                            <button 
                                onClick={handleBuy}
                                disabled={isBuying}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isBuying ? 'Processing...' : <>Sotib Olish <ChevronRight size={16}/></>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
