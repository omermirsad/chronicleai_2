
import * as React from 'react';
import { JournalEntry } from '../types';
import JournalEntryCard from './JournalEntryCard';
import { CalendarDaysIcon } from './Icons';

interface OnThisDayProps {
  entries: JournalEntry[];
  onOpenPerspectiveLens: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const OnThisDay: React.FC<OnThisDayProps> = ({ entries, onOpenPerspectiveLens, onDeleteEntry }) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={`p-6 bg-amber-50 rounded-lg border-2 border-dashed border-amber-300 shadow-sm transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <header className="flex items-center gap-4 mb-4">
        <div className="bg-amber-200 p-3 rounded-full">
            <CalendarDaysIcon className="w-10 h-10 text-amber-700" />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-amber-900 tracking-tight">From Your Time Capsule</h2>
            <p className="text-amber-800">A look back at this day in your personal history.</p>
        </div>
      </header>
      <div className="space-y-4">
        {entries.map((entry) => (
          <JournalEntryCard 
            key={entry.id} 
            entry={entry} 
            onOpenPerspectiveLens={onOpenPerspectiveLens} 
            onDelete={onDeleteEntry}
          />
        ))}
      </div>
    </section>
  );
};

export default OnThisDay;
