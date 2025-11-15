import { vi } from 'vitest';
import { createMockJournalEntry, createMockDatabaseEntry } from './journalEntry.mock';

// Mock JournalService
export const createMockJournalService = () => ({
  fetchEntries: vi.fn().mockResolvedValue([createMockJournalEntry()]),
  insertEntry: vi.fn().mockResolvedValue(createMockDatabaseEntry()),
  updateEntry: vi.fn().mockResolvedValue(undefined),
  deleteEntry: vi.fn().mockResolvedValue(undefined),
});

// Mock GeminiClient
export const createMockGeminiClient = () => ({
  analyzeEntry: vi.fn().mockResolvedValue({
    summary: ['Test summary'],
    tags: ['test'],
    sentiment: 'Positive',
    acknowledgement: 'Great entry!',
    socraticQuestion: 'What made this special?',
  }),
  generateMultiplePerspectives: vi.fn().mockResolvedValue([
    {
      perspective: 'Mindfulness',
      insights: ['You were present in the moment'],
    },
    {
      perspective: 'Growth',
      insights: ['You learned something new'],
    },
  ]),
});

// Mock OfflineSync
export const createMockOfflineSync = () => ({
  syncStatus: 'synced' as const,
  addToOfflineQueue: vi.fn(),
  processOfflineQueue: vi.fn().mockResolvedValue(undefined),
  getOfflineQueue: vi.fn().mockReturnValue([]),
  clearOfflineQueue: vi.fn(),
});

// Mock Analytics Service
export const createMockAnalyticsService = () => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  trackError: vi.fn(),
  identify: vi.fn(),
});

// Mock Data Export Service
export const createMockDataExportService = () => ({
  exportToJSON: vi.fn().mockResolvedValue(JSON.stringify({})),
  exportToCSV: vi.fn().mockResolvedValue('csv,data'),
  exportToPDF: vi.fn().mockResolvedValue(new Blob()),
  downloadExport: vi.fn(),
});

// Mock toast notifications
export const createMockToast = () => ({
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  info: vi.fn(),
  custom: vi.fn(),
  promise: vi.fn(),
  dismiss: vi.fn(),
});
