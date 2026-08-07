import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Anime, Episode, UserProfile, SocialLink } from '../types';
import { ANIME_DATABASE } from '../data/animeData';

/**
 * Normalizes video URLs from external cloud storages (Dropbox, Google Drive, Telegram, etc.)
 */
export function normalizeVideoUrl(url: string | null | undefined): string {
  if (!url) return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  
  let cleanUrl = url.trim();

  // Handle Dropbox links
  if (cleanUrl.includes('dropbox.com')) {
    cleanUrl = cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    cleanUrl = cleanUrl.replace('?dl=0', '?dl=1');
    return cleanUrl;
  }

  // Handle Google Drive links
  if (cleanUrl.includes('drive.google.com')) {
    const match = cleanUrl.match(/\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }

  return cleanUrl;
}

/**
 * Map Supabase database row to the standard Anime UI model
 */
function mapRowToAnime(row: any, index: number): Anime {
  const fallbackAnime = ANIME_DATABASE[index % ANIME_DATABASE.length];

  // Parse genres
  let genres: string[] = [];
  if (Array.isArray(row.genres)) {
    genres = row.genres;
  } else if (typeof row.genres === 'string') {
    try {
      genres = JSON.parse(row.genres);
    } catch {
      genres = row.genres.split(',').map((g: string) => g.trim());
    }
  } else if (row.genre) {
    genres = typeof row.genre === 'string' ? row.genre.split(',').map((g: string) => g.trim()) : [String(row.genre)];
  } else {
    genres = fallbackAnime.genres;
  }

  // Parse voiceovers
  let voiceovers: string[] = ["Anilo Studio (O'zbekcha)"];
  if (Array.isArray(row.voiceovers)) voiceovers = row.voiceovers;
  else if (typeof row.voiceovers === 'string') voiceovers = row.voiceovers.split(',').map((v: string) => v.trim());

  // Parse episodes
  let episodes: Episode[] = [];
  if (Array.isArray(row.episodes) && row.episodes.length > 0) {
    episodes = row.episodes.map((ep: any, epIdx: number) => ({
      id: ep.id || `ep-${row.id || index}-${epIdx + 1}`,
      number: ep.number || ep.episode_number || epIdx + 1,
      title: ep.title || `${epIdx + 1}-qism`,
      duration: ep.duration || '24:00',
      videoUrl: normalizeVideoUrl(ep.videoUrl || ep.video_url || ep.url || row.video_url),
      thumbnail: ep.thumbnail || row.poster_url || row.poster_image || fallbackAnime.posterImage,
      releaseDate: ep.releaseDate || ep.release_date || ''
    }));
  } else {
    // Generate default episodes if total_episodes specified
    const epCount = row.total_episodes || row.episodes_count || 12;
    episodes = Array.from({ length: Math.min(epCount, 24) }, (_, i) => ({
      id: `ep-${row.id || index}-${i + 1}`,
      number: i + 1,
      title: `${i + 1}-qism: Ozodlik yo'lidagi kurash`,
      duration: '24:00',
      videoUrl: normalizeVideoUrl(row.video_url || row.videoUrl || fallbackAnime.videoUrl),
      thumbnail: row.poster_url || row.poster_image || fallbackAnime.posterImage
    }));
  }

  const rawPoster = row.poster_url || row.poster_image || row.poster || row.image_url || fallbackAnime.posterImage;
  const rawBanner = row.banner_url || row.banner_image || row.banner || row.cover_url || rawPoster || fallbackAnime.bannerImage;

  return {
    id: String(row.id || row.slug || `supabase-anime-${index}`),
    title: row.title || row.name || row.title_uz || fallbackAnime.title,
    titleOriginal: row.title_original || row.original_title || row.japanese_title || fallbackAnime.titleOriginal,
    year: Number(row.year || row.release_year || 2024),
    rating: Number(row.rating || row.score || 8.8),
    genres: genres.length > 0 ? genres : fallbackAnime.genres,
    episodeCount: row.episode_count || `${episodes.length}-qism`,
    totalEpisodes: Number(row.total_episodes || row.episodes_count || episodes.length || 12),
    season: row.season || '1-fasl',
    description: row.description || row.synopsis || row.about || fallbackAnime.description,
    bannerImage: rawBanner,
    posterImage: rawPoster,
    videoUrl: normalizeVideoUrl(row.video_url || row.videoUrl || fallbackAnime.videoUrl),
    isTrending: Boolean(row.is_trending ?? (index % 2 === 0)),
    isPopular: Boolean(row.is_popular ?? true),
    isNew: Boolean(row.is_new ?? (row.year >= 2024)),
    status: (row.status === 'Yakunlangan' || row.status === 'Completed') ? 'Yakunlangan' : 'Ongoing',
    studio: row.studio || row.production || 'Anilo Studio',
    voiceovers,
    releaseYear: Number(row.release_year || row.year || 2024),
    views: row.views || row.view_count ? `${row.views || row.view_count}` : '500K',
    episodes
  };
}

/**
 * Fetch all animes/movies from Supabase database tables (`movies`, `animes`, `anime`)
 */
export async function getAnimesFromDatabase(): Promise<Anime[]> {
  try {
    // Try querying 'movies' table first
    let { data, error } = await supabase.from('movies').select('*');

    if (error || !data || data.length === 0) {
      // Try querying 'animes' table
      const res = await supabase.from('animes').select('*');
      if (!res.error && res.data && res.data.length > 0) {
        data = res.data;
      } else {
        // Try querying 'anime' table
        const res2 = await supabase.from('anime').select('*');
        if (!res2.error && res2.data && res2.data.length > 0) {
          data = res2.data;
        } else {
          // Try querying 'content' table
          const res3 = await supabase.from('content').select('*');
          if (!res3.error && res3.data && res3.data.length > 0) {
            data = res3.data;
          } else {
            // Try querying 'videos' table
            const res4 = await supabase.from('videos').select('*');
            if (!res4.error && res4.data && res4.data.length > 0) {
              data = res4.data;
            }
          }
        }
      }
    }

    if (data && data.length > 0) {
      const dbAnimes = data.map((row, idx) => mapRowToAnime(row, idx));
      return dbAnimes;
    }
  } catch (err) {
    console.warn('Supabase fetch failed or table missing, using local dataset:', err);
  }

  return ANIME_DATABASE;
}

/* =========================================================================
   AUTH FUNCTIONS (Supabase Authentication: Email & Google OAuth)
   ========================================================================= */

/**
 * Sign Up with Email and Password
 */
export async function signUpWithEmail(email: string, pass: string, name?: string) {
  if (!isSupabaseConfigured()) {
    return {
      user: {
        id: 'local-user-' + Date.now(),
        email,
        user_metadata: { full_name: name || email.split('@')[0] }
      }
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name || email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.warn('Supabase signUp error, falling back to local user session:', err);
    return {
      user: {
        id: 'local-user-' + Date.now(),
        email,
        user_metadata: { full_name: name || email.split('@')[0] }
      }
    };
  }
}

/**
 * Sign In with Email and Password
 */
export async function signInWithEmail(email: string, pass: string) {
  if (!isSupabaseConfigured()) {
    return {
      user: {
        id: 'local-user-' + Date.now(),
        email,
        user_metadata: { full_name: email.split('@')[0] }
      }
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.warn('Supabase signIn error, falling back to local user session:', err);
    return {
      user: {
        id: 'local-user-' + Date.now(),
        email,
        user_metadata: { full_name: email.split('@')[0] }
      }
    };
  }
}

/**
 * Sign In / Register with Google OAuth
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    return {
      user: {
        id: 'google-user-' + Date.now(),
        email: 'user@gmail.com',
        user_metadata: { full_name: 'Google User' }
      }
    };
  }

  try {
    const currentOrigin = window.location.origin.replace(/\/$/, '');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${currentOrigin}/`,
      },
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.warn('Supabase Google OAuth error, falling back to local Google user:', err);
    return {
      user: {
        id: 'google-user-' + Date.now(),
        email: 'user@gmail.com',
        user_metadata: { full_name: 'Google User' }
      }
    };
  }
}

/**
 * Sign Out
 */
export async function signOutUser() {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }
}

/**
 * Get current session and user
 */
export async function getCurrentUserSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return null;
  return session;
}

/**
 * Subscribe to Auth Session changes
 */
export function onAuthStateChange(callback: (session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
}

/**
 * Get user profile from Supabase database ('profiles' or 'users' table)
 */
export async function getUserProfileFromDatabase(userId?: string): Promise<Partial<UserProfile> | null> {
  try {
    const session = await getCurrentUserSession();
    const uid = userId || session?.user?.id;
    if (!uid) return null;

    let { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (!data) {
      const res = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
      if (res.data) data = res.data;
    }

    if (data) {
      return {
        name: data.full_name || data.name || data.username,
        avatar: data.avatar_url || data.avatar || data.image,
        coverImage: data.cover_image || data.cover_url || data.banner,
        isPremium: Boolean(data.is_premium ?? data.premium ?? false),
      };
    }
  } catch (e) {
    console.warn('Failed to load profile from Supabase:', e);
  }
  return null;
}

/**
 * Save / Update user profile to Supabase database ('profiles' table)
 */
export async function saveUserProfileToDatabase(profile: Partial<UserProfile>, userId?: string) {
  try {
    const session = await getCurrentUserSession();
    const uid = userId || session?.user?.id;
    if (!uid) return;

    const payload = {
      id: uid,
      full_name: profile.name,
      avatar_url: profile.avatar,
      cover_image: profile.coverImage,
      is_premium: profile.isPremium,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  } catch (e) {
    console.warn('Failed to save profile to Supabase:', e);
  }
}

/* =========================================================================
   APP CONFIG & SOCIAL LINKS SERVICES (Legacy & Custom Settings)
   ========================================================================= */

export async function getAppConfig(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.from('app_config').select('*');
    if (data && data.length > 0) {
      const config: Record<string, string> = {};
      data.forEach((row: any) => {
        config[row.key] = row.value;
      });
      return config;
    }
  } catch {
    // fallback
  }
  return {
    card_number: '8600 0000 0000 0000',
    card_holder: 'ANILO UZ',
    price_1_oy: '9999',
    price_3_oy: '28500',
    price_6_oy: '51000',
    price_1_yil: '90000',
    free_trial_minutes: '60'
  };
}

export async function updateAppConfig(key: string, value: string): Promise<void> {
  try {
    await supabase.from('app_config').upsert({ key, value });
  } catch (e) {
    console.error('Failed to update app config:', e);
  }
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const { data } = await supabase.from('social_links').select('*');
    if (data) return data;
  } catch {
    // fallback
  }
  return [
    { id: '1', platform: 'telegram', url: 'https://t.me/anilo_uz' },
    { id: '2', platform: 'instagram', url: 'https://instagram.com/anilo.uz' }
  ];
}

export async function addSocialLink(link: Omit<SocialLink, 'id'>): Promise<void> {
  try {
    await supabase.from('social_links').insert([link]);
  } catch (e) {
    console.error('Failed to add social link:', e);
  }
}

export async function deleteSocialLink(id: number): Promise<void> {
  try {
    await supabase.from('social_links').delete().eq('id', id);
  } catch (e) {
    console.error('Failed to delete social link:', e);
  }
}
