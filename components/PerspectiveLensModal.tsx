

// Fix: Import React types FC, useState, useEffect
import React, { useState, useEffect, FC } from 'react';
import { JournalEntry, Perspective } from '../types';
import { getPerspectives } from '../services/geminiService';
import { XMarkIcon } from './Icons';

interface PerspectiveLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
}

// Fix: Use FC type for functional component
const PerspectiveLensModal: FC<PerspectiveLensModalProps> = ({ isOpen, onClose, entry }) => {
  // Fix: Add generic type to useState
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchPerspectives = async () => {
        setIsLoading(true);
        setPerspectives([]);
        const result = await getPerspectives(entry.text);
        setPerspectives(result);
        setIsLoading(false);
      };
      fetchPerspectives();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entry.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-stone-800">Perspective Lens</h2>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-800">
              <XMarkIcon />
            </button>
          </div>
          <p className="text-sm text-stone-600 mb-2 font-serif italic border-l-4 border-stone-200 pl-4">"{entry.text.substring(0, 150)}{entry.text.length > 150 ? '...' : ''}"</p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {isLoading ? (
            <div className="text-center p-8">
              <p className="text-stone-600">AI is generating new perspectives...</p>
            </div>
          ) : (
            perspectives.map((p, index) => (
              <div key={index} className="bg-stone-50 border border-stone-200 p-4 rounded-md">
                <h3 className="font-semibold text-rose-700">{p.title}</h3>
                <p className="text-sm text-stone-700 mt-2 whitespace-pre-wrap">{p.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PerspectiveLensModal;
