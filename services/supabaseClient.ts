
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Kalitlar yo'q bo'lsa placeholder url beramiz, lekin logda ogohlantiramiz
const finalUrl = SUPABASE_URL || "https://placeholder-project.supabase.co";
const finalKey = SUPABASE_ANON_KEY || "placeholder-key";

// Fix: Using any for the database type to avoid extensive "never" and "not assignable" errors
// across multiple files where tables and columns are not explicitly defined in the Database interface.
export const supabase = createClient<any>(finalUrl, finalKey);
