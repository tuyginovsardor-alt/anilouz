import { supabase } from './supabaseClient';
import { Movie, UserProfile, Transaction, PaymentRequestDB, SupportTicket, TicketMessage, Ad, Promocode, AppConfig, Review, DashboardStats, ActivityLog, News, SocialLink, UserDevice, Episode, Broadcast, ATCWallet, ATCTransaction, ContestTask, WheelPrize, QuizQuestion, ContestAd, ArkWallet, ArkMarketData, ArkWithdrawal, ArkSettings, ArkAd, ArkQuiz, ArkAutopilotConfig, ArkSchedule } from '../types';

// --- APP CONFIG (SETTINGS) SERVICES ---

export const getAppConfig = async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from('app_config').select('*');
    if (error) {
        return {};
    }
    const config: Record<string, string> = {};
    data.forEach((item: any) => {
        config[item.key] = item.value;
    });
    return config;
};

export const updateAppConfig = async (key: string, value: string) => {
    const { error } = await supabase
        .from('app_config')
        .upsert({ key, value } as any);
    
    if (error) throw error;
};

// --- SECURITY SERVICES (PIN, ROUTES & RECOVERY) ---

export const getAdminPin = async (): Promise<string> => {
    const config = await getAppConfig();
    return config['admin_pin'] || '0000';
};

export const setAdminPin = async (pin: string) => {
    await updateAppConfig('admin_pin', pin);
};

export const getProtectedRoutes = async (): Promise<string[]> => {
    const config = await getAppConfig();
    try {
        return JSON.parse(config['protected_routes'] || '[]');
    } catch {
        return [];
    }
};

export const setProtectedRoutes = async (routes: string[]) => {
    await updateAppConfig('protected_routes', JSON.stringify(routes));
};

export const saveRecoveryCodes = async (codes: string[]) => {
    await updateAppConfig('admin_recovery_codes', JSON.stringify(codes));
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    const config = await getAppConfig();
    try {
        const codes: string[] = JSON.parse(config['admin_recovery_codes'] || '[]');
        return codes.includes(code);
    } catch {
        return false;
    }
};

export const getRecoveryCodesStatus = async (): Promise<boolean> => {
    const config = await getAppConfig();
    try {
        const codes = JSON.parse(config['admin_recovery_codes'] || '[]');
        return codes.length > 0;
    } catch {
        return false;
    }
};

// --- SOCIAL LINKS SERVICES ---

export const getSocialLinks = async (): Promise<SocialLink[]> => {
    const { data, error } = await supabase.from('social_links').select('*').order('created_at', { ascending: true });
    if (error) {
        if (error.code === '42P01') return [];
        throw error;
    }
    return data || [];
};

export const addSocialLink = async (link: SocialLink) => {
    const { error } = await supabase.from('social_links').insert([{
        platform: link.platform,
        url: link.url,
        label: link.label
    } as any]);
    if (error) throw error;
};

export const deleteSocialLink = async (id: number) => {
    const { error } = await supabase.from('social_links').delete().eq('id', id);
    if (error) throw error;
};

// --- USER & DEVICE SECURITY SERVICES ---

export const checkAndTrackRegistration = async (deviceId: string): Promise<{ allowed: boolean, warning: boolean, count: number }> => {
    const { data } = await supabase
        .from('device_registrations')
        .select('attempt_count')
        .eq('device_id', deviceId)
        .maybeSingle();

    let currentCount = (data as any)?.attempt_count || 0;
    const newCount = currentCount + 1;

    await supabase
        .from('device_registrations')
        .upsert({ device_id: deviceId, attempt_count: newCount, last_attempt_at: new Date().toISOString() } as any);

    return { allowed: true, warning: newCount >= 2, count: newCount };
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    const deviceName = navigator.userAgent;
    const { data: existing } = await supabase
        .from('user_devices')
        .select('id, is_blocked')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .maybeSingle();

    if (existing && (existing as any).is_blocked) {
        throw new Error("Ushbu qurilma bloklangan. Admin bilan bog'laning.");
    }

    if (existing) {
        await supabase.from('user_devices').update({ last_active: new Date().toISOString() } as any).eq('id', (existing as any).id);
    } else {
        await supabase.from('user_devices').insert({
            user_id: userId,
            device_id: deviceId,
            device_name: deviceName,
            last_active: new Date().toISOString(),
            is_blocked: false
        } as any);
    }
};

