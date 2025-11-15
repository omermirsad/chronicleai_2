import { JournalEntry, DatabaseEntry, AIAnalysis, GuidedSessionType } from '../../types';

export const createMockJournalEntry = (
  overrides?: Partial<JournalEntry>
): JournalEntry => ({
  id: 'entry-' + Math.random().toString(36).substring(7),
  date: new Date().toISOString(),
  text: 'This is a test journal entry.',
  mood: 4,
  energy: 75,
  tags: ['test', 'mock'],
  ...overrides,
});

export const createMockDatabaseEntry = (
  overrides?: Partial<DatabaseEntry>
): DatabaseEntry => ({
  id: 'entry-' + Math.random().toString(36).substring(7),
  user_id: 'test-user-123',
  date: new Date().toISOString(),
  text: 'This is a test database entry.',
  mood: 4,
  energy: 75,
  tags: ['test', 'mock'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAIAnalysis = (overrides?: Partial<AIAnalysis>): AIAnalysis => ({
  summary: ['You reflected on your day', 'You felt productive'],
  tags: ['productivity', 'reflection'],
  sentiment: 'Positive',
  acknowledgement: 'It sounds like you had a productive day!',
  socraticQuestion: 'What specific actions contributed to your productivity?',
  ...overrides,
});

export const createMockGuidedSession = (type?: GuidedSessionType) => ({
  type: type || ('gratitude' as GuidedSessionType),
  title: type === 'gratitude' ? 'Daily Gratitude' : 'Guided Reflection',
});

export const createMockEntryWithAI = (
  overrides?: Partial<JournalEntry>
): JournalEntry =>
  createMockJournalEntry({
    aiAnalysis: createMockAIAnalysis(),
    ...overrides,
  });

export const createMockEntryWithGuidedSession = (
  type?: GuidedSessionType,
  overrides?: Partial<JournalEntry>
): JournalEntry =>
  createMockJournalEntry({
    guidedSession: createMockGuidedSession(type),
    ...overrides,
  });

export const createMockEntriesArray = (count: number): JournalEntry[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockJournalEntry({
      id: `entry-${i}`,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      text: `Journal entry ${i + 1}`,
      mood: (i % 5) + 1,
      energy: ((i % 10) + 1) * 10,
    })
  );
};

export const createMockDatabaseEntriesArray = (count: number): DatabaseEntry[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockDatabaseEntry({
      id: `entry-${i}`,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      text: `Database entry ${i + 1}`,
      mood: (i % 5) + 1,
      energy: ((i % 10) + 1) * 10,
    })
  );
};
