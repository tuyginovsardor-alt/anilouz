

// Fix: Added the missing ContentItem interface based on its usage in constants.ts.
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
  videoUrl?: string; // New field for the actual video file/link
  genre: string;
  language: string;
  quality: string;
  rating: number;
  is_archived?: boolean; // New field for archiving
  view_count?: number; // New field for analytics
  tags?: string; // NEW: Additional search keywords
  status?: 'ongoing' | 'completed'; // Status field
  translator?: string; // NEW: Translator name
}

export interface Review {
  id: number;
  movie_id: number;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: UserProfile; // Joined user data
  movies?: Movie; // Joined movie data (optional)
}

export interface Episode {
  title: string;
  sourceType: 'url' | 'file';
  source: string | File;
}

export type UserRole = 'user' | 'admin' | 'manager' | 'support' | 'accountant' | 'owner' | 'premium';

export interface UserProfile {
  id: string;
  short_id?: string; // 6 xonali ID raqam
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  role: UserRole;
  balance: number;
  phone?: string;
  created_at: string;
  total_watch_time?: number; // Sekundlarda umumiy ko'rish vaqti (Analytics uchun qoladi)
  free_trial_started_at?: string; // YANGI: 3 soatlik vaqt qachon boshlangani
  subscription_end_at?: string; // Obuna tugash sanasi
  subscription_plan?: string; // YANGI: '1-oy', '3-oy', '6-oy', '1-yil'
  email_notifications?: boolean;
  push_notifications?: boolean;
  language?: string;
  device_id?: string; // YANGI: Qurilma identifikatori
  is_online?: boolean; // Computed: Hozir saytdami
  last_active?: string; // Computed: Oxirgi marta qachon kirgan
}

export interface UserDevice {
    id: number;
    user_id: string;
    device_id: string;
    device_name: string; // e.g. "Chrome on Windows"
    last_active: string;
    is_blocked: boolean;
    ip_address?: string;
    profiles?: UserProfile;
}

export interface DeviceRegistration {
    device_id: string;
    attempt_count: number;
    last_attempt_at: string;
}

export interface PaymentRequestDB {
  id: number;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  screenshot_url: string;
  created_at: string;
  profiles?: UserProfile; // Join qilinganda keladi
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  created_at: string;
}

export interface GeminiAnalysisResult {
  isAuthentic: boolean;
  reasoning: string;
  extractedAmount: number | null;
  currency: string | null;
  transactionDate: string | null;
  transactionTime: string | null;
  fingerprint: string;
}

export interface PaymentVerificationRequest {
    id: number;
    user: {
        name: string;
        email: string;
    };
    declaredAmount: number;
    screenshotUrl: string;
    geminiAnalysis: GeminiAnalysisResult;
    status: 'pending' | 'approved' | 'rejected';
}

export interface Ad {
  id?: number;
  name: string;
  type: 'video' | 'banner'; 
  contentUrl: string;
  targetUrl: string;
  location: 
    | 'pre_roll_video'
    | 'player_overlay_full' // Full screen video ad
    | 'player_overlay_popup' // Small video popup
    | 'player_overlay_large_banner'
    | 'player_overlay_small_banner'
    | 'welcome_bottom'
    | 'search_top'
    | 'detail_top';
  status: 'active' | 'inactive';
  view_count?: number; // New analytics
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
    subject: string;
    status: 'open' | 'closed';
    created_at: string;
    updated_at?: string;
    description?: string;
    profiles?: UserProfile;
    last_message?: string; // UI helper
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
    is_active: boolean;
}

export interface AppConfig {
    key: string;
    value: string;
    description?: string;
}

export interface SocialLink {
    id?: number;
    platform: 'instagram' | 'facebook' | 'youtube' | 'telegram';
    url: string;
    label: string; // Masalan: "Asosiy kanal", "Zahira"
    created_at?: string;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

// Chat types (AI Bot)
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

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: number;
}

export enum AppView {
  Chat = 'chat',
  Settings = 'settings',
  About = 'about'
}

export interface DashboardStats {
    totalUsers: number;
    totalMovies: number;
    totalPremium: number; // Approximate based on approved payments
    totalReviews: number;
}

export interface ActivityLog {
    id: string | number;
    type: 'review' | 'movie' | 'user_join' | 'payment';
    title: string;
    description: string;
    time: string;
    user?: string;
}

export interface CulturalAnalysis {
  detectedLanguage: string;
  isoCode: string;
  englishTranslation: string;
  pronunciation: string;
  friendlyResponse: string;
  culturalFacts: string[];
}

// --- LEGAL DOCS ---
export type LegalDocType = 'privacy' | 'security' | 'terms';

// --- CONTEST (ATC) TYPES ---

export interface ATCWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    total_converted: number;
    active_days: number;
    last_spin_at: string | null;
    extra_spins: number; // NEW: earned from quiz
}

export interface ATCTransaction {
    id: number;
    amount: number;
    type: 'spin' | 'task' | 'conversion' | 'bonus' | 'ad_watch' | 'quiz_win';
    description: string;
    created_at: string;
}

export interface ContestTask {
    id: number;
    platform: 'telegram' | 'instagram' | 'youtube' | 'facebook' | 'other';
    url: string;
    label: string;
    reward_atc: number;
    is_active: boolean;
    is_completed?: boolean; // UI helper
}

export interface ContestAd {
    id: number;
    title: string;
    media_type: 'video' | 'image';
    media_url: string;
    reward_atc: number;
    duration_sec: number;
    is_active: boolean;
    created_at: string;
}

export interface WheelPrize {
    id: number;
    label: string;
    value: number;
    type: 'atc' | 'uzs' | 'loss' | 'box' | 'ark'; // Added 'ark' and 'box'
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

// --- ARK (CASH CONTEST) TYPES ---

export interface ArkWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    frozen_balance: number;
    available_spins: number;
    created_at: string;
}

export interface ArkMarketData {
    id: number;
    price: number;
    created_at: string;
}

export interface ArkTransaction {
    id: number;
    amount: number;
    type: 'spin' | 'bonus' | 'trade' | 'withdraw_hold' | 'withdraw_fail' | 'withdraw_success' | 'ad_watch';
    description: string;
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
    admin_note?: string;
    created_at: string;
    profiles?: UserProfile;
}

export interface ArkSettings {
    game_status: 'active' | 'paused' | 'finished' | 'closed'; // Added 'closed'
    current_price: number;
    start_time?: string;
    end_time?: string;
    start_message?: string;
    wheel_config?: WheelPrize[];
    autopilot_config?: ArkAutopilotConfig; // New
    market_schedule?: ArkSchedule; // New
}

export interface ArkAutopilotConfig {
    unit_views: number; // e.g. 10000
    revenue_per_unit: number; // e.g. 200000 UZS
    market_share_percent: number; // e.g. 45%
}

export interface ArkSchedule {
    start_date: string;
    duration_hours: number;
    growth_percent: number;
    is_active: boolean;
}

export interface ArkAd {
    id: number;
    title: string;
    media_type: 'video' | 'image';
    media_url: string;
    reward_ark: number;
    duration_sec: number;
    is_active: boolean;
    created_at: string;
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
    created_at: string;
}