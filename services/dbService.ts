
// ... existing imports ...
import { 
    UserProfile, Movie, Episode, FandubChannel, FandubUpload, FandubStory, Ad,
    SocialLink, UserDevice, SupportTicket, TicketMessage, News, Transaction,
    ATCWallet, ATCTransaction, ContestTask, WheelPrize, QuizQuestion, ContestAd,
    ArkWallet, ArkMarketData, ArkAd, ArkQuiz, ArkAutopilotConfig, ArkSchedule,
    ArkWithdrawal, ShopProduct, ShopWallet, ShopOrder, Promocode, Broadcast, PaymentRequestDB,
    FandubPost, PremiumBundle, FandubEarning, FandubWithdrawal
} from '../types';
import { supabase } from './supabaseClient';
import { isAiPilotEnabled, runAiServerManager } from './aiGuardService';
import { getCache, setCache } from './cacheService';

// --- FANDUB EXTENSIONS ---

export const getFandubEarnings = async (channelId: string): Promise<FandubEarning[]> => {
    try {
        const { data } = await supabase.from('fandub_earnings').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const getFandubWithdrawals = async (channelId: string): Promise<FandubWithdrawal[]> => {
    try {
        const { data } = await supabase.from('fandub_withdrawals').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const requestFandubWithdrawal = async (channelId: string, userId: string, amount: number, card: string, holder: string) => {
    const { error } = await supabase.from('fandub_withdrawals').insert({
        channel_id: channelId,
        user_id: userId,
        amount,
        card_number: card,
        card_holder: holder
    });
    if (error) throw error;
};

// ... keep all other existing functions below ...
export const getSecuredUrl = async (rawUrl: string, userId: string): Promise<string> => {
    return rawUrl || '';
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        if (!userId) return null;
        const cachedProfile = getCache<UserProfile>(`profile_${userId}`);
        if (cachedProfile) return cachedProfile;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (error) return null;
        if (data) setCache(`profile_${userId}`, data, 5); 
        return data as UserProfile;
    } catch (e) { return null; }
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
        return data as UserProfile;
    } catch (e) { return null; }
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    try {
        const { data } = await supabase.from('user_devices').select('*').eq('user_id', userId).order('last_active', { ascending: false });
        return (data || []) as UserDevice[];
    } catch (e) { return []; }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
        if (isAiPilotEnabled()) {
            const guardResult = await runAiServerManager(`User Profile Update: ${JSON.stringify(updates)}`);
            if (guardResult && !guardResult.allowed) throw new Error(`AI Guard: ${guardResult.analysis}`);
        }
        const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
        if (error) throw error;
        localStorage.removeItem(`anilo_cache_profile_${userId}`);
    } catch (e) { throw e; }
};

export const getMovies = async (): Promise<Movie[]> => {
    try {
        const cachedMovies = getCache<Movie[]>('all_movies_catalog');
        if (cachedMovies) return cachedMovies;
        const getOfficial = async () => {
            const { data, error } = await supabase.from('movies').select('*').eq('is_archived', false).order('created_at', { ascending: false });
            if (error) return [];
            return (data || []).map(m => ({ 
                ...m, 
                posterUrl: m.posterUrl || m.poster_url,
                videoUrl: m.videoUrl || m.video_url,
                is_fandub: false 
            }));
        };
        const getFandub = async () => {
            try {
                const { data, error } = await supabase.from('fandub_uploads').select('*, fandub_channels(name)').eq('status', 'approved').order('created_at', { ascending: false });
                if (error) return [];
                return (data || []).map(m => ({
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
                    is_blocked: m.is_blocked || false
                }));
            } catch { return []; }
        };
        const [official, fandub] = await Promise.all([getOfficial(), getFandub()]);
        const mergedMovies = [...official, ...fandub]
            .filter(m => !m.is_blocked)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (mergedMovies.length > 0) setCache('all_movies_catalog', mergedMovies, 60);
        return mergedMovies;
    } catch (e) { return []; }
};

export const getMovieEpisodes = async (movieId: number): Promise<Episode[]> => {
    try {
        const { data: fandubMovie } = await supabase.from('fandub_uploads').select('episodes').eq('id', movieId).maybeSingle();
        if (fandubMovie && fandubMovie.episodes) return fandubMovie.episodes as Episode[];
        const { data } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const addMovieToDB = async (movie: Partial<Movie>) => {
    const { data, error } = await supabase.from('movies').insert(movie).select().single();
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
    return data as Movie;
};

export const updateMovieInDB = async (id: number, movie: Partial<Movie>) => {
    const { error } = await supabase.from('movies').update(movie).eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const deleteMovieFromDB = async (id: number) => {
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const toggleMovieArchive = async (id: number, isArchived: boolean) => {
    const { error } = await supabase.from('movies').update({ is_archived: isArchived }).eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const getPremiumBundles = async (): Promise<PremiumBundle[]> => {
    try {
        const { data } = await supabase.from('premium_bundles').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const savePremiumBundle = async (bundle: Partial<PremiumBundle>) => {
    const { id, ...data } = bundle;
    if (id) await supabase.from('premium_bundles').update(data).eq('id', id);
    else await supabase.from('premium_bundles').insert(data);
};

export const deletePremiumBundle = async (id: number) => {
    await supabase.from('premium_bundles').delete().eq('id', id);
};

export const toggleBlockFandub = async (id: number, block: boolean) => {
    await supabase.from('fandub_uploads').update({ is_blocked: block }).eq('id', id);
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const deleteFandubUpload = async (id: number) => {
    await supabase.from('fandub_uploads').delete().eq('id', id);
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const updateFandubUpload = async (id: number, updates: any) => {
    await supabase.from('fandub_uploads').update(updates).eq('id', id);
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const createFandubChannel = async (channel: Partial<FandubChannel>) => {
    await supabase.from('fandub_channels').insert(channel);
};

export const updateFandubChannel = async (id: string, updates: Partial<FandubChannel>) => {
    await supabase.from('fandub_channels').update(updates).eq('id', id);
};

export const createFandubStory = async (story: Partial<FandubStory>) => {
    await supabase.from('fandub_stories').insert(story);
};

export const getFandubPosts = async (channelId: string): Promise<FandubPost[]> => {
    try {
        const { data } = await supabase.from('fandub_posts').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createFandubPost = async (post: Partial<FandubPost>) => {
    await supabase.from('fandub_posts').insert(post);
};

export const deleteFandubPost = async (id: number) => {
    await supabase.from('fandub_posts').delete().eq('id', id);
};

export const getUserNotifications = async (userId: string) => {
    try {
        const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
        return data || [];
    } catch (e) { return []; }
};

export const markNotificationsRead = async (userId: string) => {
    try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    } catch (e) {}
};

export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2,9)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
};

export const uploadPoster = (file: File) => uploadFile(file, 'posters');
export const uploadVideo = (file: File) => uploadFile(file, 'videos');
export const uploadAvatar = (file: File) => uploadFile(file, 'avatars');
export const uploadBanner = (file: File) => uploadFile(file, 'posters');

export const getFandubChannels = async (userId?: string): Promise<FandubChannel[]> => {
    try {
        const { data } = await supabase.from('fandub_channels').select('*').order('subscriber_count', { ascending: false });
        if (userId && data) {
            const { data: follows } = await supabase.from('fandub_follows').select('channel_id').eq('user_id', userId);
            const followedIds = new Set((follows || []).map(f => f.channel_id));
            return data.map(ch => ({ ...ch, is_following: followedIds.has(ch.id) }));
        }
        return data || [];
    } catch (e) { return []; }
};

export const getFandubChannel = async (userId: string): Promise<FandubChannel | null> => {
    try {
        const { data } = await supabase.from('fandub_channels').select('*').eq('user_id', userId).maybeSingle();
        return data as FandubChannel;
    } catch (e) { return null; }
};

export const getFandubUploads = async (userId: string): Promise<FandubUpload[]> => {
    try {
        const { data = [] } = await supabase.from('fandub_uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getPendingFandubUploads = async (): Promise<FandubUpload[]> => {
    try {
        const { data } = await supabase.from('fandub_uploads').select('*, profiles(full_name, email), fandub_channels(name)').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const approveFandubUpload = async (id: number) => {
    await supabase.from('fandub_uploads').update({ status: 'approved' }).eq('id', id);
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const rejectFandubUpload = async (id: number, comment: string) => {
    await supabase.from('fandub_uploads').update({ status: 'rejected', admin_comment: comment }).eq('id', id);
};

export const getAppConfig = async () => {
    try {
        const { data } = await supabase.from('app_config').select('*');
        const config: Record<string, string> = {};
        (data || []).forEach(item => { config[item.key] = item.value; });
        return config;
    } catch (e) { return {}; }
};

export const updateAppConfig = async (key: string, value: string) => {
    await supabase.from('app_config').upsert({ key, value });
};

export const getDashboardStats = async () => {
    try {
        const { data } = await supabase.rpc('get_dashboard_stats');
        return data;
    } catch (e) { return null; }
};

export const getUnreadNotificationsCount = async (userId: string) => {
    try {
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
        return count || 0;
    } catch (e) { return 0; }
};

export const getAdminNotificationCounts = async () => {
    try {
        const { data } = await supabase.rpc('get_admin_counts');
        return { financials: data?.payment_pending || 0, support: data?.tickets_open || 0, fandub: data?.fandub_pending || 0 };
    } catch (e) { return { financials: 0, support: 0, fandub: 0 }; }
};

export const toggleFollowChannel = async (userId: string, channelId: string) => {
    try {
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
    } catch (e) { return false; }
};

export const getActiveStories = async (): Promise<FandubStory[]> => {
    try {
        const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
        const { data } = await supabase.from('fandub_stories').select('*, profiles(username, avatar_url)').gt('created_at', yesterday);
        return data || [];
    } catch (e) { return []; }
};

export const isMovieSaved = async (userId: string, movieId: number): Promise<boolean> => {
    try {
        const { data } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
        return !!data;
    } catch (e) { return false; }
};

export const toggleSaveMovie = async (userId: string, movieId: number): Promise<boolean> => {
    try {
        const { data: existing } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
        if (existing) {
            await supabase.from('saved_movies').delete().eq('id', existing.id);
            return false;
        } else {
            await supabase.from('saved_movies').insert({ user_id: userId, movie_id: movieId });
            return true;
        }
    } catch (e) { return false; }
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    try {
        const { data } = await supabase.from('user_history').select('*, movies(*)').eq('user_id', userId).order('viewed_at', { ascending: false });
        return (data || []).map((h: any) => ({ ...h.movies, posterUrl: h.movies.posterUrl || h.movies.poster_url })).filter(Boolean) as Movie[];
    } catch (e) { return []; }
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    try {
        const { data } = await supabase.from('saved_movies').select('*, movies(*)').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).map((s: any) => ({ ...s.movies, posterUrl: s.movies.posterUrl || s.movies.poster_url })).filter(Boolean) as Movie[];
    } catch (e) { return []; }
};

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    try {
        const { data } = await supabase.from('movies').select('*').or(`title.ilike.%${query}%,genre.ilike.%${query}%,tags.ilike.%${query}%`).eq('is_archived', false);
        return (data || []).map(m => ({ ...m, posterUrl: m.posterUrl || m.poster_url })) as Movie[];
    } catch (e) { return []; }
};

export const getMovieReviews = async (movieId: number) => {
    try {
        const { data } = await supabase.from('reviews').select('*, profiles(full_name, avatar_url, role)').eq('movie_id', movieId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const addReview = async (movieId: number, userId: string, rating: number, comment: string) => {
    if (isAiPilotEnabled()) {
        const guardResult = await runAiServerManager(`User Review Submission on Movie ID ${movieId}: "${comment}"`);
        if (guardResult && !guardResult.allowed) throw new Error(`AI Guard: ${guardResult.analysis}`);
    }
    await supabase.from('reviews').insert({ movie_id: movieId, user_id: userId, rating, comment });
};

export const deleteReview = async (reviewId: number) => {
    await supabase.from('reviews').delete().eq('id', reviewId);
};

export const updateReview = async (reviewId: number, comment: string) => {
    if (isAiPilotEnabled()) {
        const guardResult = await runAiServerManager(`User Review Edit: "${comment}"`);
        if (guardResult && !guardResult.allowed) throw new Error(`AI Guard: ${guardResult.analysis}`);
    }
    await supabase.from('reviews').update({ comment }).eq('id', reviewId);
};

export const buySubscription = async (userId: string, plan: string, price: number) => {
    await supabase.rpc('buy_subscription', { u_id: userId, p_name: plan, cost: price });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { u_id: userId, c_str: code });
    if (error) throw error;
    return data;
};

export const getNews = async (): Promise<News[]> => {
    try {
        const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createNews = async (title: string, content: string) => {
    await supabase.from('news').insert({ title, content });
};

export const deleteNews = async (id: number) => {
    await supabase.from('news').delete().eq('id', id);
};

export const getAllTickets = async (): Promise<SupportTicket[]> => {
    try {
        const { data } = await supabase.from('support_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    try {
        const { data } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    try {
        const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const createTicket = async (userId: string) => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
    if (error) throw error;
    return data;
};

export const sendMessage = async (ticketId: number, userId: string, message: string, isAdmin: boolean) => {
    await supabase.from('ticket_messages').insert({ ticket_id: ticketId, user_id: userId, message, is_admin: isAdmin });
};

export const getPromocodes = async (): Promise<Promocode[]> => {
    try {
        const { data } = await supabase.from('promocodes').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const savePromocode = async (promo: Promocode) => {
    await supabase.from('promocodes').insert(promo);
};

export const deletePromocode = async (id: number) => {
    await supabase.from('promocodes').delete().eq('id', id);
};

export const getSocialLinks = async (): Promise<SocialLink[]> => {
    try {
        const { data } = await supabase.from('social_links').select('*').order('label', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const addSocialLink = async (link: Partial<SocialLink>) => {
    await supabase.from('social_links').insert(link);
};

export const deleteSocialLink = async (id: number) => {
    await supabase.from('social_links').delete().eq('id', id);
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const deleteUser = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
};

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    try {
        const { data } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
    await supabase.rpc('approve_payment', { req_id: requestId, u_id: userId, amt: amount });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const rejectPaymentRequest = async (requestId: number) => {
    await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
};

export const getPremiumUsers = async (): Promise<UserProfile[]> => {
    try {
        const { data } = await supabase.from('profiles').select('*').gt('balance', 0).order('balance', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    await supabase.rpc('adjust_user_balance', { u_id: userId, amt: amount, adj_type: type, desc: description });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const giveGlobalBonus = async (amount: number, description: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { amt: amount, desc: description });
    if (error) throw error;
    return data;
};

export const getAllSessions = async (): Promise<UserDevice[]> => {
    try {
        const { data } = await supabase.from('user_devices').select('*, profiles(full_name, email, role)').order('last_active', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const toggleDeviceBlock = async (id: number, blocked: boolean) => {
    await supabase.from('user_devices').update({ is_blocked: blocked }).eq('id', id);
};

export const getBroadcasts = async (): Promise<Broadcast[]> => {
    try {
        const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createBroadcast = async (bc: Partial<Broadcast>) => {
    await supabase.from('broadcasts').insert(bc);
};

export const deleteBroadcast = async (id: number) => {
    await supabase.from('broadcasts').delete().eq('id', id);
};

export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
    try {
        const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
        return data;
    } catch (e) { return null; }
};

export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    try {
        const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getContestSettings = async () => {
    try {
        const { data } = await supabase.from('contest_settings').select('*');
        const s: any = {};
        (data || []).forEach(i => s[i.key] = i.value);
        return s;
    } catch (e) { return {}; }
};

export const updateContestSetting = async (key: string, value: any) => {
    await supabase.from('contest_settings').upsert({ key, value });
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
    try {
        const { data } = await supabase.from('contest_tasks').select('*');
        return data || [];
    } catch (e) { return []; }
};

export const createContestTask = async (task: Partial<ContestTask>) => {
    await supabase.from('contest_tasks').insert(task);
};

export const deleteContestTask = async (id: number) => {
    await supabase.from('contest_tasks').delete().eq('id', id);
};

export const getContestAds = async (): Promise<ContestAd[]> => {
    try {
        const { data } = await supabase.from('contest_ads').select('*');
        return data || [];
    } catch (e) { return []; }
};

export const createContestAd = async (ad: Partial<ContestAd>) => {
    await supabase.from('contest_ads').insert(ad);
};

export const deleteContestAd = async (id: number) => {
    await supabase.from('contest_ads').delete().eq('id', id);
};

export const claimATCReward = async (userId: string, amount: number, type: string, desc: string) => {
    await supabase.rpc('claim_atc_reward', { u_id: userId, amt: amount, r_type: type, r_desc: desc });
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    await supabase.rpc('convert_atc_to_uzs', { u_id: userId, atc_amt: amount, ex_rate: rate });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const getQuizQuestions = async (count: number): Promise<QuizQuestion[]> => {
    try {
        const { data } = await supabase.rpc('get_random_quiz', { q_count: count });
        return data || [];
    } catch (e) { return []; }
};

export const rewardExtraSpin = async (userId: string, count: number) => {
    await supabase.rpc('add_extra_spins', { u_id: userId, s_count: count });
};

export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
    try {
        const { data } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
        return data;
    } catch (e) { return null; }
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    try {
        const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const getArkSettings = async () => {
    try {
        const { data } = await supabase.from('ark_settings').select('*');
        const s: any = {};
        (data || []).forEach(i => s[i.key] = i.value);
        return s;
    } catch (e) { return {}; }
};

export const updateArkSettings = async (key: string, value: any) => {
    await supabase.from('ark_settings').upsert({ key, value });
};

export const getArkAds = async (): Promise<ArkAd[]> => {
    try {
        const { data } = await supabase.from('ark_ads').select('*');
        return data || [];
    } catch (e) { return []; }
};

export const createArkAd = async (ad: Partial<ArkAd>) => {
    await supabase.from('ark_ads').insert(ad);
};

export const deleteArkAd = async (id: number) => {
    await supabase.from('ark_ads').delete().eq('id', id);
};

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    try {
        const { data } = await supabase.from('ark_quizzes').select('*');
        return data || [];
    } catch (e) { return []; }
};

export const createArkQuiz = async (q: Partial<ArkQuiz>) => {
    await supabase.from('ark_quizzes').insert(q);
};

export const deleteArkQuiz = async (id: number) => {
    await supabase.from('ark_quizzes').delete().eq('id', id);
};

export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    await supabase.rpc('process_ark_spin', { u_id: userId, p_type: prize.type, p_val: prize.value, p_lbl: prize.label });
};

export const rewardArkSpins = async (userId: string, count: number) => {
    await supabase.rpc('add_ark_spins', { u_id: userId, s_count: count });
};

export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    await supabase.rpc('claim_ark_ad_reward', { u_id: userId, amt: amount, ad_title: title });
};

export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    try {
        const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const requestArkWithdrawal = async (userId: string, amount: number, card: string, holder: string) => {
    await supabase.from('ark_withdrawals').insert({ user_id: userId, amount_ark: amount, card_number: card, card_holder: holder });
};

export const approveArkWithdrawal = async (id: number) => {
    await supabase.from('ark_withdrawals').update({ status: 'approved' }).eq('id', id);
};

export const giveArkGlobalBonus = async (amount: number, msg: string) => {
    await supabase.rpc('give_ark_global_bonus', { amt: amount, bonus_msg: msg });
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

export const getAdminPin = async () => {
    try {
        const config = await getAppConfig();
        return config['admin_pin'] || '0000';
    } catch { return '0000'; }
};

export const setAdminPin = async (pin: string) => {
    await updateAppConfig('admin_pin', pin);
};

export const getProtectedRoutes = async (): Promise<string[]> => {
    try {
        const config = await getAppConfig();
        return JSON.parse(config['protected_routes'] || '[]');
    } catch { return []; }
};

export const setProtectedRoutes = async (routes: string[]) => {
    await updateAppConfig('protected_routes', JSON.stringify(routes));
};

export const saveRecoveryCodes = async (codes: string[]) => {
    await updateAppConfig('admin_recovery_codes', JSON.stringify(codes));
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    try {
        const config = await getAppConfig();
        const codes = JSON.parse(config['admin_recovery_codes'] || '[]');
        return codes.includes(code);
    } catch { return false; }
};

export const getRecoveryCodesStatus = async (): Promise<boolean> => {
    try {
        const config = await getAppConfig();
        const codes = JSON.parse(config['admin_recovery_codes'] || '[]');
        return codes.length > 0;
    } catch { return false; }
};

export const getShopProducts = async (cat?: string, sort?: string, query?: string): Promise<ShopProduct[]> => {
    try {
        let q = supabase.from('shop_products').select('*').eq('is_active', true);
        if (cat && cat !== 'all') q = q.eq('category', cat);
        if (query) q = q.ilike('title', `%${query}%`);
        if (sort === 'price_asc') q = q.order('price', { ascending: true });
        else if (sort === 'price_desc') q = q.order('price', { ascending: false });
        else if (sort === 'popular') q = q.order('sales_count', { ascending: false });
        else q = q.order('created_at', { ascending: false });
        const { data } = await q;
        return data || [];
    } catch { return []; }
};

export const getAdminShopProducts = async (): Promise<ShopProduct[]> => {
    try {
        const { data } = await supabase.from('shop_products').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const createShopProduct = async (prod: Partial<ShopProduct>) => {
    await supabase.from('shop_products').insert(prod);
};

export const getShopWallet = async (userId: string): Promise<ShopWallet | null> => {
    try {
        const { data = null } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
        return data;
    } catch { return null; }
};

export const createShopPaymentRequest = async (userId: string, amount: number, url: string) => {
    await supabase.from('shop_payment_requests').insert({ user_id: userId, amount, screenshot_url: url });
};

export const placeShopOrder = async (userId: string, productId: number, amount: number, address: string, phone: string) => {
    await supabase.rpc('place_shop_order', { u_id: userId, p_id: productId, amt: amount, addr: address, ph: phone });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    try {
        const { data = [] } = await supabase.from('shop_orders').select('*, products(*)').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const incrementAdView = async (adId: number) => {
    try { await supabase.rpc('increment_ad_views', { ad_id: adId }); } catch {}
};

export const getAds = async (): Promise<Ad[]> => {
    try {
        const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
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
    } catch { return []; }
};

export const saveAd = async (ad: Ad) => {
    const { id, ...data } = ad;
    const payload = {
        name: data.name,
        type: data.type,
        content_url: data.contentUrl,
        target_url: data.targetUrl,
        location: data.location,
        status: data.status,
        view_count: data.view_count || 0
    };
    if (id) await supabase.from('ads').update(payload).eq('id', id);
    else await supabase.from('ads').insert(payload);
};

export const deleteAd = async (id: number) => {
    await supabase.from('ads').delete().eq('id', id);
};

export const recordTsPaySuccess = async (userId: string, amount: number, orderId: number) => {
    await supabase.rpc('record_tspay_success', { u_id: userId, amt: amount, o_id: orderId });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    try {
        const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const getAdminMovies = async (): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
        if (error) return [];
        return (data || []).map(m => ({
            ...m,
            posterUrl: m.posterUrl || m.poster_url,
            videoUrl: m.videoUrl || m.video_url
        })) as Movie[];
    } catch { return []; }
};

export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
};

export const updateUserEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
    const user = await supabase.auth.getUser();
    if(user.data.user) localStorage.removeItem(`anilo_cache_profile_${user.data.user.id}`);
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    try {
        const { data, error } = await supabase.rpc('check_registration_limit', { dev_id: deviceId });
        if (error) return;
        if (data && !data.allowed) {
            throw new Error(data.message || "Ushbu qurilmadan ro'yxatdan o'tish limiti tugagan.");
        }
    } catch (e: any) { throw e; }
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    try {
        const userAgent = navigator.userAgent;
        await supabase.from('user_devices').upsert({
            user_id: userId,
            device_id: deviceId,
            device_name: userAgent,
            last_active: new Date().toISOString()
        }, { onConflict: 'user_id, device_id' });
    } catch {}
};
