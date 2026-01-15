import { supabase } from './supabaseClient';
import { 
    Movie, UserProfile, ATCTransaction, ATCWallet, ContestTask, 
    QuizQuestion, ContestAd, Broadcast, ArkWithdrawal, ArkAd, 
    ArkQuiz, ArkSchedule, SocialLink, PaymentRequestDB, UserDevice, 
    Promocode, SupportTicket, TicketMessage, News, DashboardStats, 
    ActivityLog, Transaction, WheelPrize, Ad 
} from '../types';

// --- Mappers ---
// Fix: Added proper type checking and mapping for database entities
const mapMovie = (m: any): Movie => {
    if (!m) return m;
    return {
        id: m.id,
        title: m.title || 'Nomsiz',
        year: m.year || 2024,
        plot: m.plot || 'Mazmun yozilmagan.',
        posterUrl: m.poster_url || m.posterUrl || '',
        videoUrl: m.video_url || m.videoUrl || '',
        genre: m.genre || 'Janr noma\'lum',
        language: m.language || 'JP / UZ',
        quality: m.quality || 'HD',
        rating: m.rating || 0,
        view_count: m.view_count || 0,
        status: m.status || 'completed',
        translator: m.translator || 'Anilo Team',
        tags: m.tags || '',
        access_type: m.access_type || 'free',
        is_archived: m.is_archived
    };
};

const mapProfile = (p: any): UserProfile => {
    return {
        ...p,
        role: p.role || 'user',
        balance: p.balance || 0
    };
};

// --- Profiles ---
// Fix: Export missing member getUserProfile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return mapProfile(data);
};

// Fix: Export missing member updateUserProfile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase.from('profiles').update(updates as any).eq('id', userId);
    if (error) throw error;
};

// --- Movies ---
// Fix: Export missing member getMovies
export const getMovies = async (): Promise<Movie[]> => {
    const { data, error } = await supabase.from('movies').select('*').eq('is_archived', false);
    if (error) return [];
    return data.map(mapMovie);
};

// Fix: Export missing member getAdminMovies
export const getAdminMovies = async (): Promise<Movie[]> => {
    const { data, error } = await supabase.from('movies').select('*');
    if (error) return [];
    return data.map(mapMovie);
};

// Fix: Export missing member addMovieToDB
export const addMovieToDB = async (movie: any) => {
    const { data, error } = await supabase.from('movies').insert({
        title: movie.title,
        year: movie.year,
        plot: movie.plot,
        poster_url: movie.posterUrl,
        video_url: movie.videoUrl,
        genre: movie.genre,
        language: movie.language,
        quality: movie.quality,
        status: movie.status,
        tags: movie.tags,
        translator: movie.translator,
        access_type: movie.access_type || 'free'
    } as any).select().single();
    if (error) throw error;
    return mapMovie(data);
};

// Fix: Export missing member updateMovieInDB
export const updateMovieInDB = async (id: number, movie: any) => {
    const { error } = await supabase.from('movies').update({
        title: movie.title,
        year: movie.year,
        plot: movie.plot,
        poster_url: movie.posterUrl,
        video_url: movie.videoUrl,
        genre: movie.genre,
        language: movie.language,
        quality: movie.quality,
        status: movie.status,
        tags: movie.tags,
        translator: movie.translator,
        access_type: movie.access_type
    } as any).eq('id', id);
    if (error) throw error;
};

// Fix: Export missing member deleteMovieFromDB
export const deleteMovieFromDB = async (id: number) => {
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
};

// Fix: Export missing member toggleMovieArchive
export const toggleMovieArchive = async (id: number, isArchived: boolean) => {
    const { error } = await supabase.from('movies').update({ is_archived: isArchived } as any).eq('id', id);
    if (error) throw error;
};

// --- ATC Game ---
// Fix: Export missing member getATCWallet
export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
    const { data, error } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).single();
    if (error) return null;
    return data as ATCWallet;
};

// Fix: Export missing member getATCTransactions
export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    const { data, error } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data as ATCTransaction[];
};

// Fix: Export missing member claimATCReward
export const claimATCReward = async (userId: string, amount: number, type: string, description: string) => {
    const { error } = await supabase.rpc('claim_atc_reward', { u_id: userId, amt: amount, t_type: type, desc: description });
    if (error) throw error;
};

