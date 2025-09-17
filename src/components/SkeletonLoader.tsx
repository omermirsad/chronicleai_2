// src/components/SkeletonLoader.tsx
import React, { FC } from 'react';

export const EntryCardSkeleton: FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-4 bg-stone-200 rounded w-32"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-stone-200 rounded-full"></div>
        <div className="h-8 w-16 bg-stone-200 rounded-full"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-stone-200 rounded"></div>
      <div className="h-4 bg-stone-200 rounded w-5/6"></div>
      <div className="h-4 bg-stone-200 rounded w-4/6"></div>
    </div>
    <div className="mt-6 pt-4 border-t border-stone-200">
      <div className="h-3 bg-stone-200 rounded w-20 mb-2"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-stone-200 rounded-full w-16"></div>
        <div className="h-6 bg-stone-200 rounded-full w-20"></div>
        <div className="h-6 bg-stone-200 rounded-full w-24"></div>
      </div>
    </div>
  </div>
);

export const FeedSkeleton: FC = () => (
  <div className="space-y-6">
    {[1, 2, 3].map(i => (
      <EntryCardSkeleton key={i} />
    ))}
  </div>
);

export const InsightsSkeleton: FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 animate-pulse">
    <div className="text-center mb-8">
      <div className="w-12 h-12 bg-stone-200 rounded-full mx-auto mb-4"></div>
      <div className="h-6 bg-stone-200 rounded w-48 mx-auto mb-2"></div>
      <div className="h-4 bg-stone-200 rounded w-64 mx-auto"></div>
    </div>
    <div className="space-y-4">
      <div className="h-64 bg-stone-200 rounded"></div>
      <div className="space-y-2">
        <div className="h-4 bg-stone-200 rounded"></div>
        <div className="h-4 bg-stone-200 rounded w-5/6"></div>
        <div className="h-4 bg-stone-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export const CalendarSkeleton: FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-8 w-20 bg-stone-200 rounded"></div>
      <div className="h-6 bg-stone-200 rounded w-32"></div>
      <div className="h-8 w-20 bg-stone-200 rounded"></div>
    </div>
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="h-20 bg-stone-100 rounded"></div>
      ))}
    </div>
  </div>
);

export const EditorSkeleton: FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 animate-pulse">
    <div className="h-6 bg-stone-200 rounded w-32 mb-4"></div>
    <div className="h-48 bg-stone-100 rounded mb-4"></div>
    <div className="flex justify-between">
      <div className="flex gap-2">
        <div className="h-10 w-10 bg-stone-200 rounded-full"></div>
        <div className="h-10 w-10 bg-stone-200 rounded-full"></div>
      </div>
      <div className="h-10 w-24 bg-rose-200 rounded"></div>
    </div>
  </div>
);
