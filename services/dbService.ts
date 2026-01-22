
import { supabase } from './supabaseClient';
import { 
    Movie, Episode, UserProfile, Transaction, ShopProduct, 
    ShopWallet, ShopOrder, ShopPayment, ATCWallet, ArkWallet, WheelPrize 
} from '../types';

// --- CORE MOVIE SERVICES ---
export const getMovies = async (): Promise<Movie[]> => {
    const { data, error } = await supabase.from('movies').select('*').eq('is_archived', false).order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    const { data, error } = await supabase.from('movies')
        .select('*')
        .or(`title.ilike.%${query}%,tags.ilike.%${query}%,genre.ilike.%${query}%`)
        .eq('is_archived', false);
    if (error) throw error;
    return data || [];
};

export const getMovieEpisodes = async (movieId: number): Promise<Episode[]> => {
    const { data, error } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
    if (error) throw error;
    return data || [];
};

// --- PROFILE & AUTH ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

// --- FILE UPLOADS ---
export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
};

export const uploadPoster = async (file: File) => uploadFile(file, 'posters');
export const uploadVideo = async (file: File) => uploadFile(file, 'videos');

// --- ANILO SHOP SERVICES (UBUY STYLE) ---
export const getShopProducts = async (
    category: string = 'all', 
    sort: 'newest' | 'price_asc' | 'price_desc' | 'popular' = 'newest',
    searchQuery: string = ''
): Promise<ShopProduct[]> => {
    let query = supabase.from('shop_products').select('*').eq('is_active', true);
    
    if (category !== 'all') {
        query = query.eq('category', category);
    }
    if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
    }

    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'popular') query = query.order('sales_count', { ascending: false });
    else query = query.order('id', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const getShopWallet = async (userId: string): Promise<ShopWallet> => {
    const { data, error } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (!data) {
        const { data: newWallet, error: cr } = await supabase.from('shop_wallets').insert({ user_id: userId, balance: 0 }).select().single();
        if (cr) throw cr;
        return newWallet;
    }
    return data;
};

export const createShopPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('shop_payments').insert({ user_id: userId, amount, screenshot_url: screenshotUrl, status: 'pending' });
    if (error) throw error;
};

export const placeShopOrder = async (userId: string, productId: number, amount: number, address: string, phone: string) => {
    const { error } = await supabase.rpc('place_shop_order', {
        p_user_id: userId, p_product_id: productId, p_amount: amount, p_address: address, p_phone: phone
    });
    if (error) throw error;
};

export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    const { data, error } = await supabase.from('shop_orders').select('*, shop_products(*)').eq('user_id', userId).order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

// --- ADMIN SERVICES ---
export const getAdminShopProducts = async () => {
    const { data, error } = await supabase.from('shop_products').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createShopProduct = async (product: Partial<ShopProduct>) => {
    const { data, error } = await supabase.from('shop_products').insert(product).select().single();
    if (error) throw error;
    return data;
};

export const getAppConfig = async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from('app_config').select('key, value');
    if (error) return {};
    const config: Record<string, string> = {};
    data.forEach(item => { config[item.key] = item.value; });
    return config;
};

export const getAdminNotificationCounts = async () => {
    const { data, error } = await supabase.rpc('get_admin_counts');
    if (error) return { financials: 0, support: 0 };
    return data;
};

export const getAdminPin = async () => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_pin').single();
    return data?.value || '0000';
};

export const getProtectedRoutes = async () => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'protected_routes').single();
    try { return JSON.parse(data?.value || '[]'); } catch { return []; }
};

// --- BILLING & TRANSACTIONS ---
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('payment_requests').insert({ user_id: userId, amount, screenshot_url: screenshotUrl, status: 'pending' });
    if (error) throw error;
};

export const recordTsPaySuccess = async (userId: string, amount: number, tspayId: number) => {
    const { error } = await supabase.rpc('record_tspay_payment', { p_user_id: userId, p_amount: amount, p_tspay_id: tspayId });
    if (error) throw error;
};

