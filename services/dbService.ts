
import { supabase } from './supabaseClient';
import { 
    UserProfile, Movie, Episode, FandubChannel, FandubUpload, FandubStory, Ad, 
    ATCWallet, ATCTransaction, ContestTask, QuizQuestion, ContestAd,
    ArkWallet, ArkMarketData, ArkAd, ArkQuiz, ArkWithdrawal, ArkSchedule,
    SocialLink, PaymentRequestDB, UserDevice, Promocode, SupportTicket, TicketMessage, News, Transaction, ShopProduct, ShopWallet, ShopOrder
} from '../types';

// --- FANDUB CHANNEL & STORIES ---

export const getFandubChannels = async (currentUserId?: string): Promise<FandubChannel[]> => {
    const { data } = await supabase.from('fandub_channels').select('*').order('subscriber_count', { ascending: false });
    if (currentUserId && data) {
        const { data: follows } = await supabase.from('fandub_follows').select('channel_id').eq('user_id', currentUserId);
        const followedIds = new Set((follows || []).map(f => f.channel_id));
        return data.map(ch => ({ ...ch, is_following: followedIds.has(ch.id) }));
    }
    return data || [];
};

export const getActiveStories = async (): Promise<FandubStory[]> => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
        .from('fandub_stories')
        .select('*, profiles(username, avatar_url)')
        .gt('created_at', yesterday)
        .order('created_at', { ascending: false });
    return data || [];
};

export const createFandubStory = async (story: Partial<FandubStory>) => {
    const { error } = await supabase.from('fandub_stories').insert(story);
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

// --- FANDUB PROJECTS & MODERATION ---

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

// --- GENERAL SERVICES ---

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

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data as UserProfile;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
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
        rating: 5.0,
        is_fandub: true,
        channel_id: m.channel_id
    }));
    return [...officialMovies, ...fandubMovies] as Movie[];
};

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

export const getFandubUploads = async (userId: string): Promise<FandubUpload[]> => {
    const { data } = await supabase.from('fandub_uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as FandubUpload[];
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

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('saved_movies').select('movies(*)').eq('user_id', userId);
    return (data || []).map((item: any) => item.movies) as Movie[];
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    return count || 0;
};

export const getAdminNotificationCounts = async () => {
    const { data } = await supabase.rpc('get_admin_counts');
    return {
        financials: data?.payment_pending || 0,
        support: data?.tickets_open || 0,
        fandub: data?.fandub_pending || 0
    };
};

/** 
 * Added missing functions based on component errors 
 */

export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
  const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

export const getContestSettings = async () => {
  const { data } = await supabase.from('contest_settings').select('*');
  const settings: Record<string, any> = {};
  (data || []).forEach(s => settings[s.key] = s.value);
  return settings;
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
  const { data } = await supabase.from('contest_tasks').select('*').eq('is_active', true);
  return data || [];
};

export const claimATCReward = async (userId: string, amount: number, type: string, description: string) => {
  await supabase.rpc('claim_atc_reward', { u_id: userId, amt: amount, t: type, desc: description });
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
  await supabase.rpc('convert_atc_to_uzs', { u_id: userId, atc_amt: amount, ex_rate: rate });
};

export const getQuizQuestions = async (count: number): Promise<QuizQuestion[]> => {
  const { data } = await supabase.from('quiz_questions').select('*').limit(count);
  return data || [];
};

export const rewardExtraSpin = async (userId: string, amount: number) => {
  await supabase.rpc('reward_extra_spin', { u_id: userId, amt: amount });
};

export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
  const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
  return data as ATCWallet;
};

export const getContestAds = async (): Promise<ContestAd[]> => {
  const { data } = await supabase.from('contest_ads').select('*').eq('is_active', true);
  return data || [];
};

export const recordTsPaySuccess = async (userId: string, amount: number, transactionId: number) => {
  await supabase.from('tspay_logs').insert({ user_id: userId, amount, transaction_id: transactionId, status: 'success' });
  await supabase.rpc('add_balance', { u_id: userId, amt: amount });
};

