
import { supabase } from './supabaseClient';
import { 
    UserProfile, Movie, Episode, FandubChannel, FandubUpload, FandubStory, Ad,
    SocialLink, UserDevice, SupportTicket, TicketMessage, News, Transaction,
    ATCWallet, ATCTransaction, ContestTask, WheelPrize, QuizQuestion, ContestAd,
    ArkWallet, ArkMarketData, ArkAd, ArkQuiz, ArkAutopilotConfig, ArkSchedule,
    ArkWithdrawal, ShopProduct, ShopWallet, ShopOrder, Promocode, Broadcast, PaymentRequestDB,
    FandubPost, PremiumBundle
} from '../types';

// --- PROFILE & AUTH ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data as UserProfile;
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*').eq('user_id', userId).order('last_active', { ascending: false });
    return (data || []) as UserDevice[];
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
};

// --- AUTH & SECURITY LOGS ---
export const checkAndTrackRegistration = async (deviceId: string) => {
    // Basic logic to prevent multi-account registration on same device if needed
    return true;
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    const ua = navigator.userAgent;
    const { error } = await supabase.from('user_devices').upsert({
        user_id: userId,
        device_id: deviceId,
        device_name: ua,
        last_active: new Date().toISOString()
    }, { onConflict: 'user_id, device_id' });
    if (error) console.error("Device log error", error);
};

export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
};

export const updateUserEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
};

// --- MOVIES & FANDUB INTEGRATION ---
export const getMovies = async (): Promise<Movie[]> => {
    const [off, fan] = await Promise.all([
        supabase.from('movies').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
        supabase.from('fandub_uploads').select('*, fandub_channels(name)').eq('status', 'approved').eq('is_blocked', false).order('created_at', { ascending: false })
    ]);

    const official = (off.data || []).map(m => ({ 
        ...m, 
        posterUrl: m.posterUrl || m.poster_url,
        videoUrl: m.videoUrl || m.video_url,
        is_fandub: false 
    }));
    
    const fandub = (fan.data || []).map(m => ({
        id: m.id,
        title: m.title,
        year: m.year,
        plot: m.description,
        posterUrl: m.poster_url,
        videoUrl: m.video_url,
        genre: m.genre,
        language: 'JP/UZ',
        quality: 'HD',
        rating: 5.0,
        is_fandub: true,
        channel_id: m.channel_id,
        translator: m.fandub_channels?.name || 'Fandub',
        status: 'completed',
        access_type: m.access_type,
        created_at: m.created_at,
        is_blocked: m.is_blocked
    }));

    const merged = [...official, ...fandub].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
    });

    return merged as Movie[];
};

export const getAdminMovies = async (): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    return (data || []).map(m => ({ ...m, posterUrl: m.posterUrl || m.poster_url, videoUrl: m.videoUrl || m.video_url })) as Movie[];
};

export const getMovieEpisodes = async (movieId: number): Promise<Episode[]> => {
    const { data: fandubMovie } = await supabase.from('fandub_uploads').select('episodes').eq('id', movieId).maybeSingle();
    if (fandubMovie && fandubMovie.episodes) return fandubMovie.episodes as Episode[];
    const { data } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
    return data || [];
};

export const addMovieToDB = async (movie: any) => {
    const { data, error } = await supabase.from('movies').insert(movie).select().single();
    if (error) throw error;
    return data;
};

export const updateMovieInDB = async (id: number, updates: any) => {
    const { error } = await supabase.from('movies').update(updates).eq('id', id);
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

// --- FANDUB MANAGEMENT (ADMIN & USER) ---
export const deleteFandubUpload = async (id: number) => {
    const { error } = await supabase.from('fandub_uploads').delete().eq('id', id);
    if (error) throw error;
};

export const updateFandubUpload = async (id: number, updates: any) => {
    const { error } = await supabase.from('fandub_uploads').update(updates).eq('id', id);
    if (error) throw error;
};

export const toggleBlockFandub = async (id: number, block: boolean) => {
    const { error } = await supabase.from('fandub_uploads').update({ is_blocked: block }).eq('id', id);
    if (error) throw error;
};

// --- COMMUNITY POSTS ---
export const getFandubPosts = async (channelId: string): Promise<FandubPost[]> => {
    const { data } = await supabase.from('fandub_posts').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });
    return data || [];
};

