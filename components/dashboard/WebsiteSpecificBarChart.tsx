"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeIntervalSelector, TimeInterval } from './TimeIntervalSelector';
import { ChevronDown } from 'lucide-react';

interface PageData {
  url: string;
  views: number;
}

interface WebsiteSpecificBarChartProps {
  websiteName: string;
  websites: string[];
  data: PageData[];
  timeInterval: TimeInterval;
  onTimeIntervalChange: (interval: TimeInterval) => void;
  onWebsiteChange: (website: string) => void;
  onPageClick: (page: PageData) => void;
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
        <p className="text-sm font-semibold text-purple-600 mt-1">
          {payload[0].value.toLocaleString()} views
        </p>
        <p className="text-xs text-gray-500 mt-1">Click to view details</p>
      </div>
    );
  }
  return null;
};

export function WebsiteSpecificBarChart({
  websiteName,
  websites,
  data,
  timeInterval,
  onTimeIntervalChange,
  onWebsiteChange,
  onPageClick,
  isLoading,
}: WebsiteSpecificBarChartProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const truncateUrl = (url: string, maxLength: number = 25) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <h2 className="text-2xl font-semibold text-gray-900">Website Page Views</h2>
          </div>
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <h2 className="text-2xl font-semibold text-gray-900">Website Page Views</h2>
          
          {websites.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{websiteName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {websites.map((website) => (
                      <button
                        key={website}
                        onClick={() => {
                          onWebsiteChange(website);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          website === websiteName ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {website}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <TimeIntervalSelector selected={timeInterval} onChange={onTimeIntervalChange} />
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No data available for this website</p>
        </div>
      ) : (
        <>
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
                <Bar 
                  dataKey="views" 
                  fill="#8b5cf6" 
                  radius={[8, 8, 0, 0]} 
                  cursor="pointer"
                  className="hover:opacity-80 transition-opacity focus:outline-none"
                  onClick={(event) => {
                    if (event && 'payload' in event && event.payload) {
                      onPageClick(event.payload as PageData);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-gray-500 text-center mt-2">
            Click on any bar to view detailed analytics for that page
          </p>
        </>
      )}
    </div>
  );
}

