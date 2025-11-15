// Supabase Edge Function: Send Email
// Handles sending various types of emails using Resend

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { withMiddleware, parseJsonBody, createErrorResponse, createSuccessResponse } from '../_shared/middleware.ts';
import { validateEmailRequest, sanitizeHtmlBasic } from '../_shared/validation.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

async function handleRequest(req: Request, userId?: string): Promise<Response> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return createErrorResponse(
      'Email service not configured',
      500,
      'CONFIG_ERROR'
    );
  }

  // Parse request body
  const { data: body, error: parseError } = await parseJsonBody(req, 1048576); // 1MB max
  if (parseError || !body) {
    return createErrorResponse(
      parseError || 'Invalid request body',
      400,
      'INVALID_REQUEST'
    );
  }

  // Validate email request
  const validation = validateEmailRequest(body);
  if (!validation.success) {
    return createErrorResponse(
      validation.errors?.join(', ') || 'Validation failed',
      400,
      'VALIDATION_ERROR'
    );
  }

  const { to, subject, html, from = 'Chronicle AI <noreply@chronicle-ai.app>' } = validation.data!;

  // Sanitize HTML content to prevent injection
  const sanitizedHtml = sanitizeHtmlBasic(html);

  try {
    // Send email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: subject.trim(),
        html: sanitizedHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      return createErrorResponse(
        'Failed to send email',
        resendResponse.status,
        'EMAIL_SEND_ERROR'
      );
    }

    return createSuccessResponse({
      success: true,
      messageId: resendData.id,
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to send email',
      500,
      'EMAIL_ERROR'
    );
  }
}

serve(async (req: Request) => {
  return withMiddleware(req, handleRequest, {
    requireAuth: true,
    rateLimit: true,
    strictRateLimit: true, // Strict rate limit for email sending
    maxBodySize: 1048576, // 1MB
    timeout: 10000, // 10 seconds
    requiredEnvVars: ['RESEND_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  });
});
