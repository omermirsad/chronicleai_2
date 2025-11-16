import * as React from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { VOICE_TO_TEXT_LIMITS, formatDuration } from '../config/voiceLimits';
import { SubscriptionTier } from '../types';

// Custom type definitions for the Web Speech API for cross-browser compatibility
// and to resolve TypeScript errors, as these types are not always standard.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [key: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// Polyfill for cross-browser support (e.g., Chrome uses `webkitSpeechRecognition`)
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export interface VoiceRecordingStatus {
  recordingsUsed: number;
  recordingsLimit: number;
  recordingsRemaining: number;
}

export const useSpeechRecognition = (
  onTranscriptChange: (transcript: string) => void,
  userTier: SubscriptionTier = 'free'
) => {
  const { user } = useAuth();
  const [isListening, setIsListening] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const [hasShownWarning, setHasShownWarning] = React.useState(false);
  const [voiceStatus, setVoiceStatus] = React.useState<VoiceRecordingStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);

  const recognitionRef = React.useRef<ISpeechRecognition | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = React.useRef<number>(0);

  // Get limits for current tier
  const limits = VOICE_TO_TEXT_LIMITS[userTier];

  // Fetch voice recording status on mount
  React.useEffect(() => {
    const fetchVoiceStatus = async () => {
      if (!user || userTier === 'free') {
        setIsLoadingStatus(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_voice_recording_status', {
          p_user_id: user.id,
        });

        if (error) throw error;

        if (data) {
          setVoiceStatus({
            recordingsUsed: data.recordings_used || 0,
            recordingsLimit: data.recordings_limit || 0,
            recordingsRemaining: data.recordings_remaining || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching voice recording status:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchVoiceStatus();
  }, [user, userTier]);

  // Initialize Speech Recognition
  React.useEffect(() => {
    if (!SpeechRecognitionAPI) {
      console.error("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      onTranscriptChange(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (isListening) {
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      }
    };

    recognitionRef.current = recognition;
  }, [onTranscriptChange, isListening]);

  // Timer effect - runs every second while listening
  React.useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);

        // Show warning when approaching duration limit
        if (
          limits.warningAtSeconds &&
          elapsed >= limits.warningAtSeconds &&
          !hasShownWarning
        ) {
          const remaining = limits.maxDurationSeconds - elapsed;
          toast.warning(
            `${remaining} seconds remaining!`,
            { duration: 3000, icon: '⏱️' }
          );
          setHasShownWarning(true);
        }

        // Auto-stop at duration limit
        if (elapsed >= limits.maxDurationSeconds) {
          stopListening(true); // true = hit duration limit
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening, hasShownWarning, limits]);

  const startListening = React.useCallback(async () => {
    if (!recognitionRef.current || isListening || !limits.enabled || !user) {
      return;
    }

    // Check monthly recording limit
    if (voiceStatus && voiceStatus.recordingsRemaining <= 0) {
      const limitText = userTier === 'pro' ? '40 recordings' : '99 recordings';
      toast.error(
        `Monthly limit reached (${limitText}). ${
          userTier === 'pro' ? 'Upgrade to Premium for 99 recordings!' : 'Limit will reset next month.'
        }`,
        { duration: 5000, icon: '🔒' }
      );
      return;
    }

    // Increment recording count in backend
    try {
      const { data, error } = await supabase.rpc('increment_voice_recording_count', {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error || 'Failed to start recording');
        return;
      }

      // Update local status
      setVoiceStatus({
        recordingsUsed: data.recordings_used,
        recordingsLimit: data.recordings_limit,
        recordingsRemaining: data.recordings_remaining,
      });

      // Show remaining count if getting low
      if (data.recordings_remaining <= 5 && data.recordings_remaining > 0) {
        toast.info(
          `${data.recordings_remaining} recordings remaining this month`,
          { duration: 3000, icon: 'ℹ️' }
        );
      }

      // Start recording
      setIsListening(true);
      setRecordingDuration(0);
      setHasShownWarning(false);
      startTimeRef.current = Date.now();
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast.error('Failed to start recording. Please try again.');
    }
  }, [isListening, limits, user, voiceStatus, userTier]);

  const stopListening = React.useCallback(
    (hitDurationLimit: boolean = false) => {
      if (recognitionRef.current && isListening) {
        setIsListening(false);
        recognitionRef.current.stop();

        // Show upgrade prompt if duration limit was hit
        if (hitDurationLimit) {
          const currentLimit = formatDuration(limits.maxDurationSeconds);
          const upgradeMessage =
            userTier === 'pro'
              ? `${currentLimit} limit reached! Upgrade to Premium for 2-minute recordings.`
              : `${currentLimit} recording complete.`;

          if (userTier === 'pro') {
            toast.error(upgradeMessage, {
              duration: 5000,
              icon: '🔒',
            });
          } else {
            toast.success(upgradeMessage, {
              duration: 3000,
              icon: '✅',
            });
          }
        }
      }
    },
    [isListening, userTier, limits]
  );

  return {
    isListening,
    startListening,
    stopListening,
    hasSupport: !!SpeechRecognitionAPI,
    recordingDuration,
    maxDuration: limits.maxDurationSeconds,
    remainingDuration: Math.max(0, limits.maxDurationSeconds - recordingDuration),
    voiceStatus,
    isLoadingStatus,
  };
};
