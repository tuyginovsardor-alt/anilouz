
// Kesh tizimi versiyasi. Agar kesh strukturasi o'zgarsa, ushbu raqamni oshiring.
const CACHE_VERSION = '2.1';
const CACHE_PREFIX = 'anilo_cache_v' + CACHE_VERSION + '_';

interface CacheItem<T> {
    data: T;
    expiry: number;
    v: string; // Versiya
}

/**
 * Keshdan xavfsiz ma'lumot olish
 */
export const getCache = <T>(key: string): T | null => {
    const fullKey = CACHE_PREFIX + key;
    try {
        const itemStr = localStorage.getItem(fullKey);
        if (!itemStr) return null;

        const item: CacheItem<T> = JSON.parse(itemStr);
        
        // Versiya va struktura tekshiruvi
        if (!item || typeof item !== 'object' || item.v !== CACHE_VERSION) {
            localStorage.removeItem(fullKey);
            return null;
        }

        // Muddati o'tgan bo'lsa
        if (Date.now() > item.expiry) {
            localStorage.removeItem(fullKey);
            return null;
        }

        return item.data;
    } catch (e) {
        // Agar parsingda xato bo'lsa, keshni o'chirib yuboramiz (Oq sahifa oldini olish)
        console.warn(`Cache corrupted for key: ${fullKey}. Clearing...`);
        localStorage.removeItem(fullKey);
        return null;
    }
};

/**
 * Keshga ma'lumot yozish
 */
export const setCache = <T>(key: string, data: T, ttlMinutes: number = 60): void => {
    try {
        const item: CacheItem<T> = {
            data: data,
            expiry: Date.now() + ttlMinutes * 60 * 1000,
            v: CACHE_VERSION
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e: any) {
        // Joy yetmasa hammasini tozalaymiz
        if (e.name === 'QuotaExceededError') {
            clearAppCache();
        }
    }
};

/**
 * Muddati o'tgan yoki eski versiyadagi barcha keshni tozalash
 */
export const pruneCache = (): void => {
    try {
        const now = Date.now();
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('anilo_cache_') || key.startsWith('anilo_auth_'))) {
                // Agar joriy versiya prefiksi bo'lmasa - demak u eski
                if (!key.startsWith(CACHE_PREFIX) && key.startsWith('anilo_cache_')) {
                    keysToRemove.push(key);
                    continue;
                }

                // Agar joriy versiya bo'lsa, muddatini tekshiramiz
                try {
                    const itemStr = localStorage.getItem(key);
                    if (itemStr) {
                        const item = JSON.parse(itemStr);
                        if (item.expiry && now > item.expiry) {
                            keysToRemove.push(key);
                        }
                    }
                } catch {
                    keysToRemove.push(key);
                }
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
        console.error("Prune error:", e);
    }
};

/**
 * Barcha ilovaga tegishli keshni tozalash (Full Reset)
 */
export const clearAppCache = (): void => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes('anilo') || key.includes('supabase')) {
                localStorage.removeItem(key);
            }
        });
        console.log("Anilo: Barcha kesh tozalandi.");
    } catch (e) {}
};
