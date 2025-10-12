
// src/App.tsx
// Fix: Import React types like FC, useState, useMemo, lazy, Suspense, useEffect
import * as React from 'react';
import toast from 'react-hot-toast';
import ErrorBoundary from './src/components/ErrorBoundary';
import Header from './src/components/Header';
import Auth from './src/components/Auth';
import { useJournal } from './src/hooks/useJournal';
import { useAuth } from './src/hooks/useAuth';
import { JournalEntry, View } from './src/types';
import { FeedSkeleton } from './src/components/SkeletonLoader';
import ToastProvider from './src/components/ToastProvider';

// Lazy load heavy components for better performance
const JournalEditor = React.lazy(() => import('./src/components/JournalEditor'));
const JournalFeed = React.lazy(() => import('./src/components/JournalFeed'));
const InsightsView = React.lazy(() => import('./src/components/InsightsView'));
const CalendarView = React.lazy(() => import('./src/components/CalendarView'));
const PerspectiveLensModal = React.lazy(() => import('./src/components/PerspectiveLensModal'));

// Fix: Use FC type for functional component
const App: React.FC = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  // Fix: useJournal now returns deleteEntry, loading, and syncStatus
  const { entries, addEntry, updateEntry, deleteEntry, loading: entriesLoading, syncStatus } = useJournal();
  // Fix: Add generic type to useState
  const [currentView, setCurrentView] = React.useState<View>('feed');
  // Fix: Add generic type to useState
  const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Check for offline/online status
  React.useEffect(() => {
    const handleOnline = () => toast.success('Back online! Syncing your entries...');
    const handleOffline = () => toast.error('You are offline. Changes will sync when connection returns.');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleOpenPerspectiveLens = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const hasOnThisDayEntries = React.useMemo(() => {
    const today = new Date();
    return entries.some(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getDate() === today.getDate() &&
        entryDate.getFullYear() < today.getFullYear()
      );
    });
  }, [entries]);

  const renderView = () => {
    switch (currentView) {
      case 'editor':
        return (
          <JournalEditor 
            addEntry={addEntry} 
            updateEntry={updateEntry} 
            setCurrentView={setCurrentView}
          />
        );
      case 'insights':
        return <InsightsView entries={entries} userId={user!.id} />;
      case 'calendar':
        // Fix: Pass onDeleteEntry to CalendarView
        return (
          <CalendarView
            entries={entries}
            onOpenPerspectiveLens={handleOpenPerspectiveLens}
            onDeleteEntry={deleteEntry}
          />
        );
      case 'feed':
      default:
        // Fix: Pass onDeleteEntry to JournalFeed
        return (
          <JournalFeed
            entries={entries}
            onOpenPerspectiveLens={handleOpenPerspectiveLens}
            onDeleteEntry={deleteEntry}
          />
        );
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">Loading Chronicle AI...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return (
      <ErrorBoundary>
        <Auth />
        <ToastProvider />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-rose-50 text-stone-900">
        <ToastProvider />
        
        <Header 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          onThisDayNotification={hasOnThisDayEntries}
          user={user}
          onSignOut={handleSignOut}
          syncStatus={syncStatus}
        />
        
        <main className="max-w-3xl mx-auto p-4 sm:p-6">
          <React.Suspense fallback={<FeedSkeleton />}>
            {entriesLoading && entries.length === 0 ? (
              <FeedSkeleton />
            ) : (
              renderView()
            )}
          </React.Suspense>
        </main>
        
        {selectedEntry && (
          <React.Suspense fallback={<div />}>
            <PerspectiveLensModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              entry={selectedEntry}
            />
          </React.Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
