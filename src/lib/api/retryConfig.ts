/**
 * API Retry Logic with Exponential Backoff and Circuit Breaker
 * Facebook/Meta-level resilience patterns
 */

import { logger } from '../logger';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
  timeout?: number;
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;

  constructor(private config: Required<CircuitBreakerConfig>) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        logger.info('Circuit breaker CLOSED');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      logger.warn('Circuit breaker reopened to OPEN state');
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker OPEN after ${this.failureCount} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    if (this.lastFailureTime === null) return false;
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
}

/**
 * Global circuit breakers for different API endpoints
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(endpoint: string, config: CircuitBreakerConfig): CircuitBreaker {
  if (!circuitBreakers.has(endpoint)) {
    circuitBreakers.set(
      endpoint,
      new CircuitBreaker({
        failureThreshold: config.failureThreshold || 5,
        resetTimeout: config.resetTimeout || 60000,
        monitoringPeriod: config.monitoringPeriod || 10000,
      })
    );
  }
  return circuitBreakers.get(endpoint)!;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number
): number {
  const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (random value between 0-20% of delay)
  const jitter = cappedDelay * 0.2 * Math.random();

  return cappedDelay + jitter;
}

/**
 * Check if error is retryable
 */
function isRetryable(error: any, retryableStatuses: number[]): boolean {
  // Network errors
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    return true;
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    return true;
  }

  // HTTP status codes
  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }

  return false;
}

/**
 * Retry fetch with exponential backoff
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {},
  circuitBreakerConfig: CircuitBreakerConfig = {}
): Promise<T> {
  const config = {
    maxRetries: retryConfig.maxRetries ?? 3,
    initialDelay: retryConfig.initialDelay ?? 1000,
    maxDelay: retryConfig.maxDelay ?? 10000,
    backoffFactor: retryConfig.backoffFactor ?? 2,
    retryableStatuses: retryConfig.retryableStatuses ?? [408, 429, 500, 502, 503, 504],
    timeout: retryConfig.timeout ?? 30000,
  };

  const circuitBreaker = getCircuitBreaker(url, circuitBreakerConfig);
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Execute with circuit breaker
      const response = await circuitBreaker.execute(async () => {
        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            error.response = response;
            throw error;
          }

          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });

      // Parse response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return (await response.text()) as any;
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryable(error, config.retryableStatuses)) {
        logger.error('Non-retryable error', error, {
          url,
          attempt,
          status: error.status,
        });
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === config.maxRetries) {
        logger.error('Max retries exhausted', error, {
          url,
          attempts: attempt + 1,
        });
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffFactor
      );

      logger.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`, {
        url,
        error: error.message,
        status: error.status,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Request queue for rate limiting
 */
class RequestQueue {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(
    private maxConcurrent: number,
    private minInterval: number
  ) {}

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(() => {
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.running--;
            setTimeout(() => this.processNext(), this.minInterval);
          });
      });

      this.processNext();
    });
  }

  private processNext(): void {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const fn = this.queue.shift();
    if (fn) {
      this.running++;
      fn();
    }
  }
}

// Global request queue for rate limiting
export const requestQueue = new RequestQueue(10, 100);

/**
 * Fetch with rate limiting
 */
export async function fetchWithRateLimit<T = any>(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<T> {
  return requestQueue.add(() => fetchWithRetry<T>(url, options, retryConfig));
}

/**
 * Reset all circuit breakers (useful for testing or manual recovery)
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.forEach((cb) => cb.reset());
  logger.info('All circuit breakers reset');
}

/**
 * Get circuit breaker states (useful for monitoring)
 */
export function getCircuitBreakerStates(): Record<string, CircuitState> {
  const states: Record<string, CircuitState> = {};
  circuitBreakers.forEach((cb, endpoint) => {
    states[endpoint] = cb.getState();
  });
  return states;
}
