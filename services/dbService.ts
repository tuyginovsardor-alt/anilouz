
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

// --- MOVIES & FANDUB INTEGRATION ---
export const getMovies = async (): Promise<Movie[]> => {
    const [off, fan] = await Promise.all([
        supabase.from('movies').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
        supabase.from('fandub_uploads').select('*, fandub_channels(name)').eq('status', 'approved').order('created_at', { ascending: false })
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
        is_blocked: m.is_blocked || false
    }));

    const merged = [...official, ...fandub]
        .filter(m => !m.is_blocked) // Faqat bloklanmaganlarni ko'rsatish
        .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
        });

    return merged as Movie[];
};

export const getMovieEpisodes = async (movieId: number): Promise<Episode[]> => {
    const { data: fandubMovie } = await supabase.from('fandub_uploads').select('episodes').eq('id', movieId).maybeSingle();
    if (fandubMovie && fandubMovie.episodes) return fandubMovie.episodes as Episode[];
    const { data } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
    return data || [];
};

// --- FANDUB MANAGEMENT (ADMIN & CREATOR) ---
export const toggleBlockFandub = async (id: number, block: boolean) => {
    const { error } = await supabase.from('fandub_uploads').update({ is_blocked: block }).eq('id', id);
    if (error) throw error;
};

export const deleteFandubUpload = async (id: number) => {
    const { error } = await supabase.from('fandub_uploads').delete().eq('id', id);
    if (error) throw error;
};

export const updateFandubUpload = async (id: number, updates: any) => {
    const { error } = await supabase.from('fandub_uploads').update(updates).eq('id', id);
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

// --- QOLGAN STANDART FUNKSIYALAR ---
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

export const updateFandubChannel = async (channelId: string, updates: Partial<FandubChannel>) => {
    const { error } = await supabase.from('fandub_channels').update(updates).eq('id', channelId);
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

export const getAppConfig = async () => {
    const { data } = await supabase.from('app_config').select('*');
    const config: Record<string, string> = {};
    (data || []).forEach(item => { config[item.key] = item.value; });
    return config;
};

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

export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2,9)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
};
export const uploadPoster = (file: File) => uploadFile(file, 'posters');
export const uploadVideo = (file: File) => uploadFile(file, 'videos');
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
export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    const { data } = await supabase.from('movies').select('*').or(`title.ilike.%${query}%,genre.ilike.%${query}%,tags.ilike.%${query}%`).eq('is_archived', false);
    return (data || []) as Movie[];
};
export const getMovieReviews = async (movieId: number) => {
    const { data } = await supabase.from('reviews').select('*, profiles(full_name, avatar_url, role)').eq('movie_id', movieId).order('created_at', { ascending: false });
    return data || [];
};
export const addReview = async (movieId: number, userId: string, rating: number, comment: string) => {
    await supabase.from('reviews').insert({ movie_id: movieId, user_id: userId, rating, comment });
};
export const deleteReview = async (reviewId: number) => {
    await supabase.from('reviews').delete().eq('id', reviewId);
};
export const updateReview = async (reviewId: number, comment: string) => {
    await supabase.from('reviews').update({ comment }).eq('id', reviewId);
};
export const buySubscription = async (userId: string, plan: string, price: number) => {
    await supabase.rpc('buy_subscription', { u_id: userId, p_name: plan, cost: price });
};
export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { u_id: userId, c_str: code });
    if (error) throw error;
    return data;
};
export const getNews = async (): Promise<News[]> => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    return data || [];
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
