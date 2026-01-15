import { createClient } from '@supabase/supabase-js';
import { UserRole } from '../types';
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
            source: string; 
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

// Kalitlar yo'q bo'lsa placeholder url beramiz, lekin logda ogohlantiramiz
const finalUrl = SUPABASE_URL || "https://placeholder-project.supabase.co";
const finalKey = SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient<Database>(finalUrl, finalKey);