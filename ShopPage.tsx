import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Package, Wallet, CreditCard, X, ChevronRight, 
    MapPin, Phone, CheckCircle2, ShoppingCart, Filter, Info, 
    Star, Play, Box, Zap, Truck, ShieldCheck 
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

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.category === selectedCategory);

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 animate-fade-in font-sans">
            {/* NEW PREMIUM HEADER */}
            <div className="relative h-[40vh] flex items-center justify-center overflow-hidden border-b border-white/5 bg-zinc-900">
                <div className="absolute inset-0 bg-[url('https://i.imgur.com/uN8fD3A.png')] bg-cover bg-center opacity-10 blur-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
                
                <div className="relative z-10 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                        <Zap size={14} fill="white"/> New Collection Drop
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
                        ANILO <span className="text-orange-500">SHOP</span>
                    </h1>
                    <p className="text-zinc-400 font-bold uppercase tracking-[0.4em] text-xs">Exclusively for the Anilo Community</p>
                </div>
            </div>

            {/* QUICK STATS & NAV */}
            <div className="container mx-auto px-4 -mt-12 relative z-20">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-hidden">
                        {[
                            { id: 'browse', label: 'Shop', icon: <ShoppingBag size={16}/> },
                            { id: 'orders', label: 'Buyurtmalar', icon: <Package size={16}/> },
                            { id: 'topup', label: 'Hamyon', icon: <Wallet size={16}/> },
                        ].map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Sizning Balansingiz</p>
                            <p className="text-xl font-black text-white">{(wallet?.balance || 0).toLocaleString()} <span className="text-xs text-orange-500">UZS</span></p>
                        </div>
                        <button onClick={() => setActiveTab('topup')} className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-xl">
                            <CreditCard size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-16">
                {activeTab === 'browse' && (
                    <div className="space-y-12">
                        {/* Filters */}
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide justify-center">
                            {['all', 'clothing', 'accessory', 'figure'].map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/20'}`}
                                >
                                    {cat === 'all' ? 'Hamma mahsulotlar' : cat}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                            {filteredProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    onClick={() => setViewProduct(product)}
                                    className="group relative bg-zinc-900 border border-white/5 rounded-[3rem] overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all hover:-translate-y-2 shadow-xl"
                                >
                                    <div className="aspect-[4/5] bg-zinc-800 relative overflow-hidden">
                                        <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                        <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-orange-500 border border-white/10">
                                            {product.category}
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-4">
                                        <h3 className="font-black text-xl uppercase tracking-tighter group-hover:text-orange-500 transition-colors">{product.title}</h3>
                                        <div className="flex justify-between items-center">
                                            <p className="text-2xl font-black text-white">{product.price.toLocaleString()} <span className="text-xs text-zinc-500">UZS</span></p>
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {orders.length === 0 && (
                            <div className="text-center py-32 bg-zinc-900/50 rounded-[3rem] border border-dashed border-white/10">
                                <Box size={48} className="mx-auto text-zinc-800 mb-4" />
                                <p className="text-zinc-600 font-black uppercase tracking-widest">Sizda hali buyurtmalar yo'q</p>
                            </div>
                        )}
                        {orders.map(order => (
                            <div key={order.id} className="group bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 hover:bg-zinc-800/50 transition-all">
                                <div className="flex items-center gap-8">
                                    <div className="w-24 h-24 bg-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                                        <img src={order.products?.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">ID: #{order.id}</p>
                                        <h4 className="font-black text-xl text-white uppercase tracking-tight">{order.products?.title}</h4>
                                        <p className="text-sm font-bold text-zinc-400">{order.amount_paid.toLocaleString()} UZS</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[9px] text-zinc-600 font-black uppercase">Sana</p>
                                        <p className="text-xs font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        order.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        order.status === 'delivered' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'topup' && (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        <div className="bg-zinc-900 border border-white/10 p-12 rounded-[4rem] space-y-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                            
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Hisobni To'ldirish</h2>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Xaridlar uchun hamyoningizni aktivlashtiring</p>
                            </div>

                            <PaymentDetailsCard />

                            <form onSubmit={handleTopup} className="space-y-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4">To'lov miqdori (UZS)</label>
                                    <input 
                                        type="number" 
                                        value={topupAmount}
                                        onChange={e => setTopupAmount(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-[2rem] p-5 text-white font-black text-xl outline-none focus:border-orange-500 transition-all shadow-inner"
                                        placeholder="50 000"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-4">To'lov cheki (Screen)</label>
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            onChange={e => setScreenshot(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="receipt-upload"
                                            accept="image/*"
                                            required
                                        />
                                        <label htmlFor="receipt-upload" className="flex items-center justify-between w-full bg-black border border-white/10 rounded-[2rem] p-5 cursor-pointer group-hover:border-white/30 transition-all">
                                            <span className="text-zinc-500 text-sm font-bold truncate max-w-[200px]">{screenshot ? screenshot.name : 'Faylni tanlang...'}</span>
                                            <div className="px-4 py-1.5 bg-zinc-800 rounded-full text-[9px] font-black uppercase text-white group-hover:bg-orange-600 transition-all">Tanlash</div>
                                        </label>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isTopupLoading}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-orange-600/30 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {isTopupLoading ? 'Jo\'natilmoqda...' : <><Zap size={18} fill="white"/> Tasdiqlashni so'rash</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* PRODUCT DETAILED VIEW & BUY MODAL */}
            {viewProduct && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => setViewProduct(null)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-5xl rounded-[4rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-slide-in-up">
                        
                        {/* Media Section */}
                        <div className="w-full md:w-1/2 bg-zinc-900 relative">
                            {viewProduct.video_url ? (
                                <video 
                                    src={viewProduct.video_url} 
                                    className="w-full h-full object-cover" 
                                    autoPlay muted loop playsInline
                                />
                            ) : (
                                <img src={viewProduct.image_url} className="w-full h-full object-cover" alt="" />
                            )}
                            <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-orange-500 border border-white/10">
                                {viewProduct.category}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col overflow-y-auto max-h-[85vh] custom-scrollbar">
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">{viewProduct.title}</h3>
                                <button onClick={() => setViewProduct(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-500 transition-colors"><X size={24}/></button>
                            </div>

                            <div className="space-y-8 flex-1">
                                <div className="flex items-center gap-4">
                                    <p className="text-4xl font-black text-white">{viewProduct.price.toLocaleString()} <span className="text-lg text-zinc-500">UZS</span></p>
                                    <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded text-[10px] font-black uppercase tracking-widest border border-green-500/20">Omborda mavjud</div>
                                </div>

                                <p className="text-zinc-400 text-sm leading-relaxed">{viewProduct.description || "Ushbu mahsulot haqida ma'lumot kiritilmagan."}</p>

                                {/* Specifications List */}
                                {viewProduct.specifications && Object.keys(viewProduct.specifications).length > 0 && (
                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                        {Object.entries(viewProduct.specifications).map(([key, val]) => (
                                            <div key={key} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">{key}</p>
                                                <p className="text-sm font-bold text-white">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-4 pt-8 border-t border-white/5">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Sotib olish ma'lumotlari</h4>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 text-zinc-500" size={20}/>
                                        <textarea 
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            placeholder="Yetkazib berish manzili..."
                                            className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 h-20 text-sm text-white outline-none focus:border-orange-500 transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20}/>
                                        <input 
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="Telefon raqamingiz"
                                            className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-sm text-white outline-none focus:border-orange-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10">
                                <button 
                                    onClick={handleBuy}
                                    disabled={isBuying}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-orange-600/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isBuying ? 'Bajarilmoqda...' : <><ShoppingCart size={18} fill="white"/> Xaridni Yakunlash</>}
                                </button>
                                <div className="flex justify-center gap-6 mt-6">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest"><Truck size={14}/> Tezkor yetkazish</div>
                                    <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest"><ShieldCheck size={14}/> Sifat kafolati</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};