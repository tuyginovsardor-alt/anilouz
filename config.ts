
// --- BU KONFIGURATSIYA FAYLI ---

// Vite environment variables
const viteEnv = (import.meta as any).env || {};

// Vercel yoki Local .env dan olingan o'zgaruvchilar.
// vite.config.ts dagi `define` orqali bu yerga kelib tushadi.
const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

// Supabase
export const SUPABASE_URL = 
    viteEnv.VITE_SUPABASE_URL || 
    procEnv.VITE_SUPABASE_URL || 
    procEnv.SUPABASE_URL || 
    "";

export const SUPABASE_ANON_KEY = 
    viteEnv.VITE_SUPABASE_ANON_KEY || 
    procEnv.VITE_SUPABASE_ANON_KEY || 
    procEnv.SUPABASE_KEY || 
    "";

// --- TSPAY CONFIGURATION ---
// Endi Vercel-da shunchaki 'TSPAY_URL' va 'TSPAY_API' deb yozsangiz ham ishlaydi.

export const TSPAY_BASE_URL = 
    viteEnv.VITE_TSPAY_URL || 
    procEnv.TSPAY_URL || 
    'https://tspay.uz/api/v1'; // Fallback

export const TSPAY_MERCHANT_TOKEN = 
    viteEnv.VITE_TSPAY_API || 
    procEnv.TSPAY_API || 
    ""; 

// Debugging (Console da tekshirish uchun, ishlab chiqarishda o'chirib qo'yish mumkin)
console.log("TsPay Config Loaded:", {
    url: TSPAY_BASE_URL ? "Set" : "Not Set",
    token: TSPAY_MERCHANT_TOKEN ? "Set (Hidden)" : "Not Set"
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase kalitlari topilmadi!");
}
