// src/services/geminiService.ts
import { JournalEntry, AIAnalysis, Perspective, GuidedSessionType } from '../types';
import { supabase } from '../lib/supabase';
import { APIClient } from '../utils/api';
import { sanitizeTextInput, validateMood, validateEnergy } from '../utils/security';
import toast from 'react-hot-toast';

// Type definitions for Gemini API
interface GeminiPart {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

interface AnalysisSchema {
  summary: string[];
  tags: string[];
  sentiment: string;
  acknowledgement?: string;
  socraticQuestion?: string;
}

// Rate limiting for AI calls
const AI_RATE_LIMIT = {
  maxCallsPerMinute: 5,
  maxCallsPerHour: 20,
};

class AIRateLimiter {
  private calls: number[] = [];
  
  canMakeCall(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    
    // Clean old calls
    this.calls = this.calls.filter(time => time > oneHourAgo);
    
    // Check rate limits
    const callsInLastMinute = this.calls.filter(time => time > oneMinuteAgo).length;
    const callsInLastHour = this.calls.length;
    
    if (callsInLastMinute >= AI_RATE_LIMIT.maxCallsPerMinute) {
      toast.error('Please wait a moment before making another AI request');
      return false;
    }
    
    if (callsInLastHour >= AI_RATE_LIMIT.maxCallsPerHour) {
      toast.error('Hourly AI limit reached. Please try again later.');
      return false;
    }
    
    this.calls.push(now);
    return true;
  }
}

const rateLimiter = new AIRateLimiter();

/**
 * Call the Gemini proxy with authentication and error handling
 */
const callGeminiProxy = async (
  parts: GeminiPart[], 
  config?: object,
  userId?: string
): Promise<any> => {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to use AI features');
  }
  
  if (!rateLimiter.canMakeCall()) {
    throw new Error('Rate limit exceeded');
  }
  
  try {
    const result = await APIClient.callEdgeFunction(
      'gemini-proxy',
      { parts, config },
      userId || session.user.id
    );
    
    return result;
  } catch (error: any) {
    console.error('Gemini proxy error:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('Rate limit')) {
      toast.error('AI service is busy. Please try again in a moment.');
    } else if (error.message?.includes('Monthly AI usage limit')) {
      toast.error('Monthly AI limit reached. Please upgrade your plan.');
    } else if (!navigator.onLine) {
      toast.error('AI features require an internet connection.');
    } else {
      toast.error('AI service temporarily unavailable.');
    }
    
    throw error;
  }
};

/**
 * Analyze a journal entry
 */
