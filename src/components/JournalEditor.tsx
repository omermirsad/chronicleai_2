
// Fix: Import React types
import * as React from 'react';
import { JournalEntry, View, GuidedSessionType } from '../types';
import { analyzeEntry, getGuidedPrompt } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSubscription } from '../hooks/useSubscription';
import UpgradeModal from './UpgradeModal';
import { MicrophoneIcon, PhotoIcon, PaperAirplaneIcon, HeartIcon, MountainIcon, CompassIcon, PencilSquareIcon, ArrowUturnLeftIcon, SparklesIcon, SeedingIcon } from './Icons';
import { marked } from 'marked';
import toast from 'react-hot-toast';

interface JournalEditorProps {
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updatedData: Partial<JournalEntry>) => void;
  setCurrentView: (view: View) => void;
}

type EditorMode = 'selection' | 'freestyle' | 'guided';

const guidedSessions = [
    { type: 'gratitude' as GuidedSessionType, title: "Gratitude Practice", description: "Focus on the good and cultivate appreciation.", icon: <HeartIcon />},
    { type: 'challenge' as GuidedSessionType, title: "Overcoming a Challenge", description: "Reflect on a difficulty to find strength and clarity.", icon: <MountainIcon />},
    { type: 'review' as GuidedSessionType, title: "Weekly Compass", description: "Review your week to set a clear course for the next.", icon: <CompassIcon />},
    { type: 'future-self' as GuidedSessionType, title: "Future Self Visualization", description: "Envision your ideal future to gain clarity and motivation.", icon: <SparklesIcon />},
    { type: 'mindful-observation' as GuidedSessionType, title: "Mindful Observation", description: "Ground yourself in the present by observing your surroundings.", icon: <SeedingIcon />},
    { type: 'stoic-reflection' as GuidedSessionType, title: "Stoic Reflection", description: "Practice resilience by reflecting on what is in your control.", icon: <CompassIcon />},
]

const GUIDED_DRAFT_KEY = 'chronicle-ai-guided-draft';

