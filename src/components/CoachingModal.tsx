// src/components/CoachingModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { CoachingModuleType } from '@/types';
import { getCoachingModule, getCoachingFollowUp } from '@/services/geminiService';
import { XMarkIcon, SparklesIcon } from '@/components/Icons';
import { useSubscription } from '@/hooks/useSubscription';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

interface CoachingModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleType: CoachingModuleType;
  onOpenUpgradeModal?: () => void;
}

interface ConversationTurn {
  prompt: string;
  response: string;
}

const CoachingModal: React.FC<CoachingModalProps> = ({
  isOpen,
  onClose,
  moduleType,
  onOpenUpgradeModal,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [userResponse, setUserResponse] = useState('');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [stepNumber, setStepNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const responseRef = useRef<HTMLTextAreaElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const { canMakeAICall, incrementAICallCount } = useSubscription();

  // Initialize coaching module
  useEffect(() => {
    if (isOpen) {
      initializeCoaching();
    }
  }, [isOpen, moduleType]);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, currentPrompt]);

  const initializeCoaching = async () => {
    setIsLoading(true);
    setConversation([]);
    setStepNumber(0);
    setIsComplete(false);
    setUserResponse('');

    try {
      // Check AI usage limit
      if (!canMakeAICall()) {
        toast.error('You have reached your AI usage limit');
        if (onOpenUpgradeModal) {
          onOpenUpgradeModal();
        }
        onClose();
        return;
      }

      const module = await getCoachingModule(moduleType);
      setTitle(module.title);
      setDescription(module.description);
      setCurrentPrompt(module.initialPrompt);

      // Track AI call for initialization
      await incrementAICallCount();
    } catch (error) {
      logger.error('Error initializing coaching', error as Error);
      toast.error('Failed to start coaching session');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!userResponse.trim()) {
      toast.error('Please enter a response before continuing');
      return;
    }

    // Check AI usage limit before proceeding
    if (!canMakeAICall()) {
      toast.error('You have reached your AI usage limit');
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal();
      }
      return;
    }

    // Add current turn to conversation
    const newTurn: ConversationTurn = {
      prompt: currentPrompt,
      response: userResponse.trim(),
    };
    const updatedConversation = [...conversation, newTurn];
    setConversation(updatedConversation);
    setUserResponse('');
    setIsLoading(true);

    try {
      // Get next prompt from AI
      const { prompt, isComplete: sessionComplete } = await getCoachingFollowUp(
        moduleType,
        stepNumber,
        updatedConversation
      );

      setCurrentPrompt(prompt);
      setStepNumber(stepNumber + 1);
      setIsComplete(sessionComplete);

      // Track AI call
      await incrementAICallCount();

      // Focus on response textarea if not complete
      if (!sessionComplete) {
        setTimeout(() => {
          responseRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      logger.error('Error getting coaching follow-up', error as Error);
      toast.error('Failed to continue session. Please try again.');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd+Enter or Ctrl+Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  const handleClose = () => {
    if (conversation.length > 0 && !isComplete) {
      const confirmClose = window.confirm(
        'Are you sure you want to exit? Your coaching session progress will be lost.'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
            <p className="text-sm text-stone-600 mt-1">{description}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-stone-100 transition"
            aria-label="Close coaching session"
          >
            <XMarkIcon className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <SparklesIcon className="w-12 h-12 text-rose-500 animate-pulse" />
              <p className="mt-4 text-stone-600">Preparing your coaching session...</p>
            </div>
          ) : (
            <>
              {/* Past conversation */}
              {conversation.map((turn, index) => (
                <div key={index} className="space-y-4">
                  {/* Coach prompt */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 bg-rose-50 rounded-lg p-4 border border-rose-200">
                      <p className="text-sm font-semibold text-rose-900 mb-1">Coach</p>
                      <p className="text-stone-700 whitespace-pre-wrap">{turn.prompt}</p>
                    </div>
                  </div>

                  {/* User response */}
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 max-w-2xl bg-stone-100 rounded-lg p-4 border border-stone-200">
                      <p className="text-sm font-semibold text-stone-900 mb-1">You</p>
                      <p className="text-stone-700 whitespace-pre-wrap">{turn.response}</p>
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center text-white font-semibold">
                      {turn.response.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Current prompt */}
              {currentPrompt && !isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1 bg-rose-50 rounded-lg p-4 border border-rose-200">
                    <p className="text-sm font-semibold text-rose-900 mb-1">Coach</p>
                    <p className="text-stone-700 whitespace-pre-wrap">{currentPrompt}</p>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && conversation.length > 0 && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-rose-600 animate-pulse" />
                  </div>
                  <div className="flex-1 bg-rose-50 rounded-lg p-4 border border-rose-200">
                    <p className="text-sm text-stone-600 italic">Coach is thinking...</p>
                  </div>
                </div>
              )}

              <div ref={conversationEndRef} />
            </>
          )}
        </div>

        {/* Response Area */}
        {!isLoading && !isComplete && (
          <div className="p-6 border-t border-stone-200 bg-stone-50">
            <label htmlFor="coaching-response" className="block text-sm font-medium text-stone-700 mb-2">
              Your Response
            </label>
            <textarea
              id="coaching-response"
              ref={responseRef}
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts here..."
              rows={4}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-stone-500">
                Press <kbd className="px-2 py-1 bg-white border border-stone-300 rounded">⌘</kbd> + <kbd className="px-2 py-1 bg-white border border-stone-300 rounded">Enter</kbd> to continue
              </p>
              <button
                onClick={handleSubmitResponse}
                disabled={!userResponse.trim()}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Complete state */}
        {isComplete && (
          <div className="p-6 border-t border-stone-200 bg-gradient-to-r from-rose-50 to-amber-50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-4">
                <SparklesIcon className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                Coaching Session Complete
              </h3>
              <p className="text-sm text-stone-600 mb-4">
                Great work today! Remember to revisit these insights as you continue your journey.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium"
              >
                Close Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachingModal;
