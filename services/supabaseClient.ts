
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const finalUrl = SUPABASE_URL || "https://placeholder-project.supabase.co";
const finalKey = SUPABASE_ANON_KEY || "placeholder-key";

// Custom fetch with Retry Logic (Aloqa uzilsa qayta ulanish uchun)
const fetchWithRetry = async (url: any, options: any, retries = 3, backoff = 300) => {
    try {
        const response = await fetch(url, options);
        // Agar 5xx (Server xatosi) yoki 408 (Timeout) bo'lsa, xatolik deb hisoblab qayta urinamiz
        if (!response.ok && (response.status >= 500 || response.status === 408)) {
            throw new Error(`Retrying due to ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2); // Exponential backoff
        }
        throw error;
    }
};

// Build jarayonida 'Database' interfeysi bilan bog'liq xatolarni yo'q qilish uchun 'any'
export const supabase = createClient<any>(finalUrl, finalKey, {
    auth: {
        persistSession: true, // Sessiyani saqlash
        autoRefreshToken: true, // Tokenni avtomatik yangilash
        detectSessionInUrl: true,
        storageKey: 'anilo_auth_token',
        storage: window.localStorage
    },
    global: {
        fetch: fetchWithRetry, // Biz yozgan kuchaytirilgan fetch funksiyasi
        headers: { 'x-client-info': 'anilo-uz-web' }
    },
    db: {
        schema: 'public',
    },
    // Realtime connection sozlamalari
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});