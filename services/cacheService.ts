
// Cache kalitlari uchun prefix
const CACHE_PREFIX = 'anilo_cache_';

interface CacheItem<T> {
    data: T;
    expiry: number; // Timestamp
}

// Keshga saqlash
export const setCache = <T>(key: string, data: T, ttlMinutes: number = 60): void => {
    try {
        const now = new Date();
        const item: CacheItem<T> = {
            data: data,
            expiry: now.getTime() + ttlMinutes * 60 * 1000,
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e) {
        console.warn('LocalStorage to\'ldi yoki xatolik:', e);
    }
};

// Keshdan olish
export const getCache = <T>(key: string): T | null => {
    try {
        const itemStr = localStorage.getItem(CACHE_PREFIX + key);
        if (!itemStr) return null;

        const item: CacheItem<T> = JSON.parse(itemStr);
        const now = new Date();

        // Agar muddati o'tgan bo'lsa, o'chirib tashlaymiz
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return item.data;
    } catch (e) {
        return null;
    }
};

// Barcha keshlarni tozalash
export const clearAppCache = (): void => {
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
};
