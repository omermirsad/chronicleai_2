import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import toast from 'react-hot-toast';

type Part = { text: string } | { inlineData: { data: string; mimeType: string } };

/**
 * Base Gemini API client that proxies calls through Supabase Edge Function
 */
export class GeminiClient {
  /**
   * Call the Gemini proxy with parts and optional configuration
   */
  static async callProxy(parts: Part[], config?: object): Promise<any> {
    try {
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
    } catch (error: any) {
      logger.error('Gemini proxy error:', error);

      // Don't show toast for limit errors - let the calling code handle it
      if (error?.code !== 'AI_LIMIT_EXCEEDED') {
        toast.error('AI service is temporarily unavailable.');
      }

      throw error;
    }
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
    const parts: Part[] = [{ text }];

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
  static async callWithSchema(parts: Part[], schema: object): Promise<any> {
    return this.callProxy(parts, {
      response_mime_type: 'application/json',
      response_schema: schema,
    });
  }
}
