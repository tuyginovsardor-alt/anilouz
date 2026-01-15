
import { supabase } from './supabaseClient';
import { Movie, UserProfile, Transaction, PaymentRequestDB, SupportTicket, TicketMessage, Ad, Promocode, AppConfig, Review, DashboardStats, ActivityLog, News, SocialLink, UserDevice, Episode, Broadcast, ATCWallet, ATCTransaction, ContestTask, WheelPrize, QuizQuestion, ContestAd, ArkWallet, ArkMarketData, ArkWithdrawal, ArkSettings, ArkAd, ArkQuiz, ArkAutopilotConfig, ArkSchedule } from '../types';

// --- APP CONFIG (SETTINGS) SERVICES ---

export const getAppConfig = async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from('app_config').select('*');
    if (error) {
        // Fail silently for config
        return {};
    }
    const config: Record<string, string> = {};
    // Fix: Using any cast to access key and value from app_config items
    data.forEach((item: any) => {
        config[item.key] = item.value;
    });
    return config;
};

export const updateAppConfig = async (key: string, value: string) => {
    // Fix: Explicitly cast payload to any to avoid "never" error on missing table type
    const { error } = await supabase
        .from('app_config')
        .upsert({ key, value } as any);
    
    if (error) throw error;
};

// --- SECURITY SERVICES (PIN, ROUTES & RECOVERY) ---

export const getAdminPin = async (): Promise<string> => {
    const config = await getAppConfig();
    return config['admin_pin'] || '0000'; // Default PIN
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
        // Check if code exists (Case insensitive usually, but let's do sensitive for security)
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
        // If table doesn't exist yet, return empty array gracefully
        if (error.code === '42P01') return [];
        throw error;
    }
    return data || [];
};

export const addSocialLink = async (link: SocialLink) => {
    // Fix: Cast payload to any array
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

// 1. Register Attempt Logic
export const checkAndTrackRegistration = async (deviceId: string): Promise<{ allowed: boolean, warning: boolean, count: number }> => {
    // Fetch current count
    const { data, error } = await supabase
        .from('device_registrations')
        .select('attempt_count')
        .eq('device_id', deviceId)
        .maybeSingle();

    let currentCount = 0;
    // Fix: Using any cast to safely access attempt_count if data exists
    if (data) {
        currentCount = (data as any).attempt_count;
    }

    // Increment count
    const newCount = currentCount + 1;
    // Fix: Cast payload to any
    const { error: upsertError } = await supabase
        .from('device_registrations')
        .upsert({ device_id: deviceId, attempt_count: newCount, last_attempt_at: new Date().toISOString() } as any);

    if (upsertError) {
        console.error("Registration tracking error (ignoring for user flow):", upsertError);
    }

    if (newCount === 2) {
        return { allowed: true, warning: true, count: newCount };
    } else if (newCount >= 3) {
        // Notify Admin automatically
        await createTicketForSuspiciousActivity(deviceId, newCount);
        return { allowed: true, warning: true, count: newCount }; // Still allow, but warn and track
    }

    return { allowed: true, warning: false, count: newCount };
};

const createTicketForSuspiciousActivity = async (deviceId: string, count: number) => {
    try {
        // System notification logic implies we log it somewhere visible to admin
        console.warn(`Suspicious activity detected for device ${deviceId}: ${count} attempts.`);
    } catch (e) {
        console.error("Failed to notify admin", e);
    }
}

// 2. Log Login Session
export const logDeviceLogin = async (userId: string, deviceId: string) => {
    const deviceName = navigator.userAgent; // Simple user agent for now
    
    // Check if session exists
    const { data: existing } = await supabase
        .from('user_devices')
        .select('id, is_blocked')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .maybeSingle();

    // Fix: Cast existing result to any for safe field access
    if (existing) {
        const ex = existing as any;
        if (ex.is_blocked) {
            throw new Error("Ushbu qurilma bloklangan. Admin bilan bog'laning.");
        }
        // Update last active
        await supabase.from('user_devices').update({ last_active: new Date().toISOString() } as any).eq('id', ex.id);
    } else {
        // Insert new
        // Fix: Cast insert payload to any
        await supabase.from('user_devices').insert({
            user_id: userId,
            device_id: deviceId,
            device_name: deviceName,
            last_active: new Date().toISOString(),
            is_blocked: false
        } as any);
    }
};

// 3. Get Sessions (Admin)
export const getAllSessions = async (): Promise<UserDevice[]> => {
    const { data, error } = await supabase
        .from('user_devices')
        .select('*, profiles(full_name, email, role)')
        .order('last_active', { ascending: false });
    
    if (error) {
        // If table missing, return empty
        if (error.code === '42P01') return [];
        throw error;
    }
    return data || [];
};

// 4. Get My Sessions (User Profile)
export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });
    
    if (error) return [];
    return data || [];
};

// 5. Block/Unblock Device
export const toggleDeviceBlock = async (id: number, isBlocked: boolean) => {
    // Fix: Cast update object to any
    const { error } = await supabase
        .from('user_devices')
        .update({ is_blocked: isBlocked } as any)
        .eq('id', id);
    if (error) throw error;
};

