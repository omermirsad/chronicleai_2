/**
 * Components barrel exports
 * Central export point for all UI components
 */

// Layout components
export { default as Header } from './Header';
export { default as Footer } from './Footer';
export { default as SafeAreaView } from './SafeAreaView';

// Auth components
export { default as Auth } from './Auth';
export { default as AuthCallback } from './AuthCallback';
export { default as Onboarding } from './Onboarding';

// Journal components
export { default as JournalEditor } from './JournalEditor';
export { default as JournalFeed } from './JournalFeed';
export { default as JournalEntryCard } from './JournalEntryCard';
export { default as JournalFilters } from './JournalFilters';

// Feature components
export { default as InsightsView } from './InsightsView';
export { default as CalendarView } from './CalendarView';
export { default as CoachingHub } from './CoachingHub';
export { default as CoachingModal } from './CoachingModal';
export { default as AchievementsGallery } from './AchievementsGallery';
export { default as OnThisDay } from './OnThisDay';
export { default as StreakDisplay } from './StreakDisplay';

// Modal components
export { default as PerspectiveLensModal } from './PerspectiveLensModal';
export { default as UpgradeModal } from './UpgradeModal';

// UI utilities
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ToastProvider } from './ToastProvider';
export { default as VoiceRecordingTimer } from './VoiceRecordingTimer';
export { FeedSkeleton, EditorSkeleton, InsightsSkeleton } from './SkeletonLoader';
export * from './Icons';
