
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const finalUrl = SUPABASE_URL || "https://placeholder-project.supabase.co";
const finalKey = SUPABASE_ANON_KEY || "placeholder-key";

// Supabase mijozi - Standart konfiguratsiya
// Custom fetch olib tashlandi, chunki u ba'zi qurilmalarda 
// auth headerlarini tushirib qoldirishi va aloqani uzishi mumkin.
export const supabase = createClient<any>(finalUrl, finalKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'anilo_auth_token',
        storage: window.localStorage
    },
    db: {
        schema: 'public',
    },
    // Realtime connection sozlamalari
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
        timeout: 30000, // Timeoutni oshiramiz
    },
    // Global fetch o'rniga, Supabase o'zining default fetch mexanizmidan foydalanadi.
    // Bu barqarorlikni oshiradi.
});
