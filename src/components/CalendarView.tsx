import { FC, useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import JournalEntryCard from './JournalEntryCard';
import { XMarkIcon } from './Icons';

interface CalendarViewProps {
  entries: JournalEntry[];
  onOpenPerspectiveLens: (entry: JournalEntry) => void;
  onOpenUpgradeModal?: (reason: 'limit_reached' | 'premium_feature' | 'perspective_lens', featureName?: string) => void;
  onDeleteEntry: (id: string) => void;
}

const CalendarView: FC<CalendarViewProps> = ({ entries, onOpenPerspectiveLens, onOpenUpgradeModal, onDeleteEntry }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEntries, setSelectedDayEntries] = useState<JournalEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach(entry => {
      const dateKey = entry.date ? new Date(entry.date).toISOString().split('T')[0] : "";
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);
  
  const openModal = (dayEntries: JournalEntry[]) => {
    setSelectedDayEntries(dayEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsModalOpen(true);
    setTimeout(() => setIsModalVisible(true), 10);
  }

  const closeModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
        setIsModalOpen(false);
        setSelectedDayEntries([]);
    }, 300); // Match transition duration
  }

  const handleDayClick = (day: number) => {
    const dateKey = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    const dayEntries = entriesByDate.get(dateKey);
    if (dayEntries && dayEntries.length > 0) {
      openModal(dayEntries);
    }
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days = Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} className="border-r border-b border-stone-200"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = new Date(year, month, day).toISOString().split('T')[0];
      const hasEntries = entriesByDate.has(dateKey);
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

      days.push(
        <div 
            key={day} 
            className={`p-2 border-r border-b border-stone-200 h-24 flex flex-col items-start transition-colors ${hasEntries ? 'cursor-pointer hover:bg-rose-50' : 'bg-stone-50'}`}
            onClick={() => handleDayClick(day)}
            >
          <span className={`font-medium text-sm ${isToday ? 'bg-rose-500 text-white rounded-full h-6 w-6 flex items-center justify-center' : 'text-stone-700'}`}>{day}</span>
          {hasEntries && <span className="mt-2 h-2 w-2 bg-rose-400 rounded-full self-center"></span>}
        </div>
      );
    }
    return days;
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
        <header className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-stone-200 text-stone-700 rounded-md hover:bg-stone-300">&lt; Prev</button>
          <h2 className="text-xl font-bold text-stone-800">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-stone-200 text-stone-700 rounded-md hover:bg-stone-300">Next &gt;</button>
        </header>
        <div className="grid grid-cols-7 text-center font-semibold text-sm text-stone-600">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2 border-b-2 border-stone-200">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-stone-200">
          {renderCalendarGrid()}
        </div>
      </div>

      {isModalOpen && (
        <div className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${isModalVisible ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={closeModal}>
          <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 ${isModalVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-stone-800">
                  Entries for {selectedDayEntries.length > 0 ? new Date(selectedDayEntries[0].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                </h2>
                <button onClick={closeModal} className="text-stone-500 hover:text-stone-800">
                  <XMarkIcon />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {selectedDayEntries.map(entry => (
                <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onOpenPerspectiveLens={onOpenPerspectiveLens}
                    onOpenUpgradeModal={onOpenUpgradeModal}
                    onDelete={onDeleteEntry}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CalendarView;
