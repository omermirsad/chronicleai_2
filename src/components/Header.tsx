
// Fix: Import React types FC, useState, useRef, useEffect
import { FC, useState, useEffect, useCallback, useRef, useMemo, cloneElement, ChangeEvent, FormEvent, ReactNode } from 'react';
import { View, User } from '../types';
import { BookOpenIcon, PencilSquareIcon, SparklesIcon, CalendarDaysIcon, UserCircleIcon, HeartIcon } from './Icons';
import { StreakDisplay } from './StreakDisplay';
import { useSubscription } from '../hooks/useSubscription';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onThisDayNotification?: boolean;
  user: User;
  onSignOut: () => void;
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  onOpenUpgradeModal?: (reason: 'limit_reached' | 'premium_feature' | 'perspective_lens', featureName?: string) => void;
}

// Fix: Use FC type for functional component
const SyncIndicator: FC<{ status: HeaderProps['syncStatus'] }> = ({ status }) => {
    const statusMap = {
        idle: { text: 'Synced', color: 'text-green-600', icon: '✓', bgColor: 'bg-green-50' },
        syncing: { text: 'Syncing...', color: 'text-blue-600', icon: '↻', bgColor: 'bg-blue-50' },
        error: { text: 'Sync Error', color: 'text-red-600', icon: '⚠', bgColor: 'bg-red-50' },
        offline: { text: 'Offline', color: 'text-stone-500', icon: '○', bgColor: 'bg-stone-100' },
    };
    const { text, color, icon } = statusMap[status] || statusMap.idle;
    return (
        <div className="flex items-center gap-1.5">
            <span className={`text-sm ${status === 'syncing' ? 'animate-spin' : ''}`}>{icon}</span>
            <span className={`text-xs font-medium ${color}`}>{text}</span>
        </div>
    );
}

// Fix: Use FC type for functional component
const Header: FC<HeaderProps> = ({ currentView, setCurrentView, onThisDayNotification, user, onSignOut, syncStatus, onOpenUpgradeModal }) => {
  // Fix: Add generic type to useState
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { usage } = useSubscription();
  
  const navItems = [
    { id: 'feed', label: 'Journal', icon: <BookOpenIcon />, notification: onThisDayNotification },
    { id: 'editor', label: 'New Entry', icon: <PencilSquareIcon /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDaysIcon /> },
    { id: 'insights', label: 'Insights', icon: <SparklesIcon /> },
    { id: 'coaching', label: 'Coaching', icon: <HeartIcon /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-stone-100 border-b border-stone-200 sticky top-0 z-10">
      <nav className="max-w-3xl mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
           <BookOpenIcon className="w-8 h-8 text-rose-600"/>
           <h1 className="text-xl font-bold text-stone-800 tracking-tight hidden sm:block">Chronicle AI</h1>
        </div>
        <div className="flex-grow flex justify-center">
            <div className="flex items-center gap-1 sm:gap-2 bg-white p-1 rounded-full border border-stone-200 shadow-sm">
            {navItems.map((item) => (
                <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    currentView === item.id
                    ? 'bg-rose-500 text-white'
                    : 'text-stone-600 hover:bg-rose-100 hover:text-stone-900'
                }`}
                >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
                {item.notification && currentView !== item.id && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                )}
                </button>
            ))}
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
           {/* AI Call Counter - Only for Free Tier */}
           {usage?.tier === 'free' && (
             <button
               onClick={() => {
                 if (usage.aiCallsRemaining === 0) {
                   onOpenUpgradeModal?.('limit_reached');
                 }
               }}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                 usage.aiCallsRemaining === 0
                   ? 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer'
                   : usage.percentageUsed >= 80
                   ? 'bg-yellow-100 text-yellow-700'
                   : 'bg-indigo-100 text-indigo-700'
               }`}
               disabled={usage.aiCallsRemaining > 0}
             >
               <SparklesIcon className="w-4 h-4" />
               <span className="hidden sm:inline">AI Calls: </span>
               <span className="font-bold">{usage.aiCallsRemaining}/{usage.aiCallsLimit}</span>
             </button>
           )}

           {/* Persistent Sync Status Indicator */}
           <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200">
             <SyncIndicator status={syncStatus} />
           </div>

           <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
              className="p-1 rounded-full text-stone-600 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
                <span className="sr-only">Open user menu</span>
                <UserCircleIcon className="w-7 h-7" />
            </button>
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20 origin-top-right">
                    <div className="px-4 py-3 border-b border-stone-200">
                        <p className="text-sm text-stone-600">Signed in as</p>
                        <p className="font-medium text-stone-800 truncate">{user.email}</p>
                        <div className="mt-1">
                            <SyncIndicator status={syncStatus} />
                        </div>
                    </div>
                    <div className="px-4 py-3 border-b border-stone-200">
                        <StreakDisplay variant="compact" />
                    </div>
                    <div className="py-1">
                        <a
                            href="/achievements"
                            onClick={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new CustomEvent('navigate', { detail: '/achievements' }));
                                window.history.pushState({}, '', '/achievements');
                                setIsDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                        >
                            🏆 Achievements
                        </a>
                        <a
                            href="/settings"
                            onClick={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new CustomEvent('navigate', { detail: '/settings' }));
                                window.history.pushState({}, '', '/settings');
                                setIsDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                        >
                            Settings
                        </a>
                        <button
                            onClick={() => {
                                onSignOut();
                                setIsDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
