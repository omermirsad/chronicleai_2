// Fix: Use npm specifier to import the Google GenAI SDK in a Deno environment.
import { GoogleGenAI, GenerateContentResponse } from "npm:@google/genai";
import { withMiddleware, parseJsonBody, createErrorResponse, createSuccessResponse } from "../_shared/middleware.ts";
import { validateAIAnalysisRequest } from "../_shared/validation.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
const AI_TIMEOUT_MS = 30000; // 30 seconds timeout for AI operations

async function handleRequest(req: Request, userId?: string): Promise<Response> {
  if (!GEMINI_API_KEY) {
    return createErrorResponse(
      'AI service not configured',
      500,
      'CONFIG_ERROR'
    );
  }

  // Parse and validate request body
  const { data: body, error: parseError } = await parseJsonBody(req, 1048576); // 1MB max
  if (parseError || !body) {
    return createErrorResponse(
      parseError || 'Invalid request body',
      400,
      'INVALID_REQUEST'
    );
  }

  // Validate request structure
  const validation = validateAIAnalysisRequest(body);
  if (!validation.success) {
    return createErrorResponse(
      validation.errors?.join(', ') || 'Validation failed',
      400,
      'VALIDATION_ERROR'
    );
  }

  const { parts, config } = validation.data!;

  try {
    // Fix: Initialize SDK within the request handler to ensure env var is loaded.
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const model = GEMINI_MODEL;

    // Check if client supports streaming
    const acceptHeader = req.headers.get('accept') || '';
    const supportsStreaming = acceptHeader.includes('text/event-stream');

    if (supportsStreaming && config?.responseMimeType !== 'application/json') {
      // Streaming response for better UX
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            const streamResponse = await ai.models.generateContentStream({
              model,
              contents: [{ parts }],
              config,
            });

            for await (const chunk of streamResponse.stream) {
              const text = chunk.text;
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error: any) {
            console.error('Streaming error:', error);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (for JSON or clients that don't support streaming)
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS);
    });

    // Race between AI call and timeout
    const response: GenerateContentResponse = await Promise.race([
      ai.models.generateContent({
        model,
        contents: [{ parts }],
        config,
      }),
      timeoutPromise,
    ]);

    const responseText = response.text;
    let result: any;

    if (config?.responseMimeType === 'application/json') {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Gemini JSON response:", responseText);
        return createErrorResponse(
          'Invalid JSON response from AI',
          500,
          'AI_PARSE_ERROR'
        );
      }
    } else {
      result = responseText;
    }

    return createSuccessResponse(result);
  } catch (error: any) {
    console.error('AI generation error:', error);
    return createErrorResponse(
      error.message || 'Failed to generate AI content',
      500,
      'AI_ERROR'
    );
  }
}

// Use native Deno.serve for better cold-start performance
Deno.serve(async (req: Request) => {
  return withMiddleware(req, handleRequest, {
    requireAuth: true,
    rateLimit: true,
    strictRateLimit: true, // Strict rate limit for AI operations
    checkAICallLimit: true, // Enforce subscription-based AI call limits
    maxBodySize: 1048576, // 1MB
    timeout: 35000, // 35 seconds total timeout (5s buffer over AI timeout)
    requiredEnvVars: ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  });
});