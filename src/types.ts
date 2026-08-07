
export type UserRole = 'user' | 'admin' | 'owner' | 'fandub' | 'courier' | 'courier_applicant';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    banner_url?: string | null;
    bio?: string | null;
    is_online?: boolean;
    role: UserRole;
    balance: number;
    phone: string | null;
    short_id: string;
    email_notifications: boolean;
    push_notifications: boolean;
    language: string;
    created_at: string;
    subscription_plan: string | null;
    subscription_end_at: string | null;
    free_trial_started_at: string | null;
    coverImage?: string;
    isPremium?: boolean;
}

export interface Movie {
    id: number;
    title: string;
    year: number;
    plot: string;
    poster_url: string;
    posterUrl?: string; // Legacy support
    video_url: string;
    videoUrl?: string; // Legacy support
    genre: string;
    tags: string;
    translator: string;
    is_series: boolean;
    status: 'ongoing' | 'completed' | 'pending';
    access_type: 'free' | 'premium';
    language: string;
    quality: string;
    rating: number;
    is_archived: boolean;
    is_blocked: boolean;
    view_count: number;
    type: 'anime' | 'movie' | 'hentai' | 'dorama' | 'multfilm';
    is_fandub?: boolean;
    channel_id?: string;
    genres?: string[]; // Legacy support
    totalEpisodes?: number; // Legacy support
    isNew?: boolean; // Legacy support
    isPopular?: boolean; // Legacy support
}

export interface Episode {
    id: number;
    movie_id: number;
    title: string;
    source: string;
    duration?: number;
    created_at: string;
}

export interface FandubChannel {
    id: string;
    user_id: string;
    name: string;
    description: string;
    avatar_url: string;
    banner_url: string;
    subscriber_count: number;
    is_verified: boolean;
    created_at: string;
    is_following?: boolean;
    social_links?: any;
}

export interface FandubUpload {
    id: number;
    user_id: string;
    channel_id: string;
    title: string;
    description: string;
    poster_url: string;
    video_url: string;
    type: string;
    year: number;
    genre: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    episodes?: Episode[];
    is_blocked: boolean;
    view_count: number;
    access_type: 'free' | 'premium';
    fandub_channels?: { name: string };
}

export interface FandubStory {
    id: number;
    channel_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    created_at: string;
    profiles?: { username: string; avatar_url: string | null };
}

export interface Ad {
    id: number;
    title: string;
    name?: string; // Some parts use name
    media_url: string;
    contentUrl?: string; // Some parts use contentUrl
    link_url: string;
    targetUrl?: string; // Some parts use targetUrl
    type: 'banner' | 'popup' | 'video';
    position: string;
    location?: string;
    status?: string;
    is_active: boolean;
    view_count?: number;
    created_at: string;
}

export interface SocialLink {
    id: number;
    label: string;
    url: string;
    icon: string;
}

export interface UserDevice {
    id: number;
    user_id: string;
    device_id?: string;
    device_name: string;
    browser: string;
    ip_address: string;
    last_active: string;
    is_blocked: boolean;
    profiles?: { full_name: string; email: string; role: string };
}

export interface SupportTicket {
    id: number;
    user_id: string;
    status: 'open' | 'closed';
    created_at: string;
    profiles?: { full_name: string };
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
    type: 'deposit' | 'withdrawal' | 'bonus' | 'purchase';
    description: string;
    created_at: string;
}

export interface ATCWallet {
    user_id: string;
    balance: number;
    total_earned: number;
    total_converted: number;
    extra_spins: number;
    active_days: number;
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
    type: string;
}

export interface WheelPrize {
    id: number;
    label: string;
    type: 'atc' | 'uzs' | 'empty';
    value: number;
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
    correct_option: 'a' | 'b' | 'c' | 'd';
}

export interface ContestAd {
    id: number;
    title: string;
    media_url: string;
    media_type: 'image' | 'video';
    reward_atc: number;
    duration_sec: number;
}

export interface ArkWallet {
    user_id: string;
    balance: number;
    tokens: number;
}

export interface ArkMarketData {
    id: number;
    price: number;
    volume: number;
    created_at: string;
}

export interface ArkAd {
    id: number;
    title: string;
    media_url: string;
}

export interface ArkQuiz {
    id: number;
    question: string;
}

export interface ArkAutopilotConfig {
    enabled: boolean;
    strategy: string;
}

export interface ArkSchedule {
    id: number;
    event: string;
}

export interface ArkWithdrawal {
    id: number;
    amount: number;
    status: string;
}

export interface ShopProduct {
    id: number;
    name: string;
    title?: string;
    price: number;
    image_url: string;
    category?: string;
    discount_percent?: number;
    sales_count?: number;
    rating?: number;
    delivery_time?: string;
    description?: string;
    specifications?: any;
}

export interface ShopWallet {
    balance: number;
}

export interface ShopOrder {
    id: number;
    status: string;
    products?: any[];
    amount?: number;
    address?: string;
    created_at?: string;
}

export interface Promocode {
    id: number;
    code: string;
    reward_type: string;
    reward_value: number;
    created_at: string;
}

export interface Broadcast {
    id: number;
    title: string;
    message: string;
    created_at: string;
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

export interface FandubPost {
    id: number;
    channel_id: string;
    content: string;
    created_at: string;
}

export interface PremiumBundle {
    id: number;
    name: string;
    price: number;
    duration_days: number;
    created_at: string;
}

export interface FandubEarning {
    amount: number;
}

export interface FandubWithdrawal {
    id: number;
    amount: number;
    status: string;
}

export interface LiveStream {
    id: number;
    title: string;
    url: string;
}

export interface LiveChatMessage {
    id: number;
    content: string;
}

export enum AppView {
    Home = 'home',
    Anime = 'anime',
    Series = 'series',
    Movies = 'movies',
    New = 'new',
    Popular = 'popular',
    Ongoing = 'ongoing',
    Genres = 'genres',
    Favorites = 'favorites',
    History = 'history',
    Profile = 'profile',
    Community = 'community',
    Contest = 'contest',
    Chat = 'chat',
    Settings = 'settings',
    About = 'about'
}

export interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: number;
}

export interface Genre {
    id: string;
    name: string;
    iconName?: string;
    count?: number;
}

export interface Anime extends Movie {
    titleOriginal?: string;
    bannerImage?: string;
    posterImage?: string;
    studio?: string;
    voiceovers?: string[];
    releaseYear?: number;
    views?: string;
    episodes?: any[];
    isTrending?: boolean;
    isNew?: boolean;
    isPopular?: boolean;
}

export type Page = 'home' | 'anime' | 'series' | 'movies' | 'new' | 'popular' | 'ongoing' | 'genres' | 'favorites' | 'history' | 'profile' | 'community' | 'contest' | 'admin' | 'dashboard' | 'ramazon' | 'shop' | 'chat' | 'settings' | 'about';
export type DashboardSubPage = 'home' | 'profile' | 'settings' | 'history' | 'billing' | 'saved' | 'security' | 'sessions' | 'support' | 'subscription' | 'more';
export type AdminSubPage = 'home' | 'users' | 'movies' | 'advertising' | 'financials' | 'site-customization' | 'contests' | 'support' | 'sitemap' | 'reports';
export type LegalDocType = 'terms' | 'privacy' | 'copyright' | 'contacts';

export type ActiveTab = Page;

export interface WatchProgress {
    animeId: string;
    animeTitle: string;
    posterImage: string;
    episodeNumber: number;
    progressPercentage: number;
    lastWatchedAt: number;
}
