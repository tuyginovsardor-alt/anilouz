
// --- BU KONFIGURATSIYA FAYLI ---
// Vercel yoki boshqa hostinglarda Environment Variables orqali ishlaydi.

// Vite environment variables
const viteEnv = (import.meta as any).env || {};
// Fallback to process.env (polyfilled by vite.config.ts define)
const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

export const SUPABASE_URL = viteEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = viteEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || "";

// Debugging help (ko'rinmaydigan joyda console log)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase kalitlari topilmadi! .env faylini yoki Vercel sozlamalarini tekshiring. URL:", !!SUPABASE_URL, "KEY:", !!SUPABASE_ANON_KEY);
}
