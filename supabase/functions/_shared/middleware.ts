/**
 * Middleware utilities for Supabase Edge Functions
 * Provides CORS, rate limiting, validation, and error handling
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * CORS configuration for production
 */
const ALLOWED_ORIGINS = [
  'https://chronicle-ai.app',
  'https://www.chronicle-ai.app',
  // Add development origins in dev mode
  ...(Deno.env.get('ENVIRONMENT') === 'development'
    ? ['http://localhost:5173', 'http://localhost:3000']
    : []),
];

/**
 * Get CORS headers based on request origin
 */
export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: getCorsHeaders(request),
      status: 200,
    });
  }
  return null;
}

/**
 * Rate limiter using in-memory storage
 * For production, use Redis or Supabase rate limiting
 */
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];

    // Filter out old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if rate limit exceeded
    if (requests.length >= this.maxRequests) {
      return true;
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(windowStart);
    }

    return false;
  }

  private cleanup(beforeTimestamp: number) {
    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(t => t > beforeTimestamp);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

// Global rate limiters
const globalLimiter = new SimpleRateLimiter(60000, 60); // 60 requests per minute
const strictLimiter = new SimpleRateLimiter(60000, 10); // 10 requests per minute for sensitive endpoints

/**
 * Apply rate limiting
 */
export function checkRateLimit(
  identifier: string,
  strict: boolean = false
): boolean {
  const limiter = strict ? strictLimiter : globalLimiter;
  return limiter.isRateLimited(identifier);
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string,
  corsHeaders?: HeadersInit
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...(code && { code }),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...(corsHeaders || {}),
      },
    }
  );
}

/**
 * Create success response
 */
export function createSuccessResponse(
  data: any,
  status: number = 200,
  corsHeaders?: HeadersInit
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(corsHeaders || {}),
    },
  });
}

/**
 * Validate request body size
 */
export async function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 1048576 // 1MB default
): Promise<string | null> {
  const contentLength = request.headers.get('content-length');

  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return `Request body too large. Maximum size: ${maxSizeBytes} bytes`;
  }

  return null;
}

/**
 * Parse and validate JSON body
 */
export async function parseJsonBody<T = any>(
  request: Request,
  maxSizeBytes: number = 1048576
): Promise<{ data: T | null; error: string | null }> {
  try {
    // Check size
    const sizeError = await validateRequestSize(request, maxSizeBytes);
    if (sizeError) {
      return { data: null, error: sizeError };
    }

    // Parse JSON
    const body = await request.json();
    return { data: body as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Invalid JSON body'
    };
  }
}

/**
 * Verify Supabase JWT token
 */
export async function verifyAuth(
  request: Request,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ userId: string | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return { userId: null, error: 'Missing authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { userId: null, error: 'Invalid or expired token' };
    }

    return { userId: user.id, error: null };
  } catch (error) {
    return {
      userId: null,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

/**
 * Verify cron secret
 * IMPORTANT: Fails closed - rejects if secret is not configured
 */
export function verifyCronSecret(request: Request): { authorized: boolean; error?: string } {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');

  // Fail closed: If no secret is configured, reject the request
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured');
    return {
      authorized: false,
      error: 'Server configuration error: CRON_SECRET not set'
    };
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return {
      authorized: false,
      error: 'Unauthorized: Invalid or missing cron secret'
    };
  }

  return { authorized: true };
}

/**
 * Add timeout to a promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(timeoutError || `Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(required: string[]): { valid: boolean; missing?: string[] } {
  const missing = required.filter(varName => !Deno.env.get(varName));

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Check and increment AI call usage for a user
 * Returns { allowed: true, ... } if the user can make the call
 * Returns { allowed: false, error: "..." } if the limit is reached
 */
export async function checkAndIncrementAICalls(
  userId: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{
  allowed: boolean;
  callsUsed?: number;
  callsLimit?: number;
  callsRemaining?: number;
  error?: string;
}> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .rpc('increment_ai_calls', { user_uuid: userId });

    if (error) {
      console.error('Error checking AI call limit:', error);
      return {
        allowed: false,
        error: 'Failed to verify subscription limits'
      };
    }

    if (!data || data.length === 0) {
      return {
        allowed: false,
        error: 'Failed to retrieve subscription data'
      };
    }

    const result = data[0];

    if (!result.success) {
      return {
        allowed: false,
        callsUsed: result.calls_used,
        callsLimit: result.calls_limit,
        callsRemaining: 0,
        error: `AI call limit reached. You've used ${result.calls_used} of ${result.calls_limit} calls this month. Please upgrade your subscription to continue.`
      };
    }

    return {
      allowed: true,
      callsUsed: result.calls_used,
      callsLimit: result.calls_limit,
      callsRemaining: result.calls_remaining
    };
  } catch (error) {
    console.error('Exception in checkAndIncrementAICalls:', error);
    return {
      allowed: false,
      error: error instanceof Error ? error.message : 'Failed to check subscription limits'
    };
  }
}

/**
 * Comprehensive middleware wrapper
 */
export interface MiddlewareOptions {
  requireAuth?: boolean;
  rateLimit?: boolean;
  strictRateLimit?: boolean;
  maxBodySize?: number;
  timeout?: number;
  requiredEnvVars?: string[];
  checkAICallLimit?: boolean; // New option for AI call limit enforcement
}

export async function withMiddleware(
  request: Request,
  handler: (request: Request, userId?: string) => Promise<Response>,
  options: MiddlewareOptions = {}
): Promise<Response> {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Handle CORS preflight
    const preflightResponse = handleCorsPreFlight(request);
    if (preflightResponse) {
      return preflightResponse;
    }

    // Validate environment variables
    if (options.requiredEnvVars) {
      const envCheck = validateEnvVars(options.requiredEnvVars);
      if (!envCheck.valid) {
        return createErrorResponse(
          'Server configuration error',
          500,
          'ENV_ERROR',
          corsHeaders
        );
      }
    }

    // Rate limiting
    if (options.rateLimit || options.strictRateLimit) {
      const identifier = request.headers.get('x-forwarded-for') ||
                        request.headers.get('cf-connecting-ip') ||
                        'unknown';

      if (checkRateLimit(identifier, options.strictRateLimit)) {
        return createErrorResponse(
          'Rate limit exceeded. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED',
          corsHeaders
        );
      }
    }

    // Authentication
    let userId: string | undefined;
    if (options.requireAuth) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

      const authResult = await verifyAuth(request, supabaseUrl, supabaseKey);
      if (authResult.error) {
        return createErrorResponse(
          authResult.error,
          401,
          'UNAUTHORIZED',
          corsHeaders
        );
      }
      userId = authResult.userId!;
    }

    // AI Call Limit Check (only if authenticated and option enabled)
    if (options.checkAICallLimit && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

      const aiCallCheck = await checkAndIncrementAICalls(userId, supabaseUrl, supabaseKey);

      if (!aiCallCheck.allowed) {
        return createErrorResponse(
          aiCallCheck.error || 'AI call limit reached',
          429,
          'AI_LIMIT_EXCEEDED',
          corsHeaders
        );
      }

      // Optionally add usage info to response headers (for client-side tracking)
      // This will be added to the final response below
    }

    // Execute handler with optional timeout
    let response: Response;
    if (options.timeout) {
      response = await withTimeout(
        handler(request, userId),
        options.timeout,
        `Request timed out after ${options.timeout}ms`
      );
    } else {
      response = await handler(request, userId);
    }

    // Add CORS headers to response
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value as string);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Middleware error:', error);

    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR',
      corsHeaders
    );
  }
}
