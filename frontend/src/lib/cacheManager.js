/**
 * Cache Manager for Admin Components
 * Provides centralized cache management to prevent synchronization issues
 */

const CACHE_KEYS = {
  ADMIN_STOCK_DATA: 'adminStockData',
  ADMIN_STOCK_TIMESTAMP: 'adminStockDataTimestamp',
  ADMIN_PRODUCTS: 'adminProducts',
  ADMIN_PRODUCTS_TIMESTAMP: 'adminProductsTimestamp',
  ADMIN_KEY_METRICS: 'adminKeyMetrics',
  ADMIN_KEY_METRICS_TIMESTAMP: 'adminKeyMetricsTimestamp',
  ADMIN_ORDERS: 'adminOrders',
  ADMIN_ORDERS_TIMESTAMP: 'adminOrdersTimestamp',
  ADMIN_SYNC_ERROR: 'adminSyncError'
};

class CacheManager {
  /**
   * Clear all admin-related cache
   */
  static clearAllAdminCache() {
    console.log('🧹 Clearing all admin cache for data synchronization');
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Clear product-related cache
   */
  static clearProductCache() {
    console.log('🧹 Clearing product-related cache');
    localStorage.removeItem(CACHE_KEYS.ADMIN_PRODUCTS);
    localStorage.removeItem(CACHE_KEYS.ADMIN_PRODUCTS_TIMESTAMP);
    localStorage.removeItem(CACHE_KEYS.ADMIN_STOCK_DATA);
    localStorage.removeItem(CACHE_KEYS.ADMIN_STOCK_TIMESTAMP);
    localStorage.removeItem(CACHE_KEYS.ADMIN_KEY_METRICS);
    localStorage.removeItem(CACHE_KEYS.ADMIN_KEY_METRICS_TIMESTAMP);
  }

  /**
   * Clear order-related cache
   */
  static clearOrderCache() {
    console.log('🧹 Clearing order-related cache');
    localStorage.removeItem(CACHE_KEYS.ADMIN_ORDERS);
    localStorage.removeItem(CACHE_KEYS.ADMIN_ORDERS_TIMESTAMP);
  }

  /**
   * Clear stock-related cache
   */
  static clearStockCache() {
    console.log('🧹 Clearing stock-related cache');
    localStorage.removeItem(CACHE_KEYS.ADMIN_STOCK_DATA);
    localStorage.removeItem(CACHE_KEYS.ADMIN_STOCK_TIMESTAMP);
    localStorage.removeItem(CACHE_KEYS.ADMIN_KEY_METRICS);
    localStorage.removeItem(CACHE_KEYS.ADMIN_KEY_METRICS_TIMESTAMP);
  }

  /**
   * Mark a synchronization error
   */
  static markSyncError(component, error) {
    console.warn(`🚨 Sync error in ${component}:`, error);
    localStorage.setItem(CACHE_KEYS.ADMIN_SYNC_ERROR, JSON.stringify({
      component,
      error: error.message || error,
      timestamp: Date.now()
    }));
  }

  /**
   * Check if there's a sync error and clear cache if needed
   */
  static checkAndClearSyncError() {
    const syncError = localStorage.getItem(CACHE_KEYS.ADMIN_SYNC_ERROR);
    if (syncError) {
      console.log('🔄 Detected sync error, clearing all cache');
      this.clearAllAdminCache();
      return JSON.parse(syncError);
    }
    return null;
  }

  /**
   * Check if cache is valid (less than specified minutes old)
   */
  static isCacheValid(timestampKey, maxAgeMinutes = 5) {
    const timestamp = localStorage.getItem(timestampKey);
    if (!timestamp) return false;
    
    const age = Date.now() - parseInt(timestamp);
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
    
    return age < maxAge;
  }

  /**
   * Get cached data if valid
   */
  static getCachedData(dataKey, timestampKey, maxAgeMinutes = 5) {
    if (!this.isCacheValid(timestampKey, maxAgeMinutes)) {
      return null;
    }
    
    const cachedData = localStorage.getItem(dataKey);
    if (!cachedData) return null;
    
    try {
      return JSON.parse(cachedData);
    } catch (error) {
      console.warn(`Failed to parse cached data for ${dataKey}:`, error);
      localStorage.removeItem(dataKey);
      localStorage.removeItem(timestampKey);
      return null;
    }
  }

  /**
   * Set cached data with timestamp
   */
  static setCachedData(dataKey, timestampKey, data) {
    try {
      localStorage.setItem(dataKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.warn(`Failed to cache data for ${dataKey}:`, error);
    }
  }
  /**
   * Get cache statistics for debugging
   */
  static getCacheStats() {
    const stats = {};
    Object.entries(CACHE_KEYS).forEach(([name, key]) => {
      const data = localStorage.getItem(key);
      stats[name] = {
        exists: !!data,
        size: data ? data.length : 0,
        timestamp: key.includes('TIMESTAMP') ? 
          (data ? new Date(parseInt(data)).toISOString() : null) : null,
        age: key.includes('TIMESTAMP') && data ? 
          `${Math.round((Date.now() - parseInt(data)) / 1000 / 60)}m ago` : null
      };
    });
    return stats;
  }

  /**
   * Get a summary of cache health
   */
  static getCacheHealth() {
    const stats = this.getCacheStats();
    const syncError = localStorage.getItem(CACHE_KEYS.ADMIN_SYNC_ERROR);
    
    return {
      hasData: Object.values(stats).some(stat => stat.exists),
      syncError: syncError ? JSON.parse(syncError) : null,
      cacheCount: Object.values(stats).filter(stat => stat.exists).length,
      oldestCache: Object.values(stats)
        .filter(stat => stat.timestamp)
        .reduce((oldest, current) => {
          if (!oldest || !current.timestamp) return current;
          return new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest;
        }, null)
    };
  }

  /**
   * Clear cache based on component type
   */
  static clearComponentCache(component) {
    console.log(`🧹 Clearing cache for component: ${component}`);
    
    switch (component.toLowerCase()) {
      case 'adminproducts':
        this.clearProductCache();
        break;
      case 'adminorders':
        this.clearOrderCache();
        break;
      case 'adminstock':
        this.clearStockCache();
        break;
      default:
        this.clearAllAdminCache();
        break;
    }
  }

  /**
   * Validate cache integrity
   */
  static validateCacheIntegrity() {
    const issues = [];
    
    Object.entries(CACHE_KEYS).forEach(([name, key]) => {
      if (key.includes('TIMESTAMP')) return; // Skip timestamp keys
      
      const data = localStorage.getItem(key);
      const timestampKey = key + 'Timestamp';
      const timestamp = localStorage.getItem(timestampKey);
      
      if (data && !timestamp) {
        issues.push(`${name}: Data exists without timestamp`);
      }
      if (!data && timestamp) {
        issues.push(`${name}: Timestamp exists without data`);
        localStorage.removeItem(timestampKey); // Clean up orphaned timestamp
      }
    });
    
    return issues;
  }
}

export default CacheManager;
export { CACHE_KEYS };
