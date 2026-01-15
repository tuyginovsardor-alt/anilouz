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

// Debugging help (faqat dev rejimda yoki kalitlar bo'lmasa ko'rinadi)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase kalitlari topilmadi! Vercel Settings -> Environment Variables qismini tekshiring.");
    console.log("URL mavjudligi:", !!SUPABASE_URL);
    console.log("KEY mavjudligi:", !!SUPABASE_ANON_KEY);
}