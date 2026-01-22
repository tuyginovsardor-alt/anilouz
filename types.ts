
export type UserRole = 'user' | 'premium' | 'manager' | 'support' | 'accountant' | 'admin' | 'owner' | 'dub' | 'fandub';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  balance: number;
  phone: string | null;
  short_id: string | null;
  subscription_end_at: string | null;
  subscription_plan: string | null;
  free_trial_started_at: string | null;
  email_notifications: boolean;
  push_notifications: boolean;
  language: string;
  bio?: string;
  fans_count?: number;
  is_online?: boolean;
  last_active?: string;
  created_at: string;
}

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
  is_fandub?: boolean;
  channel_id?: string;
}

export interface FandubChannel {
    id: string;
    user_id: string;
    name: string;
    username: string;
    bio?: string;
    avatar_url?: string;
    banner_url?: string;
    subscriber_count: number;
    total_likes: number;
    total_views: number;
    balance_usd: number;
    created_at: string;
    is_following?: boolean;
}

export interface FandubStory {
    id: string;
    user_id: string;
    channel_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    created_at: string;
    profiles?: UserProfile;
}

export interface Episode {
    id: number;
    movie_id?: number;
    title: string;
    source: string;
    sourceType?: 'url' | 'file';
}

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Ad {
    id?: number;
    name: string;
    type: 'video' | 'banner';
    contentUrl: string;
    targetUrl: string;
    location: string;
    status: 'active' | 'inactive';
    view_count?: number;
}
