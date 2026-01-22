
import { supabase } from './supabaseClient';
import { 
    Movie, Episode, UserProfile, Transaction, ShopProduct, 
    ShopWallet, ShopOrder, ShopPayment, ATCWallet, ArkWallet, 
    WheelPrize, Promocode, SupportTicket, TicketMessage, News, 
    Ad, SocialLink, UserDevice, ArkWithdrawal, ContestTask, 
    ContestAd, QuizQuestion, ArkQuiz, ArkAutopilotConfig, ArkSchedule,
    DashboardStats, ActivityLog, ATCTransaction
} from '../types';

// --- CORE MOVIE SERVICES ---
export const getMovies = async (): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('movies').select('*').eq('is_archived', false).order('id', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("getMovies error:", e);
        return [];
    }
};

export const getAdminMovies = async (): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('movies').select('*').order('id', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
};

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('movies')
            .select('*')
            .or(`title.ilike.%${query}%,tags.ilike.%${query}%,genre.ilike.%${query}%`)
            .eq('is_archived', false);
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
};

export const addMovieToDB = async (movie: Partial<Movie>) => {
    const { data, error } = await supabase.from('movies').insert(movie).select().single();
    if (error) throw error;
    return data;
};

export const updateMovieInDB = async (id: number, updates: Partial<Movie>) => {
    const { error } = await supabase.from('movies').update(updates).eq('id', id);
    if (error) throw error;
};

export const deleteMovieFromDB = async (id: number) => {
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
};

export const toggleMovieArchive = async (id: number, status: boolean) => {
    const { error } = await supabase.from('movies').update({ is_archived: status }).eq('id', id);
    if (error) throw error;
};

export const getMovieEpisodes = async (movieId: number): Promise<Episode[]> => {
    try {
        const { data, error } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
};

// --- PROFILE & AUTH ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) return null;
        return data;
    } catch (e) {
        return null;
    }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
};

export const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};

export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
};

export const updateUserEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
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

// --- ANILO SHOP SERVICES ---
export const getShopProducts = async (
    category: string = 'all', 
    sort: 'newest' | 'price_asc' | 'price_desc' | 'popular' = 'newest',
    searchQuery: string = ''
): Promise<ShopProduct[]> => {
    try {
        let query = supabase.from('shop_products').select('*').eq('is_active', true);
        if (category !== 'all') query = query.eq('category', category);
        if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
        if (sort === 'price_asc') query = query.order('price', { ascending: true });
        else if (sort === 'price_desc') query = query.order('price', { ascending: false });
        else if (sort === 'popular') query = query.order('sales_count', { ascending: false });
        else query = query.order('id', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
};

export const getShopWallet = async (userId: string): Promise<ShopWallet> => {
    const { data, error } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (!data) {
        const { data: nW } = await supabase.from('shop_wallets').insert({ user_id: userId, balance: 0 }).select().single();
        return nW;
    }
    return data;
};

export const placeShopOrder = async (userId: string, productId: number, amount: number, address: string, phone: string) => {
    const { error } = await supabase.rpc('place_shop_order', {
        p_user_id: userId, p_product_id: productId, p_amount: amount, p_address: address, p_phone: phone
    });
    if (error) throw error;
};

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

// --- APP CONFIG & ADMIN SECURITY ---
export const getAppConfig = async (): Promise<Record<string, string>> => {
    try {
        const { data, error } = await supabase.from('app_config').select('key, value');
        if (error) return {};
        const config: Record<string, string> = {};
        (data || []).forEach(item => { if (item.key) config[item.key] = item.value; });
        return config;
    } catch (e) { return {}; }
};

export const updateAppConfig = async (key: string, value: string) => {
    await supabase.from('app_config').upsert({ key, value });
};

export const getAdminPin = async () => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_pin').single();
    return data?.value || '0000';
};

export const setAdminPin = async (pin: string) => {
    await updateAppConfig('admin_pin', pin);
};

export const getProtectedRoutes = async () => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'protected_routes').single();
    try { return JSON.parse(data?.value || '[]'); } catch { return []; }
};

export const setProtectedRoutes = async (routes: string[]) => {
    await updateAppConfig('protected_routes', JSON.stringify(routes));
};

export const saveRecoveryCodes = async (codes: string[]) => {
    await updateAppConfig('admin_recovery_codes', JSON.stringify(codes));
};

