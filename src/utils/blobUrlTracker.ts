/**
 * Blob URL tracking utility to monitor and prevent blob URL memory leaks
 */

import { memoryMonitor } from './memoryMonitor';

class BlobUrlTracker {
  private activeBlobUrls = new Map<string, { 
    createdAt: number; 
    context: string; 
    size?: number 
  }>();
  
  /**
   * Create a blob URL and track it
   */
  createObjectURL(blob: Blob, context: string = 'unknown'): string {
    const url = URL.createObjectURL(blob);
    
    this.activeBlobUrls.set(url, {
      createdAt: Date.now(),
      context,
      size: blob.size
    });
    
    memoryMonitor.takeSnapshot('blob-url-created', {
      context,
      blobSize: blob.size,
      totalActiveBlobUrls: this.activeBlobUrls.size,
      estimatedMemoryMB: this.getEstimatedMemoryUsage()
    });
    
    console.log(`🔗 Blob URL created [${context}]: ${url.substring(0, 50)}... (${(blob.size / 1024).toFixed(1)}KB)`);
    
    return url;
  }
  
  /**
   * Revoke a blob URL and stop tracking it
   */
  revokeObjectURL(url: string, context: string = 'cleanup'): void {
    const tracked = this.activeBlobUrls.get(url);
    
    if (tracked) {
      URL.revokeObjectURL(url);
      this.activeBlobUrls.delete(url);
      
      const ageMs = Date.now() - tracked.createdAt;
      
      memoryMonitor.takeSnapshot('blob-url-revoked', {
        context,
        originalContext: tracked.context,
        ageMs,
        blobSize: tracked.size || 0,
        totalActiveBlobUrls: this.activeBlobUrls.size,
        estimatedMemoryMB: this.getEstimatedMemoryUsage()
      });
      
      console.log(`🗑️ Blob URL revoked [${context}]: ${url.substring(0, 50)}... (age: ${(ageMs / 1000).toFixed(1)}s)`);
    } else {
      // Still revoke it, but warn about untracked URL
      URL.revokeObjectURL(url);
      console.warn(`⚠️ Revoking untracked blob URL [${context}]: ${url.substring(0, 50)}...`);
    }
  }
  
  /**
   * Get all active blob URLs
   */
  getActiveBlobUrls(): Array<{ url: string; context: string; ageMs: number; size?: number }> {
    const now = Date.now();
    return Array.from(this.activeBlobUrls.entries()).map(([url, data]) => ({
      url,
      context: data.context,
      ageMs: now - data.createdAt,
      size: data.size
    }));
  }
  
  /**
   * Find old blob URLs that might be leaks
   */
  findPotentialLeaks(ageThresholdMs: number = 300000): Array<{ url: string; context: string; ageMs: number }> {
    return this.getActiveBlobUrls().filter(item => item.ageMs > ageThresholdMs);
  }
  
  /**
   * Clean up old blob URLs
   */
  cleanupOldUrls(ageThresholdMs: number = 300000): number {
    const oldUrls = this.findPotentialLeaks(ageThresholdMs);
    
    oldUrls.forEach(({ url, context, ageMs }) => {
      console.warn(`🧹 Auto-cleaning old blob URL [${context}]: ${url.substring(0, 50)}... (age: ${(ageMs / 1000).toFixed(1)}s)`);
      this.revokeObjectURL(url, 'auto-cleanup');
    });
    
    if (oldUrls.length > 0) {
      memoryMonitor.takeSnapshot('blob-url-auto-cleanup', {
        cleanedCount: oldUrls.length,
        totalActiveBlobUrls: this.activeBlobUrls.size
      });
    }
    
    return oldUrls.length;
  }
  
  /**
   * Get estimated memory usage of all tracked blobs
   */
  private getEstimatedMemoryUsage(): number {
    const totalBytes = Array.from(this.activeBlobUrls.values())
      .reduce((total, data) => total + (data.size || 0), 0);
    return Number((totalBytes / 1024 / 1024).toFixed(2)); // MB
  }
  
  /**
   * Log current status
   */
  logStatus(): void {
    const activeUrls = this.getActiveBlobUrls();
    const potentialLeaks = this.findPotentialLeaks();
    
    console.group('🔗 Blob URL Tracker Status');
    console.log(`Active blob URLs: ${activeUrls.length}`);
    console.log(`Estimated memory usage: ${this.getEstimatedMemoryUsage()}MB`);
    console.log(`Potential leaks (>5min old): ${potentialLeaks.length}`);
    
    if (activeUrls.length > 0) {
      console.table(activeUrls.map(item => ({
        context: item.context,
        ageSeconds: (item.ageMs / 1000).toFixed(1),
        sizeKB: item.size ? (item.size / 1024).toFixed(1) : 'unknown',
        url: item.url.substring(0, 50) + '...'
      })));
    }
    
    console.groupEnd();
  }
  
  /**
   * Start automatic cleanup interval
   */
  startAutoCleanup(intervalMs: number = 60000, ageThresholdMs: number = 300000): () => void {
    const interval = setInterval(() => {
      this.cleanupOldUrls(ageThresholdMs);
    }, intervalMs);
    
    return () => clearInterval(interval);
  }
}

// Create global instance
export const blobUrlTracker = new BlobUrlTracker();

// Enhanced URL creation/revocation functions
export const createObjectURL = (blob: Blob, context: string = 'unknown'): string => {
  return blobUrlTracker.createObjectURL(blob, context);
};

export const revokeObjectURL = (url: string, context: string = 'cleanup'): void => {
  blobUrlTracker.revokeObjectURL(url, context);
};