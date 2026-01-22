
import { supabase } from './supabaseClient';
import { 
    UserProfile, Movie, Episode, ATCWallet, ATCTransaction, 
    ContestTask, ContestAd, QuizQuestion, ArkWallet, 
    ArkMarketData, ArkAd, ArkQuiz, ArkWithdrawal, 
    Broadcast, Promocode, UserDevice, SupportTicket, 
    TicketMessage, News, Transaction, ShopProduct, 
    ShopWallet, ShopOrder, SocialLink, PaymentRequestDB, 
    FandubChannel, FandubUpload, ArkSchedule 
} from '../types';

// --- CONFIG & APP SETTINGS ---
export const getAppConfig = async () => {
    const { data } = await supabase.from('app_config').select('*');
    const config: Record<string, string> = {};
    (data || []).forEach(item => { config[item.key] = item.value; });
    return config;
};

export const updateAppConfig = async (key: string, value: string) => {
    const { error } = await supabase.from('app_config').upsert({ key, value });
    if (error) throw error;
};

// --- USER PROFILE & AUTH ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data as UserProfile;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
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

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    return data as UserProfile;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return (data || []) as UserProfile[];
};

export const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
};

// --- MOVIES, EPISODES & REVIEWS ---
export const getMovies = async (): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    return (data || []) as Movie[];
};

export const getAdminMovies = async (): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    return (data || []) as Movie[];
};

export const addMovieToDB = async (movie: Movie) => {
    const { data, error } = await supabase.from('movies').insert(movie).select().single();
    if (error) throw error;
    return data as Movie;
};

export const updateMovieInDB = async (id: number, movie: Partial<Movie>) => {
    const { error } = await supabase.from('movies').update(movie).eq('id', id);
    if (error) throw error;
};

export const deleteMovieFromDB = async (id: number) => {
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
};

export const toggleMovieArchive = async (id: number, archived: boolean) => {
    const { error } = await supabase.from('movies').update({ is_archived: archived }).eq('id', id);
    if (error) throw error;
};

export const getMovieEpisodes = async (movieId: number): Promise<Episode[]> => {
    const { data } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
    return (data || []) as Episode[];
};

export const getMovieReviews = async (movieId: number): Promise<any[]> => {
    const { data } = await supabase.from('movie_reviews').select('*, profiles(full_name, avatar_url)').eq('movie_id', movieId).order('created_at', { ascending: false });
    return data || [];
};

export const addReview = async (movieId: number, userId: string, rating: number, comment: string) => {
    const { error } = await supabase.from('movie_reviews').insert({ movie_id: movieId, user_id: userId, rating, comment });
    if (error) throw error;
};

// --- WATCH HISTORY & SAVED ---
export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('user_history').select('movies(*)').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map((item: any) => item.movies) as Movie[];
};

export const updateUserWatchTime = async (userId: string, seconds: number) => {
    // Basic tracking, can be expanded to specific movies
    const { error } = await supabase.rpc('increment_watch_time', { u_id: userId, secs: seconds });
    if (error) console.error(error);
};

export const isMovieSaved = async (userId: string, movieId: number): Promise<boolean> => {
    const { data } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
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

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('saved_movies').select('movies(*)').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map((item: any) => item.movies) as Movie[];
};

// --- ATC (ANI CONCURS) SERVICES ---
export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
    const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ATCWallet;
};

export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as ATCTransaction[];
};

export const claimATCReward = async (userId: string, amount: number, type: string, description: string) => {
    const { error } = await supabase.rpc('claim_atc_reward', { u_id: userId, amt: amount, r_type: type, desc: description });
    if (error) throw error;
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    const { error } = await supabase.rpc('convert_atc_to_uzs', { u_id: userId, amt: amount, r_rate: rate });
    if (error) throw error;
};

export const getContestSettings = async () => {
    const { data } = await supabase.from('contest_settings').select('*');
    const settings: Record<string, any> = {};
    (data || []).forEach(item => { settings[item.key] = item.value; });
    return settings;
};

export const updateContestSetting = async (key: string, value: any) => {
    const { error } = await supabase.from('contest_settings').upsert({ key, value });
    if (error) throw error;
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
    const { data } = await supabase.from('contest_tasks').select('*').order('created_at', { ascending: false });
    return (data || []) as ContestTask[];
};

export const createContestTask = async (task: Partial<ContestTask>) => {
    const { error } = await supabase.from('contest_tasks').insert(task);
    if (error) throw error;
};

export const deleteContestTask = async (id: number) => {
    const { error } = await supabase.from('contest_tasks').delete().eq('id', id);
    if (error) throw error;
};

export const getContestAds = async (): Promise<ContestAd[]> => {
    const { data } = await supabase.from('contest_ads').select('*').order('created_at', { ascending: false });
    return (data || []) as ContestAd[];
};

