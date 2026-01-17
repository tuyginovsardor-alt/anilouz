// ... (oldingi turlar) ...

export interface ShopProduct {
    id: number;
    title: string;
    description: string;
    price: number;
    image_url: string;
    video_url?: string;
    category: 'clothing' | 'accessory' | 'figure' | 'other';
    stock_count: number;
    is_active: boolean;
    specifications?: Record<string, string>;
    gallery?: string[];
    created_at?: string;
}

// ... (qolgan turlar o'zgarishsiz) ...
export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'dub-dashboard' | 'studio' | 'shop' | 'shop-admin';
