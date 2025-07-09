/**
 * Blob URL tracking utility to monitor and prevent blob URL memory leaks
 */

// Memory monitoring disabled

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
    
    // Memory monitoring disabled
    
    return url;
  }
  
  /**
   * Revoke a blob URL and stop tracking it
   */
  revokeObjectURL(url: string, context: string = 'cleanup'): void {
    URL.revokeObjectURL(url);
    // Memory monitoring disabled
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
    // Memory monitoring disabled
    return 0;
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
    
    // Blob URL tracker status logging removed
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

  /**
   * Clear blob URLs by context (useful for specific cleanup scenarios like redo)
   */
  clearByContext(contextPattern: string): number {
    // Memory monitoring disabled
    return 0;
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