export const getRecoveryCodesStatus = async () => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').single();
    try { return JSON.parse(data?.value || '[]').length > 0; } catch { return false; }
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').single();
    try {
        const codes = JSON.parse(data?.value || '[]');
        if (codes.includes(code)) {
            // Remove code after use for security
            const newCodes = codes.filter((c: string) => c !== code);
            await saveRecoveryCodes(newCodes);
            return true;
        }
        return false;
    } catch { return false; }
};

export const getAdminNotificationCounts = async () => {
    try {
        const { data, error } = await supabase.rpc('get_admin_counts');
        if (error) return { financials: 0, support: 0 };
        return data || { financials: 0, support: 0 };
    } catch (e) { return { financials: 0, support: 0 }; }
};

// --- BILLING & TRANSACTIONS ---
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    try {
        const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
};

export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('payment_requests').insert({ user_id: userId, amount, screenshot_url: screenshotUrl, status: 'pending' });
    if (error) throw error;
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
    const { error } = await supabase.rpc('approve_payment_request', { p_request_id: requestId, p_user_id: userId, p_amount: amount });
    if (error) throw error;
};

export const rejectPaymentRequest = async (requestId: number) => {
    const { error } = await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
    if (error) throw error;
};

export const getPaymentRequests = async () => {
    const { data, error } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getPremiumUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').gt('balance', 0).order('balance', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', desc: string) => {
    const finalAmount = type === 'add' ? amount : -amount;
    const { error } = await supabase.rpc('admin_adjust_balance', { p_user_id: userId, p_amount: finalAmount, p_desc: desc });
    if (error) throw error;
};

export const giveGlobalBonus = async (amount: number, desc: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { p_amount: amount, p_desc: desc });
    if (error) throw error;
    return data;
};

export const getUserByEmail = async (email: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data;
};

export const recordTsPaySuccess = async (userId: string, amount: number, tspayId: number) => {
    const { error } = await supabase.rpc('record_tspay_payment', { p_user_id: userId, p_amount: amount, p_tspay_id: tspayId });
    if (error) throw error;
};

// --- INTERACTION SERVICES ---
export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('watch_history').select('movies(*)').eq('user_id', userId).order('watched_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((item: any) => item.movies).filter(Boolean);
    } catch (e) { return []; }
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('saved_movies').select('movies(*)').eq('user_id', userId);
        if (error) throw error;
        return (data || []).map((item: any) => item.movies).filter(Boolean);
    } catch (e) { return []; }
};

