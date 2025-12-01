import React from 'react';
import { formatDuration } from '../config/voiceLimits';
import { VoiceRecordingStatus } from '../hooks/useSpeechRecognition';

interface VoiceRecordingTimerProps {
  currentDuration: number;
  maxDuration: number;
  tier: 'pro' | 'premium';
  voiceStatus: VoiceRecordingStatus | null;
}

export const VoiceRecordingTimer: React.FC<VoiceRecordingTimerProps> = ({
  currentDuration,
  maxDuration,
  _tier,
  voiceStatus,
}) => {
  const percentage = (currentDuration / maxDuration) * 100;
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 90;

  const colorClass = isDanger
    ? 'text-red-600'
    : isWarning
    ? 'text-yellow-600'
    : 'text-green-600';

  const pulseColorClass = isDanger
    ? 'bg-red-400'
    : isWarning
    ? 'bg-yellow-400'
    : 'bg-red-400';

  return (
    <div className="flex items-center gap-3">
      {/* Pulsing recording indicator */}
      <span className="relative flex h-3 w-3">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColorClass} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-3 w-3 ${pulseColorClass.replace('bg-', 'bg-').replace('-400', '-500')}`}></span>
      </span>

      {/* Timer display */}
      <div className="flex items-center gap-1">
        <span className={`font-mono font-semibold text-sm ${colorClass}`}>
          {formatDuration(currentDuration)}
        </span>
        <span className="text-stone-400 text-sm">
          / {formatDuration(maxDuration)}
        </span>
      </div>

      {/* Monthly limit indicator */}
      {voiceStatus && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 rounded-full border border-stone-200">
          <svg className="w-3 h-3 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs font-medium text-stone-600">
            {voiceStatus.recordingsRemaining}/{voiceStatus.recordingsLimit}
          </span>
        </div>
      )}
    </div>
  );
};