export const createFandubPost = async (post: Partial<FandubPost>) => {
    const { error } = await supabase.from('fandub_posts').insert(post);
    if (error) throw error;
};

export const deleteFandubPost = async (id: number) => {
    const { error } = await supabase.from('fandub_posts').delete().eq('id', id);
    if (error) throw error;
};

// --- PREMIUM BUNDLES (YAKKA PREMIUM) ---
export const getPremiumBundles = async (): Promise<PremiumBundle[]> => {
    const { data } = await supabase.from('premium_bundles').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const savePremiumBundle = async (bundle: Partial<PremiumBundle>) => {
    const { error } = await supabase.from('premium_bundles').upsert(bundle);
    if (error) throw error;
};

export const deletePremiumBundle = async (id: number) => {
    const { error } = await supabase.from('premium_bundles').delete().eq('id', id);
    if (error) throw error;
};

// --- NOTIFICATIONS ---
export const getUserNotifications = async (userId: string) => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    return data || [];
};

export const markNotificationsRead = async (userId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
};

// --- FILE UPLOADS ---
export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2,9)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
};
export const uploadPoster = (file: File) => uploadFile(file, 'posters');
export const uploadVideo = (file: File) => uploadFile(file, 'videos');

// --- FANDUB CHANNELS ---
export const getFandubChannels = async (userId?: string): Promise<FandubChannel[]> => {
    const { data } = await supabase.from('fandub_channels').select('*').order('subscriber_count', { ascending: false });
    if (userId && data) {
        const { data: follows } = await supabase.from('fandub_follows').select('channel_id').eq('user_id', userId);
        const followedIds = new Set((follows || []).map(f => f.channel_id));
        return data.map(ch => ({ ...ch, is_following: followedIds.has(ch.id) }));
    }
    return data || [];
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

export const createFandubStory = async (story: Partial<FandubStory>) => {
    const { error } = await supabase.from('fandub_stories').insert(story);
    if (error) throw error;
};

export const getFandubUploads = async (userId: string): Promise<FandubUpload[]> => {
    const { data } = await supabase.from('fandub_uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const getPendingFandubUploads = async (): Promise<FandubUpload[]> => {
    const { data } = await supabase.from('fandub_uploads').select('*, profiles(full_name, email), fandub_channels(name)').order('created_at', { ascending: false });
    return data || [];
};

export const approveFandubUpload = async (id: number) => {
    const { error } = await supabase.from('fandub_uploads').update({ status: 'approved' }).eq('id', id);
    if (error) throw error;
};

export const rejectFandubUpload = async (id: number, comment: string) => {
    const { error } = await supabase.from('fandub_uploads').update({ status: 'rejected', admin_comment: comment }).eq('id', id);
    if (error) throw error;
};

// --- SYSTEM CONFIG ---
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

// --- ADMIN STATS ---
export const getDashboardStats = async () => {
    const { data } = await supabase.rpc('get_dashboard_stats');
    return data;
};

export const getUnreadNotificationsCount = async (userId: string) => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    return count || 0;
};

export const getAdminNotificationCounts = async () => {
    const { data } = await supabase.rpc('get_admin_counts');
    return { financials: data?.payment_pending || 0, support: data?.tickets_open || 0, fandub: data?.fandub_pending || 0 };
};

// --- FOLLOWS & STORIES ---
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

export const getActiveStories = async (): Promise<FandubStory[]> => {
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data } = await supabase.from('fandub_stories').select('*, profiles(username, avatar_url)').gt('created_at', yesterday);
    return data || [];
};

// --- SAVES & HISTORY ---
export const isMovieSaved = async (userId: string, movieId: number): Promise<boolean> => {
    const { data } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
    return !!data;
};

