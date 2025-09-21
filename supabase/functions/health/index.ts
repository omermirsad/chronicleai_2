// supabase/functions/health/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  services: {
    database: boolean;
    storage: boolean;
    gemini: boolean;
    auth: boolean;
  };
  metrics?: {
    uptime: number;
    requestCount: number;
    avgResponseTime: number;
  };
}

// Simple in-memory metrics (in production, use a proper monitoring service)
let startTime = Date.now();
let requestCount = 0;
let totalResponseTime = 0;

async function checkDatabase(): Promise<boolean> {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Simple query to check database connectivity
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    return !error;
  } catch {
    return false;
  }
}

async function checkStorage(): Promise<boolean> {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Check if storage bucket exists
    const { data, error } = await supabase.storage.listBuckets();
    
    return !error && Array.isArray(data);
  } catch {
    return false;
  }
}

async function checkGemini(): Promise<boolean> {
  try {
    // Check if Gemini API key is configured
    const hasGeminiKey = !!Deno.env.get('GEMINI_API_KEY');
    return hasGeminiKey;
  } catch {
    return false;
  }
}

async function checkAuth(): Promise<boolean> {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
    
    // Check if auth service is responsive
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  const startReq = Date.now();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests for health checks
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    requestCount++;
    
    // Run health checks in parallel
    const [dbHealthy, storageHealthy, geminiHealthy, authHealthy] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkGemini(),
      checkAuth()
    ]);
    
    // Determine overall status
    const allHealthy = dbHealthy && storageHealthy && geminiHealthy && authHealthy;
    const someHealthy = dbHealthy || storageHealthy || geminiHealthy || authHealthy;
    
    let status: HealthCheckResponse['status'] = 'ok';
    if (!allHealthy) {
      status = someHealthy ? 'degraded' : 'error';
    }
    
    // Calculate metrics
    const responseTime = Date.now() - startReq;
    totalResponseTime += responseTime;
    const uptime = Date.now() - startTime;
    
    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        database: dbHealthy,
        storage: storageHealthy,
        gemini: geminiHealthy,
        auth: authHealthy
      },
      metrics: {
        uptime: Math.floor(uptime / 1000), // in seconds
        requestCount,
        avgResponseTime: Math.floor(totalResponseTime / requestCount)
      }
    };
    
    // Set appropriate status code
    const statusCode = status === 'ok' ? 200 : status === 'degraded' ? 206 : 503;
    
    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse: HealthCheckResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        database: false,
        storage: false,
        gemini: false,
        auth: false
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
