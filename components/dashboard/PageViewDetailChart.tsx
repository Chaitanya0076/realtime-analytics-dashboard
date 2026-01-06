"use client";

import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TimeInterval } from './TimeIntervalSelector';
import { Clock, TrendingUp, Users } from 'lucide-react';

interface TimeSeriesData {
  time: string;
  views: number;
}

interface PageViewDetailChartProps {
  pageUrl: string;
  websiteName: string;
  timeInterval: TimeInterval;
  data: TimeSeriesData[];
  totalViews: number;
  avgViewsPerInterval: number;
  peakTime: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TimeSeriesData;
    value: number;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{payload[0].payload.time}</p>
        <p className="text-sm font-semibold text-emerald-600 mt-1">
          {payload[0].value} views
        </p>
      </div>
    );
  }
  return null;
};

export function PageViewDetailChart({
  pageUrl,
  websiteName,
  timeInterval,
  data,
  totalViews,
  avgViewsPerInterval,
  peakTime,
}: PageViewDetailChartProps) {
  const getTimeLabel = () => {
    switch (timeInterval) {
      case '30mins':
        return 'Last 30 Minutes';
      case '24hr':
        return 'Last 24 Hours';
      case '7days':
        return 'Last 7 Days';
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page View Analytics</h2>
        <p className="text-gray-600">
          <span className="font-medium text-emerald-600">{pageUrl}</span> from{' '}
          <span className="font-medium text-blue-600">{websiteName}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">{getTimeLabel()}</p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-80 mb-6">
          <p className="text-gray-500">No time series data available</p>
        </div>
      ) : (
        <div style={{ height: '320px' }} className="mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Page Views', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorViews)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Views/Interval</p>
              <p className="text-xl font-bold text-gray-900">{avgViewsPerInterval.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Peak Time</p>
              <p className="text-xl font-bold text-gray-900">{peakTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

