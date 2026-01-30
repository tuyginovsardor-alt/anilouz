
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
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            try {
                const itemStr = localStorage.getItem(key);
                if (itemStr) {
                    const item = JSON.parse(itemStr);
                    if (now > item.expiry) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (e) {
                // Agar parsingda xato bo'lsa (buzilgan JSON), o'chiramiz
                localStorage.removeItem(key);
            }
        });
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
        // Joy yetmasa (QuotaExceededError) hammasini tozalaymiz
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error("LocalStorage to'lib qoldi, kesh tozalanmoqda...");
            clearAppCache();
        }
    }
};

/**
 * Keshdan ma'lumot olish - Xavfsiz usul
 */
export const getCache = <T>(key: string): T | null => {
    const fullKey = CACHE_PREFIX + key;
    try {
        const itemStr = localStorage.getItem(fullKey);
        if (!itemStr) return null;

        const item = JSON.parse(itemStr);
        
        // Ob'ekt strukturasi to'g'riligini tekshirish
        if (!item || typeof item !== 'object' || !('expiry' in item)) {
            localStorage.removeItem(fullKey);
            return null;
        }

        // Muddati o'tgan bo'lsa
        if (Date.now() > item.expiry) {
            localStorage.removeItem(fullKey);
            return null;
        }

        return item.data as T;
    } catch (e) {
        // Har qanday xato bo'lsa (masalan [object Object] yozilib qolgan bo'lsa) o'chiramiz
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
            if (key && (key.startsWith(CACHE_PREFIX) || key.includes('supabase.auth.token'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        console.log("Anilo kesh tizimi butunlay tozalandi.");
    } catch (e) {
        console.error("Cache clear error:", e);
    }
};
