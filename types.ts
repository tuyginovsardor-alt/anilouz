
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
  // Added missing properties to fix error in SettingsPage.tsx
  language?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  is_online?: boolean;
  last_active?: string;
  created_at?: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
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

export type ATCTransaction = Transaction;

export interface ATCWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    total_converted: number;
    active_days: number;
    last_spin_at: string | null;
    extra_spins: number;
}

export interface ContestTask {
    id: number;
    label: string;
    url: string;
    reward_atc: number;
    platform: 'telegram' | 'instagram' | 'youtube' | 'facebook' | 'other';
    created_at?: string;
}

export interface ContestAd {
    id: number;
    title: string;
    media_type: 'video' | 'image';
    media_url: string;
    reward_atc: number;
    duration_sec: number;
    is_active?: boolean;
    created_at?: string;
}

export interface WheelPrize {
    id: number | string;
    label: string;
    value: number;
    type: 'atc' | 'uzs' | 'loss' | 'ark' | 'box';
    color: string;
    probability: number;
}

export interface QuizQuestion {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    created_at?: string;
}

export interface ArkWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    available_spins: number;
}

export interface ArkMarketData {
    id: number;
    price: number;
    created_at: string;
}

export interface ArkAd {
    id: number;
    title: string;
    media_type: 'video' | 'image';
    media_url: string;
    reward_ark: number;
    duration_sec: number;
    is_active: boolean;
    view_count?: number;
    created_at?: string;
}

export interface ArkQuiz {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    reward_spins: number;
}

export interface Broadcast {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent';
    target_group: 'all' | 'premium' | 'user';
    created_at: string;
}

export interface ArkWithdrawal {
    id: number;
    user_id: string;
    amount_ark: number;
    amount_uzs: number;
    card_number: string;
    card_holder: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles?: { full_name: string; email: string };
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

export interface ContentItem {
    id: number;
    title: string;
    imageUrl: string;
}

export interface SocialLink {
    id: number;
    platform: 'instagram' | 'telegram' | 'youtube' | 'facebook' | 'other';
    url: string;
    label: string;
}

export interface PaymentRequestDB {
    id: number;
    user_id: string;
    amount: number;
    screenshot_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles?: { full_name: string; email: string };
}

export interface UserDevice {
    id: number;
    user_id: string;
    device_id: string;
    device_name: string;
    last_active: string;
    is_blocked: boolean;
    profiles?: { full_name: string; email: string; role: string };
}

export interface Promocode {
    id?: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    usage_limit: number | null;
    expires_at: string | null;
    used_count: number;
    status: 'active' | 'inactive' | 'expired';
}

export interface SupportTicket {
    id: number;
    user_id: string;
    status: 'open' | 'closed';
    created_at: string;
    profiles?: { full_name: string; email: string };
}

export interface TicketMessage {
    id: number;
    ticket_id: number;
    sender_id: string;
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

export interface DashboardStats {
    totalUsers: number;
    totalMovies: number;
    totalPremium: number;
    totalReviews: number;
}

export interface ActivityLog {
    id: number;
    title: string;
    description: string;
    time: string;
}

export interface CulturalAnalysis {
  detectedLanguage: string;
  isoCode: string;
  englishTranslation: string;
  pronunciation: string;
  friendlyResponse: string;
  culturalFacts: string[];
}

export enum AppView {
  Chat = 'chat',
  Settings = 'settings',
  About = 'about'
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export enum Sender {
  User = 'user',
  Bot = 'bot',
  System = 'system'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isError?: boolean;
}

export interface FandubUpload {
    id: number;
    user_id: string;
    title: string;
    description: string;
    poster_url: string;
    video_url: string;
    genre: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_comment?: string;
    created_at: string;
}

// --- SHOP TYPES ---
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
    specifications?: Record<string, string>;
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
