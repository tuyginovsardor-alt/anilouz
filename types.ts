
export type UserRole = 'user' | 'premium' | 'manager' | 'support' | 'accountant' | 'admin' | 'owner' | 'dub' | 'fandub';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  banner_url?: string | null; // Added banner
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

export interface Episode {
    id: number;
    movie_id?: number;
    title: string;
    source: string;
    sourceType?: 'url' | 'file';
}

// --- CONCURS & ATC ---
export interface ATCWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    total_converted: number;
    active_days: number;
    last_spin_at: string | null;
    extra_spins: number;
}

export interface ATCTransaction {
    id: number;
    user_id: string;
    amount: number;
    type: 'spin' | 'task' | 'convert' | 'ad_watch';
    description: string;
    created_at: string;
}

export interface ContestTask {
    id: number;
    label: string;
    url: string;
    reward_atc: number;
    platform: 'telegram' | 'instagram' | 'youtube' | 'facebook' | 'other';
}

export interface WheelPrize {
    id: number;
    label: string;
    value: number;
    type: 'atc' | 'uzs' | 'box' | 'loss' | 'ark';
    probability: number;
    color: string;
}

export interface QuizQuestion {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
}

export interface ContestAd {
    id: number;
    title: string;
    media_url: string;
    media_type: 'video' | 'image';
    reward_atc: number;
    duration_sec: number;
}

// --- ARK TRADING ---
export interface ArkWallet {
    user_id: string;
    balance: number;
    available_spins: number;
    total_earned: number;
}

export interface ArkMarketData {
    id: number;
    price: number;
    created_at: string;
}

export interface ArkAd {
    id: number;
    title: string;
    media_url: string;
    media_type: 'video' | 'image';
    reward_ark: number;
    duration_sec: number;
    // Added is_active property to fix type mismatch in CashContestPage.tsx
    is_active: boolean;
}

export interface ArkQuiz {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    // Added reward_spins property to fix type mismatch in CashContestPage.tsx
    reward_spins: number;
}

export interface ArkWithdrawal {
    id: number;
    user_id: string;
    amount_ark: number;
    amount_uzs: number;
    card_number: string;
    card_holder: string;
    status: 'pending' | 'approved' | 'rejected';
    profiles?: { full_name: string; email: string; };
}

export interface ArkAutopilotConfig {
    unit_views: number;
    revenue_per_unit: number;
    market_share_percent: number;
}

export interface ArkSchedule {
    start_date: string;
    duration_hours: number;
    growth_percent: number;
    is_active: boolean;
}

// --- SHOP ---
export interface ShopProduct {
    id: number;
    title: string;
    price: number;
    discount_percent?: number;
    image_url: string;
    category: 'figure' | 'clothing' | 'accessory' | 'other';
    description: string;
    rating?: number;
    delivery_time?: string;
    specifications?: Record<string, string>;
    stock_count: number;
    is_active: boolean;
    sales_count?: number;
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
    address: string;
    phone: string;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
    products?: ShopProduct;
}

// --- FANDUB ---
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
    profiles?: { username: string | null; avatar_url: string | null; };
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
    is_blocked?: boolean;
    admin_comment?: string;
    revenue_share_percent: number;
    view_count: number;
    video_url: string;
    created_at: string;
}

// --- NEW TYPES ADDED TO FIX EXPORT ERRORS ---
export interface FandubPost {
    id: number;
    channel_id: string;
    content: string;
    image_url?: string;
    likes: number;
    created_at: string;
}

export interface PremiumBundle {
    id: number;
    title: string;
    price: number;
    duration_days: number;
    anime_ids: number[];
    created_at: string;
}

// --- SYSTEM ---
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
}

// Added NotificationType to fix error in components/Notification.tsx
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Ad {
    // Made id optional to fix error in AdvertisementPage.tsx line 78
    id?: number;
    name: string;
    type: 'video' | 'banner';
    contentUrl: string;
    targetUrl: string;
    location: string;
    status: 'active' | 'inactive';
    view_count?: number;
}

export interface Transaction {
    id: number;
    user_id: string;
    amount: number;
    created_at: string;
}

export interface SocialLink {
    id: number;
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
    profiles?: { full_name: string | null; email: string | null; role: UserRole; };
}

export interface SupportTicket {
    id: number;
    user_id: string;
    status: 'open' | 'closed';
    created_at: string;
    profiles?: { full_name: string | null; };
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

export interface ContentItem {
    id: number;
    title: string;
    imageUrl: string;
}

export interface Promocode {
    id?: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    usage_limit: number | null;
    used_count: number;
    expires_at: string | null;
    status: 'active' | 'inactive' | 'expired';
}

export interface Broadcast {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent';
    target_group: 'all' | 'premium' | 'user';
    created_at: string;
}

export enum Sender { User, Bot, System }
export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isError?: boolean;
}

export interface PaymentRequestDB {
    id: number;
    user_id: string;
    amount: number;
    screenshot_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles?: { full_name: string; email: string; };
}

// Added missing CulturalAnalysis type to fix error in components/ResultCard.tsx
export interface CulturalAnalysis {
  detectedLanguage: string;
  isoCode: string;
  englishTranslation: string;
  pronunciation: string;
  friendlyResponse: string;
  culturalFacts: string[];
}

// Added missing AppView and ChatSession types to fix errors in components/Sidebar.tsx
export enum AppView { Chat, Settings, About }
export interface ChatSession {
  id: string;
  title: string;
  lastMessageAt: number;
}
