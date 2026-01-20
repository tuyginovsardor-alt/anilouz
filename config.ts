
// --- BU KONFIGURATSIYA FAYLI ---
// Vercel yoki boshqa hostinglarda Environment Variables orqali ishlaydi.

// Vite environment variables
const viteEnv = (import.meta as any).env || {};
// Fallback to process.env (polyfilled by vite.config.ts define)
const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

// Vercel-da foydalanuvchi VITE_SUPABASE_KEY yoki VITE_SUPABASE_ANON_KEY deb yozishi mumkin
// Ikkalasini ham tekshiramiz
export const SUPABASE_URL = viteEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || "";

export const SUPABASE_ANON_KEY = 
    viteEnv.VITE_SUPABASE_ANON_KEY || 
    procEnv.VITE_SUPABASE_ANON_KEY || 
    viteEnv.VITE_SUPABASE_KEY || 
    procEnv.VITE_SUPABASE_KEY || 
    "";

// --- TSPAY CONFIGURATION ---
// Vercelda 'TSPAY_URL' va 'TSPAY_API' deb kiritasiz.
// Vite uchun 'VITE_' prefiksi bilan ham ishlataverasiz.

export const TSPAY_BASE_URL = 
    viteEnv.VITE_TSPAY_URL || 
    procEnv.TSPAY_URL || 
    'https://tspay.uz/api/v1'; // Agar kiritilmasa, default qiymat

export const TSPAY_MERCHANT_TOKEN = 
    viteEnv.VITE_TSPAY_API || 
    procEnv.TSPAY_API || 
    ""; // Bu yer bo'sh qoladi, Verceldan o'qishi kerak

// Debugging help (faqat dev rejimda yoki kalitlar bo'lmasa ko'rinadi)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase kalitlari topilmadi! Vercel Settings -> Environment Variables qismini tekshiring.");
}

if (!TSPAY_MERCHANT_TOKEN) {
    console.warn("TsPay API kaliti topilmadi! Vercel Settings -> Environment Variables da 'TSPAY_API' ni tekshiring.");
}
