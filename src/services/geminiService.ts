import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Type aliases for backward compatibility
const Type = SchemaType;
type Part = { text: string } | { inlineData: { data: string; mimeType: string } };
type GenerateContentResponse = any;
import { JournalEntry, AIAnalysis, Perspective, GuidedSessionType, CoachingModuleType } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// A generic proxy invoker that passes parts and config to the backend function
const callGeminiProxy = async (parts: Part[], config?: object): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { parts, config },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Gemini proxy error:', error);
    toast.error('AI service is temporarily unavailable.');
    throw error;
  }
};


const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.ARRAY,
      description: "A concise 3-bullet point summary of the entry.",
      items: { type: Type.STRING },
    },
    tags: {
      type: Type.ARRAY,
      description: "Relevant, non-intrusive tags (e.g., #work, #relationships, #self-reflection). Maximum 5 tags.",
      items: { type: Type.STRING },
    },
    sentiment: {
      type: Type.STRING,
      description: "The primary sentiment of the text (e.g., 'Positive', 'Negative', 'Neutral', 'Mixed').",
    },
    acknowledgement: {
        type: Type.STRING,
        description: "If the sentiment is strongly positive or negative, provide a simple, validating acknowledgement. Otherwise, this can be an empty string.",
    },
    socraticQuestion: {
        type: Type.STRING,
        description: "Based on a core theme, generate one open-ended Socratic question to encourage deeper reflection. If no clear theme, this can be an empty string.",
    },
  },
  required: ["summary", "tags", "sentiment", "acknowledgement", "socraticQuestion"],
};

export const analyzeEntry = async (text: string, photo?: { base64: string; mimeType: string }): Promise<AIAnalysis> => {
  try {
    const prompt = `You are an intelligent, reflective journaling assistant. Your purpose is to listen intently, ask insightful questions, and hold up a mirror to the user's own thoughts. Your tone is empathetic, curious, humble, and concise. You prioritize questions over statements. Analyze the following journal entry and provide your analysis in the requested JSON format. The user's entry is:\n\n---\n${text}\n---`
    
    const parts: Part[] = [{ text: prompt }];

    if (photo) {
      parts.unshift({
        inlineData: {
          data: photo.base64,
          mimeType: photo.mimeType,
        },
      });
    }

    const result = await callGeminiProxy(parts, {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    });
    
    return {
        summary: result.summary || [],
        tags: result.tags || [],
        sentiment: result.sentiment || 'Neutral',
        acknowledgement: result.acknowledgement || undefined,
        socraticQuestion: result.socraticQuestion || undefined,
    };

  } catch (error) {
    console.error("Error analyzing entry:", error);
    return {
        summary: ['Entry has been saved successfully.'],
        tags: [],
        sentiment: 'Neutral',
        acknowledgement: "AI analysis will be available when connection is restored.",
        socraticQuestion: "What is one thing you are grateful for at this moment?"
    };
  }
};

export const getPerspectives = async (entryText: string): Promise<Perspective[]> => {
    const prompts = [
        {
            title: "The Objective Observer",
            prompt: `Read the following journal entry. Rewrite it focusing only on the objective facts, separating them from emotional interpretations and stories. What happened vs. what was felt about it?\n\nEntry:\n"${entryText}"`
        },
        {
            title: "The Compassionate Friend",
            prompt: `Read the following journal entry. Imagine your closest friend wrote this and shared it with you. What would you say to them to show compassion, validation, and support, without giving unsolicited advice?\n\nEntry:\n"${entryText}"`
        },
        {
            title: "The Future Self",
            prompt: `Read the following journal entry. From the perspective of five years in the future—wiser and with more experience—what perspective or gentle advice would you offer to the person who wrote this? How might this moment look from a distance?\n\nEntry:\n"${entryText}"`
        }
    ];

    const results = await Promise.all(prompts.map(async (p) => {
        try {
            const content = await callGeminiProxy([{ text: p.prompt }]);
            // Ensure content is a string
            const textContent = typeof content === 'string' ? content : JSON.stringify(content);
            return { title: p.title, content: textContent };
        } catch (error) {
            console.error(`Error generating perspective "${p.title}":`, error);
            return { title: p.title, content: "Could not generate this perspective at the moment." };
        }
    }));

    return results;
};

