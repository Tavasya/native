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
  createObjectURL(blob: Blob, _context: string = 'unknown'): string {
    const url = URL.createObjectURL(blob);
    
    // Memory monitoring disabled
    
    return url;
  }
  
  /**
   * Revoke a blob URL and stop tracking it
   */
  revokeObjectURL(url: string, _context: string = 'cleanup'): void {
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
  cleanupOldUrls(_ageThresholdMs: number = 300000): number {
    // Memory monitoring disabled
    return 0;
  }
  
  /**
   * Log current status
   */
  logStatus(): void {
    // Blob URL tracker status logging removed
    
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
  clearByContext(_contextPattern: string): number {
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