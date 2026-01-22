
import { supabase } from './supabaseClient';
import { 
    Movie, Episode, UserProfile, Transaction, ShopProduct, 
    ShopWallet, ShopOrder, ShopPayment, ATCWallet, ArkWallet, 
    WheelPrize, Promocode, SupportTicket, TicketMessage, News, 
    Ad, SocialLink, UserDevice, ArkWithdrawal, ContestTask, 
    ContestAd, QuizQuestion, ArkQuiz, ArkAutopilotConfig, ArkSchedule,
    DashboardStats, ActivityLog, ATCTransaction
} from '../types';

// --- DASHBOARD STATISTICS & ACTIVITY ---

export interface AdminDetailedStats extends DashboardStats {
    premiumUsers: number;
    freeUsers: number;
    recentUsers: UserProfile[];
    recentComments: any[];
}

/**
 * Admin panel uchun barcha hisob-kitoblarni olish
 */
export const getDashboardStats = async (): Promise<AdminDetailedStats> => {
    try {
        // Parallel so'rovlar - tezlik uchun
        const [uCount, mCount, pCount, rCount, freeCount] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('movies').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).not('subscription_end_at', 'is', null).gt('subscription_end_at', new Date().toISOString()),
            supabase.from('movie_reviews').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).or('subscription_end_at.is.null,subscription_end_at.lt.' + new Date().toISOString())
        ]);

        // Yaqinda kirganlar va so'nggi izohlarni alohida olamiz
        const { data: recentUsers } = await supabase.from('profiles').select('*').order('last_active', { ascending: false }).limit(6);
        const { data: recentComments } = await supabase.from('movie_reviews').select('*, profiles(full_name, avatar_url), movies(title)').order('created_at', { ascending: false }).limit(5);

        return {
            totalUsers: uCount.count || 0,
            totalMovies: mCount.count || 0,
            totalPremium: pCount.count || 0,
            totalReviews: rCount.count || 0,
            premiumUsers: pCount.count || 0,
            freeUsers: freeCount.count || 0,
            recentUsers: (recentUsers || []) as UserProfile[],
            recentComments: (recentComments || [])
        };
    } catch (e) {
        console.error("Dashboard stats error:", e);
        return { 
            totalUsers: 0, totalMovies: 0, totalPremium: 0, totalReviews: 0, 
            premiumUsers: 0, freeUsers: 0, recentUsers: [], recentComments: [] 
        };
    }
};

/**
 * So'nggi harakatlar (Log)
 */
export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    try {
        const { data: users } = await supabase.from('profiles').select('full_name, created_at').order('created_at', { ascending: false }).limit(3);
        const { data: payments } = await supabase.from('payment_requests').select('profiles(full_name), amount, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(3);

        const logs: ActivityLog[] = [];
        
        (users || []).forEach((u, i) => {
            logs.push({ id: 100 + i, title: 'Yangi foydalanuvchi', description: `${u.full_name || 'Noma\'lum'} qo'shildi`, time: new Date(u.created_at).toLocaleTimeString() });
        });

        (payments || []).forEach((p: any, i) => {
            logs.push({ id: 200 + i, title: 'To\'lov', description: `${p.profiles?.full_name || 'User'} ${p.amount} UZS to'ladi`, time: new Date(p.created_at).toLocaleTimeString() });
        });

        return logs.sort((a, b) => b.id - a.id).slice(0, 10);
    } catch (e) {
        return [{ id: 1, title: 'Tizim', description: 'Harakatlar yuklanmadi', time: 'Hozir' }];
    }
};

// --- CORE MOVIE SERVICES ---
export const getMovies = async (): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('movies').select('*').eq('is_archived', false).order('id', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
};

export const getAdminMovies = async (): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('movies').select('*').order('id', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
};

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('movies')
            .select('*')
            .or(`title.ilike.%${query}%,tags.ilike.%${query}%,genre.ilike.%${query}%`)
            .eq('is_archived', false);
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
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
    } catch (e) { return []; }
};

// --- PROFILE & AUTH ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) return null;
        return data;
    } catch (e) { return null; }
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
    } catch (e) { return []; }
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
    try {
        const { data, error } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
};

