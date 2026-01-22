
import { supabase } from './supabaseClient';
import { 
    UserProfile, Movie, Episode, ATCWallet, ATCTransaction, 
    ContestTask, ContestAd, QuizQuestion, ArkWallet, 
    ArkMarketData, ArkAd, ArkQuiz, ArkWithdrawal, 
    Broadcast, Promocode, UserDevice, SupportTicket, 
    TicketMessage, News, Transaction, ShopProduct, 
    ShopWallet, ShopOrder, SocialLink, PaymentRequestDB, 
    FandubChannel, FandubUpload, ArkSchedule, Ad 
} from '../types';

// --- FANDUB SYSTEM SERVICES ---

export const getFandubChannels = async (currentUserId?: string): Promise<FandubChannel[]> => {
    const { data, error } = await supabase.from('fandub_channels').select('*').order('subscriber_count', { ascending: false });
    if (error) throw error;
    
    if (currentUserId) {
        // Obunani tekshirish
        const { data: follows } = await supabase.from('fandub_follows').select('channel_id').eq('user_id', currentUserId);
        const followedIds = new Set((follows || []).map(f => f.channel_id));
        return (data || []).map(ch => ({ ...ch, is_following: followedIds.has(ch.id) }));
    }
    return data || [];
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

export const getActiveStories = async (): Promise<any[]> => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('fandub_stories').select('*, profiles(full_name, avatar_url, username)').gt('created_at', yesterday).order('created_at', { ascending: false });
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

export const getPendingFandubUploads = async (): Promise<FandubUpload[]> => {
    const { data } = await supabase.from('fandub_uploads').select('*, profiles(full_name)').eq('status', 'pending');
    return (data || []) as FandubUpload[];
};

// ... (existing dbService methods remain below)
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