// Fix: Export missing member convertATCtoUZS
export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    const { error } = await supabase.rpc('convert_atc_to_uzs', { u_id: userId, atc_amt: amount, ex_rate: rate });
    if (error) throw error;
};

// Fix: Export missing member getContestSettings
export const getContestSettings = async () => {
    const { data } = await supabase.from('app_config').select('*').in('key', ['exchange_rate', 'daily_free_spins', 'wheel_config', 'quiz_reward_spins', 'quiz_questions_count', 'quiz_passing_score']);
    const settings: any = {};
    data?.forEach(d => {
        try { settings[d.key] = JSON.parse(d.value); } catch { settings[d.key] = d.value; }
    });
    return settings;
};

// Fix: Export missing member updateContestSetting
export const updateContestSetting = async (key: string, value: any) => {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    await supabase.from('app_config').upsert({ key, value: val } as any);
};

// Fix: Export missing member getContestTasks
export const getContestTasks = async (): Promise<ContestTask[]> => {
    const { data } = await supabase.from('contest_tasks').select('*');
    return (data || []) as ContestTask[];
};

// Fix: Export missing member createContestTask
export const createContestTask = async (task: any) => {
    await supabase.from('contest_tasks').insert(task);
};

// Fix: Export missing member deleteContestTask
export const deleteContestTask = async (id: number) => {
    await supabase.from('contest_tasks').delete().eq('id', id);
};

// Fix: Export missing member getContestAds
export const getContestAds = async (): Promise<ContestAd[]> => {
    const { data } = await supabase.from('contest_ads').select('*');
    return (data || []) as ContestAd[];
};

// Fix: Export missing member createContestAd
export const createContestAd = async (ad: any) => {
    await supabase.from('contest_ads').insert(ad);
};

// Fix: Export missing member deleteContestAd
export const deleteContestAd = async (id: number) => {
    await supabase.from('contest_ads').delete().eq('id', id);
};

// Fix: Export missing member getQuizQuestions
export const getQuizQuestions = async (count: number): Promise<QuizQuestion[]> => {
    const { data } = await supabase.from('quiz_questions').select('*').limit(count);
    return (data || []) as QuizQuestion[];
};

// Fix: Export missing member rewardExtraSpin
export const rewardExtraSpin = async (userId: string, amount: number) => {
    await supabase.from('atc_wallets').update({ extra_spins: amount } as any).eq('user_id', userId);
};

// --- Ark Trading ---
// Fix: Export missing member getArkWallet
export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
    const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).single();
    return data as ArkWallet;
};

// Fix: Export missing member getArkMarketHistory
export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    const { data } = await supabase.from('ark_market_history').select('*').order('timestamp', { ascending: true });
    return (data || []) as ArkMarketData[];
};

// Fix: Export missing member getArkSettings
export const getArkSettings = async () => {
    const { data } = await supabase.from('ark_settings').select('*');
    const settings: any = {};
    data?.forEach(d => {
        try { settings[d.key] = JSON.parse(d.value); } catch { settings[d.key] = d.value; }
    });
    return settings;
};

// Fix: Export missing member updateArkSettings
export const updateArkSettings = async (key: string, value: any) => {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    await supabase.from('ark_settings').upsert({ key, value: val } as any);
};

// Fix: Export missing member requestArkWithdrawal
export const requestArkWithdrawal = async (userId: string, amount: number, cardNum: string, cardHolder: string) => {
    await supabase.from('ark_withdrawals').insert({ user_id: userId, amount_ark: amount, card_number: cardNum, card_holder: cardHolder } as any);
};

// Fix: Export missing member getArkWithdrawals
export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    const { data } = await supabase.from('ark_withdrawals').select('*, profiles(*)').order('created_at', { ascending: false });
    return (data || []) as ArkWithdrawal[];
};

// Fix: Export missing member approveArkWithdrawal
export const approveArkWithdrawal = async (id: number) => {
    await supabase.from('ark_withdrawals').update({ status: 'approved' } as any).eq('id', id);
};

// Fix: Export missing member getArkAds
export const getArkAds = async (): Promise<ArkAd[]> => {
    const { data } = await supabase.from('ark_ads').select('*');
    return (data || []) as ArkAd[];
};