export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data, error } = await supabase
        .from('user_devices')
        .select('*, profiles(full_name, email, role)')
        .order('last_active', { ascending: false });
    return data || [];
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });
    return data || [];
};

export const toggleDeviceBlock = async (id: number, isBlocked: boolean) => {
    await supabase.from('user_devices').update({ is_blocked: isBlocked } as any).eq('id', id);
};

// --- MOVIE SERVICES ---

export const getMovies = async (): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  return data?.map((m: any) => ({ ...m, videoUrl: m.video_url })) || [];
};

export const getAdminMovies = async (): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    return data?.map((m: any) => ({ ...m, videoUrl: m.video_url })) || [];
};

export const getEpisodes = async (movieId: number): Promise<Episode[]> => {
    const { data } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
    return (data || []).map((e: any) => ({ title: e.title, source: e.source, sourceType: 'url' }));
};

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
  const { data } = await supabase
    .from('movies')
    .select('*')
    .eq('is_archived', false)
    .or(`title.ilike.%${query}%,tags.ilike.%${query}%`);
  return data?.map((m: any) => ({ ...m, videoUrl: m.video_url })) || [];
};

export const incrementMovieView = async (id: number) => {
    const { data } = await supabase.from('movies').select('view_count').eq('id', id).single();
    if (data) {
        await supabase.from('movies').update({ view_count: ((data as any).view_count || 0) + 1 } as any).eq('id', id);
    }
};

export const addMovieToDB = async (movie: any): Promise<Movie | null> => {
  const { data, error } = await supabase.from('movies').insert([{
    title: movie.title,
    year: Number(movie.year),
    plot: movie.plot,
    posterUrl: movie.posterUrl,
    genre: movie.genre,
    tags: movie.tags,
    translator: movie.translator,
    language: movie.language || 'UZ',
    quality: movie.quality || 'HD',
    video_url: movie.videoUrl,
    status: movie.status || 'completed'
  } as any]).select().single();

  if (data && movie.episodes?.length > 0) {
      const eps = movie.episodes.map((ep: any) => ({ movie_id: (data as any).id, title: ep.title, source: ep.source }));
      await supabase.from('episodes').insert(eps as any[]);
  }
  return data ? { ...(data as any), videoUrl: (data as any).video_url } : null;
};

export const updateMovieInDB = async (id: number, movie: any) => {
    await supabase.from('movies').update({
        title: movie.title,
        year: movie.year,
        plot: movie.plot,
        posterUrl: movie.posterUrl,
        genre: movie.genre,
        tags: movie.tags,
        translator: movie.translator,
        status: movie.status,
        video_url: movie.videoUrl
    } as any).eq('id', id);

    if (movie.episodes) {
        await supabase.from('episodes').delete().eq('movie_id', id);
        if (movie.episodes.length > 0) {
            const eps = movie.episodes.map((ep: any) => ({ movie_id: id, title: ep.title, source: ep.source }));
            await supabase.from('episodes').insert(eps as any[]);
        }
    }
};

export const toggleMovieArchive = async (id: number, isArchived: boolean) => {
    await supabase.from('movies').update({ is_archived: isArchived } as any).eq('id', id);
};

export const deleteMovieFromDB = async (id: number) => {
    await supabase.from('movies').delete().eq('id', id);
};

// --- FILE UPLOAD SERVICES ---

// Fix: Added missing uploadFile function used for uploading images and videos to Supabase Storage
export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrl;
};

export const uploadPoster = (file: File) => uploadFile(file, 'posters');
export const uploadVideo = (file: File) => uploadFile(file, 'videos');

// --- WATCHLIST / SAVED MOVIES SERVICES ---

export const addToSaved = async (userId: string, movieId: number) => {
    await supabase.from('saved_movies').insert([{ user_id: userId, movie_id: movieId } as any]);
};

export const removeFromSaved = async (userId: string, movieId: number) => {
    await supabase.from('saved_movies').delete().eq('user_id', userId).eq('movie_id', movieId);
};