// 6. Ban User (Helper)
export const toggleUserBan = async (userId: string, isBanned: boolean) => {
    // Usually banning means setting role to 'banned' or a flag. 
};


// Qurilma ro'yxatdan o'tganligini tekshirish (Legacy function - updated to use new table if needed, keeping for compatibility)
export const checkDeviceRegistered = async (deviceId: string): Promise<boolean> => {
    if (!deviceId) return false;
    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('device_id', deviceId);
    if (error) return false;
    return (count || 0) > 0;
};

// --- MOVIE SERVICES ---

// Regular users only see non-archived movies
export const getMovies = async (): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('is_archived', false) // Only active movies
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }

  return data?.map((m: any) => ({
      ...m,
      videoUrl: m.video_url
  })) || [];
};

// Admin sees all movies
export const getAdminMovies = async (): Promise<Movie[]> => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching admin movies:', error);
      throw error;
    }
  
    return data?.map((m: any) => ({
        ...m,
        videoUrl: m.video_url
    })) || [];
};

export const getEpisodes = async (movieId: number): Promise<Episode[]> => {
    const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('movie_id', movieId)
        .order('id', { ascending: true }); // Order by insertion ID usually keeps them in order, or add order column

    if (error) {
        console.error("Error fetching episodes:", error);
        return [];
    }
    return data.map((e: any) => ({
        title: e.title,
        source: e.source,
        sourceType: 'url' // Always URL from DB
    }));
}

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('is_archived', false) // Only search active movies
    .or(`title.ilike.%${query}%,tags.ilike.%${query}%`);

  if (error) {
    console.error('Error searching movies:', error);
    throw error;
  }

  return data?.map((m: any) => ({ ...m, videoUrl: m.video_url })) || [];
};

export const incrementMovieView = async (id: number) => {
    try {
        const { data } = await supabase.from('movies').select('view_count').eq('id', id).single();
        // Fix: Added explicit null check for result and any cast for property access
        if (!data) return;
        const current = (data as any).view_count || 0;
        
        // Fix: Cast update payload to any
        await supabase.from('movies').update({ view_count: current + 1 } as any).eq('id', id);
    } catch (e) {
        console.error("Failed to increment movie view:", e);
    }
};

// Updated to handle Episodes
export const addMovieToDB = async (movie: any): Promise<Movie | null> => {
  const cleanMovie = {
    title: movie.title,
    year: Number(movie.year) || new Date().getFullYear(),
    plot: movie.plot,
    posterUrl: movie.posterUrl,
    genre: movie.genre,
    tags: movie.tags, // Add tags
    translator: movie.translator || 'Anilo.uz', // Add translator
    language: movie.language,
    quality: movie.quality,
    rating: Number(movie.rating) || 0,
    video_url: movie.videoUrl, // Main video URL (if single movie)
    is_archived: false,
    view_count: 0,
    status: movie.status || 'completed' // Add Status
  };

  // 1. Insert Movie
  // Fix: Cast cleanup movie payload to any array for safe insertion
  const { data: movieData, error } = await supabase
    .from('movies')
    .insert([cleanMovie] as any[])
    .select()
    .single();

  if (error) {
    console.error('Error adding movie:', error);
    throw error;
  }

  // 2. Insert Episodes if valid
  // Fix: Explicit null check for movieData before property access
  if (movieData && movie.episodes && Array.isArray(movie.episodes) && movie.episodes.length > 0) {
      const episodesPayload = movie.episodes.map((ep: any) => ({
          movie_id: (movieData as any).id,
          title: ep.title,
          source: ep.source
      }));

      const { error: epError } = await supabase.from('episodes').insert(episodesPayload);
      if (epError) {
          console.error("Error inserting episodes:", epError);
          // We don't throw here to avoid failing the whole movie creation, but warn
      }
  }

  // Fix: Handled potential null movieData for return
  if (!movieData) return null;
  return { ...(movieData as any), videoUrl: (movieData as any).video_url };
};

// Updated to handle Episodes Update
export const updateMovieInDB = async (id: number, movie: any): Promise<void> => {
    const updates: any = {
        title: movie.title,
        year: movie.year,
        plot: movie.plot,
        posterUrl: movie.posterUrl,
        genre: movie.genre,
        tags: movie.tags, // Update tags
        translator: movie.translator, // Update translator
        language: movie.language,
        quality: movie.quality,
        status: movie.status // Update status
    };
    
    if (movie.videoUrl !== undefined) {
        updates.video_url = movie.videoUrl;
    }

    // 1. Update Movie Table
    // Fix: Cast updates object to any
    const { error } = await supabase
        .from('movies')
        .update(updates as any)
        .eq('id', id);

    if (error) throw error;

    // 2. Handle Episodes Update (Delete all and re-insert for simplicity)
    if (movie.episodes && Array.isArray(movie.episodes)) {
        // Delete existing
        await supabase.from('episodes').delete().eq('movie_id', id);
        
        // Insert new
        if (movie.episodes.length > 0) {
            const episodesPayload = movie.episodes.map((ep: any) => ({
                movie_id: id,
                title: ep.title,
                source: ep.source
            }));
            await supabase.from('episodes').insert(episodesPayload);
        }
    }
};

