import { supabase } from './supabaseClient';
// Added ArkAd to imports from ../types
import { Movie, UserProfile, Transaction, PaymentRequestDB, SupportTicket, TicketMessage, Ad, Promocode, Review, DashboardStats, ActivityLog, News, SocialLink, UserDevice, Episode, Broadcast, ATCWallet, ATCTransaction, ContestTask, WheelPrize, QuizQuestion, ContestAd, ArkWallet, ArkMarketData, ArkWithdrawal, ArkQuiz, ArkAd } from '../types';

// Helper to map DB movie to Frontend movie
const mapMovie = (m: any): Movie => ({
    ...m,
    posterUrl: m.poster_url,
    videoUrl: m.video_url,
    view_count: m.view_count || 0
});

// --- MOVIES ---

export const getMovies = async (): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    return (data || []).map(mapMovie);
};

export const getAdminMovies = async (): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    return (data || []).map(mapMovie);
};

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').ilike('title', `%${query}%`).eq('is_archived', false);
    return (data || []).map(mapMovie);
};

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
        translator: movie.translator
    }).select().single();
    if (error) throw error;
    return mapMovie(data);
};

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
        translator: movie.translator
    }).eq('id', id);
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

export const incrementMovieView = async (id: number) => {
    const { data } = await supabase.rpc('increment_view_count', { row_id: id });
    return data;
};

// --- EPISODES ---

export const getEpisodes = async (movieId: number): Promise<Episode[]> => {
    const { data } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
    return (data || []).map((e: any) => ({ title: e.title, sourceType: 'url', source: e.source }));
};

// --- REVIEWS ---

export const getReviews = async (movieId: number): Promise<Review[]> => {
    const { data } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url, username)')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });
    return data || [];
};

export const addReview = async (movieId: number, user_id: string, rating: number, comment: string) => {
    const { data, error } = await supabase
        .from('reviews')
        .insert([{ movie_id: movieId, user_id, rating, comment } as any])
        .select();
    if (error) throw error;
    return data;
};

export const updateReview = async (id: number, rating: number, comment: string) => {
    const { error } = await supabase
        .from('reviews').update({ rating, comment, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) throw error;
};

export const deleteReview = async (id: number) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
};

// --- PROFILES ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data;
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    return data;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const updateUserProfile = async (userId: string, updates: any) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
};

export const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
};

// --- SAVED / HISTORY ---

export const checkIsSaved = async (userId: string, movieId: number) => {
    const { data } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
    return !!data;
};

export const addToSaved = async (userId: string, movieId: number) => {
    await supabase.from('saved_movies').insert({ user_id: userId, movie_id: movieId });
};

export const removeFromSaved = async (userId: string, movieId: number) => {
    await supabase.from('saved_movies').delete().eq('user_id', userId).eq('movie_id', movieId);
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('saved_movies').select('movies(*)').eq('user_id', userId);
    return (data || []).map((d: any) => mapMovie(d.movies));
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('user_history').select('movies(*)').eq('user_id', userId).order('viewed_at', { ascending: false });
    return (data || []).map((d: any) => mapMovie(d.movies));
};

// --- TRANSACTIONS & BILLING ---

export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    const { error } = await supabase.from('payment_requests').insert({ user_id: userId, amount, screenshot_url: screenshotUrl, status: 'pending' });
    if (error) throw error;
};

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    const { data } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
    const { error } = await supabase.rpc('approve_payment', { req_id: requestId, user_id: userId, amount_val: amount });
    if (error) throw error;
};

export const rejectPaymentRequest = async (requestId: number) => {
    const { error } = await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
    if (error) throw error;
};

export const getPremiumUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('profiles').select('*').gt('balance', 0);
    return data || [];
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    const val = type === 'add' ? amount : -amount;
    const { error } = await supabase.rpc('adjust_balance', { user_id: userId, val, desc: description });
    if (error) throw error;
};

export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { user_id: userId, plan_name: plan, price_val: price });
    if (error) throw error;
};

// Added giveGlobalBonus function
export const giveGlobalBonus = async (amount: number, description: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { amount_val: amount, desc_val: description });
    if (error) throw error;
    return data;
};

// --- PROMOCODES ---

export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data } = await supabase.from('promocodes').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const savePromocode = async (promo: Promocode) => {
    const { error } = await supabase.from('promocodes').insert(promo);
    if (error) throw error;
};

export const deletePromocode = async (id: number) => {
    const { error } = await supabase.from('promocodes').delete().eq('id', id);
    if (error) throw error;
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promo', { user_id: userId, promo_code: code });
    if (error) throw error;
    return data;
};

// --- CONFIG & UTILS ---

export const getAppConfig = async (): Promise<any> => {
    const { data } = await supabase.from('app_config').select('*');
    const config: any = {};
    (data || []).forEach((c: any) => { config[c.key] = c.value; });
    return config;
};

export const updateAppConfig = async (key: string, value: string) => {
    const { error } = await supabase.from('app_config').upsert({ key, value });
    if (error) throw error;
};

