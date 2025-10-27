// Fix: Add type declaration for Deno to satisfy TypeScript in environments without native Deno types.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Fix: Use npm specifier to import the Google GenAI SDK in a Deno environment.
import { GoogleGenAI, GenerateContentResponse } from "npm:@google/genai";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function handleRequest(req: Request) {
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fix: Initialize SDK within the request handler to ensure env var is loaded.
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = GEMINI_MODEL;
  
  const { parts, config } = await req.json();

  if (!parts || !Array.isArray(parts)) {
      throw new Error("Invalid request body: 'parts' array is required.");
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config,
  });

  const responseText = response.text;
  let result: any;

  if (config?.responseMimeType === 'application/json') {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
         console.error("Failed to parse Gemini JSON response:", responseText);
         throw new Error("Invalid JSON response from AI");
      }
  } else {
    result = responseText;
  }
  
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return await handleRequest(req);
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});