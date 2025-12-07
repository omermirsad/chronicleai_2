import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../../types';
import { analyzeEntry } from '../../services/geminiService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSubscription } from '../../hooks/useSubscription';
import { useEditorState } from './useEditorState';
import { useGuidedSession } from '../../hooks/useGuidedSession';
import { MoodEnergySelector } from './MoodEnergySelector';
import { GuidedSessionSelector } from './GuidedSessionSelector';
import UpgradeModal from '../UpgradeModal';
import { VoiceRecordingTimer } from '../VoiceRecordingTimer';
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
  ArrowUturnLeftIcon,
} from '../Icons';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface GuidedEditorProps {
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBack: () => void;
}

/**
 * Guided session journaling editor component
 * Extracted from JournalEditor to follow Single Responsibility Principle
 */
export const GuidedEditor: React.FC<GuidedEditorProps> = ({ addEntry, onBack }) => {
  const { canMakeAICall, refresh: refreshSubscription, usage } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [textBeforeRecording, setTextBeforeRecording] = useState('');

  const editorState = useEditorState();
  const guidedSession = useGuidedSession();

  // Check for draft on mount
  useEffect(() => {
    const draft = guidedSession.loadDraft();
    if (draft) {
      const confirmResume = window.confirm('You have an unfinished guided session. Do you want to resume it?');
      if (confirmResume) {
        guidedSession.resumeFromDraft(draft).then((draftData) => {
          editorState.setMood(draftData.mood);
          editorState.setEnergy(draftData.energy);
        });
      }
    }
  }, []);

  // Speech recognition
  const handleTranscriptChange = (transcript: string) => {
    const prefix = textBeforeRecording ? textBeforeRecording + ' ' : '';
    guidedSession.setCurrentResponse(prefix + transcript);
  };

  const {
    isListening,
    startListening,
    stopListening,
    hasSupport,
    recordingDuration,
    maxDuration,
    voiceStatus,
  } = useSpeechRecognition(handleTranscriptChange, usage?.tier || 'free');

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setTextBeforeRecording(guidedSession.currentResponse);
      startListening();
    }
  };

  // Handle guided session submission
  const handleSubmit = async () => {
    if (!guidedSession.currentResponse.trim()) {
      toast.error('Please write a response');
      return;
    }

    const newHistory = guidedSession.advanceSession(guidedSession.currentResponse);

    // Save draft
    guidedSession.saveDraft({
      mood: editorState.mood,
      energy: editorState.energy,
    });

    if (newHistory.length >= 3) {
      // Complete guided session
      if (!canMakeAICall()) {
        setShowUpgradeModal(true);
        return;
      }

      editorState.setIsProcessing(true);
      try {
        const fullText = newHistory.map((h) => `Q: ${h.prompt}\nA: ${h.response}`).join('\n\n');
        const aiAnalysis = await analyzeEntry(fullText, editorState.photo?.base64);
        refreshSubscription();

        addEntry({
          date: new Date().toISOString(),
          text: fullText,
          mood: editorState.mood ?? undefined,
          energy: editorState.energy,
          guidedSession: guidedSession.session ?? undefined,
          aiAnalysis,
        });

        toast.success('Guided session completed!');
        guidedSession.clearDraft();
        editorState.resetState();
        guidedSession.resetSession();
        onBack();
      } catch (error: any) {
        logger.error('Failed to save guided session:', error);

        if (error?.code === 'AI_LIMIT_EXCEEDED') {
          setShowUpgradeModal(true);
          refreshSubscription();
        } else {
          toast.error('Failed to save session');
        }
      } finally {
        editorState.setIsProcessing(false);
      }
    } else {
      // Fetch next prompt
      await guidedSession.fetchNextPrompt(guidedSession.session!.type, newHistory);
    }
  };

  // Render guided session selector
  if (!guidedSession.session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <GuidedSessionSelector
          onSelect={guidedSession.initializeSession}
          onBack={onBack}
        />
      </div>
    );
  }

  // Render guided session editor
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-800">{guidedSession.session?.title}</h2>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                onBack();
              }
            }}
            className="text-stone-600 hover:text-rose-600 transition"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
        </div>

        {/* History */}
        {guidedSession.history.length > 0 && (
          <div className="mb-6 space-y-4">
            {guidedSession.history.map((item, idx) => (
              <div key={idx} className="border-l-4 border-rose-300 pl-4 py-2">
                <p className="text-sm font-medium text-stone-700 mb-2">{item.prompt}</p>
                <p className="text-stone-600">{item.response}</p>
              </div>
            ))}
          </div>
        )}

        {/* Current Prompt */}
        {guidedSession.isThinking ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
            <p className="mt-4 text-stone-600">Thinking of the next question...</p>
          </div>
        ) : guidedSession.promptChoices.length > 0 ? (
          <div className="space-y-3 mb-6">
            <p className="font-medium text-stone-700">Choose a topic to explore:</p>
            {guidedSession.promptChoices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => guidedSession.selectPrompt(choice)}
                className="w-full p-4 text-left bg-stone-50 border border-stone-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 transition"
              >
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-rose-50 rounded-lg border border-rose-200">
              <p className="font-medium text-stone-800">{guidedSession.currentPrompt}</p>
            </div>

            <textarea
              value={guidedSession.currentResponse}
              onChange={(e) => guidedSession.setCurrentResponse(e.target.value)}
              placeholder="Write your response..."
              className="w-full h-48 p-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none mb-4"
              disabled={editorState.isProcessing}
            />

            {guidedSession.history.length === 2 && (
              <div className="mb-4">
                <MoodEnergySelector
                  mood={editorState.mood}
                  energy={editorState.energy}
                  onMoodChange={editorState.setMood}
                  onEnergyChange={editorState.setEnergy}
                  variant="compact"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              {hasSupport && usage && (usage.tier === 'pro' || usage.tier === 'premium') && (
                <>
                  <button
                    onClick={toggleListening}
                    className={`p-2 rounded-lg ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    } transition`}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    <MicrophoneIcon className="w-5 h-5" />
                  </button>
                  {isListening && (
                    <VoiceRecordingTimer
                      currentDuration={recordingDuration}
                      maxDuration={maxDuration}
                      tier={usage.tier}
                      voiceStatus={voiceStatus}
                    />
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={editorState.isProcessing || !guidedSession.currentResponse.trim()}
              className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {editorState.isProcessing ? (
                'Processing...'
              ) : guidedSession.history.length >= 2 ? (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Complete Session
                </>
              ) : (
                'Continue'
              )}
            </button>
          </>
        )}
      </div>
      {showUpgradeModal && <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
};
