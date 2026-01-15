
import { createClient } from '@supabase/supabase-js';
import { UserRole, Movie, Episode } from '../types';
// Fix: Import Supabase credentials from config (removed .ts extension for compatibility)
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
        };
      };
      movies: {
        Row: {
          id: number;
          created_at: string;
          title: string;
          year: number;
          plot: string;
          posterUrl: string;
          genre: string;
          language: string;
          quality: string;
          rating: number;
        };
        Insert: Omit<Database['public']['Tables']['movies']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['movies']['Row'], 'id' | 'created_at'>>;
      };
      episodes: {
        Row: {
            id: number;
            created_at: string;
            movie_id: number;
            title: string;
            source: string; // Source in DB must be a string (URL)
        };
        Insert: Omit<Database['public']['Tables']['episodes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['episodes']['Row'], 'id' | 'created_at'>>;
      };
    };
    Enums: {
      user_role: 'user' | 'admin';
    };
  };
}

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase kalitlari yo'q. Ilovani to'g'ri ishlatish uchun .env faylini sozlang.");
    // Biz bu yerda error otmaymiz, shunda app "Connection Error" ekranini ko'rsata oladi
}

// Create client safely (pass empty strings if missing to avoid crash during module load, requests will just fail)
export const supabase = createClient<Database>(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");
