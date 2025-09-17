// src/utils/performance.ts
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounce hook for optimizing frequent function calls
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for limiting function execution rate
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeout = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args) => {
      const now = Date.now();
      const timeElapsed = now - lastRun.current;

      if (timeElapsed >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeElapsed);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  }: IntersectionObserverInit & {
    freezeOnceVisible?: boolean;
  } = {}
): IntersectionObserverEntry | undefined {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const frozen = useRef(false);

  useEffect(() => {
    const element = elementRef?.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen.current || !element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        if (freezeOnceVisible && entry.isIntersecting) {
          frozen.current = true;
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible]);

  return entry;
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  buffer = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  
  const displayStart = Math.max(0, visibleStart - buffer);
  const displayEnd = Math.min(items.length, visibleEnd + buffer);
  
  const visibleItems = items.slice(displayStart, displayEnd);
  const offsetY = displayStart * itemHeight;
  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  static mark(label: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(label);
      this.marks.set(label, window.performance.now());
    }
  }

  static measure(label: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(label, startMark, endMark);
        const measures = window.performance.getEntriesByName(label);
        const duration = measures[measures.length - 1]?.duration;
        
        if (duration > 1000) {
          console.warn(`Performance warning: ${label} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      } catch (error) {
        console.error('Performance measurement error:', error);
      }
    }
    return null;
  }

  static logMetrics() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        firstPaint: window.performance
          .getEntriesByType('paint')
          .find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: window.performance
          .getEntriesByType('paint')
          .find(entry => entry.name === 'first-contentful-paint')?.startTime,
      };
    }
    return null;
  }
}
