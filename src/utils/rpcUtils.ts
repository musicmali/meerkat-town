/**
 * RPC Utilities for reliable blockchain queries
 * Handles rate limiting, retries, and batching
 */

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxRetries - 1) {
                const waitTime = baseDelay * Math.pow(2, attempt);
                console.log(`[withRetry] Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
                await delay(waitTime);
            }
        }
    }

    throw lastError;
}

// Process items in batches with delay between batches
export async function batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 3,
    delayBetweenBatches: number = 500
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        // Process batch in parallel
        const batchResults = await Promise.all(
            batch.map(item => processor(item).catch(err => {
                console.warn('[batchProcess] Item failed:', err.message);
                return null as R;
            }))
        );

        results.push(...batchResults);

        // Delay before next batch (if not the last batch)
        if (i + batchSize < items.length) {
            await delay(delayBetweenBatches);
        }
    }

    return results;
}

// Process items sequentially with delay
export async function sequentialProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    delayBetweenItems: number = 100
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const result = await processor(items[i]);
            results.push(result);
        } catch (err) {
            console.warn('[sequentialProcess] Item failed:', (err as Error).message);
            results.push(null as R);
        }

        // Delay before next item (if not the last)
        if (i < items.length - 1) {
            await delay(delayBetweenItems);
        }
    }

    return results;
}

// Cache utilities
const CACHE_PREFIX = 'meerkat_';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export function getFromCache<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);
        const now = Date.now();

        if (now - entry.timestamp > entry.ttl) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

export function setToCache<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): void {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (err) {
        console.warn('[setToCache] Failed to cache:', err);
    }
}

export function clearCache(key?: string): void {
    if (key) {
        localStorage.removeItem(CACHE_PREFIX + key);
    } else {
        // Clear all meerkat cache
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    }
}