export const checkIsSaved = async (userId: string, movieId: number) => {
    const { data } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
    return !!data;
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data } = await supabase.from('saved_movies').select(`movies (*)`).eq('user_id', userId);
    return (data || []).map((item: any) => ({ ...item.movies, videoUrl: item.movies.video_url }));
};

// --- REVIEWS SERVICES ---

export const getReviews = async (movieId: number): Promise<Review[]> => {
    const { data } = await supabase.from('reviews').select('*, profiles(full_name, avatar_url, username)').eq('movie_id', movieId).order('created_at', { ascending: false });
    return data || [];
};

export const addReview = async (movieId: number, user_id: string, rating: number, comment: string) => {
    await supabase.from('reviews').insert([{ movie_id: movieId, user_id, rating, comment } as any]);
};

// --- USER SERVICES ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  await supabase.from('profiles').update(updates as any).eq('id', userId);
};

// Fix: Added missing deleteUser function for user management
export const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};

export const updateUserPassword = async (newPassword: string) => {
    await supabase.auth.updateUser({ password: newPassword });
};

export const updateUserEmail = async (newEmail: string) => {
    await supabase.auth.updateUser({ email: newEmail });
};

export const updateUserWatchTime = async (userId: string, secondsToAdd: number) => {
    const { data } = await supabase.from('profiles').select('total_watch_time').eq('id', userId).maybeSingle();
    if (data) {
        await supabase.from('profiles').update({ total_watch_time: ((data as any).total_watch_time || 0) + secondsToAdd } as any).eq('id', userId);
    }
};

export const startFreeTrial = async (userId: string): Promise<string> => {
    const { data } = await supabase.from('profiles').select('free_trial_started_at').eq('id', userId).single();
    if ((data as any)?.free_trial_started_at) return (data as any).free_trial_started_at;
    const now = new Date().toISOString();
    await supabase.from('profiles').update({ free_trial_started_at: now } as any).eq('id', userId);
    return now;
};

export const buySubscription = async (userId: string, planDuration: string, price: number) => {
    const { data: prof } = await supabase.from('profiles').select('balance, subscription_end_at, role').eq('id', userId).single();
    if (!prof || (prof as any).balance < price) throw new Error("Mablag' yetarli emas");

    let endDate = new Date();
    if ((prof as any).subscription_end_at && new Date((prof as any).subscription_end_at) > new Date()) {
        endDate = new Date((prof as any).subscription_end_at);
    }

    if (planDuration === '1-oy') endDate.setMonth(endDate.getMonth() + 1);
    else if (planDuration === '3-oy') endDate.setMonth(endDate.getMonth() + 3);
    else if (planDuration === '6-oy') endDate.setMonth(endDate.getMonth() + 6);
    else if (planDuration === '1-yil') endDate.setFullYear(endDate.getFullYear() + 1);

    await supabase.from('profiles').update({
        balance: (prof as any).balance - price,
        subscription_end_at: endDate.toISOString(),
        subscription_plan: planDuration,
        role: ['admin', 'owner'].includes((prof as any).role) ? (prof as any).role : 'premium'
    } as any).eq('id', userId);

    await supabase.from('transactions').insert({ user_id: userId, amount: -price, description: `Premium (${planDuration})` } as any);
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data: pr } = await supabase.from('promocodes').select('*').eq('code', code).eq('status', 'active').maybeSingle();
    if (!pr) throw new Error("Promokod yaroqsiz");
    
    await supabase.from('promocodes').update({ used_count: ((pr as any).used_count || 0) + 1 } as any).eq('id', (pr as any).id);
    return { discount: (pr as any).value, type: (pr as any).type };
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
  const { data } = await supabase.from('view_history').select(`movies (*)`).eq('user_id', userId).order('watched_at', { ascending: false });
  return (data || []).map((item: any) => ({ ...item.movies, videoUrl: item.movies.video_url }));
};

export const getUserByEmail = async (email: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    return data;
};

// --- FINANCIAL SERVICES ---

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    const { data } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
    const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).maybeSingle();
    const newBal = ((prof as any)?.balance || 0) + amount;
    await supabase.from('profiles').update({ balance: newBal } as any).eq('id', userId);
    await supabase.from('payment_requests').update({ status: 'approved' } as any).eq('id', requestId);
    await supabase.from('transactions').insert({ user_id: userId, amount: amount, description: "Hisob to'ldirildi" } as any);
};

