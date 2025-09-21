// src/components/JournalEntryCard.tsx
import React, { useState, useEffect, FC } from 'react';
import { JournalEntry } from '../types';
import { SparklesIcon, TagIcon, ChatBubbleLeftRightIcon, LightBulbIcon, LightningBoltIcon, TrashIcon } from './Icons';
import { parseMarkdownSafely } from '../utils/security';
import toast from 'react-hot-toast';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onOpenPerspectiveLens: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
}

const JournalEntryCard: FC<JournalEntryCardProps> = ({ entry, onOpenPerspectiveLens, onDelete }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const TEXT_TRUNCATE_LENGTH = 400;
  const isTruncatable = entry.text && entry.text.length > TEXT_TRUNCATE_LENGTH;
  const displayText = isTruncatable && !isExpanded
    ? `${entry.text.substring(0, TEXT_TRUNCATE_LENGTH)}...`
    : entry.text;

  useEffect(() => {
    const mountTimer = setTimeout(() => setIsMounted(true), 10);
    return () => clearTimeout(mountTimer);
  }, []);

  useEffect(() => {
    if (entry.aiAnalysis) {
      const analysisTimer = setTimeout(() => setIsAnalysisVisible(true), 50);
      return () => clearTimeout(analysisTimer);
    }
  }, [entry.aiAnalysis]);

  const handleDelete = () => {
    if (!onDelete || isDeleting) return;
    
    toast((t) => (
      <div className="flex flex-col items-center gap-2">
        <p className="font-semibold">Are you sure you want to delete this entry?</p>
        <p className="text-sm text-stone-600">This action cannot be undone.</p>
        <div className="flex gap-4 mt-2">
          <button 
            onClick={async () => {
              setIsDeleting(true);
              toast.dismiss(t.id);
              try {
                await onDelete(entry.id);
                toast.success('Entry deleted successfully');
              } catch (error) {
                toast.error('Failed to delete entry');
                setIsDeleting(false);
              }
            }} 
            className="px-4 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition"
            disabled={isDeleting}
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-1 bg-stone-200 text-stone-700 rounded-md text-sm hover:bg-stone-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😠', '😟', '😐', '🙂', '😄'];
    return emojis[Math.min(Math.max(mood - 1, 0), 4)] || '😐';
  };

  const sentimentBorders: { [key: string]: string } = {
    'Positive': 'border-green-400',
    'Negative': 'border-red-400',
    'Mixed': 'border-yellow-400',
    'Neutral': 'border-stone-200'
  };
  
  const sentimentBorderClass = entry.aiAnalysis?.sentiment 
    ? sentimentBorders[entry.aiAnalysis.sentiment] || 'border-stone-200'
    : 'border-stone-200';

  return (
    <article 
      className={`bg-white p-6 rounded-lg shadow-sm border border-l-4 ${sentimentBorderClass} transition-all duration-300 ease-out ${
        isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } hover:shadow-md ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      aria-busy={isDeleting}
    >
      <header className="mb-4 pb-2 border-b border-stone-200 flex justify-between items-start">
        <time className="text-sm text-stone-500 pt-1" dateTime={entry.date}>
          {formatDate(entry.date)}
        </time>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            {entry.mood && (
              <span 
                className="text-2xl" 
                title={`Mood: ${entry.mood}/5`}
                role="img"
                aria-label={`Mood level ${entry.mood} out of 5`}
              >
                {getMoodEmoji(entry.mood)}
              </span>
            )}
            {typeof entry.energy === 'number' && (
              <div 
                className="flex items-center gap-1 text-sm text-stone-600 font-medium" 
                title={`Energy: ${entry.energy}%`}
              >
                <LightningBoltIcon className="w-4 h-4 text-amber-500" />
                <span>{entry.energy}%</span>
              </div>
            )}
          </div>
          {onDelete && (
            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="text-stone-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed" 
              aria-label="Delete entry"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
      
      {entry.photo?.url && (
        <div className="mb-4">
          <img 
            src={entry.photo.url}
            alt="Journal entry attachment" 
            className="max-h-64 w-auto rounded-md mx-auto object-contain"
            loading="lazy"
          />
        </div>
      )}
      
      {entry.text && (
        <>
          <div
            className="prose prose-stone max-w-none font-serif text-stone-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseMarkdownSafely(displayText || '') }}
          />
          {isTruncatable && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-sm font-medium text-rose-600 hover:text-rose-800 transition mt-2"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </>
      )}

      {entry.aiAnalysis ? (
        <footer 
          className={`mt-6 pt-4 border-t border-stone-200 space-y-4 transition-all duration-500 ease-out ${
            isAnalysisVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {entry.aiAnalysis.acknowledgement && (
            <div className="bg-rose-50 text-rose-800 p-3 rounded-md flex items-start gap-3">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mt-1 flex-shrink-0" />
              <p className="text-sm italic">{entry.aiAnalysis.acknowledgement}</p>
            </div>
          )}

          {entry.aiAnalysis.summary && entry.aiAnalysis.summary.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-stone-600 mb-2 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />Summary
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-stone-600">
                {entry.aiAnalysis.summary.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {entry.aiAnalysis.tags && entry.aiAnalysis.tags.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-stone-600 mb-2 flex items-center gap-2">
                <TagIcon className="w-4 h-4" />Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {entry.aiAnalysis.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-stone-200 text-stone-700 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {entry.aiAnalysis.socraticQuestion && (
            <div className="bg-amber-50 text-amber-900 p-4 rounded-md">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5" />A Question for Reflection
              </h4>
              <p className="text-sm italic">"{entry.aiAnalysis.socraticQuestion}"</p>
            </div>
          )}
          
          <div className="text-right pt-2">
            <button 
              onClick={() => onOpenPerspectiveLens(entry)} 
              className="text-sm font-medium text-rose-600 hover:text-rose-800 transition"
            >
              View with Perspective Lens →
            </button>
          </div>
        </footer>
      ) : (
        <div className="mt-6 pt-4 border-t border-stone-200 text-center text-sm text-stone-500 animate-pulse">
          <SparklesIcon className="w-5 h-5 mx-auto mb-2" />
          AI is reflecting on your entry...
        </div>
      )}
    </article>
  );
};

export default JournalEntryCard;
