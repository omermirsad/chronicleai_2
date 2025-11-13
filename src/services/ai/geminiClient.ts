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

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Gemini proxy error:', error);
      toast.error('AI service is temporarily unavailable.');
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