// Fix: Export missing member createArkAd
export const createArkAd = async (ad: any) => {
    await supabase.from('ark_ads').insert(ad);
};

// Fix: Export missing member deleteArkAd
export const deleteArkAd = async (id: number) => {
    await supabase.from('ark_ads').delete().eq('id', id);
};

// Fix: Export missing member getArkQuizzes
export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return (data || []) as ArkQuiz[];
};

// Fix: Export missing member createArkQuiz
export const createArkQuiz = async (quiz: any) => {
    await supabase.from('ark_quizzes').insert(quiz);
};

// Fix: Export missing member deleteArkQuiz
export const deleteArkQuiz = async (id: number) => {
    await supabase.from('ark_quizzes').delete().eq('id', id);
};

// Fix: Export missing member recordArkSpinResult
export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    await supabase.rpc('record_ark_spin', { u_id: userId, p_val: prize.value, p_type: prize.type });
};

// Fix: Export missing member rewardArkSpins
export const rewardArkSpins = async (userId: string, spins: number) => {
    await supabase.rpc('add_ark_spins', { u_id: userId, amt: spins });
};

// Fix: Export missing member claimArkAdReward
export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    await supabase.rpc('claim_ark_ad_reward', { u_id: userId, amt: amount, ad_title: title });
};

// Fix: Export missing member giveArkGlobalBonus
export const giveArkGlobalBonus = async (amount: number, message: string) => {
    await supabase.rpc('give_ark_global_bonus', { amt: amount, msg: message });
};

// Fix: Export missing member runArkAutopilot
export const runArkAutopilot = async () => {
    const { data, error } = await supabase.rpc('run_ark_autopilot');
    if (error) throw error;
    return data;
};

// Fix: Export missing member toggleArkMarketStatus
export const toggleArkMarketStatus = async (status: string) => {
    await updateArkSettings('game_status', status);
};

// Fix: Export missing member saveArkSchedule
export const saveArkSchedule = async (schedule: ArkSchedule) => {
    await updateArkSettings('market_schedule', schedule);
};

// --- Billing ---
// Fix: Export missing member createPaymentRequest
export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    await supabase.from('payment_requests').insert({ user_id: userId, amount, screenshot_url: screenshotUrl } as any);
};

// Fix: Export missing member getPaymentRequests
export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    const { data } = await supabase.from('payment_requests').select('*, profiles(*)').order('created_at', { ascending: false });
    return (data || []) as PaymentRequestDB[];
};

// Fix: Export missing member approvePaymentRequest
export const approvePaymentRequest = async (reqId: number, userId: string, amount: number) => {
    await supabase.rpc('approve_payment_request', { req_id: reqId, u_id: userId, amt: amount });
};

// Fix: Export missing member rejectPaymentRequest
export const rejectPaymentRequest = async (id: number) => {
    await supabase.from('payment_requests').update({ status: 'rejected' } as any).eq('id', id);
};

// Fix: Export missing member getPremiumUsers
export const getPremiumUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').gt('balance', 0);
    return data || [];
};

// Fix: Export missing member adminAdjustUserBalance
export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    const finalAmount = type === 'add' ? amount : -amount;
    await supabase.rpc('adjust_user_balance', { u_id: userId, amt: finalAmount, desc: description });
};

// Fix: Export missing member getUserByEmail
export const getUserByEmail = async (email: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).single();
    return data;
};

// Fix: Export missing member giveGlobalBonus
export const giveGlobalBonus = async (amount: number, description: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { amt: amount, desc: description });
    if (error) throw error;
    return data;
};

// --- History & Saved ---
// Fix: Export missing member getUserHistory
export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('user_history').select('movies(*)').eq('user_id', userId);
    return (data || []).map(d => mapMovie((d as any).movies));
};

// Fix: Export missing member getSavedMovies
export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('saved_movies').select('movies(*)').eq('user_id', userId);
    return (data || []).map(d => mapMovie((d as any).movies));
};

// --- Sessions & Security ---
// Fix: Export missing member getUserSessions
export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*').eq('user_id', userId);
    return (data || []) as UserDevice[];
};

// Fix: Export missing member getAllSessions
export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*, profiles(*)');
    return (data || []) as UserDevice[];
};

