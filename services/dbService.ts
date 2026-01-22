
import { supabase } from './supabaseClient';
import { Movie, Episode, UserProfile, Transaction, ShopProduct, ShopWallet, ShopOrder, ShopPayment, ATCTransaction, ContestTask, ContestAd, ATCWallet, QuizQuestion, ArkWallet, ArkMarketData, ArkAd, ArkQuiz, WheelPrize, ArkWithdrawal, ArkSchedule, Broadcast, SocialLink, PaymentRequestDB, UserDevice, Promocode, SupportTicket, TicketMessage, News, DashboardStats, ActivityLog } from '../types';

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

// --- FILE UPLOADS ---
export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
};

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

    // Sorting
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
        const { data: newWallet, error: createError } = await supabase.from('shop_wallets').insert({ user_id: userId, balance: 0 }).select().single();
        if (createError) throw createError;
        return newWallet;
    }
    return data;
};

export const createShopPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('shop_payments').insert({
        user_id: userId,
        amount,
        screenshot_url: screenshotUrl,
        status: 'pending'
    });
    if (error) throw error;
};

export const placeShopOrder = async (userId: string, productId: number, amount: number, address: string, phone: string) => {
    const { error } = await supabase.rpc('place_shop_order', {
        p_user_id: userId,
        p_product_id: productId,
        p_amount: amount,
        p_address: address,
        p_phone: phone
    });
    if (error) throw error;
};

export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    const { data, error } = await supabase.from('shop_orders').select('*, shop_products(*)').eq('user_id', userId).order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

// --- ADMIN SHOP SERVICES ---
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

// Config
export const getAppConfig = async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from('app_config').select('key, value');
    if (error) return {};
    const config: Record<string, string> = {};
    data.forEach(item => { config[item.key] = item.value; });
    return config;
};

export const updateAppConfig = async (key: string, value: string) => {
    const { error } = await supabase.from('app_config').upsert({ key, value });
    if (error) throw error;
};

// --- ADDITIONAL SERVICES ---

// ATC (AniConcurs)
export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    const { data, error } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getContestSettings = async (): Promise<any> => {
    const { data, error } = await supabase.from('app_config').select('*').ilike('key', 'contest_%');
    if (error) throw error;
    const settings: any = {};
    data.forEach(item => {
        const key = item.key.replace('contest_', '');
        try {
            settings[key] = JSON.parse(item.value);
        } catch (e) {
            settings[key] = item.value;
        }
    });
    return settings;
};

export const updateContestSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('app_config').upsert({ key: `contest_${key}`, value });
    if (error) throw error;
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
    const { data, error } = await supabase.from('contest_tasks').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createContestTask = async (task: Partial<ContestTask>) => {
    const { data, error } = await supabase.from('contest_tasks').insert(task).select().single();
    if (error) throw error;
    return data;
};

export const deleteContestTask = async (id: number) => {
    const { error } = await supabase.from('contest_tasks').delete().eq('id', id);
    if (error) throw error;
};

export const claimATCReward = async (userId: string, amount: number, type: string, description: string) => {
    const { error } = await supabase.rpc('claim_atc_reward', { p_user_id: userId, p_amount: amount, p_type: type, p_description: description });
    if (error) throw error;
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    const { error } = await supabase.rpc('convert_atc_to_uzs', { p_user_id: userId, p_atc_amount: amount, p_rate: rate });
    if (error) throw error;
};

export const getQuizQuestions = async (count: number): Promise<QuizQuestion[]> => {
    const { data, error } = await supabase.from('quiz_questions').select('*').limit(count);
    if (error) throw error;
    return data || [];
};

export const rewardExtraSpin = async (userId: string, spins: number) => {
    const { error } = await supabase.rpc('reward_extra_spin', { p_user_id: userId, p_spins: spins });
    if (error) throw error;
};

export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
    const { data, error } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
};