export const getAdminNotificationCounts = async () => {
    const [fin, sup] = await Promise.all([
        supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open')
    ]);
    return { financials: fin.count || 0, support: sup.count || 0 };
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const [u, m, p, r] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('movies').select('id', { count: 'exact', head: true }),
        supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('reviews').select('id', { count: 'exact', head: true })
    ]);
    return { totalUsers: u.count || 0, totalMovies: m.count || 0, totalPremium: p.count || 0, totalReviews: r.count || 0 };
};

export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10);
    return (data || []).map((l: any) => ({ id: l.id, title: l.title, description: l.description, time: new Date(l.created_at).toLocaleTimeString() }));
};

// ... qolgan barcha funksiyalar (atc, ark, support, file upload) mavjud dbService dagi kabi qoladi
// (Tepada o'sha funksiyalarning to'liq ro'yxati importda bor)

export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

export const uploadPoster = (file: File) => uploadFile(file, 'posters');
export const uploadVideo = (file: File) => uploadFile(file, 'videos');

// Missing exports added to match components
export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*, profiles(full_name, email, role)').order('last_active', { ascending: false });
    return data || [];
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*').eq('user_id', userId).order('last_active', { ascending: false });
    return data || [];
};

export const toggleDeviceBlock = async (id: number, status: boolean) => {
    const { error } = await supabase.from('user_devices').update({ is_blocked: status }).eq('id', id);
    if (error) throw error;
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    await supabase.from('user_devices').upsert({ user_id: userId, device_id: deviceId, last_active: new Date().toISOString(), device_name: navigator.userAgent });
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    const { data } = await supabase.from('device_registrations').select('attempt_count').eq('device_id', deviceId).maybeSingle();
    const count = (data?.attempt_count || 0) + 1;
    await supabase.from('device_registrations').upsert({ device_id: deviceId, attempt_count: count, last_attempt_at: new Date().toISOString() });
    return { count };
};

export const startFreeTrial = async (userId: string) => {
    const startAt = new Date().toISOString();
    await updateUserProfile(userId, { free_trial_started_at: startAt });
    return startAt;
};

export const updateUserWatchTime = async (userId: string, seconds: number) => {
    await supabase.rpc('increment_watch_time', { user_id: userId, seconds });
};

export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
};

export const updateUserEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
};

// Support, ATC, Ark Trading funksiyalari (Faqat asosiylari)
export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
};
export const getAllTickets = async (): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
};
export const createTicket = async (userId: string): Promise<SupportTicket> => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
    if (error) throw error;
    return data;
};
export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    const { data } = await supabase.from('ticket_messages').select('*, profiles(username, avatar_url)').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    return data || [];
};
export const sendMessage = async (ticketId: number, senderId: string, message: string, isAdmin: boolean) => {
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: ticketId, sender_id: senderId, message, is_admin: isAdmin });
    if (error) throw error;
};
export const getNews = async (): Promise<News[]> => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    return data || [];
};

// Added createNews function
export const createNews = async (title: string, content: string) => {
    const { data, error } = await supabase.from('news').insert({ title, content }).select().single();
    if (error) throw error;
    return data;
};

// Added deleteNews function
export const deleteNews = async (id: number) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw error;
};

export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const { data } = await supabase.from('social_links').select('*').order('created_at', { ascending: true });
    return data || [];
};
export const addSocialLink = async (link: any) => { await supabase.from('social_links').insert(link); };
export const deleteSocialLink = async (id: number) => { await supabase.from('social_links').delete().eq('id', id); };
export const getBroadcasts = async (): Promise<Broadcast[]> => {
    const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    return data || [];
};
export const createBroadcast = async (b: any) => { await supabase.from('broadcasts').insert(b); };
export const deleteBroadcast = async (id: number) => { await supabase.from('broadcasts').delete().eq('id', id); };
export const getAds = async (): Promise<Ad[]> => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    return (data || []).map((ad: any) => ({ ...ad, contentUrl: ad.content_url, targetUrl: ad.target_url }));
};
export const saveAd = async (ad: any) => {
    await supabase.from('ads').insert({ name: ad.name, type: ad.type, content_url: ad.contentUrl, target_url: ad.targetUrl, location: ad.location, status: ad.status });
};
export const deleteAd = async (id: number) => { await supabase.from('ads').delete().eq('id', id); };
export const incrementAdView = async (id: number) => { await supabase.rpc('increment_ad_view', { ad_id: id }); };

