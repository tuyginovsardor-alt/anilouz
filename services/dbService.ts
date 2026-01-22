
import { supabase } from './supabaseClient';
import { 
    UserProfile, Movie, Episode, ATCWallet, ATCTransaction, 
    ContestTask, ContestAd, QuizQuestion, ArkWallet, 
    ArkMarketData, ArkAd, ArkQuiz, ArkWithdrawal, 
    Broadcast, Promocode, UserDevice, SupportTicket, 
    TicketMessage, News, Transaction, ShopProduct, 
    ShopWallet, ShopOrder, SocialLink, PaymentRequestDB, 
    FandubChannel, FandubUpload, ArkSchedule, Ad, WheelPrize 
} from '../types';

// --- CORE APP CONFIG ---
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

// --- USER PROFILE ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data as UserProfile;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return (data || []) as UserProfile[];
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    return data as UserProfile;
};

export const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
};

// --- NOTIFICATIONS & ADMIN COUNTS ---
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) return 0;
        return count || 0;
    } catch { return 0; }
};

export const getAdminNotificationCounts = async () => {
    try {
        const { data, error } = await supabase.rpc('get_admin_counts');
        if (error) throw error;
        return {
            financials: data?.payment_pending || 0,
            support: data?.tickets_open || 0,
            fandub: data?.fandub_pending || 0
        };
    } catch {
        return { financials: 0, support: 0, fandub: 0 };
    }
};

// --- MOVIES & CATALOG ---
export const getMovies = async (): Promise<Movie[]> => {
    const [officialRes, fandubRes] = await Promise.all([
        supabase.from('movies').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
        supabase.from('fandub_uploads').select('*').eq('status', 'approved').order('created_at', { ascending: false })
    ]);

    const officialMovies = (officialRes.data || []).map(m => ({ ...m, is_fandub: false }));
    const fandubMovies = (fandubRes.data || []).map(m => ({
        id: m.id,
        title: m.title,
        year: m.year,
        plot: m.description,
        posterUrl: m.poster_url,
        videoUrl: m.video_url,
        genre: m.genre,
        language: m.language || 'JP/UZ',
        quality: m.quality || 'HD',
        rating: m.rating || 5.0,
        tags: m.tags,
        translator: 'Fandub Studio',
        translator_id: m.user_id,
        is_fandub: true,
        access_type: m.access_type,
        status: 'completed',
        channel_id: m.channel_id
    }));

    return [...officialMovies, ...fandubMovies] as Movie[];
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

// --- FANDUB CHANNELS ---
export const getFandubChannel = async (userId: string): Promise<FandubChannel | null> => {
    const { data } = await supabase.from('fandub_channels').select('*').eq('user_id', userId).maybeSingle();
    return data as FandubChannel;
};

export const getFandubChannels = async (currentUserId?: string): Promise<FandubChannel[]> => {
    const { data } = await supabase.from('fandub_channels').select('*').order('subscriber_count', { ascending: false });
    if (currentUserId) {
        const { data: follows } = await supabase.from('fandub_follows').select('channel_id').eq('user_id', currentUserId);
        const followedIds = new Set((follows || []).map(f => f.channel_id));
        return (data || []).map(ch => ({ ...ch, is_following: followedIds.has(ch.id) }));
    }
    return data || [];
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

export const toggleFollowChannel = async (userId: string, channelId: string) => {
    const { data: existing } = await supabase.from('fandub_follows').select('id').eq('user_id', userId).eq('channel_id', channelId).maybeSingle();
    if (existing) {
        await supabase.from('fandub_follows').delete().eq('id', existing.id);
        await supabase.rpc('increment_subscribers', { ch_id: channelId, amt: -1 });
        return false;
    } else {
        await supabase.from('fandub_follows').insert({ user_id: userId, channel_id: channelId });
        await supabase.rpc('increment_subscribers', { ch_id: channelId, amt: 1 });
        return true;
    }
};

// --- STORIES ---
export const getActiveStories = async (): Promise<any[]> => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('fandub_stories').select('*, profiles(full_name, avatar_url, username)').gt('created_at', yesterday).order('created_at', { ascending: false });
    return data || [];
};

// --- FANDUB UPLOADS & MODERATION ---
export const getFandubUploads = async (userId: string): Promise<FandubUpload[]> => {
    const { data } = await supabase.from('fandub_uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as FandubUpload[];
};

export const getPendingFandubUploads = async (): Promise<FandubUpload[]> => {
    const { data } = await supabase.from('fandub_uploads').select('*, profiles(full_name)').eq('status', 'pending');
    return (data || []) as FandubUpload[];
};

export const approveFandubUpload = async (id: number) => {
    const { error } = await supabase.from('fandub_uploads').update({ status: 'approved' }).eq('id', id);
    if (error) throw error;
};

export const rejectFandubUpload = async (id: number, comment: string) => {
    const { error } = await supabase.from('fandub_uploads').update({ status: 'rejected', admin_comment: comment }).eq('id', id);
    if (error) throw error;
};

// --- OTHERS ---
export const getDashboardStats = async () => {
    const { data } = await supabase.rpc('get_dashboard_stats');
    return data;
};

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

// --- ANI CONCURS FUNCTIONS ---
export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as ATCTransaction[];
};

export const getContestSettings = async () => {
    const { data } = await supabase.from('contest_settings').select('*');
    const settings: any = {};
    (data || []).forEach(s => settings[s.key] = s.value);
    return settings;
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
    const { data } = await supabase.from('contest_tasks').select('*').order('created_at', { ascending: false });
    return (data || []) as ContestTask[];
};

export const claimATCReward = async (userId: string, amount: number, type: string, description: string) => {
    const { error } = await supabase.rpc('claim_atc_reward', { u_id: userId, amt: amount, r_type: type, desc: description });
    if (error) throw error;
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    const { error } = await supabase.rpc('convert_atc_to_uzs', { u_id: userId, amt: amount, ex_rate: rate });
    if (error) throw error;
};

export const getQuizQuestions = async (count: number): Promise<QuizQuestion[]> => {
    const { data } = await supabase.from('quiz_questions').select('*').limit(count);
    return (data || []) as QuizQuestion[];
};

export const rewardExtraSpin = async (userId: string, count: number) => {
    const { error } = await supabase.rpc('reward_extra_spin', { u_id: userId, amt: count });
    if (error) throw error;
};

export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
    const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ATCWallet;
};

