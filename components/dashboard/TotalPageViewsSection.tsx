"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface WebsiteData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface TotalPageViewsSectionProps {
  data: WebsiteData[];
}

const websiteColors = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
];

export function TotalPageViewsSection({ data }: TotalPageViewsSectionProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Total Page Views</h2>
      
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        <div className="w-full lg:w-1/2 [&_svg]:outline-none [&_*]:outline-none" style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => percent ? `${(percent * 100).toFixed(1)}%` : ''}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number | undefined) => value !== undefined ? [`${value.toLocaleString()} views`, 'Page Views'] : ['', '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">Total Views</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{total.toLocaleString()}</p>
            </div>
            
            <div className="space-y-3">
              {data.map((website, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: website.color }}
                    />
                    <span className="text-gray-900 font-medium">{website.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-semibold">{website.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {total > 0 ? ((website.value / total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { websiteColors };

