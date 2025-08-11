// Performance monitoring utilities for production

export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoadedTime: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

export function measurePagePerformance(): PerformanceMetrics {
  const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  const metrics: PerformanceMetrics = {
    pageLoadTime: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
    domContentLoadedTime: navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart,
  };

  // Get paint timings if available
  const paintEntries = performance.getEntriesByType('paint');
  paintEntries.forEach((entry) => {
    if (entry.name === 'first-paint') {
      metrics.firstPaint = entry.startTime;
    } else if (entry.name === 'first-contentful-paint') {
      metrics.firstContentfulPaint = entry.startTime;
    }
  });

  // Get LCP if available
  try {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lastEntry = lcpEntries[lcpEntries.length - 1] as any;
      metrics.largestContentfulPaint = lastEntry.startTime;
    }
  } catch (error) {
    // LCP not supported
  }

  return metrics;
}

export function logPerformanceMetrics(): void {
  if (import.meta.env.PROD) {
    // Only log in production
    try {
      const metrics = measurePagePerformance();
      console.log('📊 Wedding Website Performance Metrics:', {
        ...metrics,
        timestamp: new Date().toISOString(),
      });

      // Log warnings for poor performance
      if (metrics.pageLoadTime > 3000) {
        console.warn('⚠️ Slow page load detected:', metrics.pageLoadTime + 'ms');
      }
      
      if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 2500) {
        console.warn('⚠️ Slow first contentful paint:', metrics.firstContentfulPaint + 'ms');
      }
    } catch (error) {
      console.error('Performance monitoring error:', error);
    }
  }
}

export function initPerformanceMonitoring(): void {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // Monitor when page is fully loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        logPerformanceMetrics();
      }, 100);
    });

    // Monitor navigation changes (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('📍 Navigation to:', url);
      }
    }).observe(document, { subtree: true, childList: true });
  }
}

export function measureAsyncOperation<T>(
  operationName: string,
  asyncOperation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  return asyncOperation()
    .then((result) => {
      const duration = performance.now() - startTime;
      if (import.meta.env.DEV || duration > 1000) {
        console.log(`⏱️ ${operationName} took ${duration.toFixed(2)}ms`);
        
        if (duration > 5000) {
          console.warn(`⚠️ Slow operation detected: ${operationName}`);
        }
      }
      return result;
    })
    .catch((error) => {
      const duration = performance.now() - startTime;
      console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    });
}