export const isMovieSaved = async (userId: string, movieId: number): Promise<boolean> => {
    try {
        const { data } = await supabase.from('saved_movies').select('*').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
        return !!data;
    } catch { return false; }
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
    try {
        const { data, error } = await supabase.from('movie_reviews').select('*, profiles(full_name, avatar_url)').eq('movie_id', movieId).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch { return []; }
};

export const addReview = async (movieId: number, userId: string, rating: number, comment: string) => {
    const { error } = await supabase.from('movie_reviews').insert({ movie_id: movieId, user_id: userId, rating, comment });
    if (error) throw error;
};

export const updateUserWatchTime = async (userId: string, seconds: number) => {
    await supabase.rpc('increment_watch_time', { p_user_id: userId, p_seconds: seconds });
};

// --- SUPPORT & NEWS ---
export const getUnreadNotificationsCount = async (userId: string) => {
    try {
        const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
        return count || 0;
    } catch { return 0; }
};

export const getMyTickets = async (userId: string) => {
    try {
        const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const getAllTickets = async () => {
    const { data, error } = await supabase.from('support_tickets').select('*, profiles(full_name, email)').order('status', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getTicketMessages = async (ticketId: number) => {
    try {
        const { data, error } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
        return data || [];
    } catch { return []; }
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
    try {
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const createNews = async (title: string, content: string) => {
    const { error } = await supabase.from('news').insert({ title, content });
    if (error) throw error;
};

export const deleteNews = async (id: number) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw error;
};

// --- ADVERTISING & SOCIAL ---
export const getAds = async () => {
    const { data, error } = await supabase.from('ads').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const saveAd = async (ad: Partial<Ad>) => {
    const { error } = await supabase.from('ads').insert(ad);
    if (error) throw error;
};

export const deleteAd = async (id: number) => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    if (error) throw error;
};

export const incrementAdView = async (id: number) => {
    await supabase.rpc('increment_ad_view', { p_ad_id: id });
};

export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const { data, error } = await supabase.from('social_links').select('*');
    if (error) return [];
    return data || [];
};

export const addSocialLink = async (link: Partial<SocialLink>) => {
    const { error } = await supabase.from('social_links').insert(link);
    if (error) throw error;
};

export const deleteSocialLink = async (id: number) => {
    const { error } = await supabase.from('social_links').delete().eq('id', id);
    if (error) throw error;
};

// --- SESSIONS & BROADCASTS ---
export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data, error } = await supabase.from('user_sessions').select('*, profiles(full_name, email, role)').order('last_active', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data, error } = await supabase.from('user_sessions').select('*').eq('user_id', userId).order('last_active', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const toggleDeviceBlock = async (id: number, status: boolean) => {
    const { error } = await supabase.from('user_sessions').update({ is_blocked: status }).eq('id', id);
    if (error) throw error;
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    try { await supabase.rpc('log_device_login', { p_user_id: userId, p_device_id: deviceId }); } catch {}
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    const { data, error } = await supabase.rpc('check_device_registration', { p_device_id: deviceId });
    if (error) throw error;
    if (!data.can_register) throw new Error(data.message);
};

export const getBroadcasts = async () => {
    const { data, error } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createBroadcast = async (b: any) => {
    const { error } = await supabase.from('broadcasts').insert(b);
    if (error) throw error;
};

export const deleteBroadcast = async (id: number) => {
    const { error } = await supabase.from('broadcasts').delete().eq('id', id);
    if (error) throw error;
};

// --- PROMOCODES ---
export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data, error } = await supabase.from('promocodes').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const savePromocode = async (p: Partial<Promocode>) => {
    const { error } = await supabase.from('promocodes').insert(p);
    if (error) throw error;
};

export const deletePromocode = async (id: number) => {
    const { error } = await supabase.from('promocodes').delete().eq('id', id);
    if (error) throw error;
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { p_user_id: userId, p_code: code });
    if (error) throw error;
    return data;
};

// --- CONTEST & ARK (CASH) SERVICES ---
export const getATCWallet = async (userId: string) => {
    try {
        const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
        return data;
    } catch { return null; }
};

export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    try {
        const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const claimATCReward = async (userId: string, amount: number, type: string, desc: string) => {
    const { error } = await supabase.rpc('claim_atc_reward', { p_user_id: userId, p_amount: amount, p_type: type, p_desc: desc });
    if (error) throw error;
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    const { error } = await supabase.rpc('convert_atc_to_uzs', { p_user_id: userId, p_amount: amount, p_rate: rate });
    if (error) throw error;
};

export const rewardExtraSpin = async (userId: string, spins: number) => {
    const { error } = await supabase.rpc('reward_extra_spin', { p_user_id: userId, p_spins: spins });
    if (error) throw error;
};

export const getContestSettings = async () => {
    const { data } = await supabase.from('app_config').select('*').ilike('key', 'contest_%');
    const settings: any = {};
    (data || []).forEach(item => { settings[item.key.replace('contest_', '')] = item.value; });
    return settings;
};

export const updateContestSetting = async (key: string, value: string) => {
    await updateAppConfig(`contest_${key}`, value);
};

export const getContestTasks = async () => {
    const { data } = await supabase.from('contest_tasks').select('*').order('id', { ascending: false });
    return data || [];
};

export const createContestTask = async (task: any) => {
    await supabase.from('contest_tasks').insert(task);
};

export const deleteContestTask = async (id: number) => {
    await supabase.from('contest_tasks').delete().eq('id', id);
};

export const getContestAds = async () => {
    const { data } = await supabase.from('contest_ads').select('*').eq('is_active', true).order('id', { ascending: false });
    return data || [];
};

export const createContestAd = async (ad: any) => {
    await supabase.from('contest_ads').insert(ad);
};

export const deleteContestAd = async (id: number) => {
    await supabase.from('contest_ads').delete().eq('id', id);
};

export const getQuizQuestions = async (count: number) => {
    const { data } = await supabase.from('contest_quizzes').select('*').limit(count);
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
    (data || []).forEach(i => { s[i.key] = i.value; });
    return s;
};

export const updateArkSettings = async (key: string, value: string) => {
    await supabase.from('ark_settings').upsert({ key, value });
};

export const requestArkWithdrawal = async (uid: string, ark: number, card: string, holder: string) => {
    const { error } = await supabase.rpc('request_ark_withdrawal', { p_uid: uid, p_ark: ark, p_card: card, p_holder: holder });
    if (error) throw error;
};

export const getArkWithdrawals = async () => {
    const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
};

export const approveArkWithdrawal = async (id: number) => {
    await supabase.from('ark_withdrawals').update({ status: 'approved' }).eq('id', id);
};

export const getArkAds = async () => {
    const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true).order('id', { ascending: false });
    return data || [];
};

export const createArkAd = async (ad: any) => {
    await supabase.from('ark_ads').insert(ad);
};

export const deleteArkAd = async (id: number) => {
    await supabase.from('ark_ads').delete().eq('id', id);
};

export const claimArkAdReward = async (uid: string, ark: number, title: string) => {
    await supabase.rpc('claim_ark_ad_reward', { p_uid: uid, p_ark: ark, p_title: title });
};

export const getArkQuizzes = async () => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return data || [];
};

export const createArkQuiz = async (q: any) => {
    await supabase.from('ark_quizzes').insert(q);
};

export const deleteArkQuiz = async (id: number) => {
    await supabase.from('ark_quizzes').delete().eq('id', id);
};

export const recordArkSpinResult = async (uid: string, prize: any) => {
    await supabase.rpc('record_ark_spin', { p_uid: uid, p_type: prize.type, p_val: prize.value, p_label: prize.label });
};

export const rewardArkSpins = async (uid: string, spins: number) => {
    await supabase.rpc('reward_ark_spins', { p_uid: uid, p_spins: spins });
};

export const giveArkGlobalBonus = async (ark: number, msg: string) => {
    await supabase.rpc('give_ark_global_bonus', { p_ark: ark, p_msg: msg });
};

export const toggleArkMarketStatus = async (status: string) => {
    await updateArkSettings('game_status', status);
};

export const saveArkSchedule = async (sch: any) => {
    await updateArkSettings('market_schedule', JSON.stringify(sch));
};

export const runArkAutopilot = async () => {
    const { data, error } = await supabase.rpc('run_ark_autopilot');
    if (error) throw error;
    return data;
};

export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { p_user_id: userId, p_plan: plan, p_price: price });
    if (error) throw error;
};

export const startFreeTrial = async (userId: string) => {
    const now = new Date().toISOString();
    await supabase.from('profiles').update({ free_trial_started_at: now }).eq('id', userId);
    return now;
};

// --- ADDED MISSING FUNCTIONS ---

/**
 * Fetches general dashboard statistics for administrators.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    const [u, m, p, r] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('movies').select('*', { count: 'exact', head: true }),
        supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('movie_reviews').select('*', { count: 'exact', head: true })
    ]);

    return {
        totalUsers: u.count || 0,
        totalMovies: m.count || 0,
        totalPremium: p.count || 0,
        totalReviews: r.count || 0
    };
};

/**
 * Fetches recent activity logs for the admin dashboard.
 */
export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    // Note: This is a placeholder as activity logs are managed via Supabase's realtime features
    // or specific audit tables. Returning static data for now.
    return [
        { id: 1, title: 'Yangi foydalanuvchi', description: 'Ro\'yxatdan o\'tdi', time: 'Hozir' },
        { id: 2, title: 'To\'lov', description: 'Tasdiqlandi', time: '5 daqiqa oldin' },
        { id: 3, title: 'Yangi kino', description: 'Katalogga qo\'shildi', time: '10 daqiqa oldin' }
    ];
};

/**
 * Specifically handles shop-related top-up requests.
 * Reuses the base createPaymentRequest logic.
 */
export const createShopPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    return createPaymentRequest(userId, amount, screenshotUrl);
};

/**
 * Fetches orders for a specific user, including product details.
 */
export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    try {
        const { data, error } = await supabase
            .from('shop_orders')
            .select('*, shop_products(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return (data || []) as ShopOrder[];
    } catch (e) {
        console.error("getMyShopOrders error:", e);
        return [];
    }
};