export const getContestAds = async (): Promise<ContestAd[]> => {
    const { data } = await supabase.from('contest_ads').select('*').eq('is_active', true);
    return (data || []) as ContestAd[];
};

// --- ARK TRADING FUNCTIONS ---
export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
    const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ArkWallet;
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
    return (data || []) as ArkMarketData[];
};

export const requestArkWithdrawal = async (userId: string, amount: number, card: string, holder: string) => {
    const { error } = await supabase.from('ark_withdrawals').insert({ user_id: userId, amount_ark: amount, card_number: card, card_holder: holder });
    if (error) throw error;
};

export const getArkSettings = async () => {
    const { data } = await supabase.from('ark_settings').select('*');
    const settings: any = {};
    (data || []).forEach(s => settings[s.key] = s.value);
    return settings;
};

export const getArkAds = async (): Promise<ArkAd[]> => {
    const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true);
    return (data || []) as ArkAd[];
};

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return (data || []) as ArkQuiz[];
};

export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    const { error } = await supabase.rpc('record_ark_spin', { u_id: userId, p_val: prize.value, p_type: prize.type });
    if (error) throw error;
};

export const rewardArkSpins = async (userId: string, count: number) => {
    const { error } = await supabase.rpc('reward_ark_spins', { u_id: userId, amt: count });
    if (error) throw error;
};

export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    const { error } = await supabase.rpc('claim_ark_ad_reward', { u_id: userId, amt: amount, ad_title: title });
    if (error) throw error;
};

// --- BILLING & PAYMENTS ---
export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('payment_requests').insert({ user_id: userId, amount, screenshot_url: screenshotUrl });
    if (error) throw error;
};

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    const { data } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return (data || []) as PaymentRequestDB[];
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
    const { error } = await supabase.rpc('approve_payment', { r_id: requestId, u_id: userId, amt: amount });
    if (error) throw error;
};

export const rejectPaymentRequest = async (requestId: number) => {
    const { error } = await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
    if (error) throw error;
};

export const getPremiumUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').gt('balance', 0);
    return data || [];
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    const adjAmount = type === 'add' ? amount : -amount;
    const { error } = await supabase.rpc('admin_adjust_balance', { u_id: userId, amt: adjAmount, desc: description });
    if (error) throw error;
};

export const giveGlobalBonus = async (amount: number, description: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { amt: amount, desc: description });
    if (error) throw error;
    return data;
};

// --- BROADCASTS ---
export const getBroadcasts = async (): Promise<Broadcast[]> => {
    const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    return (data || []) as Broadcast[];
};

export const createBroadcast = async (bc: Partial<Broadcast>) => {
    const { error } = await supabase.from('broadcasts').insert(bc);
    if (error) throw error;
};