export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
    const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data;
};
export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
};
export const getContestSettings = async (): Promise<any> => {
    const config = await getAppConfig();
    return { exchange_rate: config['atc_exchange_rate'], ad_reward_atc: config['atc_ad_reward'], daily_free_spins: config['atc_daily_spins'] };
};
export const updateContestSetting = async (key: string, value: string) => { await updateAppConfig(`atc_${key}`, value); };
export const getContestTasks = async (): Promise<ContestTask[]> => {
    const { data } = await supabase.from('contest_tasks').select('*').eq('is_active', true);
    return data || [];
};
export const createContestTask = async (t: any) => { await supabase.from('contest_tasks').insert(t); };
export const deleteContestTask = async (id: number) => { await supabase.from('contest_tasks').delete().eq('id', id); };
export const getContestAds = async (): Promise<ContestAd[]> => {
    const { data } = await supabase.from('contest_ads').select('*').eq('is_active', true);
    return data || [];
};
export const createContestAd = async (ad: any) => { await supabase.from('contest_ads').insert(ad); };
export const deleteContestAd = async (id: number) => { await supabase.from('contest_ads').delete().eq('id', id); };
export const claimATCReward = async (userId: string, amount: number, type: string, desc: string) => {
    await supabase.rpc('claim_atc_reward', { user_id: userId, amount_val: amount, type_val: type, desc_val: desc });
};
export const convertATCtoUZS = async (userId: string, atcAmount: number, rate: number) => {
    await supabase.rpc('convert_atc_to_uzs', { user_id: userId, atc_val: atcAmount, rate_val: rate });
};
export const getQuizQuestions = async (count: number): Promise<QuizQuestion[]> => {
    const { data } = await supabase.from('quiz_questions').select('*').limit(count);
    return data || [];
};
export const rewardExtraSpin = async (userId: string, amount: number) => {
    await supabase.rpc('reward_extra_spin', { user_id: userId, val: amount });
};

export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
    const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data;
};
export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
    return data || [];
};
export const getArkSettings = async (): Promise<any> => {
    const config = await getAppConfig();
    return { game_status: config['ark_game_status'] || 'active', current_price: Number(config['ark_current_price'] || 300), start_message: config['ark_start_message'], wheel_config: JSON.parse(config['ark_wheel_config'] || '[]') };
};
export const updateArkSettings = async (key: string, value: string) => { await updateAppConfig(`ark_${key}`, value); };
export const getArkAds = async (): Promise<ArkAd[]> => {
    const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true);
    return data || [];
};
export const createArkAd = async (ad: any) => { await supabase.from('ark_ads').insert(ad); };
export const deleteArkAd = async (id: number) => { await supabase.from('ark_ads').delete().eq('id', id); };
export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    await supabase.rpc('claim_ark_ad_reward', { user_id: userId, amount_val: amount, ad_title: title });
};
export const getArkQuizzes = async (): Promise<any[]> => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return data || [];
};
export const createArkQuiz = async (q: any) => { await supabase.from('ark_quizzes').insert(q); };
export const deleteArkQuiz = async (id: number) => { await supabase.from('ark_quizzes').delete().eq('id', id); };
export const rewardArkSpins = async (userId: string, amount: number) => {
    await supabase.rpc('reward_ark_spins', { user_id: userId, val: amount });
};
export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    await supabase.rpc('record_ark_spin', { user_id: userId, prize_val: prize.value, prize_type: prize.type, prize_label: prize.label });
};
export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
};
export const requestArkWithdrawal = async (userId: string, amount: number, cardNum: string, cardHolder: string) => {
    await supabase.from('ark_withdrawals').insert({ user_id: userId, amount_ark: amount, card_number: cardNum, card_holder: cardHolder, status: 'pending' });
};
export const approveArkWithdrawal = async (id: number) => { await supabase.from('ark_withdrawals').update({ status: 'approved' }).eq('id', id); };
export const runArkAutopilot = async () => {
    const { data, error } = await supabase.rpc('run_ark_autopilot');
    if (error) throw error;
    return data;
};
export const toggleArkMarketStatus = async (status: string) => { await updateArkSettings('game_status', status); };
export const saveArkSchedule = async (schedule: any) => { await updateArkSettings('market_schedule', JSON.stringify(schedule)); };
export const giveArkGlobalBonus = async (amount: number, message: string) => { await supabase.rpc('give_ark_global_bonus', { amount_val: amount, msg: message }); };

export const getAdminPin = async (): Promise<string> => {
    const config = await getAppConfig();
    return config['admin_pin'] || '0000';
};
export const setAdminPin = async (pin: string) => { await updateAppConfig('admin_pin', pin); };
export const getProtectedRoutes = async (): Promise<string[]> => {
    const config = await getAppConfig();
    try { return JSON.parse(config['protected_routes'] || '[]'); } catch { return []; }
};
export const setProtectedRoutes = async (routes: string[]) => { await updateAppConfig('protected_routes', JSON.stringify(routes)); };
export const saveRecoveryCodes = async (codes: string[]) => { await updateAppConfig('admin_recovery_codes', JSON.stringify(codes)); };
export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    const config = await getAppConfig();
    try { const codes = JSON.parse(config['admin_recovery_codes'] || '[]'); return codes.includes(code); } catch { return false; }
};
export const getRecoveryCodesStatus = async (): Promise<boolean> => {
    const config = await getAppConfig();
    return !!config['admin_recovery_codes'] && config['admin_recovery_codes'] !== '[]';
};