export const toggleSaveMovie = async (userId: string, movieId: number): Promise<boolean> => {
    const { data: existing } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
    if (existing) {
        await supabase.from('saved_movies').delete().eq('id', existing.id);
        return false;
    } else {
        await supabase.from('saved_movies').insert({ user_id: userId, movie_id: movieId });
        return true;
    }
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('user_history').select('*, movies(*)').eq('user_id', userId).order('viewed_at', { ascending: false });
    return (data || []).map((h: any) => h.movies).filter(Boolean) as Movie[];
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('saved_movies').select('*, movies(*)').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map((s: any) => s.movies).filter(Boolean) as Movie[];
};

// --- SEARCH ---
export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').or(`title.ilike.%${query}%,genre.ilike.%${query}%,tags.ilike.%${query}%`).eq('is_archived', false);
    return (data || []) as Movie[];
};

// --- REVIEWS ---
export const getMovieReviews = async (movieId: number) => {
    const { data } = await supabase.from('reviews').select('*, profiles(full_name, avatar_url, role)').eq('movie_id', movieId).order('created_at', { ascending: false });
    return data || [];
};

export const addReview = async (movieId: number, userId: string, rating: number, comment: string) => {
    const { error } = await supabase.from('reviews').insert({ movie_id: movieId, user_id: userId, rating, comment });
    if (error) throw error;
};

export const deleteReview = async (reviewId: number) => {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
};

export const updateReview = async (reviewId: number, comment: string) => {
    const { error } = await supabase.from('reviews').update({ comment }).eq('id', reviewId);
    if (error) throw error;
};

// --- BILLING & SUBSCRIPTIONS ---
export const buySubscription = async (userId: string, plan: string, price: number) => {
    const { error } = await supabase.rpc('buy_subscription', { u_id: userId, p_name: plan, cost: price });
    if (error) throw error;
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { u_id: userId, c_str: code });
    if (error) throw error;
    return data;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as Transaction[];
};

export const recordTsPaySuccess = async (userId: string, amount: number, orderId: number) => {
    await supabase.rpc('record_tspay_success', { u_id: userId, amt: amount, o_id: orderId });
};

// --- SUPPORT ---
export const getNews = async (): Promise<News[]> => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
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

export const getAllTickets = async (): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
    return data || [];
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    return data || [];
};

export const createTicket = async (userId: string) => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
    if (error) throw error;
    return data;
};

export const sendMessage = async (ticketId: number, userId: string, message: string, isAdmin: boolean) => {
    await supabase.from('ticket_messages').insert({ ticket_id: ticketId, user_id: userId, message, is_admin: isAdmin });
};

// --- ATC CONCURS ---
export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
    const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ATCWallet;
};

export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as ATCTransaction[];
};

export const getContestSettings = async () => {
    const { data } = await supabase.from('contest_settings').select('*');
    const settings: any = {};
    (data || []).forEach(i => settings[i.key] = i.value);
    return settings;
};

export const updateContestSetting = async (key: string, value: string) => {
    await supabase.from('contest_settings').upsert({ key, value });
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
    const { data } = await supabase.from('contest_tasks').select('*');
    return data || [];
};

export const createContestTask = async (task: Partial<ContestTask>) => {
    await supabase.from('contest_tasks').insert(task);
};

export const deleteContestTask = async (id: number) => {
    await supabase.from('contest_tasks').delete().eq('id', id);
};

export const claimATCReward = async (userId: string, amount: number, type: string, description: string) => {
    await supabase.rpc('claim_atc_reward', { u_id: userId, amt: amount, r_type: type, desc: description });
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    await supabase.rpc('convert_atc_to_uzs', { u_id: userId, amt: amount, r_rate: rate });
};

export const getQuizQuestions = async (count: number): Promise<QuizQuestion[]> => {
    const { data } = await supabase.from('quiz_questions').select('*').limit(count);
    return data || [];
};

export const rewardExtraSpin = async (userId: string, amount: number) => {
    await supabase.rpc('reward_extra_spin', { u_id: userId, amt: amount });
};

