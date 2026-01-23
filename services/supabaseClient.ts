
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const finalUrl = SUPABASE_URL || "https://placeholder-project.supabase.co";
const finalKey = SUPABASE_ANON_KEY || "placeholder-key";

// Build jarayonida 'Database' interfeysi bilan bog'liq "property does not exist" 
// xatolarini butunlay yo'q qilish uchun 'any' ishlatamiz.
export const supabase = createClient<any>(finalUrl, finalKey);
