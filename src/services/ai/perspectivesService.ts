import { GeminiClient } from './geminiClient';
import { logger } from '@/lib/logger';
import type { Perspective } from '../../types';

/**
 * Service for generating different perspectives on journal entries
 */
export class PerspectivesService {
  static async getPerspectives(entryText: string): Promise<Perspective[]> {
    const prompts = [
      {
        title: 'The Objective Observer',
        prompt: `Read the following journal entry. Rewrite it focusing only on the objective facts, separating them from emotional interpretations and stories. What happened vs. what was felt about it?\n\nEntry:\n"${entryText}"`,
      },
      {
        title: 'The Compassionate Friend',
        prompt: `Read the following journal entry. Imagine your closest friend wrote this and shared it with you. What would you say to them to show compassion, validation, and support, without giving unsolicited advice?\n\nEntry:\n"${entryText}"`,
      },
      {
        title: 'The Growth Mindset Coach',
        prompt: `Read the following journal entry. Offer a perspective focused on growth: what can be learned, how challenges can lead to positive outcomes, and reframing problems as opportunities.\n\nEntry:\n"${entryText}"`,
      },
    ];

    const results = await Promise.all(
      prompts.map(async (p) => {
        try {
          const content = await GeminiClient.callWithText(p.prompt);
          return { title: p.title, content };
        } catch (error) {
          logger.error(`Error generating perspective "${p.title}":`, error);
          return { title: p.title, content: 'Could not generate this perspective at the moment.' };
        }
      })
    );

    return results;
  }
}