export const getContestAds = async (): Promise<ContestAd[]> => {
    const { data } = await supabase.from('contest_ads').select('*');
    return data || [];
};

export const createContestAd = async (ad: Partial<ContestAd>) => {
    await supabase.from('contest_ads').insert(ad);
};

export const deleteContestAd = async (id: number) => {
    await supabase.from('contest_ads').delete().eq('id', id);
};

// --- ARK TRADING (CASH CONTEST) ---
export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
    const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ArkWallet;
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
    return data || [];
};

export const getArkSettings = async () => {
    const { data } = await supabase.from('ark_settings').select('*');
    const settings: any = {};
    (data || []).forEach(i => settings[i.key] = i.value);
    return settings;
};

export const updateArkSettings = async (key: string, value: string) => {
    await supabase.from('ark_settings').upsert({ key, value });
};

export const requestArkWithdrawal = async (userId: string, amount: number, card: string, holder: string) => {
    await supabase.from('ark_withdrawals').insert({ user_id: userId, amount_ark: amount, card_number: card, card_holder: holder, status: 'pending' });
};

export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
};

export const approveArkWithdrawal = async (id: number) => {
    await supabase.from('ark_withdrawals').update({ status: 'approved' }).eq('id', id);
};

export const getArkAds = async (): Promise<ArkAd[]> => {
    const { data } = await supabase.from('ark_ads').select('*');
    return data || [];
};

export const createArkAd = async (ad: Partial<ArkAd>) => {
    await supabase.from('ark_ads').insert(ad);
};

export const deleteArkAd = async (id: number) => {
    await supabase.from('ark_ads').delete().eq('id', id);
};

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return data || [];
};

export const createArkQuiz = async (quiz: Partial<ArkQuiz>) => {
    await supabase.from('ark_quizzes').insert(quiz);
};

export const deleteArkQuiz = async (id: number) => {
    await supabase.from('ark_quizzes').delete().eq('id', id);
};

export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    await supabase.rpc('record_ark_spin_result', { u_id: userId, p_id: prize.id });
};

export const rewardArkSpins = async (userId: string, amount: number) => {
    await supabase.from('ark_wallets').update({ available_spins: amount }).eq('user_id', userId);
};

export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    await supabase.rpc('claim_ark_ad_reward', { u_id: userId, amt: amount, ad_title: title });
};

export const giveArkGlobalBonus = async (amount: number, message: string) => {
    await supabase.rpc('give_ark_global_bonus', { amt: amount, msg: message });
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

// --- BROADCAST ---
export const getBroadcasts = async (): Promise<Broadcast[]> => {
    const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const createBroadcast = async (bc: Partial<Broadcast>) => {
    await supabase.from('broadcasts').insert(bc);
};

export const deleteBroadcast = async (id: number) => {
    await supabase.from('broadcasts').delete().eq('id', id);
};

// --- SOCIAL LINKS ---
export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const { data } = await supabase.from('social_links').select('*');
    return data || [];
};

export const addSocialLink = async (link: Partial<SocialLink>) => {
    await supabase.from('social_links').insert(link);
};

export const deleteSocialLink = async (id: number) => {
    await supabase.from('social_links').delete().eq('id', id);
};

// --- FINANCIALS & ADMIN CONTROLS ---
export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    const { data } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
};

export const approvePaymentRequest = async (id: number, userId: string, amount: number) => {
    await supabase.rpc('approve_payment_request', { r_id: id, u_id: userId, amt: amount });
};

export const rejectPaymentRequest = async (id: number) => {
    await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', id);
};

export const getPremiumUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').gt('balance', 0);
    return data || [];
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    const finalAmt = type === 'add' ? amount : -amount;
    await supabase.rpc('admin_adjust_balance', { u_id: userId, amt: finalAmt, desc: description });
};

export const getUserByEmail = async (email: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    return data;
};

export const giveGlobalBonus = async (amount: number, description: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { amt: amount, desc: description });
    if (error) throw error;
    return data;
};

