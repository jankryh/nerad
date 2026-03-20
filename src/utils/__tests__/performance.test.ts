import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import PerformanceMonitor from '../performance';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('startMeasure / endMeasure', () => {
    it('starts and ends a measurement, returning a metric with duration', () => {
      const id = monitor.startMeasure('test-op');
      expect(typeof id).toBe('string');
      expect(id).toContain('test-op');

      const metric = monitor.endMeasure(id);
      expect(metric).not.toBeNull();
      expect(metric!.name).toBe('test-op');
      expect(metric!.duration).toBeGreaterThanOrEqual(0);
      expect(metric!.endTime).toBeDefined();
    });

    it('returns null for unknown metric id', () => {
      const result = monitor.endMeasure('nonexistent-id');
      expect(result).toBeNull();
    });

    it('stores metadata', () => {
      const id = monitor.startMeasure('test-op', { key: 'value' });
      const metric = monitor.endMeasure(id);
      expect(metric!.metadata).toEqual({ key: 'value' });
    });

    it('updates stats after endMeasure', () => {
      const id = monitor.startMeasure('api-call');
      monitor.endMeasure(id);

      const stats = monitor.getStats('api-call');
      expect(stats).toBeDefined();
      expect(stats!.totalCalls).toBe(1);
      expect(stats!.averageDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanupOldMetrics', () => {
    it('removes metrics older than maxAgeMinutes', () => {
      // Create a metric with old createdAt
      const id = monitor.startMeasure('old-metric');
      monitor.endMeasure(id);

      // Verify metric exists
      expect(monitor.getMetrics('old-metric')).toHaveLength(1);

      // Manually set createdAt to the past
      const allMetrics = monitor.getAllMetrics();
      const metrics = allMetrics.get('old-metric')!;
      metrics[0].createdAt = Date.now() - 120 * 60 * 1000; // 120 minutes ago

      // Cleanup with 60 minute threshold
      monitor.cleanupOldMetrics(60);

      expect(monitor.getMetrics('old-metric')).toHaveLength(0);
    });

    it('keeps recent metrics', () => {
      const id = monitor.startMeasure('recent-metric');
      monitor.endMeasure(id);

      monitor.cleanupOldMetrics(60);

      expect(monitor.getMetrics('recent-metric')).toHaveLength(1);
    });

    it('also deletes stats when all metrics for a name are removed', () => {
      const id = monitor.startMeasure('cleanup-test');
      monitor.endMeasure(id);

      const allMetrics = monitor.getAllMetrics();
      allMetrics.get('cleanup-test')![0].createdAt = Date.now() - 120 * 60 * 1000;

      monitor.cleanupOldMetrics(60);

      expect(monitor.getStats('cleanup-test')).toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('clears all metrics, stats, and active metrics', () => {
      const id1 = monitor.startMeasure('metric-a');
      monitor.endMeasure(id1);
      monitor.startMeasure('metric-b'); // left active

      monitor.destroy();

      expect(monitor.getAllMetrics().size).toBe(0);
      expect(monitor.getAllStats().size).toBe(0);
    });

    it('can be called multiple times safely', () => {
      monitor.destroy();
      monitor.destroy();
      expect(monitor.getAllMetrics().size).toBe(0);
    });
  });

  describe('reset', () => {
    it('clears all data but does not stop cleanup interval', () => {
      const id = monitor.startMeasure('test');
      monitor.endMeasure(id);

      monitor.reset();

      expect(monitor.getAllMetrics().size).toBe(0);
      expect(monitor.getAllStats().size).toBe(0);
    });
  });
});
