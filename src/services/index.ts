/**
 * Services barrel exports
 * Central export point for all application services
 */

// AI Services
export { GeminiClient } from './ai/geminiClient';
export { EntryAnalysisService } from './ai/entryAnalysisService';
export { PerspectivesService } from './ai/perspectivesService';

// Journal Services
export { JournalService, transformDbEntry } from './journal/journalService';

// Re-export facade functions for backward compatibility
export {
  analyzeEntry,
  getPerspectives,
  generateInsights,
  getGuidedPrompt,
  getCoachingModule,
  getCoachingFollowUp,
} from './geminiService';