// --- PROMOCODES ---
export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data } = await supabase.from('promocodes').select('*');
    return data || [];
};

export const savePromocode = async (pc: Partial<Promocode>) => {
    await supabase.from('promocodes').insert(pc);
};

export const deletePromocode = async (id: number) => {
    await supabase.from('promocodes').delete().eq('id', id);
};

// --- SESSIONS ---
export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data } = await supabase.from('user_devices').select('*, profiles(full_name, email, role)').order('last_active', { ascending: false });
    return data || [];
};

export const toggleDeviceBlock = async (id: number, blocked: boolean) => {
    await supabase.from('user_devices').update({ is_blocked: blocked }).eq('id', id);
};

// --- SECURITY (PIN) ---
export const getAdminPin = async () => {
    const config = await getAppConfig();
    return config['admin_pin'] || '0000';
};

export const setAdminPin = async (pin: string) => {
    await updateAppConfig('admin_pin', pin);
};

export const getProtectedRoutes = async () => {
    const config = await getAppConfig();
    return JSON.parse(config['protected_routes'] || '[]');
};

export const setProtectedRoutes = async (routes: string[]) => {
    await updateAppConfig('protected_routes', JSON.stringify(routes));
};

export const saveRecoveryCodes = async (codes: string[]) => {
    await updateAppConfig('admin_recovery_codes', JSON.stringify(codes));
};

export const verifyRecoveryCode = async (code: string) => {
    const config = await getAppConfig();
    const codes: string[] = JSON.parse(config['admin_recovery_codes'] || '[]');
    return codes.includes(code);
};

export const getRecoveryCodesStatus = async () => {
    const config = await getAppConfig();
    const codes = JSON.parse(config['admin_recovery_codes'] || '[]');
    return codes.length > 0;
};

// --- ADS ---
export const getAds = async (): Promise<Ad[]> => {
    const { data } = await supabase.from('ads').select('*');
    return (data || []).map(a => ({ ...a, contentUrl: a.content_url, targetUrl: a.target_url })) as Ad[];
};

export const saveAd = async (ad: Partial<Ad>) => {
    const payload = {
        name: ad.name,
        type: ad.type,
        content_url: ad.contentUrl,
        target_url: ad.targetUrl,
        location: ad.location,
        status: ad.status
    };
    await supabase.from('ads').insert(payload);
};

export const deleteAd = async (id: number) => {
    await supabase.from('ads').delete().eq('id', id);
};

export const incrementAdView = async (id: number) => {
    await supabase.rpc('increment_ad_view', { a_id: id });
};

// --- SHOP ---
export const getShopProducts = async (category: string, sortBy: string, search: string): Promise<ShopProduct[]> => {
    let q = supabase.from('shop_products').select('*').eq('is_active', true);
    if (category !== 'all') q = q.eq('category', category);
    if (search) q = q.ilike('title', `%${search}%`);
    
    const { data } = await q;
    let list = (data || []) as ShopProduct[];
    
    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    
    return list;
};

export const getAdminShopProducts = async (): Promise<ShopProduct[]> => {
    const { data } = await supabase.from('shop_products').select('*');
    return data || [];
};

export const createShopProduct = async (p: Partial<ShopProduct>) => {
    await supabase.from('shop_products').insert(p);
};

export const getShopWallet = async (userId: string): Promise<ShopWallet | null> => {
    const { data } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
    return data as ShopWallet;
};

export const createShopPaymentRequest = async (userId: string, amount: number, url: string) => {
    await supabase.from('shop_payment_requests').insert({ user_id: userId, amount, screenshot_url: url, status: 'pending' });
};

export const placeShopOrder = async (userId: string, productId: number, amount: number, address: string, phone: string) => {
    await supabase.rpc('place_shop_order', { u_id: userId, p_id: productId, amt: amount, addr: address, ph: phone });
};

export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    const { data } = await supabase.from('shop_orders').select('*, shop_products(*)').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map(o => ({ ...o, products: o.shop_products })) as ShopOrder[];
};

// --- USERS ---
export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const deleteUser = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
};
