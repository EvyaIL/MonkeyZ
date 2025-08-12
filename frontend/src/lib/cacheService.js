// Enhanced caching service with smart invalidation
class CacheService {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.maxSize = 100; // Maximum cache entries
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data, ttl = this.defaultTTL) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.metadata.delete(firstKey);
    }

    this.cache.set(key, data);
    this.metadata.set(key, {
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccess: Date.now()
    });

    // Persist to localStorage for important data
    if (this.shouldPersist(key)) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({
          data,
          metadata: this.metadata.get(key)
        }));
      } catch (e) {
        console.warn('Cache persistence failed:', e);
      }
    }
  }

  get(key) {
    const metadata = this.metadata.get(key);
    
    if (!metadata) {
      // Try to restore from localStorage
      return this.restoreFromStorage(key);
    }

    // Check if expired
    if (Date.now() - metadata.timestamp > metadata.ttl) {
      this.delete(key);
      return null;
    }

    // Update access stats
    metadata.accessCount++;
    metadata.lastAccess = Date.now();
    
    const data = this.cache.get(key);
    
    // Move to end for LRU
    this.cache.delete(key);
    this.cache.set(key, data);
    
    return data;
  }

  delete(key) {
    this.cache.delete(key);
    this.metadata.delete(key);
    localStorage.removeItem(`cache_${key}`);
  }

  clear() {
    this.cache.clear();
    this.metadata.clear();
    // Clear cache items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  shouldPersist(key) {
    // Persist important data like products, user profile
    return ['products', 'user_profile', 'best_sellers'].some(pattern => 
      key.includes(pattern)
    );
  }

  restoreFromStorage(key) {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const { data, metadata } = JSON.parse(stored);
        
        // Check if still valid
        if (Date.now() - metadata.timestamp <= metadata.ttl) {
          this.cache.set(key, data);
          this.metadata.set(key, metadata);
          return data;
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (e) {
      console.warn('Cache restoration failed:', e);
    }
    return null;
  }

  // Cache statistics for monitoring
  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.calculateHitRate(),
      oldestEntry: this.getOldestEntry(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  calculateHitRate() {
    let totalAccess = 0;
    let hits = 0;
    
    this.metadata.forEach(meta => {
      totalAccess += meta.accessCount;
      if (meta.accessCount > 0) hits++;
    });
    
    return totalAccess > 0 ? (hits / totalAccess) * 100 : 0;
  }

  getOldestEntry() {
    let oldest = Date.now();
    this.metadata.forEach(meta => {
      if (meta.timestamp < oldest) {
        oldest = meta.timestamp;
      }
    });
    return oldest;
  }

  estimateMemoryUsage() {
    // Rough estimation in KB
    return (JSON.stringify([...this.cache.values()]).length / 1024).toFixed(2);
  }
}

export const cacheService = new CacheService();

// React hook for cached API calls
export const useCachedQuery = (key, queryFn, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedData = cacheService.get(key);
        if (cachedData && !options.forceRefresh) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // Fetch new data
        const result = await queryFn();
        
        // Cache the result
        cacheService.set(key, result, options.ttl);
        
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        
        // Try to use stale cache as fallback
        const staleData = cacheService.get(key);
        if (staleData) {
          setData(staleData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, options.forceRefresh]);

  const refresh = () => {
    cacheService.delete(key);
    setLoading(true);
    // Re-trigger the effect
    setData(null);
  };

  return { data, loading, error, refresh };
};
