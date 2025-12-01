import React, { useState } from 'react';
import { JournalEntry, View } from '../../types';
import { analyzeEntry } from '../../services/geminiService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSubscription } from '../../hooks/useSubscription';
import { useEditorState } from './useEditorState';
import { MoodEnergySelector } from './MoodEnergySelector';
import UpgradeModal from '../UpgradeModal';
import { VoiceRecordingTimer } from '../VoiceRecordingTimer';
import {
  MicrophoneIcon,
  PhotoIcon,
  PaperAirplaneIcon,
  ArrowUturnLeftIcon,
} from '../Icons';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface FreestyleEditorProps {
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  setCurrentView: (view: View) => void;
  onBack: () => void;
}

/**
 * Freestyle journaling editor component
 * Extracted from JournalEditor to follow Single Responsibility Principle
 */
export const FreestyleEditor: React.FC<FreestyleEditorProps> = ({ addEntry, setCurrentView, onBack }) => {
  const { canMakeAICall, refresh: refreshSubscription, usage } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [textBeforeRecording, setTextBeforeRecording] = useState('');

  const editorState = useEditorState();

  // Speech recognition
  const handleTranscriptChange = (transcript: string) => {
    const prefix = textBeforeRecording ? textBeforeRecording + ' ' : '';
    editorState.setText(prefix + transcript);
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
      setTextBeforeRecording(editorState.text);
      startListening();
    }
  };

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      editorState.setPhoto({
        base64: base64?.split(',')[1] || '',
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle freestyle submission
  const handleSubmit = async () => {
    if (!editorState.text.trim() && !editorState.photo) {
      toast.error('Please write something or add a photo');
      return;
    }

    if (!canMakeAICall()) {
      setShowUpgradeModal(true);
      return;
    }

    editorState.setIsProcessing(true);
    try {
      let aiAnalysis = undefined;
      if (editorState.text.trim()) {
        aiAnalysis = await analyzeEntry(editorState.text, editorState.photo?.base64);
        refreshSubscription();
      }

      addEntry({
        date: new Date().toISOString(),
        text: editorState.text,
        photo: editorState.photo ? { base64: editorState.photo.base64, mimeType: editorState.photo.mimeType } : undefined,
        mood: editorState.mood ?? undefined,
        energy: editorState.energy,
        aiAnalysis,
      });

      toast.success('Entry saved!');
      editorState.resetState();
      setCurrentView('feed');
    } catch (error: any) {
      logger.error('Failed to process freestyle entry:', error);

      if (error?.code === 'AI_LIMIT_EXCEEDED') {
        setShowUpgradeModal(true);
        refreshSubscription();
      } else {
        toast.error('Failed to save entry');
      }
    } finally {
      editorState.setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-800">Freestyle Entry</h2>
          <button onClick={onBack} className="text-stone-600 hover:text-rose-600 transition">
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={editorState.text}
          onChange={(e) => editorState.setText(e.target.value)}
          placeholder="What's on your mind today?"
          className="w-full h-64 p-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
          disabled={editorState.isProcessing}
        />

        <div className="mt-4 space-y-4">
          <MoodEnergySelector
            mood={editorState.mood}
            energy={editorState.energy}
            onMoodChange={editorState.setMood}
            onEnergyChange={editorState.setEnergy}
          />

          <div className="flex items-center gap-3">
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

            <label className="p-2 bg-stone-100 rounded-lg cursor-pointer hover:bg-stone-200 transition">
              <PhotoIcon className="w-5 h-5 text-stone-600" />
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>

            {editorState.photo && (
              <span className="text-sm text-green-600">Photo attached ✓</span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={editorState.isProcessing || (!editorState.text.trim() && !editorState.photo)}
            className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {editorState.isProcessing ? (
              'Saving...'
            ) : (
              <>
                <PaperAirplaneIcon className="w-5 h-5" />
                Save Entry
              </>
            )}
          </button>
        </div>
      </div>
      {showUpgradeModal && <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
};
