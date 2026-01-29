
// Cache kalitlari uchun prefix
const CACHE_PREFIX = 'anilo_cache_';

interface CacheItem<T> {
    data: T;
    expiry: number; 
}

/**
 * Muddati o'tgan barcha keshni tozalash
 */
export const pruneCache = (): void => {
    try {
        const now = Date.now();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const itemStr = localStorage.getItem(key);
                    if (itemStr) {
                        const item = JSON.parse(itemStr);
                        if (now > item.expiry) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch (e) {
                    // Buzilgan JSON bo'lsa darhol o'chirish
                    localStorage.removeItem(key);
                }
            }
        }
    } catch (e) {
        console.warn("Prune error:", e);
    }
};

/**
 * Keshga ma'lumot yozish
 */
export const setCache = <T>(key: string, data: T, ttlMinutes: number = 60): void => {
    try {
        const item: CacheItem<T> = {
            data: data,
            expiry: Date.now() + ttlMinutes * 60 * 1000
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e: any) {
        // Joy yetmasa hammasini tozalab yuboramiz
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            clearAppCache();
        }
    }
};

/**
 * Keshdan ma'lumot olish
 */
export const getCache = <T>(key: string): T | null => {
    const fullKey = CACHE_PREFIX + key;
    try {
        const itemStr = localStorage.getItem(fullKey);
        if (!itemStr) return null;

        const item: CacheItem<T> = JSON.parse(itemStr);
        
        // Muddati o'tgan bo'lsa o'chiramiz
        if (Date.now() > item.expiry) {
            localStorage.removeItem(fullKey);
            return null;
        }

        return item.data;
    } catch (e) {
        // Agar parsingda xato bo'lsa kesh buzilgan, uni o'chirib tashlaymiz
        localStorage.removeItem(fullKey);
        return null;
    }
};

/**
 * Saytning barcha keshini tozalash
 */
export const clearAppCache = (): void => {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        console.log("Anilo kesh tozalandi.");
    } catch (e) {
        console.error("Cache clear error:", e);
    }
};
