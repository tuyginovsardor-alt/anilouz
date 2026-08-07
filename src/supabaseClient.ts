/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('anilo_supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('anilo_supabase_anon_key') : null;

let rawUrl = storedUrl || env.VITE_SUPABASE_URL || 'https://txcmkfltrzzzqwytzatq.supabase.co';
rawUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

export const supabaseUrl = rawUrl;
export const supabaseAnonKey = storedKey || env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4Y21rZmx0cnp6enF3eXR6YXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAyMDA0NDgwMH0.demo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
};
