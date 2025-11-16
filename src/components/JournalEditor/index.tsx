import React, { useState, useCallback, useEffect } from 'react';
import { JournalEntry, View, GuidedSessionType } from '../../types';
import { analyzeEntry, getGuidedPrompt } from '../../services/geminiService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSubscription } from '../../hooks/useSubscription';
import { useEditorState, useGuidedSessionState } from './useEditorState';
import { MoodEnergySelector } from './MoodEnergySelector';
import { GuidedSessionSelector } from './GuidedSessionSelector';
import UpgradeModal from '../UpgradeModal';
import { VoiceRecordingTimer } from '../VoiceRecordingTimer';
import {
  MicrophoneIcon,
  PhotoIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  ArrowUturnLeftIcon,
} from '../Icons';
import { marked } from 'marked';
import toast from 'react-hot-toast';
import { logger } from '../../utils/logger';
import { STORAGE_KEYS } from '../../constants';

interface JournalEditorProps {
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updatedData: Partial<JournalEntry>) => void;
  setCurrentView: (view: View) => void;
}

type EditorMode = 'selection' | 'freestyle' | 'guided';

const JournalEditor: React.FC<JournalEditorProps> = ({ addEntry, updateEntry, setCurrentView }) => {
  const { canMakeAICall, hasReachedLimit, refresh: refreshSubscription, usage } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mode, setMode] = useState<EditorMode>('selection');
  const [textBeforeRecording, setTextBeforeRecording] = useState('');

  // Use custom hooks for state management
  const editorState = useEditorState();
  const guidedState = useGuidedSessionState();

  // Speech recognition
  const handleTranscriptChange = useCallback(
    (transcript: string) => {
      const prefix = textBeforeRecording ? textBeforeRecording + ' ' : '';
      if (mode === 'freestyle') {
        editorState.setText(prefix + transcript);
      } else if (mode === 'guided') {
        guidedState.setCurrentResponse(prefix + transcript);
      }
    },
    [mode, textBeforeRecording, editorState, guidedState]
  );

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
      setTextBeforeRecording(mode === 'freestyle' ? editorState.text : guidedState.currentResponse);
      startListening();
    }
  };

  // Fetch next prompt for guided session
  const fetchNextPrompt = useCallback(
    async (sessionType: GuidedSessionType, currentHistory: { prompt: string; response: string }[]) => {
      guidedState.setIsThinking(true);
      guidedState.setCurrentPrompt('');
      guidedState.setPromptChoices([]);
      const prompts = await getGuidedPrompt(sessionType, currentHistory);
      if (prompts.length === 1) {
        guidedState.setCurrentPrompt(prompts[0]);
      } else {
        guidedState.setPromptChoices(prompts);
      }
      guidedState.setIsThinking(false);
    },
    [guidedState]
  );

  // Check for draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEYS.GUIDED_DRAFT);
      if (draft) {
        const parsed = JSON.parse(draft);
        const isRecent = Date.now() - parsed.timestamp < 1000 * 60 * 60; // 1 hour
        if (isRecent && parsed.history?.length > 0) {
          const confirmResume = window.confirm('You have an unfinished guided session. Do you want to resume it?');
          if (confirmResume) {
            setMode('guided');
            guidedState.setSession(parsed.session);
            guidedState.setHistory(parsed.history);
            guidedState.setCurrentResponse(parsed.currentResponse || '');
            editorState.setMood(parsed.mood);
            editorState.setEnergy(parsed.energy);
            fetchNextPrompt(parsed.session.type, parsed.history);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load guided session draft:', error);
    }
  }, []);

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
        base64: base64.split(',')[1],
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle freestyle submission
  const handleFreestyleSubmit = async () => {
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
        // Backend now handles AI call limit checking and incrementing
        aiAnalysis = await analyzeEntry(editorState.text, editorState.photo?.base64);
        // Refresh subscription data to update UI with new usage
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

      // Check if this is an AI limit exceeded error
      if (error?.code === 'AI_LIMIT_EXCEEDED') {
        setShowUpgradeModal(true);
        refreshSubscription(); // Refresh to show updated usage
      } else {
        toast.error('Failed to save entry');
      }
    } finally {
      editorState.setIsProcessing(false);
    }
  };

  // Handle guided session submission
  const handleGuidedSubmit = async () => {
    if (!guidedState.currentResponse.trim()) {
      toast.error('Please write a response');
      return;
    }

    const newHistory = [...guidedState.history, { prompt: guidedState.currentPrompt, response: guidedState.currentResponse }];
    guidedState.setHistory(newHistory);
    guidedState.setCurrentResponse('');

    // Save draft
    localStorage.setItem(
      STORAGE_KEYS.GUIDED_DRAFT,
      JSON.stringify({
        session: guidedState.session,
        history: newHistory,
        mood: editorState.mood,
        energy: editorState.energy,
        timestamp: Date.now(),
      })
    );

    if (newHistory.length >= 3) {
      // Complete guided session
      if (!canMakeAICall()) {
        setShowUpgradeModal(true);
        return;
      }

      editorState.setIsProcessing(true);
      try {
        const fullText = newHistory.map((h) => `Q: ${h.prompt}\nA: ${h.response}`).join('\n\n');
        // Backend now handles AI call limit checking and incrementing
        const aiAnalysis = await analyzeEntry(fullText, editorState.photo?.base64);
        // Refresh subscription data to update UI with new usage
        refreshSubscription();

        addEntry({
          date: new Date().toISOString(),
          text: fullText,
          mood: editorState.mood ?? undefined,
          energy: editorState.energy,
          guidedSession: guidedState.session ?? undefined,
          aiAnalysis,
        });

        toast.success('Guided session completed!');
        localStorage.removeItem(STORAGE_KEYS.GUIDED_DRAFT);
        editorState.resetState();
        guidedState.resetGuidedSession();
        setMode('selection');
      } catch (error: any) {
        logger.error('Failed to save guided session:', error);

        // Check if this is an AI limit exceeded error
        if (error?.code === 'AI_LIMIT_EXCEEDED') {
          setShowUpgradeModal(true);
          refreshSubscription(); // Refresh to show updated usage
        } else {
          toast.error('Failed to save session');
        }
      } finally {
        editorState.setIsProcessing(false);
      }
    } else {
      // Fetch next prompt
      await fetchNextPrompt(guidedState.session!.type, newHistory);
    }
  };

  // Handle mode selection
  const handleModeSelect = (selectedMode: EditorMode) => {
    setMode(selectedMode);
  };

  const handleGuidedSessionSelect = (session: { type: GuidedSessionType; title: string }) => {
    guidedState.setSession(session);
    fetchNextPrompt(session.type, []);
  };

  // Render mode selection screen
  if (mode === 'selection') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-stone-800 mb-2">New Entry</h2>
          <p className="text-stone-600">How would you like to journal today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleModeSelect('freestyle')}
            className="flex flex-col items-center justify-center p-8 bg-white border-2 border-stone-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition group"
          >
            <PencilSquareIcon className="w-12 h-12 text-rose-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-stone-800 mb-2">Freestyle Writing</h3>
            <p className="text-sm text-stone-600 text-center">
              Express yourself freely with a blank canvas
            </p>
          </button>

          <button
            onClick={() => handleModeSelect('guided')}
            className="flex flex-col items-center justify-center p-8 bg-white border-2 border-stone-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition group"
          >
            <div className="text-rose-600 mb-3 group-hover:scale-110 transition-transform">✨</div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">Guided Session</h3>
            <p className="text-sm text-stone-600 text-center">
              Structured prompts to guide your reflection
            </p>
          </button>
        </div>

        <div className="text-center pt-4">
          <button onClick={() => setCurrentView('feed')} className="text-stone-600 hover:text-rose-600 transition">
            <ArrowUturnLeftIcon className="w-5 h-5 inline mr-2" />
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  // Render guided session selector
  if (mode === 'guided' && !guidedState.session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <GuidedSessionSelector onSelect={handleGuidedSessionSelect} onBack={() => setMode('selection')} />
      </div>
    );
  }

  // Render freestyle editor
  if (mode === 'freestyle') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">Freestyle Entry</h2>
            <button onClick={() => setMode('selection')} className="text-stone-600 hover:text-rose-600 transition">
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
              onClick={handleFreestyleSubmit}
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
  }

  // Render guided session editor
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-800">{guidedState.session?.title}</h2>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                setMode('selection');
              }
            }}
            className="text-stone-600 hover:text-rose-600 transition"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
        </div>

        {/* History */}
        {guidedState.history.length > 0 && (
          <div className="mb-6 space-y-4">
            {guidedState.history.map((item, idx) => (
              <div key={idx} className="border-l-4 border-rose-300 pl-4 py-2">
                <p className="text-sm font-medium text-stone-700 mb-2">{item.prompt}</p>
                <p className="text-stone-600">{item.response}</p>
              </div>
            ))}
          </div>
        )}

        {/* Current Prompt */}
        {guidedState.isThinking ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
            <p className="mt-4 text-stone-600">Thinking of the next question...</p>
          </div>
        ) : guidedState.promptChoices.length > 0 ? (
          <div className="space-y-3 mb-6">
            <p className="font-medium text-stone-700">Choose a topic to explore:</p>
            {guidedState.promptChoices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => {
                  guidedState.setCurrentPrompt(choice);
                  guidedState.setPromptChoices([]);
                }}
                className="w-full p-4 text-left bg-stone-50 border border-stone-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 transition"
              >
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-rose-50 rounded-lg border border-rose-200">
              <p className="font-medium text-stone-800">{guidedState.currentPrompt}</p>
            </div>

            <textarea
              value={guidedState.currentResponse}
              onChange={(e) => guidedState.setCurrentResponse(e.target.value)}
              placeholder="Write your response..."
              className="w-full h-48 p-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none mb-4"
              disabled={editorState.isProcessing}
            />

            {guidedState.history.length === 2 && (
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
              onClick={handleGuidedSubmit}
              disabled={editorState.isProcessing || !guidedState.currentResponse.trim()}
              className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {editorState.isProcessing ? (
                'Processing...'
              ) : guidedState.history.length >= 2 ? (
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

export default JournalEditor;
