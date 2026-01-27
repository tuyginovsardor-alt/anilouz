
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const finalUrl = SUPABASE_URL || "https://placeholder-project.supabase.co";
const finalKey = SUPABASE_ANON_KEY || "placeholder-key";

// Custom fetch with Aggressive Retry Logic (Mobil tarmoqlar uchun kuchaytirilgan)
const fetchWithRetry = async (url: any, options: any, retries = 5, backoff = 500) => {
    try {
        const response = await fetch(url, options);
        
        // 502, 503, 504 (Bad Gateway/Service Unavailable) yoki 408 (Timeout) bo'lsa qayta urinamiz
        if (!response.ok && (response.status === 502 || response.status === 503 || response.status === 504 || response.status === 408)) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        return response;
    } catch (error: any) {
        // Agar urinishlar soni qolgan bo'lsa
        if (retries > 0) {
            // Tarmoq xatosi (Internet uzilishi) yoki Server xatosi bo'lsa kutib turamiz
            // console.warn(`Retrying connection... Attempts left: ${retries}`);
            
            await new Promise(resolve => setTimeout(resolve, backoff));
            
            // Keyingi urinishda vaqtni oshiramiz (Exponential backoff: 500ms -> 750ms -> 1125ms...)
            return fetchWithRetry(url, options, retries - 1, backoff * 1.5); 
        }
        // Urinishlar tugadi, xatoni qaytaramiz
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
        // Avtomatik qayta ulanishni yoqish
        // timeout qiymatini oshiramiz
        timeout: 20000, 
    },
});
