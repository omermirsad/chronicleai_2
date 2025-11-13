/**
 * Main Gemini Service - Re-exports all AI services for backward compatibility
 */

import { EntryAnalysisService } from './ai/entryAnalysisService';
import { PerspectivesService } from './ai/perspectivesService';
import { GeminiClient } from './ai/geminiClient';
import { SchemaType } from '@google/generative-ai';
import type { JournalEntry, GuidedSessionType, AIAnalysis, Perspective, CoachingModuleType } from '../types';

const Type = SchemaType;

// Re-export for backward compatibility
export const analyzeEntry = (text: string, photoBase64?: string): Promise<AIAnalysis> => {
  return EntryAnalysisService.analyzeEntry(text, photoBase64);
};

export const getPerspectives = (entryText: string): Promise<Perspective[]> => {
  return PerspectivesService.getPerspectives(entryText);
};

export const generateInsights = async (entries: JournalEntry[], userId: string): Promise<string> => {
  if (entries.length < 3) {
    return 'Not enough entries to generate insights. Keep journaling to discover patterns over time!';
  }

  const entriesText = entries
    .slice(0, 20)
    .map((e) => {
      let entryString = `Date: ${e.date}\n`;
      if (e.mood) entryString += `Mood: ${e.mood}/5\n`;
      if (e.energy !== undefined) entryString += `Energy: ${e.energy}/100\n`;
      entryString += `Tags: ${e.aiAnalysis?.tags?.join(', ') || 'N/A'}\nEntry:\n${e.text.substring(0, 500)}`;
      return entryString;
    })
    .join('\n\n---\n\n');

  const prompt = `You are a personal analyst AI. Your task is to identify subtle, long-term correlations and patterns from a user's journal entries. The user also tracks mood (1=very negative, 5=very positive) and energy level (0-100). Present your findings as gentle, encouraging observations in Markdown format. Use headings, bold text, and lists to structure the information for easy readability. Do not give advice. Focus on connections between actions, environments, feelings, and the user's recorded mood and energy levels.\n\nHere are the user's entries:\n\n${entriesText}\n\nBased on these entries, what are some potential patterns or insights? Specifically look for correlations between entry content and the recorded mood/energy.`;

  const result = await GeminiClient.callWithText(prompt);
  return result;
};

const guidedPromptSchema = {
  type: Type.OBJECT,
  properties: {
    prompts: {
      type: Type.ARRAY,
      description: "An array of exactly three distinct, open-ended follow-up questions to guide the user's reflection.",
      items: { type: Type.STRING },
    },
  },
  required: ['prompts'],
};

export const getGuidedPrompt = async (
  sessionType: GuidedSessionType,
  history: { prompt: string; response: string }[]
): Promise<string[]> => {
  const sessionDescription = {
    gratitude: 'A session focused on thankfulness and appreciating the good things in life.',
    challenge: 'A session to reflect on a difficult situation, process emotions, and find a path forward.',
    review: 'A session for a weekly review, reflecting on successes, challenges, and learnings.',
    'future-self': 'A session to envision an ideal future, gain clarity, and find motivation.',
    'mindful-observation': 'A session to ground oneself in the present moment by observing the environment and inner state.',
    'stoic-reflection': "A session to practice resilience by reflecting on what is within one's control.",
  };

  let prompt: string;

  if (history.length === 0) {
    prompt = `You are a gentle and insightful journaling guide. Give me a single, welcoming, open-ended starting prompt for a journaling session about "${sessionType}". Provide ONLY the text of the prompt.`;
    try {
      const result = await GeminiClient.callWithText(prompt);
      return [result.trim()];
    } catch (error) {
      return ["Let's begin. What's on your mind right now?"];
    }
  } else {
    prompt = `You are a gentle and insightful journaling guide. Your role is to provide a sequence of prompts to help a user reflect on a specific topic. Your tone is warm, encouraging, and curious.

        The user has started a "${sessionType}" session. Description: ${sessionDescription[sessionType]}.

        The conversation history so far is:
        ${history.map((h) => `Guide: ${h.prompt}\nUser: ${h.response}`).join('\n\n')}

        Based on this, generate three distinct, open-ended follow-up questions to help the user continue their reflection. The questions should offer different angles for exploration. Return the prompts in the requested JSON format.`;

    try {
      const result = await GeminiClient.callProxy(
        [{ text: prompt }],
        {
          responseMimeType: 'application/json',
          responseSchema: guidedPromptSchema,
        }
      );
      return result.prompts || [];
    } catch (error) {
      return [
        'Can you expand on the most important feeling you mentioned?',
        "What's one thing you could do about this situation?",
        'How does this connect to your larger goals or values?',
      ];
    }
  }
};

// Coaching functions (simplified - can be expanded if needed)
export const getCoachingModule = async (moduleType: CoachingModuleType) => {
  // Simplified implementation - returns static module structure
  const modules: Record<string, any> = {
    'goal-setting': {
      title: 'Goal Setting Workshop',
      steps: [
        'What is one goal you want to achieve in the next 3 months?',
        'Why is this goal important to you?',
        'What would success look like?',
      ],
    },
    // Add more modules as needed
  };

  return modules[moduleType] || modules['goal-setting'];
};

export const getCoachingFollowUp = async (
  module: any,
  stepNumber: number,
  userResponse?: string
): Promise<{ prompt: string; followUp?: string }> => {
  if (stepNumber < module.steps.length) {
    return { prompt: module.steps[stepNumber] };
  }
  return { prompt: 'Thank you for completing this module!' };
};
