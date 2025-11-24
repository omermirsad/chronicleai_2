/**
 * Application-wide constants
 * Centralized location for magic numbers, strings, and configuration values
 */

// ============================================================================
// MOOD & ENERGY
// ============================================================================

export const MOOD_SCALE = {
  MIN: 1,
  MAX: 5,
  EMOJIS: ['😠', '😟', '😐', '🙂', '😄'] as const,
  LABELS: ['Very Bad', 'Bad', 'Neutral', 'Good', 'Great'] as const,
} as const;

export const ENERGY_RANGE = {
  MIN: 0,
  MAX: 100,
  DEFAULT: 50,
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'chronicle-ai-offline-queue',
  GUIDED_DRAFT: 'chronicle-ai-guided-draft',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  USER_PREFERENCES: 'chronicle-ai-user-preferences',
  THEME: 'chronicle-ai-theme',
} as const;

// ============================================================================
// SUBSCRIPTION & PRICING
// ============================================================================

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium',
} as const;

export const AI_CALLS_LIMITS = {
  FREE: 5,
  PRO: 50,
  PREMIUM: -1, // unlimited
} as const;

// ============================================================================
// EMAIL PREFERENCES
// ============================================================================

export const EMAIL_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  NEVER: 'never',
} as const;

// ============================================================================
// GUIDED SESSIONS
// ============================================================================

export const GUIDED_SESSION_TYPES = {
  GRATITUDE: 'gratitude',
  CHALLENGE: 'challenge',
  REVIEW: 'review',
  FUTURE_SELF: 'future-self',
  MINDFUL_OBSERVATION: 'mindful-observation',
  STOIC_REFLECTION: 'stoic-reflection',
} as const;

export const GUIDED_SESSIONS = [
  {
    type: GUIDED_SESSION_TYPES.GRATITUDE,
    title: 'Gratitude Practice',
    description: 'Focus on the good and cultivate appreciation.',
  },
  {
    type: GUIDED_SESSION_TYPES.CHALLENGE,
    title: 'Overcoming a Challenge',
    description: 'Reflect on a difficulty to find strength and clarity.',
  },
  {
    type: GUIDED_SESSION_TYPES.REVIEW,
    title: 'Weekly Compass',
    description: 'Review your week to set a clear course for the next.',
  },
  {
    type: GUIDED_SESSION_TYPES.FUTURE_SELF,
    title: 'Future Self Visualization',
    description: 'Envision your ideal future to gain clarity and motivation.',
  },
  {
    type: GUIDED_SESSION_TYPES.MINDFUL_OBSERVATION,
    title: 'Mindful Observation',
    description: 'Ground yourself in the present by observing your surroundings.',
  },
  {
    type: GUIDED_SESSION_TYPES.STOIC_REFLECTION,
    title: 'Stoic Reflection',
    description: 'Practice resilience by reflecting on what is in your control.',
  },
] as const;

// ============================================================================
// VIEWS & NAVIGATION
// ============================================================================

export const VIEWS = {
  FEED: 'feed',
  EDITOR: 'editor',
  INSIGHTS: 'insights',
  CALENDAR: 'calendar',
} as const;

// ============================================================================
// ACHIEVEMENTS & GAMIFICATION
// ============================================================================

export const ACHIEVEMENT_CATEGORIES = {
  STREAK: 'streak',
  ENTRIES: 'entries',
  INSIGHTS: 'insights',
  EXPLORATION: 'exploration',
} as const;

export const ACHIEVEMENT_REQUIREMENT_TYPES = {
  COUNT: 'count',
  STREAK: 'streak',
  CONSECUTIVE: 'consecutive',
} as const;

// ============================================================================
// COACHING MODULES
// ============================================================================

export const COACHING_MODULES = {
  GOAL_SETTING: 'goal-setting',
  ANXIETY_MANAGEMENT: 'anxiety-management',
  GRATITUDE_PRACTICE: 'gratitude-practice',
  SELF_COMPASSION: 'self-compassion',
  MINDFULNESS: 'mindfulness',
} as const;

// ============================================================================
// API & RATE LIMITING
// ============================================================================