// Fix: Export missing member toggleDeviceBlock
export const toggleDeviceBlock = async (id: number, isBlocked: boolean) => {
    await supabase.from('user_devices').update({ is_blocked: isBlocked } as any).eq('id', id);
};

// Fix: Export missing member getAdminPin
export const getAdminPin = async (): Promise<string> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_pin').single();
    return data?.value || '0000';
};

// Fix: Export missing member setAdminPin
export const setAdminPin = async (pin: string) => {
    await supabase.from('app_config').update({ value: pin } as any).eq('key', 'admin_pin');
};

// Fix: Export missing member getProtectedRoutes
export const getProtectedRoutes = async (): Promise<string[]> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'protected_routes').single();
    try { return JSON.parse(data?.value || '[]'); } catch { return []; }
};

// Fix: Export missing member setProtectedRoutes
export const setProtectedRoutes = async (routes: string[]) => {
    await supabase.from('app_config').update({ value: JSON.stringify(routes) } as any).eq('key', 'protected_routes');
};

// Fix: Export missing member saveRecoveryCodes
export const saveRecoveryCodes = async (codes: string[]) => {
    await supabase.from('app_config').update({ value: JSON.stringify(codes) } as any).eq('key', 'admin_recovery_codes');
};

// Fix: Export missing member verifyRecoveryCode
export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').single();
    const codes: string[] = JSON.parse(data?.value || '[]');
    return codes.includes(code);
};

// Fix: Export missing member getRecoveryCodesStatus
export const getRecoveryCodesStatus = async (): Promise<boolean> => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').single();
    const codes = JSON.parse(data?.value || '[]');
    return codes.length > 0;
};

// --- Support ---
// Fix: Export missing member getAllTickets
export const getAllTickets = async (): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*, profiles(*)').order('created_at', { ascending: false });
    return (data || []) as SupportTicket[];
};

// Fix: Export missing member getMyTickets
export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as SupportTicket[];
};

// Fix: Export missing member createTicket
export const createTicket = async (userId: string): Promise<SupportTicket> => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' } as any).select().single();
    if (error) throw error;
    return data as SupportTicket;
};

// Fix: Export missing member getTicketMessages
export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    const { data } = await supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    return (data || []) as TicketMessage[];
};

// Fix: Export missing member sendMessage
export const sendMessage = async (ticketId: number, senderId: string, message: string, isAdmin: boolean) => {
    await supabase.from('support_messages').insert({ ticket_id: ticketId, sender_id: senderId, message, is_admin: isAdmin } as any);
};

// Fix: Export missing member getNews
export const getNews = async (): Promise<News[]> => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    return (data || []) as News[];
};

// Fix: Export missing member createNews
export const createNews = async (title: string, content: string) => {
    await supabase.from('news').insert({ title, content } as any);
};

// Fix: Export missing member deleteNews
export const deleteNews = async (id: number) => {
    await supabase.from('news').delete().eq('id', id);
};

// --- Misc ---
// Fix: Export missing member getAppConfig
export const getAppConfig = async () => {
    const { data } = await supabase.from('app_config').select('*');
    const config: any = {};
    data?.forEach(d => { config[d.key] = d.value; });
    return config;
};

// Fix: Export missing member updateAppConfig
export const updateAppConfig = async (key: string, value: string) => {
    await supabase.from('app_config').upsert({ key, value: val } as any);
};

// Fix: Export missing member getSocialLinks
export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const { data } = await supabase.from('social_links').select('*');
    return (data || []) as SocialLink[];
};

// Fix: Export missing member addSocialLink
export const addSocialLink = async (link: any) => {
    await supabase.from('social_links').insert(link);
};

// Fix: Export missing member deleteSocialLink
export const deleteSocialLink = async (id: number) => {
    await supabase.from('social_links').delete().eq('id', id);
};

// Fix: Export missing member getBroadcasts
export const getBroadcasts = async (): Promise<Broadcast[]> => {
    const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    return (data || []) as Broadcast[];
};

// Fix: Export missing member createBroadcast
export const createBroadcast = async (b: any) => {
    await supabase.from('broadcasts').insert(b);
};

// Fix: Export missing member deleteBroadcast
export const deleteBroadcast = async (id: number) => {
    await supabase.from('broadcasts').delete().eq('id', id);
};

