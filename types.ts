
// ... existing types above ...

// --- SHOP TYPES ---
export interface ShopProduct {
    id: number;
    title: string;
    description: string;
    price: number;
    discount_percent?: number; // Yangi: Chegirma foizi
    rating?: number; // Yangi: Mahsulot reytingi (0-5)
    sales_count?: number; // Yangi: Nechta sotilgani
    delivery_time?: string; // Yangi: Yetkazib berish vaqti (masalan: 2-3 kun)
    image_url: string;
    video_url?: string;
    category: 'clothing' | 'accessory' | 'figure' | 'other';
    stock_count: number;
    is_active: boolean;
    specifications?: Record<string, string>;
    gallery?: string[];
    created_at?: string;
}

// ... rest of the file ...
