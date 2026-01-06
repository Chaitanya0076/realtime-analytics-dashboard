"use client";

export type TimeInterval = '30mins' | '24hr' | '7days';

export interface Domain {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date | string; // Date from Prisma, string when serialized from server to client
}

export interface OverviewResponse {
  totalViews: number;
  domains: Array<{
    domain: string;
    views: number;
  }>;
}

export interface TopPagesResponse {
  pages: Array<{
    path: string;
    count: number;
  }>;
}

export interface TimeSeriesResponse {
  granularity: 'MINUTE' | 'HOUR';
  points: Array<{
    bucket: string;
    count: number;
  }>;
}

export interface KPIsResponse {
  totalViews: number;
  last30Min: number;
  last24Hours: number;
  last7Days: number;
}

// Convert backend range format to frontend interval format
export function rangeToInterval(range: string): TimeInterval {
  if (range === '30m') return '30mins';
  if (range === '24h') return '24hr';
  return '7days';
}

// Convert frontend interval format to backend range format
export function intervalToRange(interval: TimeInterval): string {
  if (interval === '30mins') return '30m';
  if (interval === '24hr') return '24h';
  return '7d'; // Backend uses '7d' for 7 days
}

// Fetch overview data (total views per domain)
export async function fetchOverview(): Promise<OverviewResponse> {
  const res = await fetch('/api/analytics/overview');
  if (!res.ok) {
    throw new Error('Failed to fetch overview');
  }
  return res.json();
}

// Fetch top pages for a domain
export async function fetchTopPages(domainId: string, range: string, limit: number = 10): Promise<TopPagesResponse> {
  const params = new URLSearchParams({
    domainId,
    range,
    limit: limit.toString(),
  });
  const res = await fetch(`/api/analytics/top-pages?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch top pages');
  }
  return res.json();
}

// Fetch time series data for a domain (optionally for a specific path)
export async function fetchTimeSeries(domainId: string, range: string, path?: string): Promise<TimeSeriesResponse> {
  const params = new URLSearchParams({
    domainId,
    range,
  });
  if (path !== undefined) {
    params.append('path', path);
  }
  const res = await fetch(`/api/analytics/timeseries?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch time series');
  }
  return res.json();
}

// Fetch KPIs for a domain
export async function fetchKPIs(domainId: string): Promise<KPIsResponse> {
  const params = new URLSearchParams({
    domainId,
  });
  const res = await fetch(`/api/analytics/kpis?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch KPIs');
  }
  return res.json();
}

// Fetch all domains
export async function fetchDomains(): Promise<{ domains: Domain[] }> {
  const res = await fetch('/api/domains');
  if (!res.ok) {
    throw new Error('Failed to fetch domains');
  }
  return res.json();
}

// Add a domain
export async function addDomain(name: string): Promise<{ domain: Domain }> {
  const res = await fetch('/api/domains', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add domain');
  }
  return res.json();
}

// Delete a domain
export async function deleteDomain(id: string): Promise<void> {
  const res = await fetch(`/api/domains/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete domain');
  }
}

// Toggle domain status
export async function toggleDomainStatus(id: string): Promise<{ domain: Domain }> {
  const res = await fetch(`/api/domains/${id}`, {
    method: 'PATCH',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to toggle domain status');
  }
  return res.json();
}

