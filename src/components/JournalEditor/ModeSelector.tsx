import React from 'react';
import { View } from '../../types';
import {
  PencilSquareIcon,
  ArrowUturnLeftIcon,
} from '../Icons';

interface ModeSelectorProps {
  onSelect: (mode: 'freestyle' | 'guided') => void;
  setCurrentView: (view: View) => void;
}

/**
 * Mode selection screen for choosing between freestyle and guided journaling
 * Extracted from JournalEditor to follow Single Responsibility Principle
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect, setCurrentView }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-stone-800 mb-2">New Entry</h2>
        <p className="text-stone-600">How would you like to journal today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('freestyle')}
          className="flex flex-col items-center justify-center p-8 bg-white border-2 border-stone-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition group"
        >
          <PencilSquareIcon className="w-12 h-12 text-rose-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-semibold text-stone-800 mb-2">Freestyle Writing</h3>
          <p className="text-sm text-stone-600 text-center">
            Express yourself freely with a blank canvas
          </p>
        </button>

        <button
          onClick={() => onSelect('guided')}
          className="flex flex-col items-center justify-center p-8 bg-white border-2 border-stone-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition group"
        >
          <div className="text-rose-600 mb-3 group-hover:scale-110 transition-transform text-4xl">✨</div>
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
};
