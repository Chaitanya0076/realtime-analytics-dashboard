"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeIntervalSelector, TimeInterval } from './TimeIntervalSelector';

interface PageData {
  url: string;
  views: number;
  website: string;
}

interface TopPagesBarChartProps {
  data: PageData[];
  timeInterval: TimeInterval;
  onTimeIntervalChange: (interval: TimeInterval) => void;
  isLoading?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: PageData;
    value: number;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{payload[0].payload.url}</p>
        <p className="text-sm text-gray-600">Website: {payload[0].payload.website}</p>
        <p className="text-sm font-semibold text-blue-600 mt-1">
          {payload[0].value.toLocaleString()} views
        </p>
      </div>
    );
  }
  return null;
};

export function TopPagesBarChart({ data, timeInterval, onTimeIntervalChange, isLoading }: TopPagesBarChartProps) {
  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Top 10 Viewed Pages</h2>
          <TimeIntervalSelector selected={timeInterval} onChange={onTimeIntervalChange} />
        </div>
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Top 10 Viewed Pages</h2>
        <TimeIntervalSelector selected={timeInterval} onChange={onTimeIntervalChange} />
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No data available</p>
        </div>
      ) : (
        <div style={{ height: '320px' }} className="[&_svg]:outline-none [&_*]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="url"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
                tickFormatter={truncateUrl}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Page Views', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="views" fill="#3b82f6" radius={[8, 8, 0, 0]} className="focus:outline-none" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

