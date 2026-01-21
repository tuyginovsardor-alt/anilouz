
import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Wallet, CreditCard, X, ChevronRight, 
    MapPin, Phone, Search, Heart, Zap, ShieldCheck, 
    Filter, Tag, Star
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
        const premiumPrice = Math.floor(viewProduct.price * 0.9); // 10% chegirma misoli

        if (wallet.balance < premiumPrice) {
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
            await placeShopOrder(user!.id, viewProduct.id, premiumPrice, address, phone);
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

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#f2f2f2] dark:bg-[#050505]"><LoadingSpinner /></div>;

    const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.category === selectedCategory);

    return (
        <div className="min-h-screen bg-[#f2f2f2] dark:bg-[#050505] pb-24 animate-fade-in font-sans selection:bg-pink-500 selection:text-white">
            
            {/* --- HEADER BAR (Clean & Sticky) --- */}
            <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 py-3 shadow-sm">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white rotate-3">
                            <ShoppingBag size={18} fill="currentColor" />
                        </div>
                        <h1 className="text-lg font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
                            Anilo<br/><span className="text-pink-500 text-xs tracking-[0.2em]">STORE</span>
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div 
                            onClick={() => setActiveTab('topup')}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-full cursor-pointer active:scale-95 transition-all"
                        >
                            <Wallet size={14} className="text-gray-600 dark:text-gray-300"/>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{(wallet?.balance || 0).toLocaleString()}</span>
                        </div>
                        <button onClick={() => setActiveTab('orders')} className="p-2 relative bg-gray-100 dark:bg-white/10 rounded-full">
                            <CreditCard size={18} className="text-gray-600 dark:text-gray-300"/>
                            {orders.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-2 md:px-4 mt-2">
                {activeTab === 'browse' && (
                    <div className="space-y-4">
                        
                        {/* --- HERO BANNER (Valentine's Anime Style) --- */}
                        <div className="relative w-full h-auto aspect-[2.5/1] md:h-64 rounded-xl overflow-hidden shadow-lg group">
                            {/* Background Art */}
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300 animate-gradient-xy"></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
                            
                            {/* Content */}
                            <div className="absolute inset-0 flex items-center justify-between p-4 md:p-10">
                                <div className="z-10 text-white drop-shadow-md">
                                    <div className="bg-yellow-400 text-black text-[10px] md:text-xs font-black px-2 py-1 rounded inline-block transform -rotate-2 mb-1 shadow-sm">
                                        LIMITED TIME
                                    </div>
                                    <h2 className="text-2xl md:text-5xl font-black uppercase italic leading-none mb-1">
                                        Mega <br/><span className="text-white text-3xl md:text-6xl text-stroke-2">Sale</span>
                                    </h2>
                                    <p className="text-xs md:text-lg font-bold bg-pink-600 inline-block px-2 transform rotate-1">Get up to 70% OFF!</p>
                                </div>
                                
                                {/* Character (Using a clean cutout placeholder) */}
                                <img 
                                    src="https://img.freepik.com/free-photo/view-3d-school-girl_23-2151109983.jpg?t=st=1729000000~exp=1729003600~hmac=abcdef" 
                                    className="absolute right-0 bottom-0 h-[110%] object-cover object-top mask-image-gradient-left" 
                                    style={{ maskImage: 'linear-gradient(to right, transparent, black 20%)' }}
                                    alt="Anime Girl" 
                                />
                            </div>
                        </div>

                        {/* --- CATEGORY TABS (Pills) --- */}
                        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide">
                            {[
                                { id: 'all', label: 'Barchasi', color: 'bg-gray-900 text-white' },
                                { id: 'figure', label: 'Figuralar', color: 'bg-blue-100 text-blue-700' },
                                { id: 'clothing', label: 'Kiyimlar', color: 'bg-pink-100 text-pink-700' },
                                { id: 'accessory', label: 'Aksessuarlar', color: 'bg-purple-100 text-purple-700' },
                            ].map(cat => (
                                <button 
                                    key={cat.id} 
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all border-2 border-transparent ${
                                        selectedCategory === cat.id 
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md scale-105' 
                                        : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-zinc-800'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* --- PRODUCT GRID (Tokyo Style) --- */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                            {filteredProducts.map(product => {
                                // Price Logic
                                const standardPrice = product.price;
                                const premiumPrice = Math.floor(product.price * 0.9); // 10% discount for premium logic visual

                                return (
                                    <div 
                                        key={product.id} 
                                        onClick={() => setViewProduct(product)}
                                        className="group bg-white dark:bg-[#121212] rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 dark:border-zinc-800 transition-all duration-300 cursor-pointer flex flex-col"
                                    >
                                        {/* Image Container */}
                                        <div className="relative aspect-square overflow-hidden bg-white">
                                            <img 
                                                src={product.image_url} 
                                                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110" 
                                                alt={product.title} 
                                            />
                                            
                                            {/* Badges Overlay */}
                                            <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start">
                                                <div className="flex flex-col gap-1">
                                                    <span className="bg-yellow-400 text-black text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase">Pre-order</span>
                                                    {product.stock_count < 5 && <span className="bg-red-500 text-white text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase">Last {product.stock_count}</span>}
                                                </div>
                                                <button className="bg-white/80 dark:bg-black/50 p-1.5 rounded-full text-gray-400 hover:text-red-500 backdrop-blur-sm transition-colors">
                                                    <Heart size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info Container */}
                                        <div className="p-2 md:p-3 flex flex-col flex-1">
                                            <h4 className="text-[11px] md:text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight mb-2 h-8 md:h-10">
                                                {product.title}
                                            </h4>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 rounded capitalize">{product.category}</span>
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">Official</span>
                                            </div>
                                            
                                            <div className="mt-auto space-y-1">
                                                {/* Pricing Block */}
                                                <div className="flex flex-col">
                                                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                                                        <span>Welcome Price</span>
                                                        <span className="line-through decoration-red-500/50">{standardPrice.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                                                            <Star size={10} className="text-yellow-400 fill-yellow-400"/> 
                                                            <span className="text-[9px] font-bold text-yellow-500 uppercase">Premium Price</span>
                                                        </div>
                                                        <span className="text-red-600 font-black text-sm md:text-lg">
                                                            {premiumPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg font-black text-[10px] md:text-xs uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20 active:scale-95 mt-2">
                                                    Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Orders & Topup Tabs kept same for functionality... */}
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
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-4 text-lg font-bold outline-none focus:border-pink-500 transition-all text-gray-900 dark:text-white"
                                        placeholder="50 000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chek rasmi</label>
                                    <input 
                                        type="file" 
                                        onChange={e => setScreenshot(e.target.files?.[0] || null)}
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
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

            {/* PRODUCT BOTTOM SHEET MODAL (Enhanced) */}
            {viewProduct && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewProduct(null)}></div>
                    <div className="relative bg-white dark:bg-[#121212] w-full max-w-2xl md:rounded-3xl rounded-t-[2rem] overflow-hidden shadow-2xl animate-slide-in-up flex flex-col max-h-[90vh]">
                        
                        {/* Scrollable Content */}
                        <div className="overflow-y-auto custom-scrollbar flex-1 pb-24">
                            {/* Header Image */}
                            <div className="relative h-64 md:h-80 bg-gray-50 dark:bg-zinc-900 flex-shrink-0">
                                <img src={viewProduct.image_url} className="w-full h-full object-contain p-6" alt="" />
                                <button onClick={() => setViewProduct(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 p-2 rounded-full text-white backdrop-blur-sm transition-colors">
                                    <X size={20}/>
                                </button>
                                {/* Badges */}
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">SALE</span>
                                    <span className="bg-white/90 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg backdrop-blur-sm uppercase">{viewProduct.category}</span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight w-2/3">{viewProduct.title}</h3>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-xs line-through">{viewProduct.price.toLocaleString()}</p>
                                        <p className="text-2xl font-black text-red-600">{Math.floor(viewProduct.price * 0.9).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Tags Row */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {['Official', 'Imported', 'Limited Edition'].map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wide">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl mb-6 border border-gray-100 dark:border-white/5">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                        {viewProduct.description || "No description available."}
                                    </p>
                                </div>

                                {/* Specs */}
                                {viewProduct.specifications && (
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {Object.entries(viewProduct.specifications).map(([key, val]) => (
                                            <div key={key} className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-transparent">
                                                <p className="text-[9px] text-gray-400 uppercase font-bold">{key}</p>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Inputs */}
                                <div className="space-y-4 pt-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shipping Details</h4>
                                    <div className="flex flex-col gap-3">
                                        <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center px-4 py-1 border border-transparent focus-within:border-pink-500 transition-colors">
                                            <MapPin size={18} className="text-gray-400"/>
                                            <input 
                                                value={address}
                                                onChange={e => setAddress(e.target.value)}
                                                placeholder="Yetkazib berish manzili"
                                                className="w-full bg-transparent p-3 text-sm outline-none text-gray-900 dark:text-white font-medium placeholder:text-gray-500"
                                            />
                                        </div>
                                        <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center px-4 py-1 border border-transparent focus-within:border-pink-500 transition-colors">
                                            <Phone size={18} className="text-gray-400"/>
                                            <input 
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder="Telefon raqamingiz"
                                                type="tel"
                                                className="w-full bg-transparent p-3 text-sm outline-none text-gray-900 dark:text-white font-medium placeholder:text-gray-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Bottom Action */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#121212] z-20">
                            <button 
                                onClick={handleBuy}
                                disabled={isBuying}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
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