export const getContestAds = async (): Promise<ContestAd[]> => {
    const { data, error } = await supabase.from('contest_ads').select('*').eq('is_active', true).order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createContestAd = async (ad: Partial<ContestAd>) => {
    const { data, error } = await supabase.from('contest_ads').insert(ad).select().single();
    if (error) throw error;
    return data;
};

export const deleteContestAd = async (id: number) => {
    const { error } = await supabase.from('contest_ads').delete().eq('id', id);
    if (error) throw error;
};

// ARK (Cash Contest)
export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
    const { data, error } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    const { data, error } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const requestArkWithdrawal = async (userId: string, amount: number, cardNum: string, cardHolder: string) => {
    const { error } = await supabase.from('ark_withdrawals').insert({
        user_id: userId,
        amount_ark: amount,
        card_number: cardNum,
        card_holder: cardHolder,
        status: 'pending'
    });
    if (error) throw error;
};

export const getArkSettings = async (): Promise<any> => {
    const { data, error } = await supabase.from('ark_settings').select('*');
    if (error) throw error;
    const settings: any = {};
    data.forEach(item => {
        try {
            settings[item.key] = JSON.parse(item.value);
        } catch (e) {
            settings[item.key] = item.value;
        }
    });
    return settings;
};

export const updateArkSettings = async (key: string, value: string) => {
    const { error } = await supabase.from('ark_settings').upsert({ key, value });
    if (error) throw error;
};

export const getArkAds = async (): Promise<ArkAd[]> => {
    const { data, error } = await supabase.from('ark_ads').select('*').eq('is_active', true).order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createArkAd = async (ad: Partial<ArkAd>) => {
    const { data, error } = await supabase.from('ark_ads').insert(ad).select().single();
    if (error) throw error;
    return data;
};

export const deleteArkAd = async (id: number) => {
    const { error } = await supabase.from('ark_ads').delete().eq('id', id);
    if (error) throw error;
};

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    const { data, error } = await supabase.from('ark_quizzes').select('*');
    if (error) throw error;
    return data || [];
};

export const createArkQuiz = async (quiz: Partial<ArkQuiz>) => {
    const { data, error } = await supabase.from('ark_quizzes').insert(quiz).select().single();
    if (error) throw error;
    return data;
};

export const deleteArkQuiz = async (id: number) => {
    const { error } = await supabase.from('ark_quizzes').delete().eq('id', id);
    if (error) throw error;
};

export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    const { error } = await supabase.rpc('record_ark_spin', { p_user_id: userId, p_prize: prize });
    if (error) throw error;
};

export const rewardArkSpins = async (userId: string, spins: number) => {
    const { error } = await supabase.rpc('reward_ark_spins', { p_user_id: userId, p_spins: spins });
    if (error) throw error;
};

export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    const { error } = await supabase.rpc('claim_ark_ad_reward', { p_user_id: userId, p_amount: amount, p_title: title });
    if (error) throw error;
};

// Admin Ark Controls
export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    const { data, error } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const approveArkWithdrawal = async (id: number) => {
    const { error } = await supabase.rpc('approve_ark_withdrawal', { p_id: id });
    if (error) throw error;
};

export const giveArkGlobalBonus = async (amount: number, message: string) => {
    const { error } = await supabase.rpc('give_ark_global_bonus', { p_amount: amount, p_message: message });
    if (error) throw error;
};

export const runArkAutopilot = async () => {
    const { data, error } = await supabase.rpc('run_ark_autopilot');
    if (error) throw error;
    return data;
};

export const toggleArkMarketStatus = async (status: 'active' | 'paused' | 'closed') => {
    const { error } = await supabase.from('ark_settings').upsert({ key: 'game_status', value: status });
    if (error) throw error;
};

export const saveArkSchedule = async (schedule: ArkSchedule) => {
    const { error } = await supabase.from('ark_settings').upsert({ key: 'market_schedule', value: JSON.stringify(schedule) });
    if (error) throw error;
};

