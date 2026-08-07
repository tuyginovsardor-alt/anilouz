import { createClient } from '@supabase/supabase-js';

// Accessing via import.meta.env which is the Vite standard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

// Create a client only if keys are present
let client = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.error('Supabase client creation failed:', e);
}

export const supabase = client;

if (!supabase) {
  console.warn('Supabase URL or Anon Key is missing. App is running in local-only mode.');
}