export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
  const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
  return data as ArkWallet;
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
  const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
  return data || [];
};

export const requestArkWithdrawal = async (userId: string, amount: number, card: string, holder: string) => {
  await supabase.from('ark_withdrawals').insert({ user_id: userId, amount_ark: amount, card_number: card, card_holder: holder, status: 'pending' });
};

export const getArkSettings = async () => {
  const { data } = await supabase.from('ark_settings').select('*');
  const settings: Record<string, any> = {};
  (data || []).forEach(s => settings[s.key] = s.value);
  return settings;
};

export const getArkAds = async (): Promise<ArkAd[]> => {
  const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true);
  return data || [];
};

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
  const { data } = await supabase.from('ark_quizzes').select('*');
  return data || [];
};

export const recordArkSpinResult = async (userId: string, prize: any) => {
  await supabase.rpc('record_ark_spin', { u_id: userId, prize_data: prize });
};

export const rewardArkSpins = async (userId: string, amount: number) => {
  await supabase.rpc('add_ark_spins', { u_id: userId, amt: amount });
};

export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
  await supabase.rpc('claim_ark_ad_reward', { u_id: userId, amt: amount, ad_title: title });
};

export const createPaymentRequest = async (userId: string, amount: number, url: string) => {
  await supabase.from('payment_requests').insert({ user_id: userId, amount, screenshot_url: url, status: 'pending' });
};

export const getBroadcasts = async (): Promise<any[]> => {
  const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const createBroadcast = async (broadcast: any) => {
  await supabase.from('broadcasts').insert(broadcast);
};

export const deleteBroadcast = async (id: number) => {
  await supabase.from('broadcasts').delete().eq('id', id);
};

export const updateArkSettings = async (key: string, value: any) => {
  await supabase.from('ark_settings').upsert({ key, value });
};

export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
  const { data } = await supabase.from('ark_withdrawals').select('*, profiles(*)').order('created_at', { ascending: false });
  return data || [];
};

export const approveArkWithdrawal = async (id: number) => {
  await supabase.from('ark_withdrawals').update({ status: 'approved' }).eq('id', id);
};

export const updateContestSetting = async (key: string, value: any) => {
  await supabase.from('contest_settings').upsert({ key, value });
};

export const createContestTask = async (task: any) => {
  await supabase.from('contest_tasks').insert(task);
};

export const deleteContestTask = async (id: number) => {
  await supabase.from('contest_tasks').delete().eq('id', id);
};

export const createContestAd = async (ad: any) => {
  await supabase.from('contest_ads').insert(ad);
};

export const deleteContestAd = async (id: number) => {
  await supabase.from('contest_ads').delete().eq('id', id);
};

export const getSocialLinks = async (): Promise<SocialLink[]> => {
  const { data } = await supabase.from('social_links').select('*');
  return data || [];
};

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
  const { data } = await supabase.from('payment_requests').select('*, profiles(*)').order('created_at', { ascending: false });
  return data || [];
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
  await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', requestId);
  await supabase.rpc('add_balance', { u_id: userId, amt: amount });
};

export const rejectPaymentRequest = async (requestId: number) => {
  await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
};

export const getPremiumUsers = async () => {
  const { data } = await supabase.from('profiles').select('*').gt('balance', 0);
  return data || [];
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', desc: string) => {
  const finalAmount = type === 'add' ? amount : -amount;
  await supabase.rpc('admin_adjust_balance', { u_id: userId, amt: finalAmount, description: desc });
};

export const getUserByEmail = async (email: string) => {
  const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  return data;
};