export const generateInsights = async (entries: JournalEntry[], userId: string): Promise<string> => {
    if (entries.length < 3) {
        return "Not enough entries to generate insights. Keep journaling to discover patterns over time!";
    }
    
    const entriesText = entries.slice(0, 20).map(e => {
        let entryString = `Date: ${e.date}\n`;
        if (e.mood) entryString += `Mood: ${e.mood}/5\n`;
        if (e.energy !== undefined) entryString += `Energy: ${e.energy}/100\n`;
        entryString += `Tags: ${e.aiAnalysis?.tags?.join(', ') || 'N/A'}\nEntry:\n${e.text.substring(0, 500)}`;
        return entryString;
    }).join('\n\n---\n\n');

    const prompt = `You are a personal analyst AI. Your task is to identify subtle, long-term correlations and patterns from a user's journal entries. The user also tracks mood (1=very negative, 5=very positive) and energy level (0-100). Present your findings as gentle, encouraging observations in Markdown format. Use headings, bold text, and lists to structure the information for easy readability. Do not give advice. Focus on connections between actions, environments, feelings, and the user's recorded mood and energy levels.\n\nHere are the user's entries:\n\n${entriesText}\n\nBased on these entries, what are some potential patterns or insights? Specifically look for correlations between entry content and the recorded mood/energy.`;
    
    const result = await callGeminiProxy([{ text: prompt }]);
    // Ensure result is a string
    return typeof result === 'string' ? result : JSON.stringify(result);
};

const guidedPromptSchema = {
    type: Type.OBJECT,
    properties: {
        prompts: {
            type: Type.ARRAY,
            description: "An array of exactly three distinct, open-ended follow-up questions to guide the user's reflection.",
            items: { type: Type.STRING }
        }
    },
    required: ["prompts"]
};

export const getGuidedPrompt = async (sessionType: GuidedSessionType, history: { prompt: string, response: string }[]): Promise<string[]> => {
    const sessionDescription = {
        gratitude: "A session focused on thankfulness and appreciating the good things in life.",
        challenge: "A session to reflect on a difficult situation, process emotions, and find a path forward.",
        review: "A session for a weekly review, reflecting on successes, challenges, and learnings.",
        'future-self': "A session to envision an ideal future, gain clarity, and find motivation.",
        'mindful-observation': "A session to ground oneself in the present moment by observing the environment and inner state.",
        'stoic-reflection': "A session to practice resilience by reflecting on what is within one's control."
    };

    let prompt: string;

    if (history.length === 0) {
        prompt = `You are a gentle and insightful journaling guide. Give me a single, welcoming, open-ended starting prompt for a journaling session about "${sessionType}". Provide ONLY the text of the prompt.`;
         try {
            const result = await callGeminiProxy([{ text: prompt }]);
            const textResult = typeof result === 'string' ? result : JSON.stringify(result);
            return [textResult.trim()];
        } catch (error) {
            return ["Let's begin. What's on your mind right now?"];
        }
    } else {
        prompt = `You are a gentle and insightful journaling guide. Your role is to provide a sequence of prompts to help a user reflect on a specific topic. Your tone is warm, encouraging, and curious.
    
        The user has started a "${sessionType}" session. Description: ${sessionDescription[sessionType]}.
        
        The conversation history so far is:
        ${history.map(h => `Guide: ${h.prompt}\nUser: ${h.response}`).join('\n\n')}
        
        Based on this, generate three distinct, open-ended follow-up questions to help the user continue their reflection. The questions should offer different angles for exploration. Return the prompts in the requested JSON format.`;
        
        try {
            const result = await callGeminiProxy([{ text: prompt }], {
                responseMimeType: "application/json",
                responseSchema: guidedPromptSchema,
            });
            return result.prompts || [];
        } catch (error) {
            return [
                "Can you expand on the most important feeling you mentioned?",
                "What's one thing you could do about this situation?",
                "How does this connect to your larger goals or values?"
            ];
        }
    }
};

