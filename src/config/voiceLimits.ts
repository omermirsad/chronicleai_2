// Voice-to-text feature limits by subscription tier
import { SubscriptionTier } from '../types';

export const VOICE_TO_TEXT_LIMITS = {
  free: {
    enabled: false,
    maxDurationSeconds: 0,
    monthlyRecordingLimit: 0,
    displayName: 'Not available',
  },
  pro: {
    enabled: true,
    maxDurationSeconds: 60,        // 1 minute per recording
    monthlyRecordingLimit: 40,     // 40 recordings per month
    warningAtSeconds: 50,          // Show warning at 50 seconds
    displayName: '1 min per recording, 40/month',
  },
  premium: {
    enabled: true,
    maxDurationSeconds: 120,       // 2 minutes per recording
    monthlyRecordingLimit: 99,     // 99 recordings per month
    warningAtSeconds: 110,         // Show warning at 110 seconds (1:50)
    displayName: '2 min per recording, 99/month',
  },
} as const;

// Helper function to format seconds as MM:SS
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get limit info for a tier
export const getVoiceLimitForTier = (tier: SubscriptionTier) => {
  return VOICE_TO_TEXT_LIMITS[tier];
};

// Calculate remaining recordings for the month
export const getRemainingRecordings = (
  tier: SubscriptionTier,
  recordingsUsed: number
): number => {
  const limit = VOICE_TO_TEXT_LIMITS[tier].monthlyRecordingLimit;
  return Math.max(0, limit - recordingsUsed);
};

// Check if user can start a new recording
export const canStartRecording = (
  tier: SubscriptionTier,
  recordingsUsed: number
): boolean => {
  const limit = VOICE_TO_TEXT_LIMITS[tier];
  return limit.enabled && recordingsUsed < limit.monthlyRecordingLimit;
};
