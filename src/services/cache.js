// Simple in-memory cache for API responses
class ApiCache {
  cache = new Map();
  TTL = 5 * 60 * 1000; // 5 minutes default TTL

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();

// Generate cache key from endpoint and params
export function getCacheKey(endpoint, params) {
  const paramStr = params ? JSON.stringify(params) : "";
  return `${endpoint}:${paramStr}`;
}