export const rejectPaymentRequest = async (requestId: number) => {
    await supabase.from('payment_requests').update({ status: 'rejected' } as any).eq('id', requestId);
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    let newBal = (prof as any).balance || 0;
    let transAmt = type === 'add' ? amount : -amount;
    newBal += transAmt;
    await supabase.from('profiles').update({ balance: newBal } as any).eq('id', userId);
    await supabase.from('transactions').insert({ user_id: userId, amount: transAmt, description: description || "Admin amali" } as any);
};

export const giveGlobalBonus = async (amount: number, description: string) => {
    const { data: users } = await supabase.from('profiles').select('id, balance');
    if (!users) return { successCount: 0, skippedCount: 0 };
    for (const u of users) {
        await supabase.from('profiles').update({ balance: ((u as any).balance || 0) + amount } as any).eq('id', (u as any).id);
        await supabase.from('transactions').insert({ user_id: (u as any).id, amount, description } as any);
    }
    return { successCount: users.length, skippedCount: 0 };
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
  await supabase.from('payment_requests').insert([{ user_id: userId, amount, screenshot_url: screenshotUrl, status: 'pending' } as any]);
};

export const getPremiumUsers = async (): Promise<any[]> => {
    const { data } = await supabase.from('profiles').select('*').gt('balance', 0).order('balance', { ascending: false });
    return data || [];
};

// --- SUPPORT & CHAT SERVICES ---

export const getNews = async (): Promise<News[]> => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    return data || [];
}

export const createNews = async (title: string, content: string) => {
    await supabase.from('news').insert([{ title, content } as any]);
};

export const deleteNews = async (id: number) => {
    await supabase.from('news').delete().eq('id', id);
};

export const createTicket = async (userId: string): Promise<SupportTicket> => {
    const { data } = await supabase.from('support_tickets').insert([{ user_id: userId, subject: 'Murojaat', status: 'open' } as any]).select().single();
    return data;
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const getAllTickets = async (): Promise<SupportTicket[]> => {
    const { data } = await supabase.from('support_tickets').select('*, profiles(full_name, email)').order('updated_at', { ascending: false });
    return data || [];
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    const { data } = await supabase.from('ticket_messages').select('*, profiles(full_name, avatar_url)').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    return data || [];
};

export const sendMessage = async (ticketId: number, senderId: string, message: string, isAdmin: boolean) => {
    await supabase.from('ticket_messages').insert([{ ticket_id: ticketId, sender_id: senderId, message, is_admin: isAdmin } as any]);
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() } as any).eq('id', ticketId);
};

// --- ADS & PROMOCODES ---

export const getAds = async (): Promise<Ad[]> => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    return (data || []).map((ad: any) => ({
        id: ad.id, name: ad.name, type: ad.type, contentUrl: ad.content_url, targetUrl: ad.target_url, location: ad.location, status: ad.status, view_count: ad.view_count || 0
    }));
};

export const incrementAdView = async (id: number) => {
    const { data } = await supabase.from('ads').select('view_count').eq('id', id).single();
    if (data) await supabase.from('ads').update({ view_count: ((data as any).view_count || 0) + 1 } as any).eq('id', id);
};

export const saveAd = async (ad: Ad) => {
    await supabase.from('ads').insert([{ name: ad.name, type: ad.type, content_url: ad.contentUrl, target_url: ad.targetUrl, location: ad.location, status: ad.status } as any]);
};

export const deleteAd = async (id: number) => {
    await supabase.from('ads').delete().eq('id', id);
};

export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data } = await supabase.from('promocodes').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const savePromocode = async (promo: Promocode) => {
    await supabase.from('promocodes').insert([promo] as any[]);
};

export const deletePromocode = async (id: number) => {
    await supabase.from('promocodes').delete().eq('id', id);
};

// --- BROADCAST SERVICES ---

export const getBroadcasts = async (): Promise<Broadcast[]> => {
    const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const createBroadcast = async (broadcast: any) => {
    await supabase.from('broadcasts').insert([{ ...broadcast, is_active: true } as any]);
};

export const deleteBroadcast = async (id: number) => {
    await supabase.from('broadcasts').delete().eq('id', id);
};

// --- DASHBOARD STATS ---

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: m } = await supabase.from('movies').select('*', { count: 'exact', head: true });
    const { count: r } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
    const { count: p } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    return { totalUsers: u || 0, totalMovies: m || 0, totalReviews: r || 0, totalPremium: p || 0 };
};