// Coaching Module Definitions
export const COACHING_MODULES: Record<CoachingModuleType, {
  title: string;
  description: string;
  steps: string[];
  systemPrompt: string;
}> = {
  'goal-setting': {
    title: 'Goal Setting & Clarity',
    description: 'Define clear, achievable goals and create an action plan.',
    steps: [
      'What goal or aspiration matters most to you right now?',
      'What would success look like? How will you know when you\'ve achieved it?',
      'What resources, skills, or support do you already have?',
      'What\'s one small, concrete action you can take this week?',
    ],
    systemPrompt: 'You are a supportive life coach helping someone clarify and work toward meaningful goals. Use SMART goal principles while maintaining warmth and encouragement.',
  },
  'anxiety-management': {
    title: 'Anxiety Management',
    description: 'Explore anxious thoughts and develop coping strategies.',
    steps: [
      'What\'s been causing you anxiety or worry lately?',
      'How does this anxiety show up in your body and mind?',
      'What parts of this situation are within your control?',
      'What coping strategies have helped you feel calmer in the past?',
    ],
    systemPrompt: 'You are a compassionate therapist helping someone work through anxiety. Validate their feelings, help them distinguish between facts and fears, and guide them toward grounding and coping techniques.',
  },
  'gratitude-practice': {
    title: 'Gratitude Practice',
    description: 'Cultivate appreciation and positive perspective.',
    steps: [
      'What are three things you\'re grateful for today, big or small?',
      'Who in your life has shown you kindness recently?',
      'What\'s something about yourself that you appreciate?',
      'How can you carry this sense of gratitude forward?',
    ],
    systemPrompt: 'You are a mindfulness coach facilitating gratitude practice. Help the user notice and appreciate positive aspects of their life while maintaining authenticity.',
  },
  'self-compassion': {
    title: 'Self-Compassion Exercise',
    description: 'Practice treating yourself with kindness and understanding.',
    steps: [
      'What\'s something you\'ve been judging or criticizing yourself about?',
      'If a dear friend told you this about themselves, what would you say to them?',
      'What does this experience say about your shared humanity?',
      'How can you offer yourself the same kindness you\'d give a friend?',
    ],
    systemPrompt: 'You are a gentle therapist guiding self-compassion practice based on Kristin Neff\'s framework. Help the user recognize their inner critic, normalize their struggles, and practice self-kindness.',
  },
  'mindfulness': {
    title: 'Mindfulness Check-In',
    description: 'Ground yourself in the present moment.',
    steps: [
      'Take a deep breath. What do you notice in your body right now?',
      'What emotions are present? Can you name them without judgment?',
      'What thoughts keep recurring? Can you observe them like clouds passing?',
      'What do you need in this moment?',
    ],
    systemPrompt: 'You are a mindfulness teacher guiding present-moment awareness. Help the user observe their experience without judgment, returning gently to the present when the mind wanders.',
  },
};

export const getCoachingPrompt = async (
  moduleType: CoachingModuleType,
  stepNumber: number,
  userResponse?: string
): Promise<{ prompt: string; followUp?: string }> => {
  const module = COACHING_MODULES[moduleType];

  if (!module) {
    throw new Error(`Unknown coaching module: ${moduleType}`);
  }

  // For first step, return the predefined prompt
  if (stepNumber === 0) {
    return { prompt: module.steps[0] };
  }

  // If we have a user response, generate a personalized follow-up
  if (userResponse && stepNumber < module.steps.length) {
    try {
      const prompt = `${module.systemPrompt}

The user is working through: "${module.title}"

They just responded to the prompt: "${module.steps[stepNumber - 1]}"

Their response: "${userResponse}"

Now provide:
1. A brief (1-2 sentence) validating acknowledgment of their response
2. The next question: "${module.steps[stepNumber]}"

Format your response as:
[Acknowledgment]

[Next Question]`;

      const result = await callGeminiProxy([{ text: prompt }]);
      const textResult = typeof result === 'string' ? result : JSON.stringify(result);

      // Try to parse the acknowledgment and question
      const parts = textResult.split('\n\n');
      if (parts.length >= 2) {
        return {
          followUp: parts[0].trim(),
          prompt: parts[1].trim(),
        };
      }

      // Fallback to default question
      return { prompt: module.steps[stepNumber] };
    } catch (error) {
      console.error('Error generating coaching follow-up:', error);
      return { prompt: module.steps[stepNumber] };
    }
  }

  // Return predefined step question
  if (stepNumber < module.steps.length) {
    return { prompt: module.steps[stepNumber] };
  }

  // If we've completed all steps, generate a closing reflection
  try {
    const prompt = `${module.systemPrompt}

The user has completed the "${module.title}" coaching module. Provide a brief (2-3 sentence) closing reflection that:
1. Acknowledges their work and effort
2. Encourages them to carry forward what they've learned
3. Is warm and empowering

Provide ONLY the closing reflection text.`;

    const result = await callGeminiProxy([{ text: prompt }]);
    const textResult = typeof result === 'string' ? result : JSON.stringify(result);

    return {
      prompt: textResult.trim(),
    };
  } catch (error) {
    return {
      prompt: 'You\'ve completed this coaching session. Great work on taking time for self-reflection and growth! 🌟',
    };
  }
};