// Fix: Use FC type for functional component
const JournalEditor: React.FC<JournalEditorProps> = ({ addEntry, updateEntry, setCurrentView }) => {
  const { canMakeAICall, incrementAICallCount, hasReachedLimit } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [text, setText] = React.useState('');
  // Fix: Add generic type to useState
  const [photo, setPhoto] = React.useState<{ base64: string; mimeType: string } | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  // Fix: Add generic type to useState
  const [mode, setMode] = React.useState<EditorMode>('selection');
  const [textBeforeRecording, setTextBeforeRecording] = React.useState('');
  // Fix: Add generic type to useState
  const [mood, setMood] = React.useState<number | null>(null);
  const [energy, setEnergy] = React.useState<number>(50);
  
  // Guided session state
  // Fix: Add generic type to useState
  const [session, setSession] = React.useState<{type: GuidedSessionType, title: string} | null>(null);
  // Fix: Add generic type to useState
  const [history, setHistory] = React.useState<{ prompt: string; response: string }[]>([]);
  const [currentPrompt, setCurrentPrompt] = React.useState('');
  // Fix: Add generic type to useState
  const [promptChoices, setPromptChoices] = React.useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = React.useState('');
  const [isThinking, setIsThinking] = React.useState(false);

  // Draft state
  // Fix: Add generic type to useState
  const [draftToResume, setDraftToResume] = React.useState<any | null>(null);
  // Fix: Add generic type to useState
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');


  const handleTranscriptChange = React.useCallback((transcript: string) => {
    const prefix = textBeforeRecording ? textBeforeRecording + ' ' : '';
    if (mode === 'freestyle') {
      setText(prefix + transcript);
    } else if (mode === 'guided') {
      setCurrentResponse(prefix + transcript);
    }
  }, [mode, textBeforeRecording]);

  const { isListening, startListening, stopListening, hasSupport } = useSpeechRecognition(handleTranscriptChange);
  
  const toggleListening = () => {
    if (isListening) {
        stopListening();
    } else {
        setTextBeforeRecording(mode === 'freestyle' ? text : currentResponse);
        startListening();
    }
  }

  const fetchNextPrompt = React.useCallback(async (sessionType: GuidedSessionType, currentHistory: { prompt: string; response: string }[]) => {
    setIsThinking(true);
    setCurrentPrompt('');
    setPromptChoices([]);
    const prompts = await getGuidedPrompt(sessionType, currentHistory);
    if (prompts.length === 1) {
        setCurrentPrompt(prompts[0]);
    } else {
        setPromptChoices(prompts);
    }
    setIsThinking(false);
  }, []);

  React.useEffect(() => {
    if (mode === 'guided' && session && history.length === 0 && !currentPrompt && promptChoices.length === 0) {
      fetchNextPrompt(session.type, []);
    }
  }, [mode, session, history, fetchNextPrompt, currentPrompt, promptChoices]);

  React.useEffect(() => {
    try {
        const savedDraft = localStorage.getItem(GUIDED_DRAFT_KEY);
        if (savedDraft) {
            setDraftToResume(JSON.parse(savedDraft));
        }
    } catch (error) {
        console.error("Failed to load guided session draft:", error);
        localStorage.removeItem(GUIDED_DRAFT_KEY); // Clear corrupted draft
    }
  }, []);


  const handleStartSession = (sessionType: GuidedSessionType, title: string) => {
    setSession({type: sessionType, title});
    setMode('guided');
    setHistory([]);
    setCurrentResponse('');
  };

  const handleSelectPrompt = (prompt: string) => {
    setCurrentPrompt(prompt);
    setPromptChoices([]);
  }
  
  const handleNextPrompt = () => {
    if (!currentResponse.trim()) {
      alert("Please write a response before continuing.");
      return;
    }
    const newHistory = [...history, { prompt: currentPrompt, response: currentResponse }];
    setHistory(newHistory);
    setCurrentResponse('');
    fetchNextPrompt(session!.type, newHistory);
  };
  
  const handleSaveGuidedSession = async () => {
     if (isListening) stopListening();
     setIsProcessing(true);

     const finalHistory = currentResponse.trim() ? [...history, { prompt: currentPrompt, response: currentResponse }] : history;
     const formattedText = finalHistory.map(item => `**${item.prompt}**\n\n${item.response}`).join('\n\n---\n\n');

     try {
        // Check if user can make AI call
        if (!canMakeAICall()) {
          setShowUpgradeModal(true);
          setIsProcessing(false);
          return;
        }

        // Fix: Run analysis before adding entry
        const analysis = await analyzeEntry(formattedText, undefined);

        // Increment AI call count after successful analysis
        const { success, message } = await incrementAICallCount();
        if (!success) {
          toast.error(message || 'Failed to track AI usage');
        }

        const newEntry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> = {
            date: new Date().toISOString(),
            text: formattedText,
            guidedSession: session || undefined,
            mood: mood ?? undefined,
            energy,
            aiAnalysis: analysis,
        };
        addEntry(newEntry);
        localStorage.removeItem(GUIDED_DRAFT_KEY);
        setCurrentView('feed');
     } catch (error) {
        console.error("Failed to process guided session:", error);
        toast.error('Failed to save entry. Please try again.');
     } finally {
        setIsProcessing(false);
     }
  }

  const handleSaveDraft = () => {
    if (!session) return;
    setSaveStatus('saving');
    const draft = {
        session,
        history,
        currentPrompt,
        promptChoices,
        currentResponse,
        mood,
        energy,
    };
    try {
        localStorage.setItem(GUIDED_DRAFT_KEY, JSON.stringify(draft));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
        console.error("Failed to save draft:", error);
        alert("Could not save draft.");
        setSaveStatus('idle');
    }
  };

  const handleResumeDraft = () => {
    if (!draftToResume) return;
    setSession(draftToResume.session);
    setHistory(draftToResume.history);
    setCurrentPrompt(draftToResume.currentPrompt);
    setPromptChoices(draftToResume.promptChoices);
    setCurrentResponse(draftToResume.currentResponse);
    setMood(draftToResume.mood);
    setEnergy(draftToResume.energy);
    setMode('guided');
    setDraftToResume(null);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(GUIDED_DRAFT_KEY);
    setDraftToResume(null);
  };

  // Fix: Use ChangeEvent type for event parameter
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        setPhoto({ base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  // Fix: Use FormEvent type for event parameter
  const handleSubmitFreestyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !photo) {
      alert("Please write something or upload a photo.");
      return;
    }
    setIsProcessing(true);
    if (isListening) stopListening();

    try {
      // Check if user can make AI call
      if (!canMakeAICall()) {
        setShowUpgradeModal(true);
        setIsProcessing(false);
        return;
      }

      // Fix: Run analysis before adding entry
      const analysis = await analyzeEntry(text, photo || undefined);

      // Increment AI call count after successful analysis
      const { success, message } = await incrementAICallCount();
      if (!success) {
        toast.error(message || 'Failed to track AI usage');
      }

      const newEntry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        date: new Date().toISOString(),
        text,
        photo: photo || undefined,
        mood: mood ?? undefined,
        energy,
        aiAnalysis: analysis,
      };
      addEntry(newEntry);
      setCurrentView('feed');
    } catch (error) {
      console.error("Failed to process freestyle entry:", error);
      toast.error('Failed to save entry. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetToSelection = () => {
    setMode('selection');
    setText('');
    setPhoto(null);
    setSession(null);
    setHistory([]);
    setCurrentPrompt('');
    setPromptChoices([]);
    setCurrentResponse('');
    setIsProcessing(false);
    if (isListening) stopListening();
    setMood(null);
    setEnergy(50);
     try {
        const savedDraft = localStorage.getItem(GUIDED_DRAFT_KEY);
        if (savedDraft) {
            setDraftToResume(JSON.parse(savedDraft));
        }
    } catch (error) {
        console.error("Failed to load draft on reset:", error);
    }
  }

  if (mode === 'selection') {
    if (draftToResume) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-dashed border-amber-400 text-center">
                <h2 className="text-2xl font-bold mb-2">Unfinished Session</h2>
                <p className="text-stone-600 mb-6">
                    You have a saved draft for the "<strong>{draftToResume.session?.title}</strong>" guided session.
                </p>
                <div className="flex justify-center gap-4">
                    <button onClick={handleResumeDraft} className="px-6 py-2 font-semibold text-white bg-rose-500 rounded-md hover:bg-rose-600 transition">
                        Resume Session
                    </button>
                    <button onClick={handleDiscardDraft} className="px-6 py-2 font-semibold text-stone-700 bg-stone-200 rounded-md hover:bg-stone-300 transition">
                        Discard & Start New
                    </button>
                </div>
            </div>
        )
    }
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
            <h2 className="text-2xl font-bold mb-1 text-center">New Entry</h2>
            <p className="text-stone-600 mb-6 text-center">How would you like to reflect today?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setMode('freestyle')} className="p-6 bg-rose-50 rounded-lg border-2 border-rose-200 hover:border-rose-500 hover:bg-rose-100 transition text-left flex items-start gap-4">
                    <PencilSquareIcon className="w-8 h-8 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-lg text-stone-800">Freestyle Writing</h3>
                        <p className="text-stone-600">Start with a blank page for your thoughts to flow freely.</p>
                    </div>
                </button>
            </div>
            <h3 className="text-lg font-bold mt-8 mb-4 text-center">Or, start a Guided Session...</h3>
            <div className="space-y-3">
                {guidedSessions.map(s => (
                    <button key={s.type} onClick={() => handleStartSession(s.type, s.title)} className="w-full p-4 bg-stone-50 rounded-lg border border-stone-200 hover:border-rose-400 hover:bg-rose-50 transition text-left flex items-start gap-4">
                        <div className="bg-rose-100 p-2 rounded-full">{React.cloneElement(s.icon, { className: 'w-6 h-6 text-rose-600' })}</div>
                        <div>
                            <h4 className="font-bold text-stone-800">{s.title}</h4>
                            <p className="text-sm text-stone-600">{s.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
  }
  
  if (mode === 'guided') {
      const getSaveButtonContent = () => {
        switch (saveStatus) {
            case 'saving': return 'Saving...';
            case 'saved': return '✓ Saved';
            default: return 'Save Draft';
        }
    };

      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{session?.title}</h2>
                <button onClick={resetToSelection} className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900">
                    <ArrowUturnLeftIcon /> Back
                </button>
            </div>

            {history.map((turn, index) => (
                <div key={index} className="mb-4">
                    <div className="bg-amber-50 text-amber-900 p-4 rounded-md prose" dangerouslySetInnerHTML={{__html: marked.parse(turn.prompt)}}></div>
                    <div className="mt-2 pl-4 border-l-2 border-stone-200 font-serif text-stone-600 whitespace-pre-wrap">{turn.response}</div>
                </div>
            ))}
            
            {isThinking && (
                <div className="text-center p-8 text-stone-600 animate-pulse">Generating next steps...</div>
            )}
            
            {promptChoices.length > 0 && (
                <div className="mb-4 p-4 bg-amber-50 rounded-md">
                    <h3 className="font-semibold text-amber-900 mb-2">Choose your path:</h3>
                    <div className="flex flex-col gap-2">
                        {promptChoices.map((p, i) => (
                            <button key={i} onClick={() => handleSelectPrompt(p)} className="text-left p-3 bg-white rounded-md border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition text-sm">
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {currentPrompt && !isThinking && (
                 <div className="bg-amber-50 text-amber-900 p-4 rounded-md mb-4 prose" dangerouslySetInnerHTML={{__html: marked.parse(currentPrompt)}}></div>
            )}

            {currentPrompt && !isThinking && (
                <>
                <textarea
                  className={`w-full h-40 p-3 font-serif text-stone-700 bg-stone-50 border border-stone-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition ${isListening ? 'border-red-400 ring-2 ring-red-200' : ''}`}
                  placeholder="Your thoughts..."
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  disabled={isProcessing}
                />
                 <div className="my-6 space-y-6">
                    {/* Mood Selector */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">How are you feeling now?</label>
                        <div className="flex justify-around items-center bg-stone-50 p-2 rounded-lg border border-stone-200">
                            {[1, 2, 3, 4, 5].map((level) => {
                                const emojis = ['😠', '😟', '😐', '🙂', '😄'];
                                return (
                                    <button
                                        type="button"
                                        key={level}
                                        onClick={() => setMood(level)}
                                        className={`p-2 rounded-full text-3xl transition-all duration-200 ${
                                            mood === level ? 'scale-125' : 'scale-100 opacity-50 hover:opacity-100 hover:scale-110'
                                        }`}
                                        aria-label={`Mood level ${level}`}
                                    >
                                        {emojis[level - 1]}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Energy Slider */}
                    <div>
                        <label htmlFor="energy-guided" className="block text-sm font-medium text-stone-700 mb-2">Energy Level: <span className="font-bold">{energy}%</span></label>
                        <input
                            id="energy-guided"
                            type="range"
                            min="0"
                            max="100"
                            value={energy}
                            onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    {hasSupport && (
                        <button
                            type="button"
                            onClick={toggleListening}
                            aria-label={isListening ? 'Stop recording' : 'Start recording'}
                            className={`p-3 rounded-full transition ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}
                        >
                            <MicrophoneIcon className="w-5 h-5" />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isProcessing || saveStatus !== 'idle'}
                        className="px-4 py-2 text-sm font-semibold text-stone-700 bg-stone-200 rounded-md hover:bg-stone-300 disabled:opacity-50 transition"
                      >
                          {getSaveButtonContent()}
                      </button>
                      <button onClick={handleNextPrompt} disabled={isProcessing || !currentResponse.trim()} className="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-100 rounded-md hover:bg-rose-200 disabled:opacity-50 transition">
                        Next
                      </button>
                      <button onClick={handleSaveGuidedSession} disabled={isProcessing || history.length === 0} className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 rounded-md hover:bg-rose-600 disabled:bg-stone-300 transition">
                        {isProcessing ? 'Saving...' : 'Finish & Save'}
                      </button>
                    </div>
                </div>
                </>
            )}
        </div>
      )
  }

  // Freestyle mode
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
      <form onSubmit={handleSubmitFreestyle}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Freestyle Entry</h2>
            <button type="button" onClick={resetToSelection} className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900">
                <ArrowUturnLeftIcon /> Back
            </button>
        </div>
        <textarea
          className={`w-full h-48 p-3 font-serif text-stone-700 bg-stone-50 border border-stone-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition ${isListening ? 'border-red-400 ring-2 ring-red-200' : ''}`}
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isProcessing}
        />
        
        <div className="my-6 space-y-6">
            {/* Mood Selector */}
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">How are you feeling?</label>
                <div className="flex justify-around items-center bg-stone-50 p-2 rounded-lg border border-stone-200">
                    {[1, 2, 3, 4, 5].map((level) => {
                        const emojis = ['😠', '😟', '😐', '🙂', '😄'];
                        return (
                            <button
                                type="button"
                                key={level}
                                onClick={() => setMood(level)}
                                className={`p-2 rounded-full text-3xl transition-all duration-200 ${
                                    mood === level ? 'scale-125' : 'scale-100 opacity-50 hover:opacity-100 hover:scale-110'
                                }`}
                                aria-label={`Mood level ${level}`}
                            >
                                {emojis[level - 1]}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Energy Slider */}
            <div>
                <label htmlFor="energy" className="block text-sm font-medium text-stone-700 mb-2">Energy Level: <span className="font-bold">{energy}%</span></label>
                <input
                    id="energy"
                    type="range"
                    min="0"
                    max="100"
                    value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
            </div>
        </div>

        {photo && (
          <div className="my-4">
            <img src={`data:${photo.mimeType};base64,${photo.base64}`} alt="Journal entry" className="max-h-48 rounded-md" />
            <button type="button" onClick={() => setPhoto(null)} className="text-sm text-red-600 mt-1">Remove Photo</button>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {hasSupport && (
                 <button
                    type="button"
                    onClick={toggleListening}
                    aria-label={isListening ? 'Stop recording' : 'Start recording'}
                    className={`p-3 rounded-full transition ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}
                >
                    <MicrophoneIcon className="w-5 h-5" />
                </button>
            )}
            <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-stone-200 rounded-md hover:bg-stone-300 transition cursor-pointer">
              <PhotoIcon /> 
              <span className="hidden sm:inline">Upload</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || (!text.trim() && !photo)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-500 rounded-md hover:bg-rose-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
          >
            {isProcessing ? 'Processing...' : 'Save Entry'}
            {!isProcessing && <PaperAirplaneIcon />}
          </button>
        </div>
      </form>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="limit_reached"
      />
    </div>
  );
};

export default JournalEditor;