export const getAdminNotificationCounts = async () => {
    const { count: p } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: s } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');
    return { financials: p || 0, support: s || 0 };
};

export const getRecentActivity = async (): Promise<ActivityLog[]> => [];

// --- CONTEST (ATC) SERVICES ---

export const getATCWallet = async (userId: string): Promise<ATCWallet> => {
    const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (!data) {
        const { data: nw } = await supabase.from('atc_wallets').insert([{ user_id: userId, balance: 0 } as any]).select().single();
        return nw;
    }
    return data;
};

export const getProfileWithWallet = async (userId: string) => {
    const p = await getUserProfile(userId);
    const w = await getATCWallet(userId);
    return { ...p, atc_balance: w.balance, atc_converted: w.total_converted, atc_earned: w.total_earned, active_days: w.active_days };
};

export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const getContestSettings = async () => {
    const { data } = await supabase.from('contest_settings').select('*');
    const s: any = {};
    data?.forEach((i: any) => { try { s[i.key] = JSON.parse(i.value); } catch { s[i.key] = i.value; } });
    return s;
};

export const updateContestSetting = async (key: string, value: any) => {
    await supabase.from('contest_settings').upsert({ key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) } as any);
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
    const { data } = await supabase.from('contest_tasks').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const createContestTask = async (task: any) => {
    await supabase.from('contest_tasks').insert([{ ...task, is_active: true } as any]);
};

export const deleteContestTask = async (id: number) => {
    await supabase.from('contest_tasks').delete().eq('id', id);
};

export const claimATCReward = async (userId: string, amount: number, type: string, description: string) => {
    const { data: w } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).single();
    if (!w) return;
    const up: any = { balance: (w as any).balance + amount, total_earned: (w as any).total_earned + amount };
    if (type === 'spin') up.last_spin_at = new Date().toISOString();
    await supabase.from('atc_wallets').update(up as any).eq('user_id', userId);
    await supabase.from('atc_transactions').insert({ user_id: userId, amount, type, description } as any);
};

export const getQuizQuestions = async (limit: number) => {
    const { data } = await supabase.from('quiz_questions').select('*');
    return (data || []).sort(() => 0.5 - Math.random()).slice(0, limit);
};

export const rewardExtraSpin = async (userId: string, count: number) => {
    const { data: w } = await supabase.from('atc_wallets').select('extra_spins').eq('user_id', userId).single();
    if (w) await supabase.from('atc_wallets').update({ extra_spins: ((w as any).extra_spins || 0) + count } as any).eq('user_id', userId);
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    await supabase.rpc('convert_atc_to_uzs', { p_amount: amount, p_rate: rate } as any);
};

export const getContestAds = async () => {
    const { data } = await supabase.from('contest_ads').select('*').eq('is_active', true);
    return data || [];
};

export const createContestAd = async (ad: any) => {
    await supabase.from('contest_ads').insert([ad] as any[]);
};

export const deleteContestAd = async (id: number) => {
    await supabase.from('contest_ads').delete().eq('id', id);
};

// --- ARK (CASH CONTEST) SERVICES ---

export const getArkWallet = async (userId: string): Promise<ArkWallet> => {
    const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (!data) {
        const { data: nw } = await supabase.from('ark_wallets').insert([{ user_id: userId } as any]).select().single();
        return nw;
    }
    return data;
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    const { data } = await supabase.from('ark_market').select('*').order('created_at', { ascending: true }).limit(50);
    return data || [];
};

export const getArkSettings = async (): Promise<ArkSettings> => {
    const { data } = await supabase.from('ark_settings').select('*');
    const c: any = {};
    data?.forEach((s: any) => { try { c[s.key] = JSON.parse(s.value); } catch { c[s.key] = s.value; } });
    return c;
}

export const updateArkSettings = async (key: string, value: any) => {
    await supabase.from('ark_settings').upsert({ key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) } as any);
};