export const createContestAd = async (ad: Partial<ContestAd>) => {
    const { error } = await supabase.from('contest_ads').insert(ad);
    if (error) throw error;
};

export const deleteContestAd = async (id: number) => {
    const { error } = await supabase.from('contest_ads').delete().eq('id', id);
    if (error) throw error;
};

export const getQuizQuestions = async (limit: number = 5): Promise<QuizQuestion[]> => {
    const { data } = await supabase.from('quiz_questions').select('*').limit(limit);
    return (data || []) as QuizQuestion[];
};

export const rewardExtraSpin = async (userId: string, count: number) => {
    const { error } = await supabase.rpc('reward_extra_spin', { u_id: userId, spin_count: count });
    if (error) throw error;
};

// --- ARK TRADING (CASH CONCURS) ---
export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
    const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ArkWallet;
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
    return (data || []) as ArkMarketData[];
};

export const requestArkWithdrawal = async (userId: string, amount: number, cardNum: string, cardHolder: string) => {
    const { error } = await supabase.from('ark_withdrawals').insert({
        user_id: userId, amount_ark: amount, card_number: cardNum, card_holder: cardHolder, status: 'pending'
    });
    if (error) throw error;
};

export const getArkSettings = async () => {
    const { data } = await supabase.from('ark_settings').select('*');
    const settings: Record<string, any> = {};
    (data || []).forEach(item => { settings[item.key] = item.value; });
    return settings;
};

export const updateArkSettings = async (key: string, value: any) => {
    const { error } = await supabase.from('ark_settings').upsert({ key, value });
    if (error) throw error;
};

export const getArkAds = async (): Promise<ArkAd[]> => {
    const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true);
    return (data || []) as ArkAd[];
};

export const createArkAd = async (ad: Partial<ArkAd>) => {
    const { error } = await supabase.from('ark_ads').insert(ad);
    if (error) throw error;
};

export const deleteArkAd = async (id: number) => {
    const { error } = await supabase.from('ark_ads').delete().eq('id', id);
    if (error) throw error;
};

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return (data || []) as ArkQuiz[];
};

export const createArkQuiz = async (quiz: Partial<ArkQuiz>) => {
    const { error } = await supabase.from('ark_quizzes').insert(quiz);
    if (error) throw error;
};

export const deleteArkQuiz = async (id: number) => {
    const { error } = await supabase.from('ark_quizzes').delete().eq('id', id);
    if (error) throw error;
};

export const recordArkSpinResult = async (userId: string, prize: any) => {
    const { error } = await supabase.rpc('record_ark_spin', { u_id: userId, prize_data: prize });
    if (error) throw error;
};

export const rewardArkSpins = async (userId: string, spins: number) => {
    const { error } = await supabase.rpc('reward_ark_spins', { u_id: userId, spin_count: spins });
    if (error) throw error;
};

export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    const { error } = await supabase.rpc('claim_ark_ad_reward', { u_id: userId, amt: amount, ad_title: title });
    if (error) throw error;
};

export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    const { data } = await supabase.from('ark_withdrawals').select('*, profiles(*)').order('created_at', { ascending: false });
    return (data || []) as ArkWithdrawal[];
};

export const approveArkWithdrawal = async (id: number) => {
    const { error } = await supabase.rpc('approve_ark_withdrawal', { withdrawal_id: id });
    if (error) throw error;
};

export const runArkAutopilot = async () => {
    const { data, error } = await supabase.rpc('run_ark_autopilot');
    if (error) throw error;
    return data;
};

export const toggleArkMarketStatus = async (status: string) => {
    await updateArkSettings('game_status', status);
};

export const saveArkSchedule = async (schedule: ArkSchedule) => {
    await updateArkSettings('market_schedule', JSON.stringify(schedule));
};

export const giveArkGlobalBonus = async (amount: number, message: string) => {
    const { error } = await supabase.rpc('give_ark_global_bonus', { amt: amount, msg: message });
    if (error) throw error;
};

// --- PAYMENTS & BILLING ---
export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('payment_requests').insert({ user_id: userId, amount, screenshot_url: screenshotUrl, status: 'pending' });
    if (error) throw error;
};

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    const { data } = await supabase.from('payment_requests').select('*, profiles(*)').order('created_at', { ascending: false });
    return (data || []) as PaymentRequestDB[];
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
    const { error } = await supabase.rpc('approve_payment_request', { req_id: requestId, u_id: userId, amt: amount });
    if (error) throw error;
};

export const rejectPaymentRequest = async (requestId: number) => {
    const { error } = await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
    if (error) throw error;
};

export const recordTsPaySuccess = async (userId: string, amount: number, tspayId: number) => {
    const { error } = await supabase.rpc('record_tspay_success', { u_id: userId, amt: amount, t_id: tspayId });
    if (error) throw error;
};

