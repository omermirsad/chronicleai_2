# 5. API Retry Strategy with Circuit Breaker

Date: 2025-01-17

## Status

Accepted

## Context

The application makes numerous API calls to:
- Supabase (database, auth, storage)
- Google Gemini AI (text generation)
- Stripe (payments)
- Third-party services

Network failures and transient errors are inevitable. We need:
- Resilience against temporary failures
- Protection against cascading failures
- Rate limiting to prevent API quota exhaustion
- Good user experience during network issues

## Decision

Implement a comprehensive retry strategy with:

1. **Exponential Backoff**
   - Initial delay: 1 second
   - Max delay: 10 seconds
   - Backoff factor: 2x
   - Jitter: ±20% randomization

2. **Circuit Breaker Pattern**
   - CLOSED: Normal operation
   - OPEN: Fast-fail after threshold failures
   - HALF_OPEN: Test if service recovered
   - Failure threshold: 5 consecutive failures
   - Reset timeout: 60 seconds

3. **Request Queue**
   - Max concurrent requests: 10
   - Min interval between requests: 100ms
   - Prevents API rate limiting

4. **Retryable Errors**
   - Network errors (fetch failures)
   - Timeout errors
   - HTTP 408, 429, 500, 502, 503, 504
   - Max retries: 3 attempts

## Consequences

### Positive
- Improved reliability and user experience
- Automatic recovery from transient failures
- Protection against cascading failures
- Reduced API quota consumption
- Better handling of network instability

### Negative
- Increased code complexity
- Longer wait times for failed requests
- Potential for delayed error feedback
- Memory overhead for queuing

### Neutral
- Need monitoring for circuit breaker states
- Requires tuning of timeouts and thresholds
- Testing complexity increases

## Implementation

```typescript
// Simple usage
const data = await fetchWithRetry('/api/endpoint');

// With custom config
const data = await fetchWithRetry('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(payload),
}, {
  maxRetries: 5,
  initialDelay: 500,
});

// With rate limiting
const data = await fetchWithRateLimit('/api/endpoint');
```

## Monitoring

Track these metrics:
- Retry attempts per endpoint
- Circuit breaker state changes
- Success rate after retries
- Average retry delay
- Queue depth

## Alternatives Considered

1. **No Retry Logic**
   - Pros: Simple, fast failures
   - Cons: Poor UX, unnecessary failures
   - Decision: Not acceptable for production

2. **Simple Retry (no backoff)**
   - Pros: Simple implementation
   - Cons: Can make problems worse, waste resources
   - Decision: Exponential backoff is standard

3. **Third-party Library (axios-retry, etc.)**
   - Pros: Battle-tested, maintained
   - Cons: Additional dependency, less control
   - Decision: Custom gives us exactly what we need

## References

- [AWS Architecture Blog: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Google Cloud: Retry Patterns](https://cloud.google.com/architecture/scalable-and-resilient-apps)