export const toggleMovieArchive = async (id: number, isArchived: boolean): Promise<void> => {
    // Fix: Cast update payload to any
    const { error } = await supabase
        .from('movies')
        .update({ is_archived: isArchived } as any)
        .eq('id', id);

    if (error) throw error;
};

export const deleteMovieFromDB = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
};

export const uploadFile = async (file: File, bucket: string = 'posters'): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    console.error(`Error uploading file to ${bucket}:`, error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

export const uploadPoster = (file: File) => uploadFile(file, 'posters');
export const uploadVideo = (file: File) => uploadFile(file, 'videos');


// --- WATCHLIST / SAVED MOVIES SERVICES ---

export const addToSaved = async (userId: string, movieId: number) => {
    // Fix: Cast insert payload to any array
    const { error } = await supabase
        .from('saved_movies')
        .insert([{ user_id: userId, movie_id: movieId } as any]);
    
    if (error) {
        // Ignore unique violation if already saved
        if (error.code !== '23505') throw error;
    }
};

export const removeFromSaved = async (userId: string, movieId: number) => {
    const { error } = await supabase
        .from('saved_movies')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', movieId);
    
    if (error) throw error;
};

export const checkIsSaved = async (userId: string, movieId: number): Promise<boolean> => {
    const { data, error } = await supabase
        .from('saved_movies')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .maybeSingle();
    
    if (error) return false;
    return !!data;
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    const { data, error } = await supabase
        .from('saved_movies')
        .select(`movie_id, movies (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Get Saved Movies Error:", error);
        return [];
    }

    return data.map((item: any) => ({
        ...item.movies,
        videoUrl: item.movies.video_url
    })) as Movie[];
};


// --- REVIEWS SERVICES ---

export const getReviews = async (movieId: number): Promise<Review[]> => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url, username)')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
};

export const addReview = async (movieId: number, user_id: string, rating: number, comment: string) => {
    // Fix: Cast insert payload to any array
    const { error } = await supabase
        .from('reviews')
        .insert([{ movie_id: movieId, user_id, rating, comment } as any]);
    
    if (error) throw error;

    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('movie_id', movieId);
    if (allReviews && allReviews.length > 0) {
        // Fix: Explicit any cast for item access in reduce and update call
        const avg = allReviews.reduce((acc, curr) => acc + (curr as any).rating, 0) / allReviews.length;
        await supabase.from('movies').update({ rating: avg } as any).eq('id', movieId);
    }
};


// --- USER SERVICES ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle(); 

  if (error) {
    return null;
  }
  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  // Fix: Cast partial updates to any for broad profile table support
  const { error } = await supabase
    .from('profiles')
    .update(updates as any)
    .eq('id', userId);

  if (error) throw error;
};

export const updateUserPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
};

export const updateUserEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
};

// Ko'rish vaqtini yangilash (Limitni tekshirish uchun)
export const updateUserWatchTime = async (userId: string, secondsToAdd: number) => {
    // Get current
    const { data: profile } = await supabase.from('profiles').select('total_watch_time').eq('id', userId).maybeSingle();
    
    if (!profile) return;

    // Fix: Explicitly any cast profile and update payload for field access
    const current = (profile as any).total_watch_time || 0;
    
    const { error } = await supabase
        .from('profiles')
        .update({ total_watch_time: current + secondsToAdd } as any)
        .eq('id', userId);
    
    if (error) console.error("Watch time update error:", error);
};

// Yangi: Sinov muddatini boshlash
export const startFreeTrial = async (userId: string): Promise<string> => {
    // Check if already started
    const { data } = await supabase.from('profiles').select('free_trial_started_at').eq('id', userId).single();
    
    // Fix: Cast result data to any for safe field access
    if (data && (data as any).free_trial_started_at) {
        return (data as any).free_trial_started_at;
    }

    const now = new Date().toISOString();
    // Fix: Cast update payload to any
    const { error } = await supabase
        .from('profiles')
        .update({ free_trial_started_at: now } as any)
        .eq('id', userId);
    
    if (error) {
        console.error("Trial start error:", error);
        throw error;
    }
    return now;
};

// Obuna sotib olish
export const buySubscription = async (userId: string, planDuration: '1-oy' | '3-oy' | '6-oy' | '1-yil', price: number) => {
    const { data: profile } = await supabase.from('profiles').select('balance, subscription_end_at, role').eq('id', userId).single();
    if (!profile) throw new Error("Profil topilmadi");

    // Fix: Using any cast to safely access fields from profile
    const prof = profile as any;
    if (prof.balance < price) {
        throw new Error("Mablag' yetarli emas. Iltimos, hisobni to'ldiring.");
    }

    // Calculate end date
    let endDate = new Date();
    // Extend if already exists and valid
    if (prof.subscription_end_at && new Date(prof.subscription_end_at) > new Date()) {
        endDate = new Date(prof.subscription_end_at);
    }

    if (planDuration === '1-oy') endDate.setMonth(endDate.getMonth() + 1);
    if (planDuration === '3-oy') endDate.setMonth(endDate.getMonth() + 3);
    if (planDuration === '6-oy') endDate.setMonth(endDate.getMonth() + 6);
    if (planDuration === '1-yil') endDate.setFullYear(endDate.getFullYear() + 1);

    // Protect Privileged Roles: Don't overwrite admin/owner roles to 'premium'
    const privilegedRoles = ['admin', 'owner', 'manager', 'support', 'accountant'];
    const targetRole = privilegedRoles.includes(prof.role) ? prof.role : 'premium';

    // Fix: Cast update payload to any
    const { error: updateError } = await supabase.from('profiles').update({
        balance: prof.balance - price,
        subscription_end_at: endDate.toISOString(),
        subscription_plan: planDuration,
        role: targetRole
    } as any).eq('id', userId);

    if (updateError) throw updateError;

    // Fix: Cast insert payload to any array
    await supabase.from('transactions').insert({
        user_id: userId,
        amount: -price,
        description: `Premium Obuna (${planDuration})`
    } as any);
};

// Promokod ishlatish
export const redeemPromocode = async (userId: string, code: string): Promise<{discount?: number, bonus?: number, type: 'percentage' | 'fixed'}> => {
    const { data: promo, error } = await supabase.from('promocodes').select('*').eq('code', code).eq('status', 'active').maybeSingle();
    
    if (error) {
        console.error("Promocode error", error);
        throw new Error("Promokod tizimida xatolik.");
    }
    if (!promo) throw new Error("Promokod topilmadi yoki yaroqsiz.");
    
    // Fix: Any cast for safe field access on promo object
    const pr = promo as any;
    if (pr.usage_limit && pr.used_count >= pr.usage_limit) throw new Error("Promokod ishlatish limiti tugagan.");
    if (pr.expires_at && new Date(pr.expires_at) < new Date()) throw new Error("Promokod muddati o'tgan.");

    // Check if user used it
    try {
        const { data: used } = await supabase.from('used_promocodes').select('*').eq('user_id', userId).eq('promocode_id', pr.id).maybeSingle();
        if (used) throw new Error("Siz bu promokodni allaqachon ishlatgansiz.");

        // Mark as used
        // Fix: Cast insert payload to any array
        await supabase.from('used_promocodes').insert([{ user_id: userId, promocode_id: pr.id } as any]);
    } catch (e: any) {
        if (e.message.includes("relation") || e.code === '42P01') {
             console.warn("used_promocodes table missing, skipping duplicate check.");
        } else if (e.message.includes("Siz bu promokodni")) {
            throw e;
        } else {
            // Log other errors but try to proceed if possible, or rethrow
            console.error(e);
        }
    }
    
    // Increment used_count
    // Fix: Cast update payload to any
    await supabase.from('promocodes').update({ used_count: pr.used_count + 1 } as any).eq('id', pr.id);

    return {
        discount: pr.value,
        type: pr.type
    };
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('view_history')
    .select(`movie_id, movies (*)`)
    .eq('user_id', userId)
    .order('watched_at', { ascending: false });

  if (error) return [];
  
  return data.map((item: any) => ({
      ...item.movies,
      videoUrl: item.movies.video_url
  })) as Movie[];
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
    if (error) return null;
    return data;
};

// --- FINANCIAL SERVICES ---

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    const { data, error } = await supabase
        .from('payment_requests')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
    // Ensure profile exists
    const { data: existingProfile } = await supabase.from('profiles').select('balance').eq('id', userId).maybeSingle();
    
    // Fix: Null check and cast for existingProfile field access
    let currentBalance = (existingProfile as any)?.balance || 0;
    
    if (!existingProfile) {
        // Fix: Cast insert payload to any array
        await supabase.from('profiles').insert([{
            id: userId,
            email: `user_${userId.slice(0,8)}@recovered.com`,
            full_name: 'Tiklangan User',
            role: 'user',
            balance: 0
        } as any]);
    }

    const newBalance = currentBalance + amount;
    
    // Fix: Cast update and insert payloads to any
    const { error: balanceError } = await supabase.from('profiles').update({ balance: newBalance } as any).eq('id', userId);
    if (balanceError) throw new Error("Balans yangilashda xatolik: " + balanceError.message);

    const { error: statusError } = await supabase.from('payment_requests').update({ status: 'approved' } as any).eq('id', requestId);
    if (statusError) throw new Error("Status yangilashda xatolik");

    await supabase.from('transactions').insert({
        user_id: userId,
        amount: amount,
        description: "Hisob to'ldirildi",
    } as any);
};

export const rejectPaymentRequest = async (requestId: number) => {
    console.log("Attempting to reject request:", requestId);
    // Fix: Cast update payload to any
    const { error } = await supabase.from('payment_requests').update({ status: 'rejected' } as any).eq('id', requestId);
    if (error) {
        console.error("Supabase rejection error:", error);
        throw error;
    }
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    if (!profile) throw new Error("Profil topilmadi");

    // Fix: Cast profile to any for balance access
    let newBalance = (profile as any).balance || 0;
    let transactionAmount = amount;

    if (type === 'add') {
        newBalance += amount;
    } else {
        newBalance -= amount;
        transactionAmount = -amount; 
    }

    // Fix: Cast update and insert payloads to any
    await supabase.from('profiles').update({ balance: newBalance } as any).eq('id', userId);
    await supabase.from('transactions').insert([{
        user_id: userId,
        amount: transactionAmount,
        description: description || (type === 'add' ? "Admin qo'shdi" : "Admin ayirdi"),
    } as any]);
};

export const giveGlobalBonus = async (amount: number, description: string = "Admin Bonusi"): Promise<{ successCount: number, skippedCount: number }> => {
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, balance');
    
    if (userError) throw userError;
    if (!users) return { successCount: 0, skippedCount: 0 };

    let successCount = 0;
    let skippedCount = 0;

    for (const user of users) {
        // Fix: Cast loop user item to any for field access
        const usr = user as any;
        const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', usr.id)
            .eq('description', description)
            .maybeSingle();

        if (existing) {
            skippedCount++;
            continue;
        }

        const newBalance = (usr.balance || 0) + amount;
        // Fix: Cast update and insert payloads to any
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance } as any)
            .eq('id', usr.id);
        
        if (!updateError) {
            await supabase.from('transactions').insert([{
                user_id: usr.id,
                amount: amount,
                description: description
            } as any]);
            successCount++;
        }
    }

    return { successCount, skippedCount };
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data;
};

export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
  // Fix: Cast insert payload to any array
  const { error } = await supabase
    .from('payment_requests')
    .insert([{ user_id: userId, amount, screenshot_url: screenshotUrl, status: 'pending' } as any]);

  if (error) throw error;
};

export const getPremiumUsers = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .gt('balance', 0)
        .order('balance', { ascending: false });
    
    if (error) return [];
    return data;
};

// --- SUPPORT & CHAT SERVICES ---

export const getNews = async (): Promise<News[]> => {
    const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (error) {
        console.warn("News table likely missing:", error.message);
        return [];
    }
    return data || [];
}

export const createNews = async (title: string, content: string) => {
    // Fix: Cast insert payload to any array
    const { error } = await supabase.from('news').insert([{ title, content } as any]);
    if (error) {
        if (error.code === '42P01') throw new Error("News jadvali topilmadi. Admin settingsda qayta quring.");
        throw error;
    }
};

export const deleteNews = async (id: number) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw error;
};

export const createTicket = async (userId: string): Promise<SupportTicket> => {
    // Fix: Cast insert payload to any array
    const { data, error } = await supabase
        .from('support_tickets')
        .insert([{ 
            user_id: userId, 
            subject: 'Yangi Murojaat', 
            status: 'open',
            description: 'Chatdan boshlandi'
        } as any])
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getAllTickets = async (): Promise<SupportTicket[]> => {
    try {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*, profiles(full_name, email, avatar_url)')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error: any) {
        // Fallback: if relationship missing (PGRST200), fetch without profile join to prevent app crash
        if (error.code === 'PGRST200') {
             const { data } = await supabase
                .from('support_tickets')
                .select('*')
                .order('updated_at', { ascending: false });
             return data || [];
        }
        console.error("Ticket fetch error:", error);
        return [];
    }
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    try {
        const { data, error } = await supabase
            .from('ticket_messages')
            .select('*, profiles(full_name, avatar_url)')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (error: any) {
         // Fallback: if relationship missing (PGRST200)
        if (error.code === 'PGRST200') {
            const { data } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });
            return data || [];
        }
        console.error("Message fetch error:", error);
        return [];
    }
};

export const sendMessage = async (ticketId: number, senderId: string, message: string, isAdmin: boolean = false) => {
    // Fix: Cast insert and update payloads to any
    const { error } = await supabase
        .from('ticket_messages')
        .insert([{ ticket_id: ticketId, sender_id: senderId, message, is_admin: isAdmin } as any]);
    if (error) throw error;

    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() } as any).eq('id', ticketId);
};

// --- ADS & PROMOCODES ---

export const getAds = async (): Promise<Ad[]> => {
    const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        type: ad.type,
        contentUrl: ad.content_url,
        targetUrl: ad.target_url,
        location: ad.location,
        status: ad.status,
        view_count: ad.view_count || 0
    }));
};

export const incrementAdView = async (id: number) => {
    try {
        const { data } = await supabase.from('ads').select('view_count').eq('id', id).single();
        // Fix: Added null check and cast for field access
        if (!data) return;
        const current = (data as any).view_count || 0;
        
        // Fix: Cast update payload to any
        await supabase.from('ads').update({ view_count: current + 1 } as any).eq('id', id);
    } catch (e) {
        console.error("Failed to increment ad view:", e);
    }
};

export const saveAd = async (ad: Ad) => {
    const dbAd = {
        name: ad.name,
        type: ad.type,
        content_url: ad.contentUrl,
        target_url: ad.targetUrl,
        location: ad.location,
        status: ad.status,
        view_count: 0
    };
    // Fix: Cast insert payload to any array
    const { error } = await supabase.from('ads').insert([dbAd] as any[]);
    if (error) throw error;
};

export const deleteAd = async (id: number) => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    if (error) throw error;
};

export const getPromocodes = async (): Promise<Promocode[]> => {
    const { data, error } = await supabase.from('promocodes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const savePromocode = async (promo: Promocode) => {
    // Explicitly define the payload to ensure cleaner insertion
    const payload = {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        usage_limit: promo.usage_limit,
        used_count: promo.used_count ?? 0,
        expires_at: promo.expires_at,
        status: promo.status ?? 'active'
    };

    // Fix: Cast insert payload to any array
    const { error } = await supabase.from('promocodes').insert([payload] as any[]);
    
    if (error) {
        console.error("Promocode save error detail:", JSON.stringify(error, null, 2));
        
        // 42P01: undefined_table
        if (error.code === '42P01' || error.message?.includes('relation "promocodes" does not exist')) {
             throw new Error("Xatolik: 'promocodes' jadvali bazada topilmadi. 'Sozlamalar' bo'limiga o'tib SQL kodni yuriting.");
        }

        // 42703: undefined_column
        if (error.code === '42703' || error.message?.includes('column')) {
             throw new Error(`Baza xatosi (Ustun topilmadi): ${error.message}. Agar ustunlar bo'lsa, 'Sozlamalar' bo'limidagi 'Reload Config' buyrug'ini ishlating.`);
        }
        
        if (error.code === '23505') {
            throw new Error("Xatolik: Bunday kodli promokod allaqachon mavjud.");
        }
        
        if (error.code === '42501') {
             throw new Error("Ruxsat yo'q: Faqat adminlar promokod qo'sha oladi.");
        }

        throw new Error(`Saqlashda xatolik: ${error.message || 'Noma\'lum xato'}`);
    }
};

