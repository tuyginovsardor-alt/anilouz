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
  translator_id?: string; // Link to dubbing artist profile
  access_type: 'free' | 'premium';
}

export interface Episode {
  id?: number;
  movie_id: number;
  title: string;
  source: string | File;
  sourceType?: 'url' | 'file';
}

export type UserRole = 'user' | 'admin' | 'manager' | 'support' | 'accountant' | 'owner' | 'premium' | 'dub';

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
  subscription_end_at?: string;
  subscription_plan?: string;
  is_online?: boolean;
  last_active?: string;
  free_trial_started_at?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  language?: string;
  bio?: string; // Dublyajchilar uchun ma'lumot
  studio_name?: string;
  fans_count?: number;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface DBNotification {
    id: number;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    created_at: string;
}

export interface ATCWallet {
    id: string;
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
}

export interface ContestAd {
    id: number;
    title: string;
    media_type: 'video' | 'image';
    media_url: string;
    reward_atc: number;
    duration_sec: number;
    is_active?: boolean;
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

export interface ArkWallet {
    id: string;
    balance: number;
    available_spins: number;
    total_earned: number;
}

export interface ArkMarketData {
    price: number;
    timestamp: string;
}

export interface ArkAd {
    id: number;
    title: string;
    media_type: 'video' | 'image';
    media_url: string;
    reward_ark: number;
    duration_sec: number;
    is_active?: boolean;
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
    id?: number;
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
    lastMessage?: string;
    timestamp: number;
}

export interface CulturalAnalysis {
    detectedLanguage: string;
    isoCode: string;
    englishTranslation: string;
    pronunciation: string;
    friendlyResponse: string;
    culturalFacts: string[];
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

export type LegalDocType = 'privacy' | 'security' | 'terms';

export interface Transaction {
    id: number;
    user_id: string;
    amount: number;
    description: string;
    created_at: string;
}