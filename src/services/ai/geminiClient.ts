import { supabase } from '../../lib/supabase';
import { retryOperation } from '@/lib/errorHandler';
import toast from 'react-hot-toast';
import { GeminiPart } from '../../types';

/**
 * Base Gemini API client that proxies calls through Supabase Edge Function
 * with exponential backoff retry logic for resilience
 */
export class GeminiClient {
  /**
   * Call the Gemini proxy with parts and optional configuration
   * Includes automatic retry with exponential backoff for transient failures
   */
  static async callProxy(parts: GeminiPart[], config?: object): Promise<any> {
    return retryOperation(
      async () => {
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
          body: { parts, config },
        });

        if (error) {
          // Check if this is an AI limit exceeded error
          if (error.message?.includes('AI call limit reached') || error.message?.includes('limit reached')) {
            // Re-throw with specific error type so calling code can handle it
            const limitError = new Error('AI_LIMIT_EXCEEDED');
            (limitError as any).code = 'AI_LIMIT_EXCEEDED';
            (limitError as any).originalError = error;
            throw limitError;
          }
          throw error;
        }
        return data;
      },
      {
        maxRetries: 3,
        delayMs: 1000,
        onRetry: (attempt) => {
          if (attempt === 1) {
            toast.loading('Retrying AI request...', { duration: 2000 });
          }
        },
      }
    ).catch((error: any) => {
      // Don't show toast for limit errors - let the calling code handle it
      if (error?.code !== 'AI_LIMIT_EXCEEDED') {
        toast.error('AI service is temporarily unavailable.');
      }
      throw error;
    });
  }

  /**
   * Call the Gemini proxy with a simple text prompt
   */
  static async callWithText(prompt: string): Promise<string> {
    const response = await this.callProxy([{ text: prompt }]);
    return typeof response === 'string' ? response : JSON.stringify(response);
  }

  /**
   * Call the Gemini proxy with text and optional image
   */
  static async callWithTextAndImage(text: string, imageBase64?: string): Promise<any> {
    const parts: GeminiPart[] = [{ text }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      });
    }

    return this.callProxy(parts);
  }

  /**
   * Call the Gemini proxy with structured output configuration
   */
  static async callWithSchema(parts: GeminiPart[], schema: object): Promise<any> {
    return this.callProxy(parts, {
      response_mime_type: 'application/json',
      response_schema: schema,
    });
  }
}
