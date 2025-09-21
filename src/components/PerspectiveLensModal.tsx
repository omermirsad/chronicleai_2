// src/components/PerspectiveLensModal.tsx
import React, { useState, useEffect, FC } from 'react';
import { JournalEntry, Perspective } from '../types';
import { getPerspectives } from '../services/geminiService';
import { XMarkIcon, SparklesIcon } from './Icons';
import { parseMarkdownSafely } from '../utils/security';
import toast from 'react-hot-toast';

interface PerspectiveLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
}

const PerspectiveLensModal: FC<PerspectiveLensModalProps> = ({ isOpen, onClose, entry }) => {
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerspective, setSelectedPerspective] = useState(0);

  useEffect(() => {
    if (isOpen && entry) {
      loadPerspectives();
    }
  }, [isOpen, entry]);

  const loadPerspectives = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await getPerspectives(entry.text);
      setPerspectives(results);
    } catch (err: any) {
      console.error('Failed to load perspectives:', err);
      setError('Unable to generate perspectives at this time. Please try again later.');
      toast.error('Failed to load perspectives');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && selectedPerspective > 0) {
      setSelectedPerspective(selectedPerspective - 1);
    } else if (e.key === 'ArrowRight' && selectedPerspective < perspectives.length - 1) {
      setSelectedPerspective(selectedPerspective + 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="perspective-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-rose-500" />
            <div>
              <h2 id="perspective-modal-title" className="text-2xl font-bold text-stone-800">
                Perspective Lens
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                View your entry through different lenses of understanding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-800 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <SparklesIcon className="w-12 h-12 text-rose-500 animate-pulse mb-4" />
              <p className="text-stone-600">Generating perspectives...</p>
              <p className="text-sm text-stone-500 mt-2">This may take a moment</p>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="bg-red-50 text-red-800 p-6 rounded-lg max-w-md text-center">
                <p className="font-medium mb-2">Unable to Generate Perspectives</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={loadPerspectives}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && perspectives.length > 0 && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 p-4 bg-stone-50 border-b border-stone-200">
                {perspectives.map((perspective, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPerspective(index)}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      selectedPerspective === index
                        ? 'bg-white text-rose-600 shadow-sm border border-stone-200'
                        : 'text-stone-600 hover:bg-white hover:text-stone-900'
                    }`}
                  >
                    {perspective.title}
                  </button>
                ))}
              </div>

              {/* Perspective Content */}
              <div className="flex-1 overflow-auto p-6">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-xl font-bold text-stone-800 mb-4">
                    {perspectives[selectedPerspective].title}
                  </h3>
                  <div 
                    className="prose prose-stone max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: parseMarkdownSafely(perspectives[selectedPerspective].content) 
                    }}
                  />
                </div>
              </div>

              {/* Navigation hints */}
              <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 text-center">
                <p className="text-xs text-stone-500">
                  Use arrow keys to navigate between perspectives • Press ESC to close
                </p>
              </div>
            </>
          )}

          {!isLoading && !error && perspectives.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <SparklesIcon className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                <p className="text-stone-600">No perspectives available</p>
                <button
                  onClick={loadPerspectives}
                  className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
                >
                  Generate Perspectives
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Original Entry Reference */}
        <details className="border-t border-stone-200 bg-stone-50">
          <summary className="px-6 py-3 cursor-pointer text-sm font-medium text-stone-600 hover:text-stone-900">
            View Original Entry
          </summary>
          <div className="px-6 pb-4">
            <div className="bg-white p-4 rounded-md border border-stone-200 max-h-32 overflow-auto">
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{entry.text}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default PerspectiveLensModal;