// Fix: Export missing member getPromocodes
export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data } = await supabase.from('promocodes').select('*');
    return (data || []) as Promocode[];
};

// Fix: Export missing member savePromocode
export const savePromocode = async (promo: Promocode) => {
    await supabase.from('promocodes').insert(promo as any);
};

// Fix: Export missing member deletePromocode
export const deletePromocode = async (id: number) => {
    await supabase.from('promocodes').delete().eq('id', id);
};

// Fix: Export missing member redeemPromocode
export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { u_id: userId, p_code: code });
    if (error) throw error;
    return data;
};

// Fix: Export missing member buySubscription
export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { u_id: userId, s_plan: plan, s_price: price });
    if (error) throw error;
};

// Fix: Export missing member searchMoviesDB
export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').ilike('title', `%${query}%`);
    return (data || []).map(mapMovie);
};

// Fix: Export missing member getUnreadNotificationsCount
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    return count || 0;
};

// Fix: Export missing member markNotificationsAsRead
export const markNotificationsAsRead = async (userId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
};

// Fix: Export missing member getAdminNotificationCounts
export const getAdminNotificationCounts = async () => {
    const { count: fCount } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: sCount } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');
    return { financials: fCount || 0, support: sCount || 0 };
};

// Fix: Export missing member getDashboardStats
export const getDashboardStats = async (): Promise<DashboardStats> => {
    const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: m } = await supabase.from('movies').select('*', { count: 'exact', head: true });
    const { count: p } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { count: r } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
    return { totalUsers: u || 0, totalMovies: m || 0, totalPremium: p || 0, totalReviews: r || 0 };
};

// Fix: Export missing member getRecentActivity
export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    return [
        { id: 1, title: 'Yangi foydalanuvchi', description: 'Ali ro\'yxatdan o\'tdi', time: '2 daqiqa oldin' },
        { id: 2, title: 'To\'lov', description: 'Vali Premium sotib oldi', time: '10 daqiqa oldin' }
    ];
};

// Fix: Export missing member getAds
export const getAds = async (): Promise<Ad[]> => {
    const { data } = await supabase.from('ads').select('*');
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

// Fix: Export missing member saveAd
export const saveAd = async (ad: Ad) => {
    const payload = {
        name: ad.name,
        type: ad.type,
        content_url: ad.contentUrl,
        target_url: ad.targetUrl,
        location: ad.location,
        status: ad.status
    };
    await supabase.from('ads').insert(payload as any);
};

// Fix: Export missing member deleteAd
export const deleteAd = async (id: number) => {
    await supabase.from('ads').delete().eq('id', id);
};

// Fix: Export missing member incrementAdView
export const incrementAdView = async (id: number) => {
    await supabase.rpc('increment_ad_view', { ad_id: id });
};

// Fix: Export missing member uploadFile
export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const path = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
};

// Fix: Export missing member uploadPoster
export const uploadPoster = async (file: File) => uploadFile(file, 'posters');
// Fix: Export missing member uploadVideo
export const uploadVideo = async (file: File) => uploadFile(file, 'videos');

// Fix: Export missing member startFreeTrial
export const startFreeTrial = async (userId: string): Promise<string> => {
    const startTime = new Date().toISOString();
    await supabase.from('profiles').update({ free_trial_started_at: startTime } as any).eq('id', userId);
    return startTime;
};

// Fix: Export missing member updateUserWatchTime
export const updateUserWatchTime = async (userId: string, seconds: number) => {
    await supabase.rpc('update_watch_time', { u_id: userId, sec: seconds });
};

// Fix: Export missing member getUserTransactions
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as Transaction[];
};

// Fix: Export missing member getAllUsers
export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('profiles').select('*');
    return (data || []).map(mapProfile);
};

// Fix: Export missing member deleteUser
export const deleteUser = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
};

// Fix: Added missing registration and device logic
export const logDeviceLogin = async (userId: string, deviceId: string) => {
    await supabase.rpc('log_device_login', { u_id: userId, d_id: deviceId });
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    const { data, error } = await supabase.rpc('check_registration_limit', { d_id: deviceId });
    if (error) throw error;
    return { count: data };
};

export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
};

export const updateUserEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
};
