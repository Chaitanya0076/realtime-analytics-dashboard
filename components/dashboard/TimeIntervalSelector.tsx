"use client";

import React from 'react';

export type TimeInterval = '30mins' | '24hr' | '7days';

interface TimeIntervalSelectorProps {
  selected: TimeInterval;
  onChange: (interval: TimeInterval) => void;
}

export function TimeIntervalSelector({ selected, onChange }: TimeIntervalSelectorProps) {
  const intervals: { value: TimeInterval; label: string }[] = [
    { value: '30mins', label: '30 mins' },
    { value: '24hr', label: '24 hours' },
    { value: '7days', label: '7 days' },
  ];

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 gap-1">
      {intervals.map((interval) => (
        <button
          key={interval.value}
          onClick={() => onChange(interval.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selected === interval.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {interval.label}
        </button>
      ))}
    </div>
  );
}

