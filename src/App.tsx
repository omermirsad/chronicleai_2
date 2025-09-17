// Fix: Import React types FC, useState, useMemo, lazy, Suspense, useEffect
import React, { useState, useMemo, lazy, Suspense, useEffect, FC } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Auth from './components/Auth';
import { useJournal } from './hooks/useJournal';
import { useAuth } from './hooks/useAuth';
import { JournalEntry, View } from './types';
import { FeedSkeleton } from './components/SkeletonLoader';
import ToastProvider from './components/ToastProvider';
import toast from 'react-hot-toast';

// Lazy load heavy components for better performance
const JournalEditor = lazy(() => import('./components/JournalEditor'));
const JournalFeed = lazy(() => import('./components/JournalFeed'));
const InsightsView = lazy(() => import('./components/InsightsView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const PerspectiveLensModal = lazy(() => import('./components/PerspectiveLensModal'));

// Fix: Use FC type for functional component
const App: FC = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { entries, addEntry, updateEntry, deleteEntry, loading: entriesLoading, syncStatus } = useJournal();
  // Fix: Add generic type to useState
  const [currentView, setCurrentView] = useState<View>('feed');
  // Fix: Add generic type to useState
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check for offline/online status
  useEffect(() => {
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

  const hasOnThisDayEntries = useMemo(() => {
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
        // Fix: Pass userId to InsightsView
        return <InsightsView entries={entries} userId={user!.id} />;
      case 'calendar':
        return (
            <CalendarView 
                entries={entries}
                onOpenPerspectiveLens={handleOpenPerspectiveLens}
                onDeleteEntry={deleteEntry}
            />
        );
      case 'feed':
      default:
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
          <Suspense fallback={<FeedSkeleton />}>
            {entriesLoading && entries.length === 0 ? (
              <FeedSkeleton />
            ) : (
              renderView()
            )}
          </Suspense>
        </main>
        
        {selectedEntry && (
          <Suspense fallback={<div />}>
            <PerspectiveLensModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              entry={selectedEntry}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
