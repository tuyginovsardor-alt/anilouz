
// --- BU KONFIGURATSIYA FAYLI ---

// Vite environment variables (VITE_ bilan boshlanadiganlar avtomatik keladi)
const viteEnv = import.meta.env;

// Supabase Configuration
export const SUPABASE_URL = viteEnv.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = viteEnv.VITE_SUPABASE_KEY || viteEnv.VITE_SUPABASE_ANON_KEY || "";

// --- TSPAY CONFIGURATION ---
// Endi Vercel-da VITE_TSPAY_URL va VITE_TSPAY_API deb yozilgan bo'lishi shart.

export const TSPAY_BASE_URL = 
    viteEnv.VITE_TSPAY_URL || 
    'https://tspay.uz/api/v1'; // Fallback

export const TSPAY_MERCHANT_TOKEN = 
    viteEnv.VITE_TSPAY_API || 
    ""; 

// Debugging (Console da tekshirish uchun)
if (viteEnv.DEV) {
    console.log("Config Loaded (Vite Standard):", {
        supabase: !!SUPABASE_URL,
        tspay: !!TSPAY_MERCHANT_TOKEN,
        tspay_url: TSPAY_BASE_URL
    });
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase kalitlari topilmadi! .env faylida VITE_SUPABASE_URL va VITE_SUPABASE_KEY borligini tekshiring.");
}

if (!TSPAY_MERCHANT_TOKEN) {
    console.warn("TsPay API kaliti topilmadi (VITE_TSPAY_API). To'lov tizimi ishlamasligi mumkin.");
}