// --- BROADCASTS ---
export const getBroadcasts = async (): Promise<Broadcast[]> => {
    const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    return (data || []) as Broadcast[];
};

export const createBroadcast = async (broadcast: Partial<Broadcast>) => {
    const { error } = await supabase.from('broadcasts').insert(broadcast);
    if (error) throw error;
};

export const deleteBroadcast = async (id: number) => {
    const { error } = await supabase.from('broadcasts').delete().eq('id', id);
    if (error) throw error;
};

// --- PROMOCODES ---
export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data } = await supabase.from('promocodes').select('*').order('id', { ascending: false });
    return (data || []) as Promocode[];
};

export const savePromocode = async (promocode: Promocode) => {
    const { error } = await supabase.from('promocodes').insert(promocode);
    if (error) throw error;
};

export const deletePromocode = async (id: number) => {
    const { error } = await supabase.from('promocodes').delete().eq('id', id);
    if (error) throw error;
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { u_id: userId, p_code: code });
    if (error) throw error;
    return data;
};

// --- SESSIONS & DEVICES ---
export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*, profiles(*)').order('last_active', { ascending: false });
    return (data || []) as UserDevice[];
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*').eq('user_id', userId).order('last_active', { ascending: false });
    return (data || []) as UserDevice[];
};

export const toggleDeviceBlock = async (id: number, blocked: boolean) => {
    const { error } = await supabase.from('user_devices').update({ is_blocked: blocked }).eq('id', id);
    if (error) throw error;
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    const name = navigator.userAgent;
    const { error } = await supabase.from('user_devices').upsert({ user_id: userId, device_id: deviceId, device_name: name, last_active: new Date().toISOString() });
    if (error) console.error(error);
};

// --- SUPPORT TICKETS ---
export const getAllTickets = async (): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*, profiles(*)').order('created_at', { ascending: false });
    return (data || []) as SupportTicket[];
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as SupportTicket[];
};

export const createTicket = async (userId: string) => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
    if (error) throw error;
    return data as SupportTicket;
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    return (data || []) as TicketMessage[];
};

export const sendMessage = async (ticketId: number, userId: string, message: string, isAdmin: boolean) => {
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: ticketId, user_id: userId, message, is_admin: isAdmin });
    if (error) throw error;
};

// --- NEWS ---
export const getNews = async (): Promise<News[]> => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    return (data || []) as News[];
};

export const createNews = async (title: string, content: string) => {
    const { error } = await supabase.from('news').insert({ title, content });
    if (error) throw error;
};

export const deleteNews = async (id: number) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw error;
};

// --- SOCIAL LINKS ---
export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const { data } = await supabase.from('social_links').select('*');
    return (data || []) as SocialLink[];
};

export const addSocialLink = async (link: Partial<SocialLink>) => {
    const { error } = await supabase.from('social_links').insert(link);
    if (error) throw error;
};

export const deleteSocialLink = async (id: number) => {
    const { error } = await supabase.from('social_links').delete().eq('id', id);
    if (error) throw error;
};

// --- ADMIN SECURITY & UTILS ---
export const getAdminPin = async (): Promise<string> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_pin').maybeSingle();
    return (data as any)?.value || '0000';
};

export const setAdminPin = async (pin: string) => {
    await updateAppConfig('admin_pin', pin);
};

export const getProtectedRoutes = async (): Promise<string[]> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'protected_routes').maybeSingle();
    try {
        return JSON.parse((data as any)?.value || '[]');
    } catch { return []; }
};

export const setProtectedRoutes = async (routes: string[]) => {
    await updateAppConfig('protected_routes', JSON.stringify(routes));
};

export const saveRecoveryCodes = async (codes: string[]) => {
    await updateAppConfig('admin_recovery_codes', JSON.stringify(codes));
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').maybeSingle();
    try {
        const codes = JSON.parse((data as any)?.value || '[]');
        return codes.includes(code);
    } catch { return false; }
};

export const getRecoveryCodesStatus = async (): Promise<boolean> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').maybeSingle();
    try {
        const codes = JSON.parse((data as any)?.value || '[]');
        return codes.length > 0;
    } catch { return false; }
};

export const getAdminNotificationCounts = async () => {
    const { data } = await supabase.rpc('get_admin_counts');
    return {
        financials: data?.payment_pending || 0,
        support: data?.tickets_open || 0
    };
};

export const getAdminNotificationCountsCount = async () => {
    return getAdminNotificationCounts();
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    return count || 0;
};

// --- PREMIUM & BALANCES ---
export const getPremiumUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('profiles').select('*').gt('balance', 0);
    return (data || []) as UserProfile[];
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', desc: string) => {
    const finalAmount = type === 'add' ? amount : -amount;
    const { error } = await supabase.rpc('admin_adjust_balance', { u_id: userId, amt: finalAmount, description: desc });
    if (error) throw error;
};

