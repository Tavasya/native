import React, { useState, useEffect } from 'react';
import { memoryMonitor } from '@/utils/memoryMonitor';

interface MemoryUsageReporterProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const MemoryUsageReporter: React.FC<MemoryUsageReporterProps> = ({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right'
}) => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !('memory' in performance)) {
      return;
    }

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: memory.usedJSHeapSize / memory.totalJSHeapSize
      });
    };

    // Update immediately
    updateMemoryInfo();

    // Update every 5 seconds
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || !memoryInfo) {
    return null;
  }

  const usedMB = (memoryInfo.used / 1024 / 1024).toFixed(1);
  const totalMB = (memoryInfo.total / 1024 / 1024).toFixed(1);
  const percentage = (memoryInfo.percentage * 100).toFixed(1);

  const getStatusColor = () => {
    if (memoryInfo.percentage >= 0.95) return 'text-red-500 bg-red-100';
    if (memoryInfo.percentage >= 0.8) return 'text-orange-500 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      default: return 'top-4 right-4';
    }
  };

  const handleClick = () => {
    console.group('🧠 Memory Usage Details');
    console.log(`Used: ${usedMB}MB`);
    console.log(`Total: ${totalMB}MB`);
    console.log(`Percentage: ${percentage}%`);
    
    // Show recent memory snapshots
    const recentSnapshots = memoryMonitor.getMemoryTrend(undefined, 300000); // Last 5 minutes
    console.log('Recent memory snapshots:', recentSnapshots.slice(-10));
    
    // Check for memory leaks
    memoryMonitor.detectMemoryLeaks(300000);
    
    console.groupEnd();
  };

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-50 p-2 rounded-lg border shadow-lg cursor-pointer text-xs font-mono ${getStatusColor()}`}
      onClick={handleClick}
      title="Click to view detailed memory information in console"
    >
      <div className="flex flex-col">
        <div>🧠 Memory</div>
        <div>{usedMB}MB/{totalMB}MB</div>
        <div>{percentage}%</div>
      </div>
    </div>
  );
};