export const deleteBroadcast = async (id: number) => {
    const { error } = await supabase.from('broadcasts').delete().eq('id', id);
    if (error) throw error;
};

// --- CASH CONTEST ADMIN ---
export const updateArkSettings = async (key: string, value: string) => {
    const { error } = await supabase.from('ark_settings').upsert({ key, value });
    if (error) throw error;
};

export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return (data || []) as ArkWithdrawal[];
};

export const approveArkWithdrawal = async (id: number) => {
    const { error } = await supabase.from('ark_withdrawals').update({ status: 'approved' }).eq('id', id);
    if (error) throw error;
};

export const updateContestSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('contest_settings').upsert({ key, value });
    if (error) throw error;
};

export const createArkAd = async (ad: Partial<ArkAd>) => {
    const { error } = await supabase.from('ark_ads').insert(ad);
    if (error) throw error;
};

export const deleteArkAd = async (id: number) => {
    const { error } = await supabase.from('ark_ads').delete().eq('id', id);
    if (error) throw error;
};

export const createArkQuiz = async (quiz: Partial<ArkQuiz>) => {
    const { error } = await supabase.from('ark_quizzes').insert(quiz);
    if (error) throw error;
};

export const deleteArkQuiz = async (id: number) => {
    const { error } = await supabase.from('ark_quizzes').delete().eq('id', id);
    if (error) throw error;
};

export const giveArkGlobalBonus = async (amount: number, message: string) => {
    const { error } = await supabase.rpc('give_ark_global_bonus', { amt: amount, msg: message });
    if (error) throw error;
};

export const runArkAutopilot = async () => {
    const { data, error } = await supabase.rpc('run_ark_autopilot');
    if (error) throw error;
    return data;
};

export const toggleArkMarketStatus = async (status: string) => {
    const { error } = await supabase.from('ark_settings').upsert({ key: 'game_status', value: status });
    if (error) throw error;
};

export const saveArkSchedule = async (schedule: ArkSchedule) => {
    const { error } = await supabase.from('ark_settings').upsert({ key: 'market_schedule', value: JSON.stringify(schedule) });
    if (error) throw error;
};

// --- CONTEST ADMIN ---
export const createContestTask = async (task: Partial<ContestTask>) => {
    const { error } = await supabase.from('contest_tasks').insert(task);
    if (error) throw error;
};

export const deleteContestTask = async (id: number) => {
    const { error } = await supabase.from('contest_tasks').delete().eq('id', id);
    if (error) throw error;
};

export const createContestAd = async (ad: Partial<ContestAd>) => {
    const { error } = await supabase.from('contest_ads').insert(ad);
    if (error) throw error;
};

export const deleteContestAd = async (id: number) => {
    const { error } = await supabase.from('contest_ads').delete().eq('id', id);
    if (error) throw error;
};

// --- PROMOCODES ---
export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data } = await supabase.from('promocodes').select('*').order('expires_at', { ascending: false });
    return (data || []) as Promocode[];
};

export const savePromocode = async (promo: Promocode) => {
    const { error } = await supabase.from('promocodes').insert(promo);
    if (error) throw error;
};

export const deletePromocode = async (id: number) => {
    const { error } = await supabase.from('promocodes').delete().eq('id', id);
    if (error) throw error;
};

// --- SAVED MOVIES ---
export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('saved_movies').select('movies(*)').eq('user_id', userId);
    return (data || []).map((item: any) => item.movies) as Movie[];
};

// --- SECURITY ---
export const getAdminPin = async (): Promise<string> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_pin').maybeSingle();
    return data?.value || '0000';
};

export const setAdminPin = async (pin: string) => {
    await updateAppConfig('admin_pin', pin);
};

export const getProtectedRoutes = async (): Promise<string[]> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'protected_routes').maybeSingle();
    return data ? JSON.parse(data.value) : [];
};

export const setProtectedRoutes = async (routes: string[]) => {
    await updateAppConfig('protected_routes', JSON.stringify(routes));
};

export const saveRecoveryCodes = async (codes: string[]) => {
    await updateAppConfig('admin_recovery_codes', JSON.stringify(codes));
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').maybeSingle();
    if (!data) return false;
    const codes = JSON.parse(data.value);
    return codes.includes(code);
};

export const getRecoveryCodesStatus = async (): Promise<boolean> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').maybeSingle();
    if (!data) return false;
    const codes = JSON.parse(data.value);
    return Array.isArray(codes) && codes.length > 0;
};

// --- SESSIONS ---
export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*, profiles(full_name, email, role)').order('last_active', { ascending: false });
    return (data || []) as UserDevice[];
};

