/**
 * Memory monitoring utilities for tracking memory usage and identifying leaks
 */

interface MemorySnapshot {
  timestamp: number;
  used: number;
  total: number;
  percentage: number;
  context: string;
  details?: Record<string, any>;
}

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 1000;
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly CRITICAL_THRESHOLD = 0.95; // 95%
  
  /**
   * Get current memory usage
   */
  private getMemoryInfo(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: memory.usedJSHeapSize / memory.totalJSHeapSize
      };
    }
    // Fallback for browsers without performance.memory
    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * Take a memory snapshot with context
   */
  takeSnapshot(context: string, details?: Record<string, any>): MemorySnapshot {
    const memInfo = this.getMemoryInfo();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      used: memInfo.used,
      total: memInfo.total,
      percentage: memInfo.percentage,
      context,
      details
    };

    this.snapshots.push(snapshot);
    
    // Keep only the most recent snapshots
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-this.MAX_SNAPSHOTS);
    }

    // Log based on severity
    this.logSnapshot(snapshot);
    
    return snapshot;
  }

  /**
   * Log memory snapshot with appropriate severity
   */
  private logSnapshot(snapshot: MemorySnapshot) {
    const { used, total, percentage, context, details } = snapshot;
    const usedMB = (used / 1024 / 1024).toFixed(2);
    const totalMB = (total / 1024 / 1024).toFixed(2);
    const percentageStr = (percentage * 100).toFixed(1);
    
    const baseMessage = `🧠 Memory [${context}]: ${usedMB}MB / ${totalMB}MB (${percentageStr}%)`;
    
    if (percentage >= this.CRITICAL_THRESHOLD) {
      console.error(`🚨 CRITICAL ${baseMessage}`, details || '');
      this.logMemoryBreakdown();
    } else if (percentage >= this.WARNING_THRESHOLD) {
      console.warn(`⚠️  WARNING ${baseMessage}`, details || '');
    } else {
      console.info(`ℹ️  ${baseMessage}`, details || '');
    }
  }

  /**
   * Log detailed memory breakdown
   */
  private logMemoryBreakdown() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.group('🔍 Memory Breakdown');
      console.log(`Used JS Heap: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Total JS Heap: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`JS Heap Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Usage: ${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}% of limit`);
      console.groupEnd();
    }
  }

  /**
   * Compare memory usage between two snapshots
   */
  compareSnapshots(from: MemorySnapshot | string, to?: MemorySnapshot): void {
    const fromSnapshot = typeof from === 'string' 
      ? this.snapshots.find(s => s.context === from)
      : from;
    const toSnapshot = to || this.snapshots[this.snapshots.length - 1];
    
    if (!fromSnapshot) {
      console.warn(`Memory snapshot not found: ${from}`);
      return;
    }

    const memoryDiff = toSnapshot.used - fromSnapshot.used;
    const timeDiff = toSnapshot.timestamp - fromSnapshot.timestamp;
    const diffMB = (memoryDiff / 1024 / 1024).toFixed(2);
    const diffSign = memoryDiff >= 0 ? '+' : '';
    
    console.group(`📊 Memory Comparison: ${fromSnapshot.context} → ${toSnapshot.context}`);
    console.log(`Time elapsed: ${timeDiff}ms`);
    console.log(`Memory change: ${diffSign}${diffMB}MB`);
    console.log(`From: ${(fromSnapshot.used / 1024 / 1024).toFixed(2)}MB (${(fromSnapshot.percentage * 100).toFixed(1)}%)`);
    console.log(`To: ${(toSnapshot.used / 1024 / 1024).toFixed(2)}MB (${(toSnapshot.percentage * 100).toFixed(1)}%)`);
    console.groupEnd();
  }

  /**
   * Get memory usage trend over time
   */
  getMemoryTrend(context?: string, timeWindow?: number): MemorySnapshot[] {
    let filtered = this.snapshots;
    
    if (context) {
      filtered = filtered.filter(s => s.context.includes(context));
    }
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filtered = filtered.filter(s => s.timestamp >= cutoff);
    }
    
    return filtered;
  }

  /**
   * Log memory leak detection
   */
  detectMemoryLeaks(windowMs: number = 60000): void {
    const recent = this.getMemoryTrend(undefined, windowMs);
    if (recent.length < 2) return;

    const first = recent[0];
    const last = recent[recent.length - 1];
    const growth = last.used - first.used;
    const growthMB = growth / 1024 / 1024;
    
    if (growthMB > 10) { // More than 10MB growth
      console.warn(`🕳️  Potential memory leak detected: +${growthMB.toFixed(2)}MB in ${windowMs}ms`);
      console.log('Recent memory snapshots:', recent.slice(-5));
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs: number = 10000): () => void {
    const interval = setInterval(() => {
      this.takeSnapshot('periodic-check');
      this.detectMemoryLeaks();
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

// Create global instance
export const memoryMonitor = new MemoryMonitor();

/**
 * Decorator for monitoring memory usage of functions
 */
export function withMemoryMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    memoryMonitor.takeSnapshot(`${name}-start`, { args: args.length });
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        memoryMonitor.takeSnapshot(`${name}-end`);
      });
    } else {
      memoryMonitor.takeSnapshot(`${name}-end`);
      return result;
    }
  }) as T;
}

/**
 * React hook for memory monitoring
 */
export function useMemoryMonitoring(componentName: string) {
  const takeSnapshot = (context: string, details?: Record<string, any>) => {
    memoryMonitor.takeSnapshot(`${componentName}-${context}`, details);
  };

  return { takeSnapshot, memoryMonitor };
}