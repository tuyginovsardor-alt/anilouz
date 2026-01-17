import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, Wallet, CreditCard, X, ChevronRight, MapPin, Phone, CheckCircle2, ShoppingCart, Filter } from 'lucide-react';
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
    
    // Purchase Modal
    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [isBuying, setIsBuying] = useState(false);

    // Topup Modal
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
            if (user) {
                const myOrders = await getMyShopOrders(user.id);
                setOrders(myOrders);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleBuy = async () => {
        if (!selectedProduct || !wallet) return;
        if (wallet.balance < selectedProduct.price) {
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
            await placeShopOrder(user!.id, selectedProduct.id, selectedProduct.price, address, phone);
            addNotification({ type: 'success', title: 'Muvaffaqiyatli', message: "Buyurtma qabul qilindi!" });
            setSelectedProduct(null);
            loadData();
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally { setIsBuying(false); }
    };

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!screenshot || !topupAmount) return;
        setIsTopupLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const url = await uploadFile(screenshot, 'receipts');
            await createShopPaymentRequest(user!.id, Number(topupAmount), url);
            addNotification({ type: 'success', title: 'Yuborildi', message: "To'lov so'rovi adminlarga yuborildi." });
            setScreenshot(null);
            setTopupAmount('');
            setActiveTab('browse');
        } catch (e: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: e.message });
        } finally { setIsTopupLoading(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

    const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.category === selectedCategory);

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 animate-fade-in">
            {/* Header / Stats */}
            <div className="bg-zinc-900 border-b border-white/5 p-6 mb-8">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Anilo Shop</h1>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Premium Merch Store</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase">Sizning balansingiz</p>
                                <p className="text-lg font-black text-orange-500">{(wallet?.balance || 0).toLocaleString()} UZS</p>
                            </div>
                            <button onClick={() => setActiveTab('topup')} className="bg-orange-600 hover:bg-orange-700 p-2 rounded-xl transition-all">
                                <Wallet size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                {/* Tabs */}
                <div className="flex gap-6 mb-10 border-b border-white/5">
                    {[
                        { id: 'browse', label: 'Mahsulotlar', icon: <ShoppingBag size={18}/> },
                        { id: 'orders', label: 'Buyurtmalarim', icon: <Package size={18}/> },
                        { id: 'topup', label: 'Hisobni to\'ldirish', icon: <CreditCard size={18}/> },
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === tab.id ? 'text-orange-500' : 'text-zinc-500'}`}
                        >
                            {tab.icon} {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 rounded-full"></div>}
                        </button>
                    ))}
                </div>

                {activeTab === 'browse' && (
                    <div className="space-y-10">
                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                            {['all', 'clothing', 'accessory', 'figure'].map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}
                                >
                                    {cat === 'all' ? 'Barchasi' : cat}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="group bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-orange-500/50 transition-all">
                                    <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                                        <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-orange-500">
                                            {product.category}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <h3 className="font-black text-lg uppercase tracking-tight">{product.title}</h3>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xl font-black text-white">{product.price.toLocaleString()} <span className="text-xs text-zinc-500">UZS</span></p>
                                            <button 
                                                onClick={() => setSelectedProduct(product)}
                                                className="bg-white text-black px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"
                                            >
                                                Sotib olish
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {orders.length === 0 && <div className="text-center py-20 text-zinc-600 font-bold uppercase tracking-widest">Hali buyurtmalar yo'q</div>}
                        {orders.map(order => (
                            <div key={order.id} className="bg-zinc-900 border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-zinc-800 rounded-2xl overflow-hidden">
                                        <img src={order.products?.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white uppercase tracking-tight">{order.products?.title}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Sana: {new Date(order.created_at).toLocaleDateString()}</p>
                                        <p className="text-orange-500 font-bold mt-1">{order.amount_paid.toLocaleString()} UZS</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        order.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                                        order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'
                                    }`}>
                                        {order.status}
                                    </span>
                                    <ChevronRight className="text-zinc-700" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'topup' && (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        <div className="bg-zinc-900 border border-white/5 p-10 rounded-[3rem] space-y-8">
                            <div className="text-center">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Do'kon hisobini to'ldirish</h2>
                                <p className="text-zinc-500 text-sm mt-2">Kartaga pul o'tkazib, chekni yuklang.</p>
                            </div>

                            <PaymentDetailsCard />

                            <form onSubmit={handleTopup} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">To'lov miqdori (UZS)</label>
                                    <input 
                                        type="number" 
                                        value={topupAmount}
                                        onChange={e => setTopupAmount(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-orange-500 transition-all"
                                        placeholder="50000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">To'lov cheki (Screen)</label>
                                    <input 
                                        type="file" 
                                        onChange={e => setScreenshot(e.target.files?.[0] || null)}
                                        className="w-full text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-white file:text-black hover:file:bg-orange-600 hover:file:text-white"
                                        accept="image/*"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isTopupLoading}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50"
                                >
                                    {isTopupLoading ? 'Yuklanmoqda...' : 'Tasdiqlashni so\'rash'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedProduct(null)}></div>
                    <div className="relative bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[3rem] p-10 space-y-8 animate-slide-in-up">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedProduct.title}</h3>
                                <p className="text-orange-500 font-bold text-lg mt-1">{selectedProduct.price.toLocaleString()} UZS</p>
                            </div>
                            <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-white/5 rounded-full"><X/></button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 text-zinc-500" size={20}/>
                                <textarea 
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Yetkazib berish manzili..."
                                    className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 h-24 text-white outline-none focus:border-orange-500 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20}/>
                                <input 
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Telefon raqamingiz"
                                    className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-white outline-none focus:border-orange-500 transition-all"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleBuy}
                            disabled={isBuying}
                            className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 hover:text-white transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                        >
                            {isBuying ? 'Jarayonda...' : 'Xaridni tasdiqlash'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};