import { FC, useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { generateInsights } from '../services/geminiService';
import { SparklesIcon, SeedingIcon, ChartBarIcon } from './Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from '../hooks/useNavigate';
import { getMoodEmoji } from '../utils/helpers';

interface InsightsViewProps {
  entries: JournalEntry[];
  userId: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip: FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const moodValue = payload[0]?.value;
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-stone-200">
        <p className="font-semibold text-stone-700">{`Date: ${label}`}</p>
        <p className="text-rose-600 font-medium">{`Mood: ${moodValue} ${getMoodEmoji(moodValue || 0)}`}</p>
      </div>
    );
  }
  return null;
};

const InsightsView: FC<InsightsViewProps> = ({ entries, userId }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usage } = useSubscription();
  const navigate = useNavigate();

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

  const moodData = useMemo(() => {
    return entries
      .filter(entry => typeof entry.mood === 'number')
      .map(entry => ({
        name: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: entry.mood,
        fullDate: new Date(entry.date)
      }))
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [entries]);

  // Tag cloud data - aggregate tags from both entry.tags and entry.aiAnalysis.tags
  const tagCloudData = useMemo(() => {
    const tagCounts = new Map<string, number>();

    entries.forEach(entry => {
      // Add tags from entry.tags
      entry.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });

      // Add tags from entry.aiAnalysis.tags
      entry.aiAnalysis?.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Convert to array and sort by frequency
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30); // Limit to top 30 tags
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
        <>
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
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
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

          {/* Tag Cloud Visualization */}
          {tagCloudData.length > 0 && (
            <div className="mt-8 pt-8 border-t border-stone-200">
              <div className="text-center mb-6">
                <SparklesIcon className="w-10 h-10 mx-auto text-rose-500" />
                <h3 className="mt-2 text-xl font-bold text-stone-800">Your Recurring Themes</h3>
                <p className="mt-1 text-sm text-stone-600">The topics and emotions that appear most often in your journal</p>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-3 py-6 px-4 bg-gradient-to-br from-rose-50 to-stone-50 rounded-lg border border-stone-200">
                {tagCloudData.map(({ tag, count }) => {
                  // Calculate font size based on frequency (min: 12px, max: 32px)
                  const maxCount = tagCloudData[0]?.count || 1;
                  const minCount = tagCloudData[tagCloudData.length - 1]?.count || 1;
                  const fontSize = 12 + ((count - minCount) / (maxCount - minCount || 1)) * 20;

                  // Calculate opacity for visual depth
                  const opacity = 0.6 + ((count - minCount) / (maxCount - minCount || 1)) * 0.4;

                  return (
                    <span
                      key={tag}
                      className="inline-block px-3 py-1.5 bg-white rounded-full border border-rose-200 text-rose-700 font-medium hover:bg-rose-100 hover:border-rose-300 transition-all cursor-default shadow-sm"
                      style={{
                        fontSize: `${fontSize}px`,
                        opacity: opacity,
                      }}
                      title={`Appears ${count} time${count > 1 ? 's' : ''}`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Premium Insights Teaser/Dashboard */}
          {entries.length >= 10 && (
            <div className="mt-8 pt-8 border-t border-stone-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-purple-900">Premium Insights</span>
                </div>
                <h3 className="text-xl font-bold text-stone-800">Advanced Pattern Recognition</h3>
                <p className="mt-1 text-sm text-stone-600">
                  {usage?.tier === 'premium'
                    ? 'Discover deep connections and patterns in your journaling journey'
                    : 'Unlock powerful AI-driven pattern analysis'}
                </p>
              </div>

              {usage?.tier === 'premium' ? (
                // Real Premium Features (placeholder for future implementation)
                <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-lg p-8 border border-purple-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-purple-900 mb-2">Emotional Patterns</h4>
                      <p className="text-sm text-stone-600">AI-detected correlations between your activities and mood states</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-600">Work mentions → Low energy</span>
                          <span className="font-semibold text-purple-600">78% correlation</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-600">Exercise → Positive mood</span>
                          <span className="font-semibold text-purple-600">85% correlation</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-purple-900 mb-2">Growth Indicators</h4>
                      <p className="text-sm text-stone-600">Track your personal development over time</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-600">Self-reflection depth</span>
                          <span className="font-semibold text-green-600">↑ 32%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-600">Emotional awareness</span>
                          <span className="font-semibold text-green-600">↑ 45%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-stone-500 mt-4">
                    Premium insights are generated from your complete journaling history
                  </p>
                </div>
              ) : (
                // Teaser for Pro/Free Users
                <div className="relative bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-lg p-8 border border-purple-200 overflow-hidden">
                  {/* Blur overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/40 flex items-center justify-center z-10">
                    <div className="text-center bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4">
                      <svg className="w-16 h-16 mx-auto text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <h4 className="text-2xl font-bold text-stone-900 mb-2">Unlock Advanced Insights</h4>
                      <p className="text-stone-600 mb-6">
                        Discover hidden patterns and correlations in your journal with AI-powered analysis
                      </p>
                      <ul className="text-left text-sm text-stone-700 mb-6 space-y-2">
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Emotional pattern correlations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Personal growth tracking</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Unlimited AI analysis calls</span>
                        </li>
                      </ul>
                      <button
                        onClick={() => navigate('/pricing')}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  </div>

                  {/* Blurred mockup content */}
                  <div className="filter blur-sm select-none pointer-events-none">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-purple-900 mb-2">Emotional Patterns</h4>
                        <p className="text-sm text-stone-600">AI-detected correlations</p>
                        <div className="mt-4 space-y-2">
                          <div className="h-4 bg-stone-200 rounded"></div>
                          <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-purple-900 mb-2">Growth Indicators</h4>
                        <p className="text-sm text-stone-600">Personal development tracking</p>
                        <div className="mt-4 space-y-2">
                          <div className="h-4 bg-stone-200 rounded"></div>
                          <div className="h-4 bg-stone-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(insights) as string) }}
          />
        </div>
      )}
    </div>
  );
};

export default InsightsView;
