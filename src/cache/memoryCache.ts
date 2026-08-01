const TTL = 30 * 1000; // 30 seconds

const cache = new Map<string, CacheEntry>();

export function getCache(key: string) {
    const item = cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expiresAt) {
        cache.delete(key);
        return null;
    }

    return item.data;
}

export function setCache(key: string, data: any) {
    cache.set(key, {
        data,
        expiresAt: Date.now() + TTL,
    });
}

export function clearResourceCache(resource: string) {
    for (const key of cache.keys()) {
        if (key.startsWith(`${resource}:`)) {
            cache.delete(key);
        }
    }
}