export const deletePromocode = async (id: number) => {
    const { error } = await supabase.from('promocodes').delete().eq('id', id);
    if (error) throw error;
};

export const resetFinancialData = async () => {
    try {
        // Attempt RPC call first (requires function to exist)
        await supabase.rpc('reset_financial_stats');
    } catch (e) {
        // Fallback manual deletion (requires RLS policies to allow)
        await supabase.from('payment_requests').delete().neq('id', 0);
        await supabase.from('transactions').delete().neq('id', 0);
    }
};

// --- BROADCAST SERVICES ---

export const getBroadcasts = async (): Promise<Broadcast[]> => {
    const { data, error } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
    if (error) {
        if (error.code === '42P01') return []; // Table missing
        throw error;
    }
    return data || [];
};

export const createBroadcast = async (broadcast: Omit<Broadcast, 'id' | 'created_at' | 'is_active'>) => {
    // Fix: Cast insert payload to any array
    const { error } = await supabase.from('broadcasts').insert([{
        ...broadcast,
        is_active: true
    } as any]);
    if (error) throw error;
};

export const deleteBroadcast = async (id: number) => {
    const { error } = await supabase.from('broadcasts').delete().eq('id', id);
    if (error) throw error;
};


// --- ADMIN DASHBOARD ---

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: movieCount } = await supabase.from('movies').select('*', { count: 'exact', head: true });
    const { count: reviewCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
    const { count: premiumCount } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved');

    return {
        totalUsers: userCount || 0,
        totalMovies: movieCount || 0,
        totalReviews: reviewCount || 0,
        totalPremium: premiumCount || 0
    };
};

