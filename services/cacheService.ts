
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
    } catch (e: any) {
        // Agar xotira to'lib qolsa (QuotaExceededError)
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('LocalStorage to\'ldi. Eskilar tozalanmoqda...');
            clearAppCache(); // Hammasini tozalab tashlaymiz
            try {
                // Qayta urinib ko'rish
                localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                    data: data,
                    expiry: new Date().getTime() + ttlMinutes * 60 * 1000
                }));
            } catch (retryError) {
                console.error("Kesh saqlab bo'lmadi:", retryError);
            }
        } else {
            console.warn('LocalStorage xatosi:', e);
        }
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
        // JSON parse xatosi bo'lsa, buzuq ma'lumotni o'chiramiz
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
    }
};

// Barcha keshlarni tozalash
export const clearAppCache = (): void => {
    try {
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (e) {
        console.error("Kesh tozalashda xatolik:", e);
    }
};