export const giveGlobalBonus = async (amount: number, desc: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { amt: amount, description: desc });
    if (error) throw error;
    return data;
};

export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { u_id: userId, s_plan: plan, s_price: price });
    if (error) throw error;
};

export const startFreeTrial = async (userId: string): Promise<string> => {
    const now = new Date().toISOString();
    const { error } = await supabase.from('profiles').update({ free_trial_started_at: now }).eq('id', userId);
    if (error) throw error;
    return now;
};

// --- SHOP SERVICES ---
export const getShopProducts = async (category: string = 'all', sort: string = 'newest', search: string = ''): Promise<ShopProduct[]> => {
    let query = supabase.from('shop_products').select('*').eq('is_active', true);
    if (category !== 'all') query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);
    const { data } = await query.order('created_at', { ascending: sort === 'price_asc' });
    return (data || []) as ShopProduct[];
};

export const getAdminShopProducts = async (): Promise<ShopProduct[]> => {
    const { data } = await supabase.from('shop_products').select('*').order('created_at', { ascending: false });
    return (data || []) as ShopProduct[];
};

export const createShopProduct = async (product: Partial<ShopProduct>) => {
    const { error } = await supabase.from('shop_products').insert(product);
    if (error) throw error;
};

export const getShopWallet = async (userId: string): Promise<ShopWallet | null> => {
    const { data } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ShopWallet;
};

export const createShopPaymentRequest = async (userId: string, amount: number, url: string) => {
    const { error } = await supabase.from('shop_payments').insert({ user_id: userId, amount, screenshot_url: url, status: 'pending' });
    if (error) throw error;
};

export const placeShopOrder = async (userId: string, productId: number, price: number, address: string, phone: string) => {
    const { error } = await supabase.rpc('place_shop_order', { u_id: userId, p_id: productId, o_price: price, o_addr: address, o_phone: phone });
    if (error) throw error;
};

export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    const { data } = await supabase.from('shop_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as ShopOrder[];
};

// --- ADS ---
export const getAds = async (): Promise<Ad[]> => {
    const { data } = await supabase.from('ads').select('*').order('id', { ascending: false });
    return (data || []).map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        type: ad.type,
        contentUrl: ad.content_url,
        targetUrl: ad.target_url,
        location: ad.location,
        status: ad.status,
        view_count: ad.view_count
    }));
};

export const saveAd = async (ad: Ad) => {
    const { error } = await supabase.from('ads').insert({
        name: ad.name,
        type: ad.type,
        content_url: ad.contentUrl,
        target_url: ad.targetUrl,
        location: ad.location,
        status: ad.status
    });
    if (error) throw error;
};

export const deleteAd = async (id: number) => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    if (error) throw error;
};

export const incrementAdView = async (id: number) => {
    await supabase.rpc('increment_ad_view', { ad_id: id });
};

// --- SEARCH & ANALYTICS ---
export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').or(`title.ilike.%${query}%,genre.ilike.%${query}%,tags.ilike.%${query}%`).eq('is_archived', false);
    return (data || []) as Movie[];
};

export const getDashboardStats = async () => {
    const { data } = await supabase.rpc('get_dashboard_stats');
    return data;
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    // Logic to prevent multiple registrations from same device if needed
};

// --- FILE UPLOADS ---
export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
};

export const uploadPoster = async (file: File): Promise<string> => uploadFile(file, 'posters');
export const uploadVideo = async (file: File): Promise<string> => uploadFile(file, 'videos');

// --- FANDUB CHANNEL SERVICES ---
export const getFandubChannel = async (userId: string): Promise<FandubChannel | null> => {
    const { data } = await supabase.from('fandub_channels').select('*').eq('user_id', userId).maybeSingle();
    return data as FandubChannel;
};

export const createFandubChannel = async (channel: Partial<FandubChannel>) => {
    const { data, error } = await supabase.from('fandub_channels').insert(channel).select().single();
    if (error) throw error;
    return data;
};

export const updateFandubChannel = async (channelId: string, updates: Partial<FandubChannel>) => {
    const { error } = await supabase.from('fandub_channels').update(updates).eq('id', channelId);
    if (error) throw error;
};

export const getMonetizationRates = async (): Promise<Record<string, number>> => {
    const { data } = await supabase.from('monetization_rates').select('key, value');
    const rates: Record<string, number> = {};
    (data || []).forEach(item => { rates[item.key] = Number(item.value); });
    return rates;
};

export const getFandubUploads = async (userId: string): Promise<FandubUpload[]> => {
    const { data } = await supabase.from('fandub_uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as FandubUpload[];
};