export const getAdminNotificationCounts = async (): Promise<{ financials: number, support: number }> => {
    try {
        const { count: pendingPayments } = await supabase
            .from('payment_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        const { count: openTickets } = await supabase
            .from('support_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        return {
            financials: pendingPayments || 0,
            support: openTickets || 0
        };
    } catch (e) {
        console.error("Failed to fetch admin notification counts:", e);
        return { financials: 0, support: 0 };
    }
};

export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    return [];
};

// --- ATC & CONTEST SERVICES ---

export const getATCWallet = async (userId: string): Promise<ATCWallet> => {
    const { data, error } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (error && error.code !== '42P01') throw error;
    
    if (!data) {
        // Initialize wallet if not exists
        // Fix: Cast insert and select payloads to any
        const { data: newWallet, error: createError } = await supabase.from('atc_wallets').insert([{ user_id: userId, balance: 0 } as any]).select().single();
        if (createError) {
             if (createError.code === '42P01') throw new Error("ATC tizimi yoqilmagan (SQL yuritilmagan)");
             throw createError;
        }
        return newWallet;
    }
    return data;
};

// Full Profile + Wallet Fetcher
export const getProfileWithWallet = async (userId: string): Promise<UserProfile & { atc_balance: number, atc_converted: number, atc_earned: number, active_days: number }> => {
    const profile = await getUserProfile(userId);
    if(!profile) throw new Error("Profil topilmadi");
    
    let wallet;
    try {
        wallet = await getATCWallet(userId);
    } catch(e) {
        // Fallback if ATC not setup yet
        wallet = { balance: 0, total_converted: 0, total_earned: 0, active_days: 0 };
    }
    
    // Fix: Using any cast to safely access fields from potentially missing wallet type
    const wal = wallet as any;
    return {
        ...profile,
        atc_balance: wal.balance || 0,
        atc_converted: wal.total_converted || 0,
        atc_earned: wal.total_earned || 0,
        active_days: wal.active_days || 0
    };
}