export const getPremiumUsers = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').gt('balance', 0).order('balance', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
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
    try {
        const { data, error } = await supabase.from('support_tickets').select('*, profiles(full_name, email)').order('status', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
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
    try {
        const { data, error } = await supabase.from('ads').select('*').order('id', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
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
    try {
        const { data, error } = await supabase.from('social_links').select('*');
        if (error) return [];
        return data || [];
    } catch (e) { return []; }
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
    try {
        const { data, error } = await supabase.from('user_sessions').select('*, profiles(full_name, email, role)').order('last_active', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    try {
        const { data, error } = await supabase.from('user_sessions').select('*').eq('user_id', userId).order('last_active', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
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
    try {
        const { data, error } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
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
    try {
        const { data, error } = await supabase.from('promocodes').select('*').order('id', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) { return []; }
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
    try {
        const { data } = await supabase.from('app_config').select('*').ilike('key', 'contest_%');
        const settings: any = {};
        (data || []).forEach(item => { settings[item.key.replace('contest_', '')] = item.value; });
        return settings;
    } catch (e) { return {}; }
};

export const updateContestSetting = async (key: string, value: string) => {
    await updateAppConfig(`contest_${key}`, value);
};

export const getContestTasks = async () => {
    try {
        const { data } = await supabase.from('contest_tasks').select('*').order('id', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createContestTask = async (task: any) => {
    await supabase.from('contest_tasks').insert(task);
};

export const deleteContestTask = async (id: number) => {
    await supabase.from('contest_tasks').delete().eq('id', id);
};

export const getContestAds = async () => {
    try {
        const { data } = await supabase.from('contest_ads').select('*').eq('is_active', true).order('id', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createContestAd = async (ad: any) => {
    await supabase.from('contest_ads').insert(ad);
};

export const deleteContestAd = async (id: number) => {
    await supabase.from('contest_ads').delete().eq('id', id);
};

export const getQuizQuestions = async (count: number) => {
    try {
        const { data } = await supabase.from('contest_quizzes').select('*').limit(count);
        return data || [];
    } catch (e) { return []; }
};

export const getArkWallet = async (userId: string) => {
    try {
        const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
        return data;
    } catch (e) { return null; }
};

export const getArkMarketHistory = async () => {
    try {
        const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const getArkSettings = async () => {
    try {
        const { data } = await supabase.from('ark_settings').select('*');
        const s: any = {};
        (data || []).forEach(i => { s[i.key] = i.value; });
        return s;
    } catch (e) { return {}; }
};

export const updateArkSettings = async (key: string, value: string) => {
    await supabase.from('ark_settings').upsert({ key, value });
};

export const requestArkWithdrawal = async (uid: string, ark: number, card: string, holder: string) => {
    const { error } = await supabase.rpc('request_ark_withdrawal', { p_uid: uid, p_ark: ark, p_card: card, p_holder: holder });
    if (error) throw error;
};

export const getArkWithdrawals = async () => {
    try {
        const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const approveArkWithdrawal = async (id: number) => {
    await supabase.from('ark_withdrawals').update({ status: 'approved' }).eq('id', id);
};

export const getArkAds = async () => {
    try {
        const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true).order('id', { ascending: false });
        return data || [];
    } catch (e) { return []; }
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
    try {
        const { data } = await supabase.from('ark_quizzes').select('*');
        return data || [];
    } catch (e) { return []; }
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

// --- SUBSCRIPTIONS ---
export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { p_user_id: userId, p_plan: plan, p_price: price });
    if (error) throw error;
};

export const startFreeTrial = async (userId: string) => {
    const now = new Date().toISOString();
    await supabase.from('profiles').update({ free_trial_started_at: now }).eq('id', userId);
    return now;
};

// --- SHOP SERVICES RE-EXPORT & FIX ---
export const createShopPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    return createPaymentRequest(userId, amount, screenshotUrl);
};

// Added missing shop functions
export const getShopProducts = async (category: string = 'all', sortBy: string = 'newest', searchQuery: string = ''): Promise<ShopProduct[]> => {
    try {
        let query = supabase.from('shop_products').select('*').eq('is_active', true);
        
        if (category !== 'all') {
            query = query.eq('category', category);
        }
        
        if (searchQuery) {
            query = query.ilike('title', `%${searchQuery}%`);
        }
        
        switch (sortBy) {
            case 'price_asc': query = query.order('price', { ascending: true }); break;
            case 'price_desc': query = query.order('price', { ascending: false }); break;
            case 'popular': query = query.order('sales_count', { ascending: false }); break;
            default: query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as ShopProduct[];
    } catch (e) {
        console.error("getShopProducts error:", e);
        return [];
    }
};

// Added missing shop function
export const getShopWallet = async (userId: string): Promise<ShopWallet | null> => {
    try {
        const { data, error } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
        if (error) throw error;
        return data as ShopWallet;
    } catch (e) {
        console.error("getShopWallet error:", e);
        return null;
    }
};

// Added missing shop function
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

// Added missing shop function
export const getAdminShopProducts = async (): Promise<ShopProduct[]> => {
    try {
        const { data, error } = await supabase.from('shop_products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as ShopProduct[];
    } catch (e) {
        console.error("getAdminShopProducts error:", e);
        return [];
    }
};

// Added missing shop function
export const createShopProduct = async (product: Partial<ShopProduct>) => {
    const { error } = await supabase.from('shop_products').insert(product);
    if (error) throw error;
};

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
