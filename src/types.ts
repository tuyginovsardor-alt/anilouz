export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: string; // e.g., "24:00"
  videoUrl: string;
  thumbnail: string;
  releaseDate?: string;
}

export interface CastMember {
  name: string;
  role: string;
  image?: string;
}

export interface Anime {
  id: string;
  title: string;
  titleOriginal?: string;
  year: number;
  rating: number; // e.g. 9.1
  genres: string[];
  episodeCount: string; // e.g. "500+ qism" or "24-qism"
  totalEpisodes: number;
  currentEpisode?: number;
  season?: string; // e.g. "4-fasl 28-qism"
  description: string;
  bannerImage: string;
  posterImage: string;
  videoUrl: string; // Default video preview/stream URL
  isTrending?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  status: 'Ongoing' | 'Yakunlangan';
  studio: string;
  voiceovers: string[]; // e.g. ["Anilo Studio", "AniMedia", "Subtitr"]
  releaseYear: number;
  episodes: Episode[];
  views?: string;
  cast?: CastMember[];
}

export interface WatchProgress {
  animeId: string;
  animeTitle: string;
  posterImage: string;
  episodeNumber: number;
  progressPercentage: number;
  lastWatchedAt: number; // timestamp
}

export interface Comment {
  id: string;
  animeId: string;
  episodeNumber: number;
  userName: string;
  userAvatar: string;
  text: string;
  date: string;
  likes: number;
  isLiked?: boolean;
}

export interface Genre {
  id: string;
  name: string;
  iconName: string;
  count: number;
}

export type ActiveTab = 'home' | 'anime' | 'series' | 'movies' | 'genres' | 'new' | 'popular' | 'ongoing' | 'favorites' | 'history' | 'profile' | 'community' | 'admin' | 'reels' | 'messages' | 'catalog' | 'fandub_dashboard';

export interface FandubProfile {
  id: string;
  userId: string;
  studioName: string;
  handle: string;
  logoUrl: string;
  bio: string;
  cardNumber?: string;
  balance: number;
  totalEarned: number;
  isVerified: boolean;
  commissionAgreed: boolean;
  subscribersCount?: number;
  totalViews?: number;
}

export interface FandubPayout {
  id: string;
  fandubId: string;
  amount: number;
  netAmount: number;
  platformFee: number;
  autoPayFee: number;
  cardNumber: string;
  status: 'pending' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  isAdmin?: boolean;
  isSelf?: boolean;
  text?: string;
  image?: string;
  quotedSender?: string;
  quotedText?: string;
  timestamp: string;
  userColor?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  avatar: string;
  coverImage?: string;
  isPremium: boolean;
  premiumExpires?: string;
  balance?: number;
  role?: 'user' | 'fandub' | 'admin' | 'owner' | string;
  fandubInfo?: FandubProfile;
}
