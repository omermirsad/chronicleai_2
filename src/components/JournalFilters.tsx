// src/components/JournalFilters.tsx
import { FC, useState, ChangeEvent } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from './Icons';

export interface FilterOptions {
  searchText: string;
  dateFrom: string;
  dateTo: string;
  selectedTags: string[];
  mood: number | null;
  energyMin: number | null;
  energyMax: number | null;
}

interface JournalFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableTags: string[];
}

const JournalFilters: FC<JournalFiltersProps> = ({
  filters,
  onFiltersChange,
  availableTags,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchText: e.target.value });
  };

  const handleDateFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dateFrom: e.target.value });
  };

  const handleDateToChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dateTo: e.target.value });
  };

  const handleMoodChange = (mood: number | null) => {
    onFiltersChange({ ...filters, mood });
  };

  const handleEnergyMinChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      energyMin: e.target.value ? parseInt(e.target.value) : null,
    });
  };

  const handleEnergyMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      energyMax: e.target.value ? parseInt(e.target.value) : null,
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onFiltersChange({ ...filters, selectedTags: newTags });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      searchText: '',
      dateFrom: '',
      dateTo: '',
      selectedTags: [],
      mood: null,
      energyMin: null,
      energyMax: null,
    });
  };

  const hasActiveFilters =
    filters.searchText ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.selectedTags.length > 0 ||
    filters.mood !== null ||
    filters.energyMin !== null ||
    filters.energyMax !== null;

  const moods = [
    { value: 1, emoji: '😠', label: 'Very Bad' },
    { value: 2, emoji: '😟', label: 'Bad' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '😄', label: 'Great' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Search your journal..."
          value={filters.searchText}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-rose-600 transition"
        >
          <FunnelIcon className="w-4 h-4" />
          {showAdvanced ? 'Hide Filters' : 'Show Filters'}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-rose-600 transition"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 space-y-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={handleDateFromChange}
                className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={handleDateToChange}
                className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                placeholder="To"
              />
            </div>
          </div>

          {/* Mood Filter */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Mood
            </label>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() =>
                    handleMoodChange(
                      filters.mood === mood.value ? null : mood.value
                    )
                  }
                  className={`px-3 py-2 rounded-lg border transition ${
                    filters.mood === mood.value
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-stone-300 bg-white text-stone-700 hover:border-rose-300'
                  }`}
                  title={mood.label}
                >
                  <span className="text-lg">{mood.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Filter */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Energy Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                max="100"
                value={filters.energyMin || ''}
                onChange={handleEnergyMinChange}
                placeholder="Min"
                className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={filters.energyMax || ''}
                onChange={handleEnergyMaxChange}
                placeholder="Max"
                className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filters.selectedTags.includes(tag)
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : 'bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !showAdvanced && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {filters.searchText && (
            <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded">
              Search: "{filters.searchText}"
            </span>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded">
              Date: {filters.dateFrom || '...'} - {filters.dateTo || '...'}
            </span>
          )}
          {filters.mood !== null && (
            <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded">
              Mood: {moods.find((m) => m.value === filters.mood)?.emoji}
            </span>
          )}
          {(filters.energyMin !== null || filters.energyMax !== null) && (
            <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded">
              Energy: {filters.energyMin || 0} - {filters.energyMax || 100}
            </span>
          )}
          {filters.selectedTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-rose-100 text-rose-700 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalFilters;
