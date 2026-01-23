
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
    profiles?: {
        username: string | null;
        avatar_url: string | null;
    };
}

export interface FandubUpload {
    id: number;
    user_id: string;
    channel_id: string;
    title: string;
    description: string;
    poster_url: string;
    genre: string;
    year: number;
    access_type: 'free' | 'premium';
    episodes: Episode[];
    tags?: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_comment?: string;
    revenue_share_percent: number;
    view_count: number;
    video_url: string;
    created_at: string;
    profiles?: {
        full_name: string | null;
    };
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
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

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

export interface ContentItem {
    id: number;
    title: string;
    imageUrl: string;
}

export interface SocialLink {
    id?: number;
    platform: 'instagram' | 'telegram' | 'youtube' | 'facebook' | 'globe';
    url: string;
    label: string;
}

export interface UserDevice {
    id: number;
    user_id: string;
    device_id: string;
    device_name: string;
    last_active: string;
    is_blocked: boolean;
    profiles?: {
        full_name: string | null;
        email: string | null;
        role: UserRole;
    };
}

export interface SupportTicket {
    id: number;
    user_id: string;
    status: 'open' | 'closed';
    created_at: string;
    profiles?: {
        full_name: string | null;
    };
}

export interface TicketMessage {
    id: number;
    ticket_id: number;
    user_id: string;
    message: string;
    is_admin: boolean;
    created_at: string;
}

export interface News {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export interface Transaction {
    id: number;
    user_id: string;
    amount: number;
    created_at: string;
}
