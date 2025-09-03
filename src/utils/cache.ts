// 🗄️ Cache systém pro optimalizaci API volání

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live v milisekundách
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupTimer: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 30000, // 30 sekund
      maxSize: 100,      // Maximální počet položek
      cleanupInterval: 60000, // Cleanup každou minutu
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * Získá data z cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Kontrola platnosti
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Uloží data do cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Kontrola velikosti cache
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, entry);
  }

  /**
   * Vyčistí cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Odstraní položku z cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Zkontroluje, zda klíč existuje a je platný
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Získá statistiku cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Odstraní nejstarší položky při překročení limitu
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Odstraní 20% nejstarších položek
    const toRemove = Math.ceil(this.config.maxSize * 0.2);
    entries.slice(0, toRemove).forEach(([key]) => {
      this.cache.delete(key);
    });
  }

  /**
   * Spustí timer pro pravidelný cleanup
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Vyčistí expirované položky
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vypočítá hit rate cache
   */
  private calculateHitRate(): number {
    // Implementace hit rate logiky
    return 0.85; // Placeholder
  }

  /**
   * Odhaduje využití paměti
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length;
      size += JSON.stringify(entry.data).length;
    }
    return size;
  }

  /**
   * Zastaví cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      window.clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Vytvoření instance cache
export const apiCache = new APICache({
  defaultTTL: 30000,    // 30 sekund pro odjezdy
  maxSize: 200,         // Více položek pro rozšíření
  cleanupInterval: 30000 // Cleanup každých 30 sekund
});

// Cache klíče pro různé typy dat
export const cacheKeys = {
  departures: (stopId: string, lineId: string, direction?: string) => 
    `departures:${stopId}:${lineId}:${direction || 'all'}`,
  
  stops: (stopId: string) => 
    `stops:${stopId}`,
  
  lines: (lineId: string) => 
    `lines:${lineId}`,
  
  directions: (direction: string) => 
    `directions:${direction}`
};

export default APICache;