export const requestArkWithdrawal = async (userId: string, amount: number, card: string, holder: string) => {
    const s = await getArkSettings();
    const uzs = amount * (s.current_price || 0);
    const { data: w } = await supabase.from('ark_wallets').select('balance').eq('user_id', userId).single();
    if (!w || (w as any).balance < amount) throw new Error("Mablag' yetarli emas");
    await supabase.from('ark_wallets').update({ balance: (w as any).balance - amount } as any).eq('user_id', userId);
    await supabase.from('ark_withdrawals').insert({ user_id: userId, amount_ark: amount, amount_uzs: uzs, card_number: card, card_holder: holder, status: 'pending' } as any);
};

export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
}

export const approveArkWithdrawal = async (id: number) => {
    await supabase.from('ark_withdrawals').update({ status: 'approved' } as any).eq('id', id);
}

export const getArkAds = async (): Promise<ArkAd[]> => {
    const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true);
    return data || [];
}

export const createArkAd = async (ad: any) => { await supabase.from('ark_ads').insert([ad] as any[]); }
export const deleteArkAd = async (id: number) => { await supabase.from('ark_ads').delete().eq('id', id); }

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return data || [];
}

export const createArkQuiz = async (quiz: any) => { await supabase.from('ark_quizzes').insert([quiz] as any[]); }
export const deleteArkQuiz = async (id: number) => { await supabase.from('ark_quizzes').delete().eq('id', id); }

export const rewardArkSpins = async (userId: string, spins: number) => {
    const { data: w } = await supabase.from('ark_wallets').select('available_spins').eq('user_id', userId).single();
    if (w) await supabase.from('ark_wallets').update({ available_spins: ((w as any).available_spins || 0) + spins } as any).eq('user_id', userId);
}

export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    const { data: wallet } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return;
    const w = wallet as any;
    const updates: any = { available_spins: (w.available_spins || 0) - 1 };
    
    if (prize.type === 'ark') {
        updates.balance = (w.balance || 0) + prize.value;
        updates.total_earned = (w.total_earned || 0) + prize.value;
    }
    
    await supabase.from('ark_wallets').update(updates as any).eq('user_id', userId);
    await supabase.from('ark_transactions').insert([{ user_id: userId, amount: prize.value, type: 'spin', description: `Wheel: ${prize.label}` } as any]);
};

export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    const { data: w } = await supabase.from('ark_wallets').select('balance, total_earned').eq('user_id', userId).single();
    if (!w) return;
    await supabase.from('ark_wallets').update({ balance: ((w as any).balance || 0) + amount, total_earned: ((w as any).total_earned || 0) + amount } as any).eq('user_id', userId);
    await supabase.from('ark_transactions').insert({ user_id: userId, amount, type: 'ad_watch', description: `Ad: ${title}` } as any);
};

export const giveArkGlobalBonus = async (amount: number, description: string) => {
    const { data: ws } = await supabase.from('ark_wallets').select('user_id, balance');
    if (!ws) return;
    for (const w of ws) {
        await supabase.from('ark_wallets').update({ balance: ((w as any).balance || 0) + amount } as any).eq('user_id', (w as any).user_id);
        await supabase.from('ark_transactions').insert({ user_id: (w as any).user_id, amount, type: 'bonus', description } as any);
    }
};

export const runArkAutopilot = async () => {
    const s = await getArkSettings();
    const config = s.autopilot_config as ArkAutopilotConfig;
    if (!config) throw new Error("Autopilot config missing");
    
    const { data: ads } = await supabase.from('ark_ads').select('view_count');
    const totalViews = (ads || []).reduce((acc, curr) => acc + ((curr as any).view_count || 0), 0);
    
    const totalRevenue = (totalViews / config.unit_views) * config.revenue_per_unit;
    const marketIncrease = (totalRevenue * (config.market_share_percent / 100));
    
    const newPrice = (s.current_price || 300) + (marketIncrease / 1000); // Scaled
    await updateArkSettings('current_price', newPrice);
    await supabase.from('ark_market').insert({ price: newPrice } as any);
    
    return { totalRevenue, newPrice };
};

export const toggleArkMarketStatus = async (status: 'active' | 'paused' | 'closed') => {
    await updateArkSettings('game_status', status);
};

export const saveArkSchedule = async (schedule: ArkSchedule) => {
    await updateArkSettings('market_schedule', schedule);
};