// Billing
export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('payment_requests').insert({
        user_id: userId,
        amount,
        screenshot_url: screenshotUrl,
        status: 'pending'
    });
    if (error) throw error;
};

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    const { data, error } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const approvePaymentRequest = async (id: number, userId: string, amount: number) => {
    const { error } = await supabase.rpc('approve_payment_request', { p_id: id, p_user_id: userId, p_amount: amount });
    if (error) throw error;
};

export const rejectPaymentRequest = async (id: number) => {
    const { error } = await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', id);
    if (error) throw error;
};

// Broadcasts
export const getBroadcasts = async (): Promise<Broadcast[]> => {
    const { data, error } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createBroadcast = async (broadcast: Partial<Broadcast>) => {
    const { data, error } = await supabase.from('broadcasts').insert(broadcast).select().single();
    if (error) throw error;
    return data;
};

export const deleteBroadcast = async (id: number) => {
    const { error } = await supabase.from('broadcasts').delete().eq('id', id);
    if (error) throw error;
};

// Movie Interactions
export const isMovieSaved = async (userId: string, movieId: number): Promise<boolean> => {
    const { data, error } = await supabase.from('saved_movies').select('*').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
    return !!data;
};

export const toggleSaveMovie = async (userId: string, movieId: number): Promise<boolean> => {
    const isSaved = await isMovieSaved(userId, movieId);
    if (isSaved) {
        await supabase.from('saved_movies').delete().eq('user_id', userId).eq('movie_id', movieId);
        return false;
    } else {
        await supabase.from('saved_movies').insert({ user_id: userId, movie_id: movieId });
        return true;
    }
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data, error } = await supabase.from('saved_movies').select('movies(*)').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(item => (item as any).movies);
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    const { data, error } = await supabase.from('watch_history').select('movies(*)').eq('user_id', userId).order('watched_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => (item as any).movies);
};

// Reviews
export const getMovieReviews = async (movieId: number): Promise<any[]> => {
    const { data, error } = await supabase.from('movie_reviews').select('*, profiles(full_name, avatar_url)').eq('movie_id', movieId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const addReview = async (movieId: number, userId: string, rating: number, comment: string) => {
    const { error } = await supabase.from('movie_reviews').insert({ movie_id: movieId, user_id: userId, rating, comment });
    if (error) throw error;
};

// Admin Movie Management
export const getAdminMovies = async (): Promise<Movie[]> => {
    const { data, error } = await supabase.from('movies').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const addMovieToDB = async (movie: Partial<Movie>) => {
    const { data, error } = await supabase.from('movies').insert(movie).select().single();
    if (error) throw error;
    return data;
};

export const updateMovieInDB = async (id: number, movie: Partial<Movie>) => {
    const { error } = await supabase.from('movies').update(movie).eq('id', id);
    if (error) throw error;
};

export const deleteMovieFromDB = async (id: number) => {
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
};

export const toggleMovieArchive = async (id: number, isArchived: boolean) => {
    const { error } = await supabase.from('movies').update({ is_archived: isArchived }).eq('id', id);
    if (error) throw error;
};

export const uploadPoster = async (file: File) => {
    return uploadFile(file, 'posters');
};

export const uploadVideo = async (file: File) => {
    return uploadFile(file, 'videos');
};

// Social Links
export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const { data, error } = await supabase.from('social_links').select('*');
    if (error) throw error;
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

// Users & Sessions
export const getPremiumUsers = async (): Promise<any[]> => {
    const { data, error } = await supabase.from('profiles').select('*').gt('balance', 0).order('balance', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data;
};

export const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    const finalAmount = type === 'add' ? amount : -amount;
    const { error } = await supabase.rpc('admin_adjust_balance', { p_user_id: userId, p_amount: finalAmount, p_description: description });
    if (error) throw error;
};

export const giveGlobalBonus = async (amount: number, description: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { p_amount: amount, p_description: description });
    if (error) throw error;
    return data;
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data, error } = await supabase.from('user_sessions').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
};

export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data, error } = await supabase.from('user_sessions').select('*, profiles(full_name, email, role)').order('last_active', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const toggleDeviceBlock = async (id: number, isBlocked: boolean) => {
    const { error } = await supabase.from('user_sessions').update({ is_blocked: isBlocked }).eq('id', id);
    if (error) throw error;
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    const { error } = await supabase.rpc('log_device_login', { p_user_id: userId, p_device_id: deviceId });
    if (error) throw error;
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    const { data, error } = await supabase.rpc('check_device_registration', { p_device_id: deviceId });
    if (error) throw error;
    if (!data.can_register) throw new Error(data.message);
};

// Promocodes
export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data, error } = await supabase.from('promocodes').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const savePromocode = async (promo: Partial<Promocode>) => {
    const { error } = await supabase.from('promocodes').insert(promo);
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

// Security
export const getAdminPin = async (): Promise<string> => {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'admin_pin').single();
    if (error) return '0000';
    return data.value;
};

export const setAdminPin = async (pin: string) => {
    await updateAppConfig('admin_pin', pin);
};

export const getProtectedRoutes = async (): Promise<string[]> => {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'protected_routes').single();
    if (error) return [];
    try { return JSON.parse(data.value); } catch { return []; }
};