export const giveGlobalBonus = async (amount: number, desc: string) => {
  const { data } = await supabase.rpc('give_global_bonus', { amt: amount, description: desc });
  return data;
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
  const { data } = await supabase.from('watch_history').select('movies(*)').eq('user_id', userId).order('watched_at', { ascending: false });
  return (data || []).map((item: any) => item.movies) as Movie[];
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
  const { data } = await supabase.from('user_devices').select('*').eq('user_id', userId);
  return data || [];
};

export const getPromocodes = async (): Promise<Promocode[]> => {
  const { data } = await supabase.from('promocodes').select('*');
  return data || [];
};

export const savePromocode = async (promo: Promocode) => {
  await supabase.from('promocodes').insert(promo);
};

export const deletePromocode = async (id: number) => {
  await supabase.from('promocodes').delete().eq('id', id);
};

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
  const { data } = await supabase.from('movies').select('*').ilike('title', `%${query}%`).eq('is_archived', false);
  return data || [];
};

export const getAdminPin = async (): Promise<string> => {
  const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_pin').maybeSingle();
  return data?.value || '0000';
};

export const setAdminPin = async (pin: string) => {
  await supabase.from('app_config').upsert({ key: 'admin_pin', value: pin });
};

export const getProtectedRoutes = async (): Promise<string[]> => {
  const { data } = await supabase.from('app_config').select('value').eq('key', 'protected_routes').maybeSingle();
  return data ? JSON.parse(data.value) : [];
};

export const setProtectedRoutes = async (routes: string[]) => {
  await supabase.from('app_config').upsert({ key: 'protected_routes', value: JSON.stringify(routes) });
};

export const saveRecoveryCodes = async (codes: string[]) => {
  await supabase.from('app_config').upsert({ key: 'admin_recovery_codes', value: JSON.stringify(codes) });
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
  const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').maybeSingle();
  if (!data) return false;
  const codes: string[] = JSON.parse(data.value);
  return codes.includes(code);
};

export const getRecoveryCodesStatus = async (): Promise<boolean> => {
  const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_recovery_codes').maybeSingle();
  return !!(data && JSON.parse(data.value).length > 0);
};

export const getAllSessions = async (): Promise<UserDevice[]> => {
  const { data } = await supabase.from('user_devices').select('*, profiles(*)').order('last_active', { ascending: false });
  return data || [];
};

export const toggleDeviceBlock = async (id: number, blocked: boolean) => {
  await supabase.from('user_devices').update({ is_blocked: blocked }).eq('id', id);
};

export const updateUserPassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

export const updateUserEmail = async (email: string) => {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
};

export const getAllTickets = async (): Promise<SupportTicket[]> => {
  const { data } = await supabase.from('support_tickets').select('*, profiles(*)').order('created_at', { ascending: false });
  return data || [];
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
  const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
  return data || [];
};

export const sendMessage = async (ticketId: number, senderId: string, msg: string, isAdmin: boolean) => {
  await supabase.from('ticket_messages').insert({ ticket_id: ticketId, sender_id: senderId, message: msg, is_admin: isAdmin });
};

