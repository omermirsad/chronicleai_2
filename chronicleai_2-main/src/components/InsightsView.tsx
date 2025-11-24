
// Fix: Import React types FC, useState, useMemo
import * as React from 'react';
import { JournalEntry } from '../types';
import { generateInsights } from '../services/geminiService';
import { SparklesIcon, SeedingIcon, ChartBarIcon } from './Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


// @ts-ignore
const marked = window.marked;

interface InsightsViewProps {
  entries: JournalEntry[];
  userId: string;
}

const getMoodEmoji = (mood: number) => {
    const emojis = ['😠', '😟', '😐', '🙂', '😄'];
    return emojis[mood - 1] || '😐';
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const moodValue = payload[0].value;
        return (
            <div className="bg-white p-3 rounded-lg shadow-md border border-stone-200">
                <p className="font-semibold text-stone-700">{`Date: ${label}`}</p>
                <p className="text-rose-600 font-medium">{`Mood: ${moodValue} ${getMoodEmoji(moodValue)}`}</p>
            </div>
        );
    }
    return null;
};

// Fix: Use FC type for functional component
const InsightsView: React.FC<InsightsViewProps> = ({ entries, userId }) => {
  // Fix: Add generic type to useState
  const [insights, setInsights] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  // Fix: Add generic type to useState
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    try {
      const result = await generateInsights(entries, userId);
      setInsights(result);
    } catch (err) {
      setError('Sorry, there was an error generating insights. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const hasEnoughEntries = entries.length >= 3;

  const moodData = React.useMemo(() => {
    return entries
      .filter(entry => typeof entry.mood === 'number')
      .map(entry => ({
        name: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: entry.mood,
        fullDate: new Date(entry.date)
      }))
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [entries]);

  const hasEnoughMoodData = moodData.length > 1;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
      <div className="text-center">
        <SparklesIcon className="w-12 h-12 mx-auto text-rose-500" />
        <h2 className="mt-2 text-2xl font-bold text-stone-800">Self-Awareness Engine</h2>
        <p className="mt-2 text-stone-600">Discover long-term patterns and connections in your thoughts and feelings.</p>
        
        {hasEnoughEntries ? (
          <button
            onClick={handleGenerateInsights}
            disabled={isLoading}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-rose-500 rounded-md hover:bg-rose-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        ) : (
          <div className="mt-8 bg-stone-50 p-6 rounded-lg border border-stone-200">
            <SeedingIcon className="w-16 h-16 mx-auto text-rose-600" />
            <h3 className="mt-4 text-lg font-semibold text-stone-700">Your Insights are Budding</h3>
            <p className="mt-2 text-sm text-stone-600 max-w-sm mx-auto">
              Your journey of self-discovery has just begun. Keep adding entries to unlock powerful insights about your life.
            </p>
            <div className="mt-4 w-full max-w-xs mx-auto bg-stone-200 rounded-full h-2.5">
              <div 
                className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${(entries.length / 3) * 100}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm font-medium text-stone-700">{entries.length} / 3 entries recorded</p>
          </div>
        )}
      </div>

      {hasEnoughEntries && (
        <div className="mt-8 pt-8 border-t border-stone-200">
          <div className="text-center mb-6">
            <ChartBarIcon className="w-10 h-10 mx-auto text-rose-500" />
            <h3 className="mt-2 text-xl font-bold text-stone-800">Your Mood Over Time</h3>
          </div>
          {hasEnoughMoodData ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                  data={moodData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                  <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" stroke="#57534e" fontSize={12} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#57534e" tickFormatter={(tick) => getMoodEmoji(tick)} fontSize={16} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="mood" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorMood)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-4 bg-stone-50 rounded-md border border-stone-200">
                <p className="text-stone-600">Track your mood when you write an entry to see your trends here.</p>
                <p className="mt-1 text-sm text-stone-500">You need at least two entries with mood data.</p>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="mt-8 text-center text-stone-600 flex flex-col items-center justify-center space-y-4">
          <SparklesIcon className="w-12 h-12 text-rose-500 animate-pulse" />
          <p>The AI is carefully reviewing your journal to find meaningful patterns. This may take a moment...</p>
        </div>
      )}

      {error && <p className="mt-8 text-center text-red-600">{error}</p>}
      
      {insights && (
        <div className="mt-8 pt-6 border-t border-stone-200">
          <h3 className="text-xl font-semibold mb-4 text-stone-700">Your Generated Insights</h3>
          <div 
            className="prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ __html: marked.parse(insights) }}
          />
        </div>
      )}
    </div>
  );
};

export default InsightsView;