export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    const { data, error } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error && error.code !== '42P01') throw error;
    return data || [];
};

export const getContestSettings = async (): Promise<Record<string, any>> => {
    const { data, error } = await supabase.from('contest_settings').select('*');
    if (error && error.code !== '42P01') throw error;
    const settings: Record<string, any> = {};
    data?.forEach((s: any) => {
        try {
            settings[s.key] = JSON.parse(s.value);
        } catch {
            settings[s.key] = s.value;
        }
    });
    return settings;
};

// Admin: Update single setting
export const updateContestSetting = async (key: string, value: any) => {
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    // Fix: Cast update payload to any
    const { error } = await supabase.from('contest_settings').upsert({ key, value: strValue } as any);
    if (error) throw error;
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
    const { data, error } = await supabase.from('contest_tasks').select('*').order('created_at', { ascending: false });
    if (error && error.code !== '42P01') throw error;
    return data || [];
}

// Admin: Create Task
export const createContestTask = async (task: Omit<ContestTask, 'id' | 'created_at' | 'is_active'>) => {
    // Fix: Cast insert payload to any array
    const { error } = await supabase.from('contest_tasks').insert([{ ...task, is_active: true } as any]);
    if (error) throw error;
};

// Admin: Delete Task
export const deleteContestTask = async (id: number) => {
    const { error } = await supabase.from('contest_tasks').delete().eq('id', id);
    if (error) throw error;
};