export const getNews = async (): Promise<News[]> => {
  const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const createNews = async (title: string, content: string) => {
  await supabase.from('news').insert({ title, content });
};

export const deleteNews = async (id: number) => {
  await supabase.from('news').delete().eq('id', id);
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const deleteUser = async (id: string) => {
  await supabase.from('profiles').delete().eq('id', id);
};

export const startFreeTrial = async (userId: string) => {
  const now = new Date().toISOString();
  await supabase.from('profiles').update({ free_trial_started_at: now }).eq('id', userId);
  return now;
};

export const updateUserWatchTime = async (userId: string, seconds: number) => {
  await supabase.rpc('increment_watch_time', { u_id: userId, s: seconds });
};

export const incrementAdView = async (adId: number) => {
  await supabase.rpc('increment_ad_view', { ad_id: adId });
};

export const addSocialLink = async (link: any) => {
  await supabase.from('social_links').insert(link);
};

export const deleteSocialLink = async (id: number) => {
  await supabase.from('social_links').delete().eq('id', id);
};

export const checkAndTrackRegistration = async (deviceId: string) => {
  const { data } = await supabase.from('device_registrations').select('id').eq('device_id', deviceId).maybeSingle();
  if (data) throw new Error("Bu qurilmadan allaqachon ro'yxatdan o'tilgan.");
  await supabase.from('device_registrations').insert({ device_id: deviceId });
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
  await supabase.from('user_devices').upsert({ user_id: userId, device_id: deviceId, last_active: new Date().toISOString() });
};

export const buySubscription = async (userId: string, plan: string, price: number) => {
  await supabase.rpc('buy_subscription', { u_id: userId, p_plan: plan, p_price: price });
};

export const redeemPromocode = async (userId: string, code: string) => {
  const { data, error } = await supabase.rpc('redeem_promocode', { u_id: userId, p_code: code });
  if (error) throw error;
  return data;
};

export const createTicket = async (userId: string) => {
  const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
  if (error) throw error;
  return data;
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
  const { data } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

export const getDashboardStats = async () => {
  const { data } = await supabase.rpc('get_dashboard_stats');
  return data;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

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

export const saveAd = async (ad: Ad) => {
  const payload = {
    name: ad.name,
    type: ad.type,
    content_url: ad.contentUrl,
    target_url: ad.targetUrl,
    location: ad.location,
    status: ad.status,
    view_count: ad.view_count
  };
  await supabase.from('ads').insert(payload);
};

export const deleteAd = async (id: number) => {
  await supabase.from('ads').delete().eq('id', id);
};

export const getShopProducts = async (category: string, sortBy: string, search: string): Promise<ShopProduct[]> => {
  let query = supabase.from('shop_products').select('*').eq('is_active', true);
  if (category !== 'all') query = query.eq('category', category);
  if (search) query = query.ilike('title', `%${search}%`);
  
  if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
  else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data } = await query;
  return data || [];
};

export const getShopWallet = async (userId: string): Promise<ShopWallet | null> => {
  const { data } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
  return data as ShopWallet;
};

export const createShopPaymentRequest = async (userId: string, amount: number, url: string) => {
  await supabase.from('shop_payments').insert({ user_id: userId, amount, screenshot_url: url, status: 'pending' });
};

export const placeShopOrder = async (userId: string, productId: number, amount: number, address: string, phone: string) => {
  await supabase.rpc('place_shop_order', { u_id: userId, p_id: productId, amt: amount, addr: address, ph: phone });
};

export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
  const { data } = await supabase.from('shop_orders').select('*, shop_products(*)').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

export const getAdminShopProducts = async (): Promise<ShopProduct[]> => {
  const { data } = await supabase.from('shop_products').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const createShopProduct = async (product: any) => {
  await supabase.from('shop_products').insert(product);
};

export const giveArkGlobalBonus = async (amount: number, desc: string) => {
  const { data } = await supabase.rpc('give_ark_global_bonus', { amt: amount, description: desc });
  return data;
};

export const runArkAutopilot = async () => {
  const { data, error } = await supabase.rpc('run_ark_autopilot');
  if (error) throw error;
  return data;
};

export const toggleArkMarketStatus = async (status: string) => {
  await supabase.from('ark_settings').upsert({ key: 'game_status', value: status });
};

export const saveArkSchedule = async (schedule: ArkSchedule) => {
  await supabase.from('ark_settings').upsert({ key: 'market_schedule', value: JSON.stringify(schedule) });
};

export const createArkAd = async (ad: any) => {
  await supabase.from('ark_ads').insert(ad);
};

export const deleteArkAd = async (id: number) => {
  await supabase.from('ark_ads').delete().eq('id', id);
};

export const createArkQuiz = async (quiz: any) => {
  await supabase.from('ark_quizzes').insert(quiz);
};

export const deleteArkQuiz = async (id: number) => {
  await supabase.from('ark_quizzes').delete().eq('id', id);
};
