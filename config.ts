
// --- BU KONFIGURATSIYA FAYLI ---

// Vite environment variables
const viteEnv = (import.meta as any).env || {};

// Supabase Configuration
// 1. Vite env (standart)
// 2. Process env (vite.config.ts da define qilingan fallback)
export const SUPABASE_URL = 
    viteEnv.VITE_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    "";

export const SUPABASE_ANON_KEY = 
    viteEnv.VITE_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY || 
    "";

// --- TSPAY CONFIGURATION ---
// Vercel Environment Variables dan o'qish
export const TSPAY_BASE_URL = 
    viteEnv.VITE_TSPAY_URL || 
    process.env.TSPAY_URL || 
    'https://tspay.uz/api/v1';

export const TSPAY_MERCHANT_TOKEN = 
    viteEnv.VITE_TSPAY_API || 
    process.env.TSPAY_API || 
    ""; 

// Debugging (faqat developmentda ko'rinadi)
if (import.meta.env.DEV) {
    console.log("Config Loaded:", {
        supabase: !!SUPABASE_URL,
        tspay: !!TSPAY_MERCHANT_TOKEN
    });
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase kalitlari topilmadi! Iltimos .env yoki Vercel sozlamalarini tekshiring.");
}
