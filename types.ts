
export type UserRole = 'user' | 'premium' | 'manager' | 'support' | 'accountant' | 'admin' | 'owner' | 'dub' | 'fandub';

export interface Movie {
  id?: number;
  title: string;
  year: number;
  plot: string;
  posterUrl: string;
  videoUrl: string;
  genre: string;
  language: string;
  quality: string;
  rating: number;
  tags?: string;
  translator?: string;
  translator_id?: string;
  is_archived?: boolean;
  access_type?: 'free' | 'premium';
  status?: 'ongoing' | 'completed';
}

export interface Episode {
    id: number;
    movie_id: number;
    title: string;
    source: string;
    sourceType?: 'url' | 'file';
    created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  balance: number;
  email?: string;
  short_id?: string;
  phone?: string;
  subscription_end_at?: string;
  subscription_plan?: string;
  free_trial_started_at?: string;
  bio?: string;
  fans_count?: number;
  language?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  is_online?: boolean;
  last_active?: string;
  created_at?: string;
}

export interface Ad {
    id?: number;
    name: string;
    type: 'video' | 'banner';
    contentUrl: string;
    targetUrl: string;
    location: 'welcome_bottom' | 'search_top' | 'detail_top' | 'player_overlay_small_banner' | 'player_overlay_large_banner' | 'player_overlay_full' | 'pre_roll_video';
    status: 'active' | 'inactive';
    view_count?: number;
}

export interface Transaction {
    id: number;
    user_id: string;
    amount: number;
    type: 'payment' | 'subscription' | 'bonus' | 'manual';
    description: string;
    created_at: string;
}

// --- SHOP TYPES (UBUY STYLE) ---
export interface ShopProduct {
    id: number;
    title: string;
    description: string;
    price: number;
    discount_percent?: number; 
    rating?: number; 
    sales_count?: number; 
    delivery_time?: string; 
    image_url: string;
    category: 'clothing' | 'figure' | 'accessory' | 'other';
    stock_count: number;
    is_active: boolean;
    specifications?: Record<string, string>; // 20 tagacha texnik xususiyat
    gallery?: string[];
    created_at?: string;
}

export interface ShopWallet {
    user_id: string;
    balance: number;
}

export interface ShopOrder {
    id: number;
    user_id: string;
    product_id: number;
    amount: number;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    address: string;
    phone: string;
    created_at: string;
    shop_products?: ShopProduct;
}

export interface ShopPayment {
    id: number;
    user_id: string;
    amount: number;
    screenshot_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles?: { full_name: string; email: string };
}

// --- CONTEST TYPES ---
export interface ATCWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    total_converted: number;
    active_days: number;
    last_spin_at: string | null;
    extra_spins: number;
}

export interface ArkWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    available_spins: number;
}

export interface WheelPrize {
    id: number | string;
    label: string;
    value: number;
    type: 'atc' | 'uzs' | 'loss' | 'ark' | 'box';
    color: string;
    probability: number;
}
