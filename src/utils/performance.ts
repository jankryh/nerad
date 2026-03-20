// 📊 Performance monitoring systém pro optimalizaci

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalCalls: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  lastCall?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeMetrics: Map<string, PerformanceMetric> = new Map();
  private stats: Map<string, PerformanceStats> = new Map();
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Automatický periodic cleanup každých 10 minut, maže metriky starší 60 minut
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupOldMetrics(60);
    }, 10 * 60 * 1000);
  }

  /**
   * Začne měření performance
   */
  startMeasure(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      createdAt: Date.now(),
      metadata
    };

    this.activeMetrics.set(id, metric);
    return id;
  }

  /**
   * Ukončí měření performance
   */
  endMeasure(id: string): PerformanceMetric | null {
    const metric = this.activeMetrics.get(id);
    if (!metric) {
      console.warn(`Performance metric not found: ${id}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Přesunout do historie
    this.activeMetrics.delete(id);
    
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    this.metrics.get(metric.name)!.push(metric);

    // Aktualizovat statistiky
    this.updateStats(metric);

    return metric;
  }

  /**
   * Měří performance funkce
   */
  async measureFunction<T>(
    name: string, 
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startMeasure(name, metadata);
    
    try {
      const result = await fn();
      this.endMeasure(id);
      return result;
    } catch (error) {
      this.endMeasure(id);
      throw error;
    }
  }

  /**
   * Měří performance synchronní funkce
   */
  measureFunctionSync<T>(
    name: string, 
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const id = this.startMeasure(name, metadata);
    
    try {
      const result = fn();
      this.endMeasure(id);
      return result;
    } catch (error) {
      this.endMeasure(id);
      throw error;
    }
  }

  /**
   * Aktualizuje statistiky pro metriku
   */
  private updateStats(metric: PerformanceMetric): void {
    if (!this.stats.has(metric.name)) {
      this.stats.set(metric.name, {
        totalCalls: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalDuration: 0,
        lastCall: undefined
      });
    }

    const stats = this.stats.get(metric.name)!;
    stats.totalCalls++;
    stats.totalDuration += metric.duration!;
    stats.averageDuration = stats.totalDuration / stats.totalCalls;
    stats.minDuration = Math.min(stats.minDuration, metric.duration!);
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration!);
    stats.lastCall = Date.now();
  }

  /**
   * Získá statistiky pro metriku
   */
  getStats(name: string): PerformanceStats | undefined {
    return this.stats.get(name);
  }

  /**
   * Získá všechny statistiky
   */
  getAllStats(): Map<string, PerformanceStats> {
    return new Map(this.stats);
  }

  /**
   * Získá metriky pro název
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Získá všechny metriky
   */
  getAllMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics);
  }

  /**
   * Získá průměrnou dobu trvání pro metriku
   */
  getAverageDuration(name: string): number {
    const stats = this.stats.get(name);
    return stats ? stats.averageDuration : 0;
  }

  /**
   * Zkontroluje, zda je performance pod prahem
   */
  isPerformanceGood(name: string, threshold: number = 1000): boolean {
    const stats = this.stats.get(name);
    if (!stats) return true;
    
    return stats.averageDuration < threshold;
  }

  /**
   * Získá performance report
   */
  getPerformanceReport(): string {
    let report = '📊 Performance Report\n';
    report += '='.repeat(50) + '\n\n';

    for (const [name, stats] of this.stats) {
      report += `🔍 ${name}:\n`;
      report += `   📞 Total calls: ${stats.totalCalls}\n`;
      report += `   ⏱️  Average: ${stats.averageDuration.toFixed(2)}ms\n`;
      report += `   🐌 Min: ${stats.minDuration.toFixed(2)}ms\n`;
      report += `   🚀 Max: ${stats.maxDuration.toFixed(2)}ms\n`;
      report += `   📅 Last call: ${stats.lastCall ? new Date(stats.lastCall).toLocaleTimeString() : 'N/A'}\n`;
      report += `   ${this.isPerformanceGood(name) ? '✅' : '⚠️'} Performance: ${this.isPerformanceGood(name) ? 'Good' : 'Needs attention'}\n\n`;
    }

    return report;
  }

  /**
   * Vyčistí staré metriky (starší než X minut)
   */
  cleanupOldMetrics(maxAgeMinutes: number = 60): void {
    const cutoff = Date.now() - (maxAgeMinutes * 60 * 1000);

    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter(metric =>
        metric.createdAt > cutoff
      );

      if (filtered.length === 0) {
        this.metrics.delete(name);
        this.stats.delete(name);
      } else {
        this.metrics.set(name, filtered);
      }
    }
  }

  /**
   * Resetuje všechny metriky a statistiky
   */
  reset(): void {
    this.metrics.clear();
    this.stats.clear();
    this.activeMetrics.clear();
  }

  /**
   * Zastaví periodic cleanup a vyčistí všechny metriky
   */
  destroy(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.reset();
  }

  /**
   * Exportuje data pro analýzu
   */
  exportData(): {
    metrics: Record<string, PerformanceMetric[]>;
    stats: Record<string, PerformanceStats>;
  } {
    const metricsObj: Record<string, PerformanceMetric[]> = {};
    const statsObj: Record<string, PerformanceStats> = {};

    for (const [name, metrics] of this.metrics) {
      metricsObj[name] = metrics;
    }

    for (const [name, stats] of this.stats) {
      statsObj[name] = stats;
    }

    return { metrics: metricsObj, stats: statsObj };
  }
}

// Vytvoření instance monitoru
export const performanceMonitor = new PerformanceMonitor();

// Utility funkce pro snadné použití
export const measure = {
  /**
   * Měří async funkci
   */
  async: <T>(name: string, fn: () => Promise<T> | T, metadata?: Record<string, any>): Promise<T> => {
    return performanceMonitor.measureFunction(name, fn, metadata);
  },

  /**
   * Měří sync funkci
   */
  sync: <T>(name: string, fn: () => T, metadata?: Record<string, any>): T => {
    return performanceMonitor.measureFunctionSync(name, fn, metadata);
  },

  /**
   * Začne měření
   */
  start: (name: string, metadata?: Record<string, any>): string => {
    return performanceMonitor.startMeasure(name, metadata);
  },

  /**
   * Ukončí měření
   */
  end: (id: string): PerformanceMetric | null => {
    return performanceMonitor.endMeasure(id);
  }
};

export default PerformanceMonitor;