// Claim Daily Spin or Reward
export const claimATCReward = async (userId: string, amount: number, type: 'spin' | 'task' | 'ad_watch' | 'quiz_win', description: string): Promise<void> => {
    const { data: wallet } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).single();
    if (!wallet) return;

    // Fix: Cast wallet to any for safe field access
    const wal = wallet as any;
    const updatePayload: any = { 
        balance: (wal.balance || 0) + amount,
        total_earned: (wal.total_earned || 0) + amount,
    };

    if (type === 'spin') {
        // If utilizing a spin, we need to see if it was free daily or extra
        const lastSpin = wal.last_spin_at ? new Date(wal.last_spin_at) : new Date(0);
        const today = new Date();
        const isSameDay = lastSpin.getDate() === today.getDate() && 
                          lastSpin.getMonth() === today.getMonth() && 
                          lastSpin.getFullYear() === today.getFullYear();

        if (!isSameDay) {
             updatePayload.last_spin_at = new Date().toISOString();
        } else if (wal.extra_spins > 0) {
             updatePayload.extra_spins = wal.extra_spins - 1;
        }
    }
    
    // Fix: Cast update and insert payloads to any
    await supabase.from('atc_wallets').update(updatePayload as any).eq('user_id', userId);

    await supabase.from('atc_transactions').insert([{
        user_id: userId,
        amount: amount,
        type: type,
        description: description
    } as any]);
};

// QUIZ LOGIC
export const getQuizQuestions = async (limit: number = 5): Promise<QuizQuestion[]> => {
    // Randomly fetch questions via SQL helper or simple JS shuffle if dataset small
    const { data, error } = await supabase.from('quiz_questions').select('*');
    if (error) return [];
    
    // Shuffle array
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
};

export const rewardExtraSpin = async (userId: string, count: number) => {
    const { data: wallet } = await supabase.from('atc_wallets').select('extra_spins').eq('user_id', userId).single();
    if(wallet) {
        // Fix: Any cast for update payload and field access
        await supabase.from('atc_wallets').update({ extra_spins: ((wallet as any).extra_spins || 0) + count } as any).eq('user_id', userId);
    }
}

export const convertATCtoUZS = async (userId: string, atcAmount: number, rate: number): Promise<void> => {
    // Try using RPC function for secure atomic transaction
    try {
        // Fix: Cast rpc payload to any
        const { error } = await supabase.rpc('convert_atc_to_uzs', {
            p_amount: atcAmount,
            p_rate: rate
        } as any);
        
        if (error) throw error;
    } catch (e: any) {
        // FALLBACK (Only if RPC missing, but RLS might block)
        const { data: wallet } = await supabase.from('atc_wallets').select('balance, total_converted').eq('user_id', userId).single();
        // Fix: Added null check and any cast for balance access
        if (!wallet || (wallet as any).balance < atcAmount) throw new Error("ATC yetarli emas (RPC kerak)");

        const wal = wallet as any;
        const uzsAmount = atcAmount * rate;
        
        // Fix: Cast update and insert payloads to any
        await supabase.from('atc_wallets').update({
            balance: wal.balance - atcAmount,
            total_converted: (wal.total_converted || 0) + uzsAmount
        } as any).eq('user_id', userId);

        await supabase.from('atc_transactions').insert([{
            user_id: userId,
            amount: -atcAmount,
            type: 'conversion',
            description: `${atcAmount} ATC -> ${uzsAmount} UZS`
        } as any]);

        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        // Fix: Added null check and any cast for balance access
        if (profile) await supabase.from('profiles').update({ balance: ((profile as any).balance || 0) + uzsAmount } as any).eq('id', userId);

        await supabase.from('transactions').insert([{
            user_id: userId,
            amount: uzsAmount,
            description: "ATC Konvertatsiyasi"
        } as any]);
    }
};

