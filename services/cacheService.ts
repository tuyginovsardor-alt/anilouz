
// Cache kalitlari uchun prefix
const CACHE_PREFIX = 'anilo_cache_';

interface CacheItem<T> {
    data: T;
    expiry: number; // Timestamp
    timestamp: number; // Created time for LRU (Least Recently Used) logic
}

// 1. Keshni tozalash (Muddati o'tganlarni)
export const pruneCache = (): void => {
    try {
        const now = new Date().getTime();
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const itemStr = localStorage.getItem(key);
                    if (itemStr) {
                        const item: CacheItem<any> = JSON.parse(itemStr);
                        // Agar muddati o'tgan bo'lsa, o'chiramiz
                        if (now > item.expiry) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch (e) {
                    // Agar JSON buzilgan bo'lsa, o'chirib tashlaymiz
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (e) {
        console.warn("Auto-prune error:", e);
    }
};

// 2. Keshga saqlash (Xavfsiz)
export const setCache = <T>(key: string, data: T, ttlMinutes: number = 60): void => {
    try {
        const now = new Date().getTime();
        const item: CacheItem<T> = {
            data: data,
            expiry: now + ttlMinutes * 60 * 1000,
            timestamp: now
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e: any) {
        // Agar xotira to'lib qolsa (QuotaExceededError)
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('LocalStorage to\'ldi. Tozalash boshlandi...');
            
            // A: Avval muddati o'tganlarni tozalaymiz
            pruneCache();

            try {
                // Qayta urinib ko'ramiz
                localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                    data: data,
                    expiry: new Date().getTime() + ttlMinutes * 60 * 1000,
                    timestamp: new Date().getTime()
                }));
            } catch (retryError) {
                // B: Agar hali ham joy yetmasa, butun 'anilo_' keshini tozalaymiz (Radikal yechim)
                clearAppCache();
                try {
                    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                        data: data,
                        expiry: new Date().getTime() + ttlMinutes * 60 * 1000,
                        timestamp: new Date().getTime()
                    }));
                } catch (finalError) {
                    console.error("Kesh saqlab bo'lmadi (Memory Full):", finalError);
                }
            }
        }
    }
};

// 3. Keshdan olish
export const getCache = <T>(key: string): T | null => {
    try {
        const itemStr = localStorage.getItem(CACHE_PREFIX + key);
        if (!itemStr) return null;

        const item: CacheItem<T> = JSON.parse(itemStr);
        const now = new Date().getTime();

        // Agar muddati o'tgan bo'lsa, o'chirib tashlaymiz
        if (now > item.expiry) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return item.data;
    } catch (e) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
    }
};

// 4. Barcha keshlarni tozalash (Faqat Anilo ga tegishlisini)
export const clearAppCache = (): void => {
    try {
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        console.log("Anilo kesh tozalandi.");
    } catch (e) {
        console.error("Kesh tozalashda xatolik:", e);
    }
};