// --- INTERACTION SERVICES ---
export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    const { data, error } = await supabase.from('watch_history').select('movies(*)').eq('user_id', userId).order('watched_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((item: any) => item.movies);
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data, error } = await supabase.from('saved_movies').select('movies(*)').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((item: any) => item.movies);
};

export const isMovieSaved = async (userId: string, movieId: number): Promise<boolean> => {
    const { data } = await supabase.from('saved_movies').select('*').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
    return !!data;
};

export const toggleSaveMovie = async (userId: string, movieId: number): Promise<boolean> => {
    const saved = await isMovieSaved(userId, movieId);
    if (saved) {
        await supabase.from('saved_movies').delete().eq('user_id', userId).eq('movie_id', movieId);
        return false;
    } else {
        await supabase.from('saved_movies').insert({ user_id: userId, movie_id: movieId });
        return true;
    }
};

export const getMovieReviews = async (movieId: number) => {
    const { data, error } = await supabase.from('movie_reviews').select('*, profiles(full_name, avatar_url)').eq('movie_id', movieId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const addReview = async (movieId: number, userId: string, rating: number, comment: string) => {
    const { error } = await supabase.from('movie_reviews').insert({ movie_id: movieId, user_id: userId, rating, comment });
    if (error) throw error;
};

// --- SUPPORT & NOTIFICATIONS ---
export const getUnreadNotificationsCount = async (userId: string) => {
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    if (error) return 0;
    return count || 0;
};

export const getMyTickets = async (userId: string) => {
    const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getTicketMessages = async (ticketId: number) => {
    const { data, error } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const sendMessage = async (ticketId: number, senderId: string, message: string, isAdmin: boolean) => {
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: ticketId, sender_id: senderId, message, is_admin: isAdmin });
    if (error) throw error;
};

export const createTicket = async (userId: string) => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
    if (error) throw error;
    return data;
};

export const getNews = async () => {
    const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

// --- CONTEST SERVICES ---
export const getATCWallet = async (userId: string) => {
    const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data;
};

export const getATCTransactions = async (userId: string) => {
    const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const getContestSettings = async () => {
    const { data } = await supabase.from('app_config').select('*').ilike('key', 'contest_%');
    const settings: any = {};
    data?.forEach(item => { settings[item.key.replace('contest_', '')] = item.value; });
    return settings;
};

export const getContestTasks = async () => {
    const { data } = await supabase.from('contest_tasks').select('*').order('id', { ascending: false });
    return data || [];
};

export const getContestAds = async () => {
    const { data } = await supabase.from('contest_ads').select('*').eq('is_active', true).order('id', { ascending: false });
    return data || [];
};

export const getArkWallet = async (userId: string) => {
    const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data;
};

export const getArkMarketHistory = async () => {
    const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
    return data || [];
};

export const getArkSettings = async () => {
    const { data } = await supabase.from('ark_settings').select('*');
    const s: any = {};
    data?.forEach(i => { s[i.key] = i.value; });
    return s;
};

export const getArkAds = async () => {
    const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true).order('id', { ascending: false });
    return data || [];
};

export const getArkQuizzes = async () => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return data || [];
};

export const getUserSessions = async (userId: string) => {
    const { data, error } = await supabase.from('user_sessions').select('*').eq('user_id', userId).order('last_active', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    await supabase.rpc('log_device_login', { p_user_id: userId, p_device_id: deviceId });
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    const { data, error } = await supabase.rpc('check_device_registration', { p_device_id: deviceId });
    if (error) throw error;
    if (!data.can_register) throw new Error(data.message);
};

export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { p_user_id: userId, p_plan: plan, p_price: price });
    if (error) throw error;
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { p_user_id: userId, p_code: code });
    if (error) throw error;
    return data;
};

export const startFreeTrial = async (userId: string) => {
    const now = new Date().toISOString();
    await supabase.from('profiles').update({ free_trial_started_at: now }).eq('id', userId);
    return now;
};

export const updateAppConfig = async (key: string, value: string) => {
    await supabase.from('app_config').upsert({ key, value });
};
