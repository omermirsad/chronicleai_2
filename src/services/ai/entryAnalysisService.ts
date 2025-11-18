import { SchemaType } from '@google/generative-ai';
import { GeminiClient } from './geminiClient';
import { logger } from '@/lib/logger';
import type { AIAnalysis } from '../../types';

const Type = SchemaType;

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.ARRAY,
      description: 'A concise 3-bullet point summary of the entry.',
      items: { type: Type.STRING },
    },
    tags: {
      type: Type.ARRAY,
      description: 'Relevant, non-intrusive tags (e.g., #work, #relationships, #self-reflection). Maximum 5 tags.',
      items: { type: Type.STRING },
    },
    sentiment: {
      type: Type.STRING,
      description: "The primary sentiment of the text (e.g., 'Positive', 'Negative', 'Neutral', 'Mixed').",
    },
    acknowledgement: {
      type: Type.STRING,
      description:
        'If the sentiment is strongly positive or negative, provide a simple, validating acknowledgement. Otherwise, this can be an empty string.',
    },
    socraticQuestion: {
      type: Type.STRING,
      description:
        'Based on a core theme, generate one open-ended Socratic question to encourage deeper reflection. If no clear theme, this can be an empty string.',
    },
  },
  required: ['summary', 'tags', 'sentiment', 'acknowledgement', 'socraticQuestion'],
};

/**
 * Service for analyzing journal entries with AI
 */
export class EntryAnalysisService {
  /**
   * Analyze a journal entry and return insights
   */
  static async analyzeEntry(text: string, photoBase64?: string): Promise<AIAnalysis> {
    try {
      const prompt = `You are an intelligent, reflective journaling assistant. Your purpose is to listen intently, ask insightful questions, and hold up a mirror to the user's own thoughts. Your tone is empathetic, curious, humble, and concise. You prioritize questions over statements. Analyze the following journal entry and provide your analysis in the requested JSON format. The user's entry is:\n\n---\n${text}\n---`;

      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [{ text: prompt }];

      if (photoBase64) {
        parts.unshift({
          inlineData: {
            data: photoBase64,
            mimeType: 'image/jpeg',
          },
        });
      }

      const result = await GeminiClient.callWithSchema(parts, analysisSchema);

      return {
        summary: result.summary || [],
        tags: result.tags || [],
        sentiment: result.sentiment || 'Neutral',
        acknowledgement: result.acknowledgement || undefined,
        socraticQuestion: result.socraticQuestion || undefined,
      };
    } catch (error) {
      logger.error('Error analyzing entry:', error);
      return {
        summary: ['Entry has been saved successfully.'],
        tags: [],
        sentiment: 'Neutral',
        acknowledgement: 'AI analysis will be available when connection is restored.',
        socraticQuestion: 'What is one thing you are grateful for at this moment?',
      };
    }
  }
}
