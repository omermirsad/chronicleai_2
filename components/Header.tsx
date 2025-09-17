// Fix: Import React types FC, useState, useRef, useEffect
import React, { useState, useRef, useEffect, FC } from 'react';
import { View, User } from '../types';
import { BookOpenIcon, PencilSquareIcon, SparklesIcon, CalendarDaysIcon, UserCircleIcon } from './Icons';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onThisDayNotification?: boolean;
  user: User;
  onSignOut: () => void;
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
}

const SyncIndicator: React.FC<{ status: HeaderProps['syncStatus'] }> = ({ status }) => {
    const statusMap = {
        idle: { text: 'Synced', color: 'text-green-600' },
        syncing: { text: 'Syncing...', color: 'text-blue-600' },
        error: { text: 'Sync Error', color: 'text-red-600' },
        offline: { text: 'Offline', color: 'text-stone-500' },
    };
    const { text, color } = statusMap[status] || statusMap.idle;
    return <span className={`text-xs font-medium ${color}`}>{text}</span>;
}


// Fix: Use FC type for functional component
const Header: FC<HeaderProps> = ({ currentView, setCurrentView, onThisDayNotification, user, onSignOut, syncStatus }) => {
  // Fix: Add generic type to useState
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const navItems = [
    { id: 'feed', label: 'Journal', icon: <BookOpenIcon />, notification: onThisDayNotification },
    { id: 'editor', label: 'New Entry', icon: <PencilSquareIcon /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDaysIcon /> },
    { id: 'insights', label: 'Insights', icon: <SparklesIcon /> },
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
           <h1 className="text-xl font-bold text-stone-800 tracking-tight">Chronicle AI</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20 origin-top-right">
                    <div className="px-4 py-3 border-b border-stone-200">
                        <p className="text-sm text-stone-600">Signed in as</p>
                        <p className="font-medium text-stone-800 truncate">{user.email}</p>
                         <div className="mt-1">
                            <SyncIndicator status={syncStatus} />
                        </div>
                    </div>
                    <div className="py-1">
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