export const setProtectedRoutes = async (routes: string[]) => {
    await updateAppConfig('protected_routes', JSON.stringify(routes));
};

export const saveRecoveryCodes = async (codes: string[]) => {
    await updateAppConfig('admin_recovery_codes', JSON.stringify(codes));
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('verify_recovery_code', { p_code: code });
    if (error) return false;
    return !!data;
};

export const getRecoveryCodesStatus = async (): Promise<boolean> => {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').single();
    if (error) return false;
    try {
        const codes = JSON.parse(data.value);
        return Array.isArray(codes) && codes.length > 0;
    } catch { return false; }
};

// Support
export const getAllTickets = async (): Promise<SupportTicket[]> => {
    const { data, error } = await supabase.from('support_tickets').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createTicket = async (userId: string) => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
    if (error) throw error;
    return data;
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    const { data, error } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const sendMessage = async (ticketId: number, senderId: string, message: string, isAdmin: boolean) => {
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: ticketId, sender_id: senderId, message, is_admin: isAdmin });
    if (error) throw error;
};

export const getNews = async (): Promise<News[]> => {
    const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const createNews = async (title: string, content: string) => {
    const { error } = await supabase.from('news').insert({ title, content });
    if (error) throw error;
};

export const deleteNews = async (id: number) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw error;
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    if (error) return 0;
    return count || 0;
};

export const startFreeTrial = async (userId: string): Promise<string> => {
    const now = new Date().toISOString();
    const { error } = await supabase.from('profiles').update({ free_trial_started_at: now }).eq('id', userId);
    if (error) throw error;
    return now;
};

export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { p_user_id: userId, p_plan: plan, p_price: price });
    if (error) throw error;
};

export const updateUserWatchTime = async (userId: string, seconds: number) => {
    // Basic tracking if exists, otherwise no-op
};

export const incrementAdView = async (adId: number) => {
    await supabase.rpc('increment_ad_view', { p_ad_id: adId });
};

export const getAdminNotificationCounts = async () => {
    const { data, error } = await supabase.rpc('get_admin_counts');
    if (error) return { financials: 0, support: 0 };
    return data;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) return { totalUsers: 0, totalMovies: 0, totalPremium: 0, totalReviews: 0 };
    return data;
};

export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    const { data, error } = await supabase.from('activity_logs').select('*').limit(10).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        time: item.created_at
    }));
};

export const getAds = async (): Promise<any[]> => {
    const { data, error } = await supabase.from('ads').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const saveAd = async (ad: any) => {
    const { error } = await supabase.from('ads').insert(ad);
    if (error) throw error;
};

export const deleteAd = async (id: number) => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
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

export const recordTsPaySuccess = async (userId: string, amount: number, tspayId: number) => {
    const { error } = await supabase.rpc('record_tspay_payment', {
        p_user_id: userId,
        p_amount: amount,
        p_tspay_id: tspayId
    });
    if (error) throw error;
};
