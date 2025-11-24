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

// Coaching Module Descriptions
const coachingModuleDescriptions: Record<CoachingModuleType, string> = {
  'goal-setting': 'A structured coaching session to help you clarify, plan, and commit to meaningful goals.',
  'anxiety-management': 'A supportive session to understand anxiety triggers, develop coping strategies, and build resilience.',
  'gratitude-practice': 'A practice-focused session to cultivate gratitude and appreciate the positive aspects of your life.',
  'self-compassion': 'A gentle session to develop kindness toward yourself, especially during difficult times.',
  'mindfulness': 'A session to develop present-moment awareness and reduce stress through mindful practices.',
};

const coachingModuleTitles: Record<CoachingModuleType, string> = {
  'goal-setting': 'Goal Setting Workshop',
  'anxiety-management': 'Anxiety Management Session',
  'gratitude-practice': 'Gratitude Practice',
  'self-compassion': 'Self-Compassion Journey',
  'mindfulness': 'Mindfulness Practice',
};

// AI-Powered Coaching Module Initialization
export const getCoachingModule = async (moduleType: CoachingModuleType) => {
  const description = coachingModuleDescriptions[moduleType];
  const title = coachingModuleTitles[moduleType];

  const prompt = `You are a professional life coach specializing in "${moduleType}".
You are starting a personalized coaching session focused on: ${description}

Your task is to create a welcoming introduction and the first coaching question for this session.
The introduction should be warm, explain what the session will cover, and set a supportive tone.
Then provide a thoughtful, open-ended first question to begin the coaching journey.

Format your response as a natural, flowing introduction followed by your first question.`;

  try {
    const initialPrompt = await GeminiClient.callWithText(prompt);

    return {
      title,
      description,
      initialPrompt: initialPrompt.trim(),
      totalSteps: 5, // AI will dynamically generate 5 steps
    };
  } catch (error) {
    // Fallback to static content if AI fails
    return {
      title,
      description,
      initialPrompt: `Welcome to the ${title}! Let's begin this journey together. What brings you to this session today?`,
      totalSteps: 5,
    };
  }
};

// AI-Powered Coaching Follow-Up (Conversational)
export const getCoachingFollowUp = async (
  moduleType: CoachingModuleType,
  stepNumber: number,
  conversationHistory: { prompt: string; response: string }[]
): Promise<{ prompt: string; isComplete: boolean }> => {
  const description = coachingModuleDescriptions[moduleType];
  const totalSteps = 5;

  // If we've completed all steps, provide a summary
  if (stepNumber >= totalSteps) {
    const summaryPrompt = `You are a professional life coach. You just completed a ${moduleType} coaching session.

Here's the conversation history:
${conversationHistory.map((h, i) => `Step ${i + 1}:\nCoach: ${h.prompt}\nClient: ${h.response}`).join('\n\n')}

Provide a warm, encouraging closing message that:
1. Acknowledges the client's insights and progress
2. Highlights 2-3 key takeaways from the session
3. Offers a gentle suggestion for how to apply what they learned
4. Ends with encouragement

Keep it concise (3-4 paragraphs) and personal.`;

    try {
      const summary = await GeminiClient.callWithText(summaryPrompt);
      return { prompt: summary.trim(), isComplete: true };
    } catch (error) {
      return {
        prompt: 'Thank you for your thoughtful engagement in this session. Remember to be kind to yourself as you move forward.',
        isComplete: true,
      };
    }
  }

  // Generate the next coaching question based on conversation history
  const nextStepPrompt = `You are a professional life coach conducting a ${moduleType} session.
Session description: ${description}

This is step ${stepNumber + 1} of ${totalSteps}. Here's the conversation so far:
${conversationHistory.map((h, i) => `Step ${i + 1}:\nCoach: ${h.prompt}\nClient: ${h.response}`).join('\n\n')}

Based on the client's responses, generate the next coaching question or prompt. Your response should:
1. Acknowledge what the client just shared (briefly and warmly)
2. Ask a deeper, insightful follow-up question that builds on their response
3. Guide them toward actionable insights or self-discovery
4. Match the tone and depth of the session type

Provide ONLY the next coaching prompt. Be conversational, supportive, and specific to their responses.`;

  try {
    const nextPrompt = await GeminiClient.callWithText(nextStepPrompt);
    return { prompt: nextPrompt.trim(), isComplete: false };
  } catch (error) {
    // Fallback questions if AI fails
    const fallbackQuestions = [
      "Can you tell me more about that?",
      "How does this make you feel?",
      "What would taking action on this look like?",
      "What's one small step you could take today?",
      "How will you know when you've made progress?",
    ];
    return {
      prompt: fallbackQuestions[Math.min(stepNumber, fallbackQuestions.length - 1)],
      isComplete: false,
    };
  }
};
