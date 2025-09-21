// src/utils/api.ts
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

interface RateLimitInfo {
  userId: string;
  count: number;
  resetTime: number;
}

/**
 * API client with retry logic and rate limiting
 */
export class APIClient {
  private static readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error) => {
      // Retry on network errors or 5xx status codes
      if (!error.status) return true;
      if (error.status >= 500) return true;
      if (error.status === 429) return true; // Rate limit
      return false;
    }
  };

  private static rateLimitMap = new Map<string, RateLimitInfo>();
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private static readonly MAX_REQUESTS_PER_WINDOW = 10;

  /**
   * Check client-side rate limit
   */
  private static checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const info = this.rateLimitMap.get(userId);

    if (!info || now > info.resetTime) {
      this.rateLimitMap.set(userId, {
        userId,
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return true;
    }

    if (info.count >= this.MAX_REQUESTS_PER_WINDOW) {
      const timeLeft = Math.ceil((info.resetTime - now) / 1000);
      toast.error(`Rate limit exceeded. Please wait ${timeLeft} seconds.`);
      return false;
    }

    info.count++;
    return true;
  }

  /**
   * Execute function with retry logic
   */
  static async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    config: RetryConfig = {},
    userId?: string
  ): Promise<T> {
    // Check rate limit if userId provided
    if (userId && !this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }

    const mergedConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: any;
    let delay = mergedConfig.initialDelay!;

    for (let attempt = 0; attempt <= mergedConfig.maxRetries!; attempt++) {
      try {
        return await fetchFn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if it's the last attempt
        if (attempt === mergedConfig.maxRetries) {
          throw error;
        }

        // Check if should retry
        if (!mergedConfig.retryCondition!(error)) {
          throw error;
        }

        // Call retry callback if provided
        if (mergedConfig.onRetry) {
          mergedConfig.onRetry(attempt + 1, error);
        }

        // If rate limited, use retry-after header if available
        if (error.status === 429 && error.headers?.['retry-after']) {
          delay = parseInt(error.headers['retry-after']) * 1000;
        }

        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        
        // Wait before retrying
        await this.delay(delay);
        
        // Increase delay for next attempt (exponential backoff)
        delay = Math.min(
          delay * mergedConfig.backoffFactor!,
          mergedConfig.maxDelay!
        );
      }
    }

    throw lastError;
  }

  /**
   * Delay helper
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Call Supabase Edge Function with retry
   */
  static async callEdgeFunction<T = any>(
    functionName: string,
    payload: any,
    userId: string
  ): Promise<T> {
    return this.fetchWithRetry(
      async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload,
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) {
          // Enhance error with status for retry logic
          const enhancedError: any = new Error(error.message);
          enhancedError.status = error.status;
          enhancedError.code = error.code;
          throw enhancedError;
        }

        return data;
      },
      {
        onRetry: (attempt, error) => {
          console.log(`Edge function retry ${attempt}:`, error.message);
        }
      },
      userId
    );
  }

  /**
   * Reset rate limit for a user
   */
  static resetRateLimit(userId: string): void {
    this.rateLimitMap.delete(userId);
  }

  /**
   * Get remaining requests for a user
   */
  static getRemainingRequests(userId: string): number {
    const info = this.rateLimitMap.get(userId);
    if (!info) return this.MAX_REQUESTS_PER_WINDOW;
    
    const now = Date.now();
    if (now > info.resetTime) {
      return this.MAX_REQUESTS_PER_WINDOW;
    }
    
    return Math.max(0, this.MAX_REQUESTS_PER_WINDOW - info.count);
  }
}

/**
 * Batch API calls to reduce load
 */
export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: any) => void }> = [];
  private processing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private processFn: (items: T[]) => Promise<R[]>,
    private batchSize = 10,
    private delay = 100
  ) {}

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      this.scheduleProcess();
    });
  }

  private scheduleProcess() {
    if (this.timer) clearTimeout(this.timer);
    
    this.timer = setTimeout(() => {
      this.process();
    }, this.delay);
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      const results = await this.processFn(batch.map(b => b.item));
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    } finally {
      this.processing = false;
      
      // Process next batch if queue not empty
      if (this.queue.length > 0) {
        this.scheduleProcess();
      }
    }
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue = [];
  }
}
