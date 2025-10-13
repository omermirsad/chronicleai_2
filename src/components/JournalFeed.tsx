import * as React from 'react';
import { JournalEntry } from '../types';
import JournalEntryCard from './JournalEntryCard';
import OnThisDay from './OnThisDay';
import { PencilSquareIcon } from './Icons';

interface JournalFeedProps {
  entries: JournalEntry[];
  onOpenPerspectiveLens: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const JournalFeed: React.FC<JournalFeedProps> = ({ entries, onOpenPerspectiveLens, onDeleteEntry }) => {
  // "On This Day" logic
  const today = new Date();
  const onThisDayEntries = entries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getDate() === today.getDate() &&
        entryDate.getFullYear() < today.getFullYear()
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const onThisDayEntryIds = new Set(onThisDayEntries.map(e => e.id));
  const regularEntries = entries
    .filter(entry => !onThisDayEntryIds.has(entry.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-stone-200">
        <PencilSquareIcon className="w-16 h-16 mx-auto text-stone-400" />
        <h2 className="mt-4 text-2xl font-bold text-stone-800">Your Story Awaits</h2>
        <p className="mt-2 text-stone-600">Your journal is ready for your thoughts, reflections, and memories.</p>
        <p className="mt-4 text-stone-600">Click on <span className="font-semibold text-rose-600">"New Entry"</span> to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {onThisDayEntries.length > 0 && (
        <OnThisDay 
            entries={onThisDayEntries} 
            onOpenPerspectiveLens={onOpenPerspectiveLens} 
            onDeleteEntry={onDeleteEntry}
        />
      )}
      <div className="space-y-6">
        {regularEntries.map((entry) => (
          <JournalEntryCard 
            key={entry.id} 
            entry={entry} 
            onOpenPerspectiveLens={onOpenPerspectiveLens}
            onDelete={onDeleteEntry}
        />
        ))}
      </div>
    </div>
  );
};

export default JournalFeed;
