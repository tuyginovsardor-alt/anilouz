// --- USER & AUTH TYPES ---
export type UserRole = 'user' | 'admin' | 'owner' | 'manager' | 'shop' | 'dub' | 'support' | 'accountant';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: UserRole;
    balance: number;
    phone?: string;
    short_id?: string;
    created_at: string;
    last_active?: string;
    is_online?: boolean;
    subscription_end_at?: string;
    subscription_plan?: string;
    free_trial_started_at?: string;
    bio?: string;
    fans_count?: number;
    email_notifications?: boolean;
    push_notifications?: boolean;
    language?: string;
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

// --- MOVIE & MEDIA TYPES ---
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
    view_count?: number;
    status?: 'ongoing' | 'completed';
    translator?: string;
    translator_id?: string;
    tags?: string;
    access_type?: 'free' | 'premium';
    is_archived?: boolean;
}

export interface Episode {
    id: number;
    movie_id: number;
    title: string;
    source: string | File;
    sourceType?: 'url' | 'file';
}

export interface ContentItem {
    id: number;
    title: string;
    imageUrl: string;
}

// --- ADVERTISEMENT TYPES ---
export interface Ad {
    id?: number;
    name: string;
    type: 'video' | 'banner';
    contentUrl: string;
    targetUrl: string;
    location: 'welcome_bottom' | 'search_top' | 'detail_top' | 'player_overlay_small_banner' | 'player_overlay_large_banner' | 'player_overlay_full' | 'pre_roll_video';
    status: 'active' | 'inactive';
    view_count: number;
}

export interface ContestAd {
    id: number;
    title: string;
    media_url: string;
    media_type: 'video' | 'image';
    reward_atc: number;
    duration_sec: number;
}

export interface ArkAd {
    id: number;
    title: string;
    media_url: string;
    media_type: 'video' | 'image';
    reward_ark: number;
    duration_sec: number;
    is_active: boolean;
    view_count?: number;
}

// --- NOTIFICATION TYPES ---
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
}

// --- ATC GAME TYPES ---
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

// --- ARK TRADING TYPES ---
export interface ArkWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    available_spins: number;
}

export interface ArkMarketData {
    id: number;
    price: number;
    timestamp: string;
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

// --- FINANCIAL & ADMIN TYPES ---
export interface PaymentRequestDB {
    id: number;
    user_id: string;
    amount: number;
    screenshot_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
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

export interface Broadcast {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent';
    target_group: 'all' | 'premium' | 'user';
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

export interface Transaction {
    id: number;
    user_id: string;
    amount: number;
    description: string;
    created_at: string;
}

// --- SUPPORT & NEWS TYPES ---
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

// --- SHOP TYPES ---
export interface ShopProduct {
    id: number;
    title: string;
    description: string;
    price: number;
    image_url: string;
    category: 'clothing' | 'accessory' | 'figure' | 'other';
    stock_count: number;
    is_active: boolean;
}

export interface ShopWallet {
    user_id: string;
    balance: number;
    total_spent: number;
}

export interface ShopOrder {
    id: number;
    user_id: string;
    product_id: number;
    amount_paid: number;
    delivery_address: string;
    phone_number: string;
    status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
    products?: ShopProduct;
    profiles?: UserProfile;
}

export interface ShopPayment {
    id: number;
    user_id: string;
    amount: number;
    screenshot_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles?: UserProfile;
}

// --- AI & SYSTEM TYPES ---
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
    messages: Message[];
    createdAt: number;
}

export type LegalDocType = 'privacy' | 'security' | 'terms';

export interface CulturalAnalysis {
    detectedLanguage: string;
    isoCode: string;
    englishTranslation: string;
    pronunciation: string;
    friendlyResponse: string;
    culturalFacts: string[];
}

export interface SocialLink {
    id: number;
    platform: 'instagram' | 'telegram' | 'youtube' | 'facebook' | 'globe';
    url: string;
    label: string;
}

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'dub-dashboard' | 'studio' | 'shop' | 'shop-admin';