// Contest Ads
export const getContestAds = async (): Promise<ContestAd[]> => {
    const { data, error } = await supabase.from('contest_ads').select('*').eq('is_active', true);
    if(error) return [];
    return data;
}
export const createContestAd = async (ad: any) => {
    // Fix: Cast insert payload to any array
    const { error } = await supabase.from('contest_ads').insert([ad] as any[]);
    if(error) throw error;
}
export const deleteContestAd = async (id: number) => {
    const { error } = await supabase.from('contest_ads').delete().eq('id', id);
    if(error) throw error;
}

// --- ARK (CASH CONTEST) SERVICES ---

export const getArkWallet = async (userId: string): Promise<ArkWallet> => {
    const { data, error } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (!data) {
        // Fix: Cast insert and select payloads to any
        const { data: newWallet } = await supabase.from('ark_wallets').insert([{ user_id: userId } as any]).select().single();
        return newWallet;
    }
    return data;
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    const { data } = await supabase.from('ark_market').select('*').order('created_at', { ascending: true }).limit(50);
    return data || [];
};

export const getArkSettings = async (): Promise<ArkSettings> => {
    const { data } = await supabase.from('ark_settings').select('*');
    const config: any = {};
    data?.forEach((s: any) => {
        try {
            config[s.key] = JSON.parse(s.value); // Handle JSON strings (wheel config, autopilot, schedule)
        } catch (e) {
            config[s.key] = s.value; // Fallback for plain text
        }
    });
    return config as ArkSettings;
}

export const updateArkSettings = async (key: string, value: any) => {
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    // Fix: Cast update payload to any
    await supabase.from('ark_settings').upsert({ key, value: strValue } as any);
};

export const requestArkWithdrawal = async (userId: string, amountArk: number, card: string, holder: string) => {
    const settings = await getArkSettings();
    const price = Number(settings.current_price || 0);
    const amountUzs = amountArk * price;
    
    const { data: wallet } = await supabase.from('ark_wallets').select('balance').eq('user_id', userId).single();
    // Fix: Added null check and any cast for balance access
    if (!wallet || (wallet as any).balance < amountArk) throw new Error("Mablag' yetarli emas");
    
    // Fix: Cast update and insert payloads to any
    await supabase.from('ark_wallets').update({ balance: (wallet as any).balance - amountArk } as any).eq('user_id', userId);
    
    await supabase.from('ark_withdrawals').insert([{
        user_id: userId, amount_ark: amountArk, amount_uzs: amountUzs, card_number: card, card_holder: holder, status: 'pending'
    } as any]);
};

export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    return data || [];
}

export const approveArkWithdrawal = async (id: number) => {
    // Fix: Cast update payload to any
    await supabase.from('ark_withdrawals').update({ status: 'approved' } as any).eq('id', id);
}

export const getArkAds = async (): Promise<ArkAd[]> => {
    const { data } = await supabase.from('ark_ads').select('*').eq('is_active', true);
    return data || [];
}
// Fix: Cast insert payload to any array
export const createArkAd = async (ad: any) => { await supabase.from('ark_ads').insert([ad] as any[]); }
export const deleteArkAd = async (id: number) => { await supabase.from('ark_ads').delete().eq('id', id); }

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    const { data } = await supabase.from('ark_quizzes').select('*');
    return data || [];
}
// Fix: Cast insert payload to any array
export const createArkQuiz = async (quiz: any) => { await supabase.from('ark_quizzes').insert([quiz] as any[]); }
export const deleteArkQuiz = async (id: number) => { await supabase.from('ark_quizzes').delete().eq('id', id); }

export const rewardArkSpins = async (userId: string, spins: number) => {
    const { data: wallet } = await supabase.from('ark_wallets').select('available_spins').eq('user_id', userId).single();
    // Fix: Added null check and cast to any for available_spins update
    if (wallet) await supabase.from('ark_wallets').update({ available_spins: ((wallet as any).available_spins || 0) + spins } as any).eq('user_id', userId);
}

export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    const { data: wallet } = await supabase.from('ark_wallets').select('*').eq('user_id', userId).single();
    // Fix: Added null check and any cast for fields access and updates
    if (!wallet) return;
    const w = wallet as any;
    const updates: any = { available_spins: (w.available_spins || 0) - 1 };
    
    if