export const toggleDeviceBlock = async (id: number, blocked: boolean) => {
    const { error } = await supabase.from('user_devices').update({ is_blocked: blocked }).eq('id', id);
    if (error) throw error;
};

// --- SETTINGS ---
export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
};

export const updateUserEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
};

// --- SUPPORT ---
export const getAllTickets = async (): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return (data || []) as SupportTicket[];
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    return (data || []) as TicketMessage[];
};

export const sendMessage = async (ticketId: number, senderId: string, message: string, isAdmin: boolean) => {
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: ticketId, sender_id: senderId, message, is_admin: isAdmin });
    if (error) throw error;
    if (isAdmin) {
        await supabase.from('support_tickets').update({ status: 'open' }).eq('id', ticketId);
    }
};

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

export const createTicket = async (userId: string) => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
    if (error) throw error;
    return data as SupportTicket;
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as SupportTicket[];
};

// --- ACCOUNT / TRANSACTIONS ---
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as Transaction[];
};

// --- SHOP ---
export const getShopProducts = async (category: string, sortBy: string, search: string): Promise<ShopProduct[]> => {
    let query = supabase.from('shop_products').select('*').eq('is_active', true);
    if (category !== 'all') query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);
    
    if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
    else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
    else if (sortBy === 'popular') query = query.order('sales_count', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query;
    return (data || []) as ShopProduct[];
};

export const getShopWallet = async (userId: string): Promise<ShopWallet | null> => {
    const { data } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ShopWallet;
};

export const createShopPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('shop_payment_requests').insert({ user_id: userId, amount, screenshot_url: screenshotUrl });
    if (error) throw error;
};

export const placeShopOrder = async (userId: string, productId: number, amount: number, address: string, phone: string) => {
    const { error } = await supabase.rpc('place_shop_order', { u_id: userId, p_id: productId, amt: amount, addr: address, ph: phone });
    if (error) throw error;
};

export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    const { data } = await supabase.from('shop_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as ShopOrder[];
};

export const getAdminShopProducts = async (): Promise<ShopProduct[]> => {
    const { data } = await supabase.from('shop_products').select('*').order('created_at', { ascending: false });
    return (data || []) as ShopProduct[];
};

export const createShopProduct = async (product: Partial<ShopProduct>) => {
    const { error } = await supabase.from('shop_products').insert(product);
    if (error) throw error;
};

export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const { data } = await supabase.from('social_links').select('*');
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

export const getMovieEpisodes = async (movieId: number): Promise<Episode[]> => {
    const { data } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
    return data || [];
};

export const getMovieReviews = async (movieId: number): Promise<any[]> => {
    const { data } = await supabase.from('movie_reviews').select('*, profiles(full_name, avatar_url)').eq('movie_id', movieId).order('created_at', { ascending: false });
    return data || [];
};

export const addReview = async (movieId: number, userId: string, rating: number, comment: string) => {
    const { error } = await supabase.from('movie_reviews').insert({ movie_id: movieId, user_id: userId, rating, comment });
    if (error) throw error;
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

export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { u_id: userId, s_plan: plan, s_price: price });
    if (error) throw error;
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { u_id: userId, p_code: code });
    if (error) throw error;
    return data;
};

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

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').or(`title.ilike.%${query}%,genre.ilike.%${query}%,tags.ilike.%${query}%`).eq('is_archived', false);
    return (data || []) as Movie[];
};

export const recordTsPaySuccess = async (userId: string, amount: number, tspayId: number) => {
    const { error } = await supabase.rpc('record_tspay_success', { u_id: userId, amt: amount, t_id: tspayId });
    if (error) throw error;
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('user_history').select('movies(*)').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map((item: any) => item.movies) as Movie[];
};

export const updateUserWatchTime = async (userId: string, seconds: number) => {
    const { error } = await supabase.rpc('increment_watch_time', { u_id: userId, secs: seconds });
    if (error) console.error(error);
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*').eq('user_id', userId).order('last_active', { ascending: false });
    return (data || []) as UserDevice[];
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    const name = navigator.userAgent;
    const { error } = await supabase.from('user_devices').upsert({ user_id: userId, device_id: deviceId, device_name: name, last_active: new Date().toISOString() });
    if (error) console.error(error);
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    const { data } = await supabase.from('user_devices').select('is_blocked').eq('device_id', deviceId).maybeSingle();
    if (data && data.is_blocked) throw new Error("Ushbu qurilma bloklangan.");
};

export const startFreeTrial = async (userId: string): Promise<string> => {
    const now = new Date().toISOString();
    const { error } = await supabase.from('profiles').update({ free_trial_started_at: now }).eq('id', userId);
    if (error) throw error;
    return now;
};
