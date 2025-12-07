import { FC, useState, useEffect, useMemo } from 'react';
import { JournalEntry } from '../types';
import JournalEntryCard from './JournalEntryCard';
import OnThisDay from './OnThisDay';
import JournalFilters, { FilterOptions } from './JournalFilters';
import { PencilSquareIcon } from './Icons';
import { useJournal } from '../hooks/useJournal';
import { getOnThisDayEntries } from '../utils/helpers';

interface JournalFeedProps {
  entries: JournalEntry[];
  onOpenPerspectiveLens: (entry: JournalEntry) => void;
  onOpenUpgradeModal?: (reason: 'limit_reached' | 'premium_feature' | 'perspective_lens', featureName?: string) => void;
  onDeleteEntry: (id: string) => void;
}

const JournalFeed: FC<JournalFeedProps> = ({ entries, onOpenPerspectiveLens, onOpenUpgradeModal, onDeleteEntry }) => {
  const { fetchEntries } = useJournal();
  const [filters, setFilters] = useState<FilterOptions>({
    searchText: '',
    dateFrom: '',
    dateTo: '',
    selectedTags: [],
    mood: null,
    energyMin: null,
    energyMax: null,
  });

  // Extract all unique tags from entries for the filter dropdown
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // Apply filters whenever they change
  useEffect(() => {
    const hasActiveFilters =
      filters.searchText ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.selectedTags.length > 0 ||
      filters.mood !== null ||
      filters.energyMin !== null ||
      filters.energyMax !== null;

    if (hasActiveFilters) {
      fetchEntries({
        search: filters.searchText || undefined,
        mood: filters.mood,
        energyMin: filters.energyMin,
        energyMax: filters.energyMax,
        tags: filters.selectedTags.length > 0 ? filters.selectedTags : undefined,
      });
    } else {
      // No filters, fetch all entries
      fetchEntries();
    }
  }, [filters, fetchEntries]);

  // "On This Day" logic
  const onThisDayEntries = getOnThisDayEntries(entries.map(e => ({ ...e, created_at: e.date })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(e => ({ ...e, date: e.created_at }));

  const onThisDayEntryIds = new Set(onThisDayEntries.map(e => e.id));
  const regularEntries = entries
    .filter(entry => !onThisDayEntryIds.has(entry.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasActiveFilters =
    filters.searchText ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.selectedTags.length > 0 ||
    filters.mood !== null ||
    filters.energyMin !== null ||
    filters.energyMax !== null;

  if (entries.length === 0 && !hasActiveFilters) {
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
    <div className="space-y-6">
      {/* Filters */}
      <JournalFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
      />

      {/* No results message */}
      {entries.length === 0 && hasActiveFilters && (
        <div className="text-center py-12 px-6 bg-white rounded-lg shadow-sm border border-stone-200">
          <p className="text-lg text-stone-600">No entries match your filters.</p>
          <p className="mt-2 text-sm text-stone-500">Try adjusting or clearing your search criteria.</p>
        </div>
      )}

      {/* Entries */}
      {entries.length > 0 && (
        <>
          {onThisDayEntries.length > 0 && (
            <OnThisDay
              entries={onThisDayEntries}
              onOpenPerspectiveLens={onOpenPerspectiveLens}
              onOpenUpgradeModal={onOpenUpgradeModal}
              onDeleteEntry={onDeleteEntry}
            />
          )}
          <div className="space-y-6">
            {regularEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onOpenPerspectiveLens={onOpenPerspectiveLens}
                onOpenUpgradeModal={onOpenUpgradeModal}
                onDelete={onDeleteEntry}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default JournalFeed;