export const analyzeEntry = async (
  text: string, 
  photo?: { base64: string; mimeType: string }
): Promise<AIAnalysis> => {
  // Validate and sanitize input
  const sanitizedText = sanitizeTextInput(text);
  
  if (!sanitizedText || sanitizedText.length < 10) {
    return {
      summary: ['Entry saved successfully.'],
      tags: [],
      sentiment: 'Neutral',
      acknowledgement: 'Your entry has been recorded.',
    };
  }
  
  try {
    const prompt = `You are an intelligent, reflective journaling assistant. Your purpose is to listen intently, ask insightful questions, and hold up a mirror to the user's own thoughts. Your tone is empathetic, curious, humble, and concise. You prioritize questions over statements.

Analyze the following journal entry and provide your analysis in the requested JSON format.

The user's entry is:
---
${sanitizedText}
---

Provide a JSON response with:
- summary: Array of 3 concise bullet points summarizing the entry
- tags: Array of up to 5 relevant tags (lowercase, no spaces)
- sentiment: One of "Positive", "Negative", "Neutral", or "Mixed"
- acknowledgement: A brief, validating acknowledgement if sentiment is strongly positive/negative, otherwise empty string
- socraticQuestion: One open-ended question to encourage deeper reflection, or empty string if none`;
    
    const parts: GeminiPart[] = [{ text: prompt }];
    
    // Add image if provided
    if (photo && photo.base64 && photo.mimeType) {
      // Validate image size (max 5MB in base64 ≈ 6.7MB)
      if (photo.base64.length > 6990506) {
        toast.error('Image is too large for AI analysis');
      } else {
        parts.unshift({
          inlineData: {
            data: photo.base64,
            mimeType: photo.mimeType,
          },
        });
      }
    }
    
    const result = await callGeminiProxy(parts, {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 500,
    });
    
    // Validate response structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid AI response format');
    }
    
    return {
      summary: Array.isArray(result.summary) ? result.summary.slice(0, 3) : [],
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 5).map((t: string) => t.toLowerCase().replace(/\s+/g, '-')) : [],
      sentiment: ['Positive', 'Negative', 'Neutral', 'Mixed'].includes(result.sentiment) ? result.sentiment : 'Neutral',
      acknowledgement: typeof result.acknowledgement === 'string' ? result.acknowledgement : undefined,
      socraticQuestion: typeof result.socraticQuestion === 'string' ? result.socraticQuestion : undefined,
    };
    
  } catch (error) {
    console.error("Error analyzing entry:", error);
    
    // Return graceful fallback
    return {
      summary: ['Your entry has been saved.'],
      tags: [],
      sentiment: 'Neutral',
      acknowledgement: navigator.onLine 
        ? "AI analysis will be available shortly." 
        : "AI analysis will be available when you're back online.",
    };
  }
};

/**
 * Get multiple perspectives on an entry
 */
export const getPerspectives = async (entryText: string): Promise<Perspective[]> => {
  const sanitizedText = sanitizeTextInput(entryText, 5000);
  
  if (!sanitizedText) {
    return [
      { title: "Unable to Generate", content: "Entry text is required for perspective analysis." }
    ];
  }
  
  const perspectives = [
    {
      title: "The Objective Observer",
      prompt: `Read the following journal entry. Rewrite it focusing only on the objective facts, separating them from emotional interpretations and stories. What happened vs. what was felt about it? Be concise and factual.

Entry: "${sanitizedText}"`
    },
    {
      title: "The Compassionate Friend",
      prompt: `Read the following journal entry. Imagine your closest friend wrote this and shared it with you. What would you say to them to show compassion, validation, and support, without giving unsolicited advice? Keep it warm and brief.

Entry: "${sanitizedText}"`
    },
    {
      title: "The Future Self",
      prompt: `Read the following journal entry. From the perspective of five years in the future—wiser and with more experience—what perspective or gentle advice would you offer to the person who wrote this? How might this moment look from a distance? Be wise but concise.

Entry: "${sanitizedText}"`
    }
  ];

  try {
    const results = await Promise.allSettled(
      perspectives.map(async (p) => {
        const content = await callGeminiProxy([{ text: p.prompt }], {
          temperature: 0.8,
          maxOutputTokens: 300,
        });
        return { title: p.title, content: content || "Unable to generate perspective." };
      })
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return { 
          title: perspectives[index].title, 
          content: "This perspective couldn't be generated at the moment." 
        };
      }
    });
    
  } catch (error) {
    console.error("Error generating perspectives:", error);
    return perspectives.map(p => ({
      title: p.title,
      content: "Perspective generation is temporarily unavailable."
    }));
  }
};

/**
 * Generate insights from multiple entries
 */