export const API_CONFIG = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const RATE_LIMITS = {
  AI_CALLS_PER_MINUTE: 10,
  ENTRIES_PER_DAY: 50,
  EXPORTS_PER_HOUR: 3,
} as const;

// ============================================================================
// FILE UPLOAD
// ============================================================================

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const,
  MAX_DIMENSION: 4096,
} as const;

// ============================================================================
// EDITOR SETTINGS
// ============================================================================

export const EDITOR_CONFIG = {
  AUTO_SAVE_DELAY: 2000, // 2 seconds
  MIN_TEXT_LENGTH: 10,
  MAX_TEXT_LENGTH: 10000,
  DRAFT_EXPIRY_DAYS: 7,
} as const;

// ============================================================================
// TOAST MESSAGES
// ============================================================================

export const TOAST_MESSAGES = {
  // Success messages
  ENTRY_SAVED: 'Entry saved successfully',
  ENTRY_UPDATED: 'Entry updated successfully',
  ENTRY_DELETED: 'Entry deleted successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PREFERENCES_SAVED: 'Preferences saved successfully',
  DATA_EXPORTED: 'Data exported successfully',

  // Error messages
  ENTRY_SAVE_ERROR: 'Failed to save entry. Please try again.',
  ENTRY_UPDATE_ERROR: 'Failed to update entry. Please try again.',
  ENTRY_DELETE_ERROR: 'Failed to delete entry. Please try again.',
  PROFILE_UPDATE_ERROR: 'Failed to update profile. Please try again.',
  PASSWORD_CHANGE_ERROR: 'Failed to change password. Please try again.',
  PREFERENCES_SAVE_ERROR: 'Failed to save preferences. Please try again.',
  DATA_EXPORT_ERROR: 'Failed to export data. Please try again.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',

  // Info messages
  AI_LIMIT_REACHED: 'You\'ve reached your AI call limit. Upgrade for more.',
  OFFLINE_MODE: 'You\'re offline. Changes will sync when you\'re back online.',
  SYNCING: 'Syncing your changes...',

  // Validation messages
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  PASSWORDS_DONT_MATCH: 'Passwords don\'t match',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  TEXT_TOO_SHORT: `Entry must be at least ${EDITOR_CONFIG.MIN_TEXT_LENGTH} characters`,
  TEXT_TOO_LONG: `Entry cannot exceed ${EDITOR_CONFIG.MAX_TEXT_LENGTH} characters`,
  FILE_TOO_LARGE: `File size must be less than ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`,
  INVALID_FILE_TYPE: 'File type not supported. Please upload an image.',
} as const;

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

export const ANALYTICS_EVENTS = {
  ENTRY_CREATED: 'entry_created',
  ENTRY_UPDATED: 'entry_updated',
  ENTRY_DELETED: 'entry_deleted',
  INSIGHTS_GENERATED: 'insights_generated',
  PERSPECTIVE_GENERATED: 'perspective_generated',
  GUIDED_SESSION_STARTED: 'guided_session_started',
  GUIDED_SESSION_COMPLETED: 'guided_session_completed',
  EXPORT_DATA: 'export_data',
  ACCOUNT_DELETED: 'account_deleted',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

// ============================================================================
// DATE & TIME
// ============================================================================

export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  FULL: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
  CALENDAR_HEADER: 'MMMM yyyy',
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  ENTRY_MIN_LENGTH: 10,
  ENTRY_MAX_LENGTH: 10000,
} as const;

// ============================================================================
// INSIGHTS REQUIREMENTS
// ============================================================================

export const INSIGHTS = {
  MIN_ENTRIES_REQUIRED: 3,
  MAX_ENTRIES_ANALYZED: 20,
  CACHE_DURATION_HOURS: 24,
} as const;

// ============================================================================
// STREAKS
// ============================================================================

export const STREAKS = {
  GRACE_PERIOD_HOURS: 4, // Allow entries up to 4 hours into next day
  STREAK_MILESTONES: [3, 7, 14, 30, 60, 90, 180, 365] as const,
} as const;

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  MARKDOWN: 'markdown',
  TEXT: 'text',
} as const;
