export interface ContentItem {
  id: number;
  title: string;
  imageUrl: string;
}

export interface Movie {
  id?: number;
  title: string;
  year: number;
  plot: string;
  posterUrl: string;
  videoUrl?: string;
  genre: string;
  language: string;
  quality: string;
  rating: number;
  is_archived?: boolean;
  view_count?: number;
  tags?: string;
  status?: 'ongoing' | 'completed';
  translator?: string;
}

export interface Review {
  id: number;
  movie_id: number;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: UserProfile;
}

export interface Episode {
  title: string;
  sourceType: 'url' | 'file';
  source: string | File;
}

export type UserRole = 'user' | 'admin' | 'manager' | 'support' | 'accountant' | 'owner' | 'premium';

export interface UserProfile {
  id: string;
  short_id?: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  role: UserRole;
  balance: number;
  phone?: string;
  created_at: string;
  total_watch_time?: number;
  free_trial_started_at?: string;
  subscription_end_at?: string;
  subscription_plan?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  language?: string;
  device_id?: string;
  is_online?: boolean;
  last_active?: string;
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

export interface PaymentRequestDB {
  id: number;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  screenshot_url: string;
  created_at: string;
  profiles?: UserProfile;
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  created_at: string;
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
    profiles?: UserProfile;
}

export interface News {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export interface Broadcast {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent';
    target_group: 'all' | 'premium' | 'user';
    created_at: string;
}

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
    amount: number;
    type: string;
    description: string;
    created_at: string;
}

// Added platform property to ContestTask
export interface ContestTask {
    id: number;
    url: string;
    label: string;
    reward_atc: number;
    platform: 'telegram' | 'instagram' | 'youtube' | 'facebook' | 'other';
}

export interface ContestAd {
    id: number;
    title: string;
    media_type: 'video' | 'image';
    media_url: string;
    reward_atc: number;
    duration_sec: number;
}

export interface WheelPrize {
    id: number;
    label: string;
    value: number;
    type: 'atc' | 'uzs' | 'loss' | 'box' | 'ark';
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
    correct_option: 'a' | 'b' | 'c' | 'd';
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

export interface ArkWithdrawal {
    id: number;
    user_id: string;
    amount_ark: number;
    amount_uzs: number;
    card_number: string;
    card_holder: string;
    status: 'pending' | 'approved' | 'rejected';
    profiles?: UserProfile;
}

export interface ArkAd {
    id: number;
    title: string;
    media_type: 'video' | 'image';
    media_url: string;
    reward_ark: number;
    duration_sec: number;
}

export interface ArkQuiz {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: 'a' | 'b' | 'c' | 'd';
    reward_spins: number;
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

// Added NotificationType
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
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

export interface DashboardStats {
    totalUsers: number;
    totalMovies: number;
    totalPremium: number;
    totalReviews: number;
}

export interface ActivityLog {
    id: string | number;
    title: string;
    description: string;
    time: string;
}

export type LegalDocType = 'privacy' | 'security' | 'terms';

// Added SocialLink
export interface SocialLink {
  id?: number;
  platform: 'instagram' | 'facebook' | 'youtube' | 'telegram';
  url: string;
  label: string;
  created_at?: string;
}

// Added CulturalAnalysis
export interface CulturalAnalysis {
  detectedLanguage: string;
  isoCode: string;
  englishTranslation: string;
  pronunciation: string;
  friendlyResponse: string;
  culturalFacts: string[];
}

// Added AppView
export enum AppView {
  Chat = 'chat',
  Settings = 'settings',
  About = 'about'
}

// Added ChatSession
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}