export const generateInsights = async (
  entries: JournalEntry[], 
  userId: string
): Promise<string> => {
  if (entries.length < 3) {
    return "You need at least 3 journal entries to generate insights. Keep writing to unlock patterns in your journey!";
  }
  
  // Limit to recent entries for better performance
  const recentEntries = entries.slice(0, Math.min(20, entries.length));
  
  const entriesText = recentEntries.map(e => {
    let entryString = `Date: ${new Date(e.date).toLocaleDateString()}\n`;
    
    if (validateMood(e.mood)) {
      entryString += `Mood: ${e.mood}/5\n`;
    }
    
    if (validateEnergy(e.energy)) {
      entryString += `Energy: ${e.energy}/100\n`;
    }
    
    if (e.aiAnalysis?.tags?.length) {
      entryString += `Tags: ${e.aiAnalysis.tags.join(', ')}\n`;
    }
    
    // Limit text length per entry
    const truncatedText = sanitizeTextInput(e.text, 500);
    entryString += `Entry:\n${truncatedText}`;
    
    return entryString;
  }).join('\n\n---\n\n');

  const prompt = `You are a personal insight generator. Analyze these journal entries to identify patterns, trends, and insights. Focus on:
1. Emotional patterns and mood trends
2. Energy level correlations
3. Recurring themes or concerns
4. Positive developments and growth
5. Areas that might benefit from attention

Present your findings as actionable, encouraging observations in Markdown format. Use headings, bold text, and lists. Be specific but kind. Maximum 500 words.

Entries:
${entriesText}`;
  
  try {
    const insights = await callGeminiProxy([{ text: prompt }], {
      temperature: 0.7,
      maxOutputTokens: 600,
    }, userId);
    
    return insights || "Unable to generate insights at this time.";
    
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Insight generation is temporarily unavailable. Please try again later.";
  }
};

/**
 * Get guided journaling prompt
 */
export const getGuidedPrompt = async (
  sessionType: GuidedSessionType, 
  history: { prompt: string; response: string }[]
): Promise<string[]> => {
  const sessionDescriptions: Record<GuidedSessionType, string> = {
    gratitude: "focusing on thankfulness and appreciation",
    challenge: "reflecting on difficulties and finding paths forward",
    review: "reviewing the week's successes and learnings",
    'future-self': "envisioning an ideal future for clarity and motivation",
    'mindful-observation': "grounding in the present moment",
    'stoic-reflection': "practicing resilience through Stoic principles"
  };

  try {
    if (history.length === 0) {
      // Generate initial prompt
      const prompt = `Generate a single, warm, open-ended journaling prompt for a session about ${sessionDescriptions[sessionType]}. 
      Keep it concise and inviting. Return only the prompt text, no additional formatting.`;
      
      const result = await callGeminiProxy([{ text: prompt }], {
        temperature: 0.8,
        maxOutputTokens: 100,
      });
      
      return [result?.trim() || "What's on your mind right now?"];
      
    } else {
      // Generate follow-up prompts
      const conversationHistory = history.map(h => 
        `Guide: ${h.prompt}\nUser: ${sanitizeTextInput(h.response, 200)}`
      ).join('\n\n');
      
      const prompt = `You are a gentle journaling guide helping with a ${sessionDescriptions[sessionType]} session.

Conversation so far:
${conversationHistory}

Generate exactly 3 distinct follow-up questions to deepen the reflection. Each should explore a different angle. 
Return as JSON array of strings.`;
      
      const result = await callGeminiProxy([{ text: prompt }], {
        responseMimeType: "application/json",
        temperature: 0.8,
        maxOutputTokens: 200,
      });
      
      if (Array.isArray(result)) {
        return result.slice(0, 3);
      }
      
      // Fallback prompts
      return [
        "Can you expand on that feeling?",
        "What would change if you approached this differently?",
        "How does this connect to what matters most to you?"
      ];
    }
    
  } catch (error) {
    console.error("Error getting guided prompt:", error);
    
    // Return fallback prompts
    const fallbacks: Record<GuidedSessionType, string[]> = {
      gratitude: ["What are three things you're grateful for today?"],
      challenge: ["What challenge are you currently facing?"],
      review: ["What went well this week?"],
      'future-self': ["What does your ideal future look like?"],
      'mindful-observation': ["What do you notice around you right now?"],
      'stoic-reflection': ["What is within your control today?"]
    };
    
    return fallbacks[sessionType] || ["What would you like to explore today?"];
  }
};
