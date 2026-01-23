
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

/** 
 * Added missing types based on component errors 
 */

export interface ATCWallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_converted: number;
  active_days: number;
  extra_spins: number;
  last_spin_at: string | null;
}

export interface ATCTransaction {
  id: number;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export interface ContestTask {
  id: number;
  label: string;
  url: string;
  reward_atc: number;
  platform: 'telegram' | 'instagram' | 'youtube' | 'facebook' | 'other';
  is_active: boolean;
}

export interface WheelPrize {
  id: number;
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
  reward_atc?: number;
  created_at: string;
}

export interface ContestAd {
  id: number;
  title: string;
  media_type: 'video' | 'image';
  media_url: string;
  reward_atc: number;
  duration_sec: number;
  is_active: boolean;
}

export interface ArkWallet {
  user_id: string;
  balance: number;
  available_spins: number;
  total_earned: number;
  created_at: string;
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

export interface ArkWithdrawal {
  id: number;
  user_id: string;
  amount_ark: number;
  amount_uzs: number;
  card_number: string;
  card_holder: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: UserProfile;
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
  platform: 'instagram' | 'telegram' | 'youtube' | 'facebook' | 'globe';
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
  profiles?: UserProfile;
}

export interface UserDevice {
  id: number;
  user_id: string;
  device_id: string;
  device_name: string;
  last_active: string;
  is_blocked: boolean;
  profiles?: UserProfile;
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

export interface SupportTicket {
  id: number;
  user_id: string;
  status: 'open' | 'closed';
  created_at: string;
  profiles?: UserProfile;
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

export interface Transaction {
  id: number;
  user_id: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface ShopProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discount_percent?: number;
  category: ' figure' | 'clothing' | 'accessory' | 'other';
  image_url: string;
  rating: number;
  sales_count: number;
  stock_count: number;
  delivery_time: string;
  specifications: Record<string, string>;
  is_active: boolean;
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
  status: 'pending' | 'shipped' | 'delivered' | 'canceled';
  created_at: string;
  product?: ShopProduct;
}

export interface Broadcast {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  target_group: 'all' | 'premium' | 'user';
  created_at: string;
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

export enum AppView {
  Chat = 'chat',
  Settings = 'settings',
  About = 'about'
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: number;
}

export interface CulturalAnalysis {
  detectedLanguage: string;
  isoCode: string;
  englishTranslation: string;
  pronunciation: string;
  friendlyResponse: string;
  culturalFacts: string[];
}
