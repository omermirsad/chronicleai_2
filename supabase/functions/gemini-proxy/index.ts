// supabase/functions/gemini-proxy/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Rate limiting store - in production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + 60000 // 1 minute window
    });
    return true;
  }
  
  if (userLimit.count >= 10) { // 10 requests per minute
    return false;
  }
  
  userLimit.count++;
  return true;
}

async function handleRequest(req: Request) {
  // Verify authentication
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase configuration');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Verify JWT token
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check rate limit
  if (!checkRateLimit(user.id)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
      status: 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': '60'
      },
    });
  }

  // Check user's subscription tier and usage
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, ai_calls_used, ai_calls_limit')
    .eq('id', user.id)
    .single();

  if (profile && profile.ai_calls_used >= profile.ai_calls_limit) {
    return new Response(JSON.stringify({ 
      error: 'Monthly AI usage limit exceeded. Please upgrade your plan.' 
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { parts, config } = await req.json();
    
    // Validate and sanitize input
    if (!parts || !Array.isArray(parts)) {
      throw new Error("Invalid request body: 'parts' array is required");
    }

    if (parts.length > 10) {
      throw new Error("Too many parts in request");
    }

    // Sanitize text input - limit length and remove potentially harmful content
    const sanitizedParts = parts.map(part => {
      if (part.text) {
        // Limit text length
        if (part.text.length > 10000) {
          part.text = part.text.substring(0, 10000);
        }
        // Remove null bytes and control characters
        part.text = part.text.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      }
      if (part.inlineData && part.inlineData.data) {
        // Limit image data size (roughly 5MB in base64)
        if (part.inlineData.data.length > 6990506) {
          throw new Error("Image data too large");
        }
      }
      return part;
    });

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate content with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let result;
    try {
      result = await model.generateContent({
        contents: [{ role: "user", parts: sanitizedParts }],
        generationConfig: config,
      });
    } finally {
      clearTimeout(timeout);
    }

    const response = result.response;
    const responseText = response.text();

    // Parse JSON if requested
    let finalResponse;
    if (config?.responseMimeType === 'application/json') {
      try {
        finalResponse = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Gemini JSON response:", e);
        throw new Error("Invalid JSON response from AI");
      }
    } else {
      finalResponse = responseText;
    }

    // Update usage count
    await supabase
      .from('profiles')
      .update({ 
        ai_calls_used: (profile?.ai_calls_used || 0) + 1,
        last_ai_call: new Date().toISOString()
      })
      .eq('id', user.id);

    // Log successful API call for monitoring
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'AI_API_CALL',
        table_name: 'gemini_proxy',
        new_data: { 
          parts_count: sanitizedParts.length,
          response_length: responseText.length 
        }
      });

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Edge function error:', error);
    
    // Don't expose internal errors to client
    const errorMessage = error.message?.includes('Rate limit') 
      ? error.message 
      : 'An error occurred processing your request';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: error.message?.includes('Rate limit') ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    return await handleRequest(req);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
