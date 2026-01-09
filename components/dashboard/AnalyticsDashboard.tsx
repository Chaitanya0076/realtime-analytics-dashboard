"use client";

import { useState, useEffect } from 'react';
import { TotalPageViewsSection, websiteColors } from './TotalPageViewsSection';
import { TopPagesBarChart } from './TopPagesBarChart';
import { WebsiteSpecificBarChart } from './WebsiteSpecificBarChart';
import { PageViewDetailChart } from './PageViewDetailChart';
import { DomainsTable } from './DomainsTable';
import { TimeInterval as TimeIntervalType } from './TimeIntervalSelector';
import { BarChart3, Globe } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { WelcomeBanner } from './WelcomeBanner';
import {
  fetchOverview,
  fetchTopPages,
  fetchTimeSeries,
  addDomain,
  deleteDomain,
  toggleDomainStatus,
  intervalToRange,
  type Domain,
} from '@/lib/analyticsClient';

interface PageData {
  url: string;
  views: number;
  website: string;
}

interface WebsitePageData {
  url: string;
  views: number;
}

interface AnalyticsDashboardProps {
  initialDomains: Domain[];
  userEmail?: string | null;
  userName?: string | null;
  userImage?: string | null;
}

export function AnalyticsDashboard({ initialDomains, userEmail, userName, userImage }: AnalyticsDashboardProps) {
  const [topPagesInterval, setTopPagesInterval] = useState<TimeIntervalType>('30mins');
  const [websiteInterval, setWebsiteInterval] = useState<TimeIntervalType>('30mins');
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<{ url: string; views: number } | null>(null);
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  
  // Data states
  const [overviewData, setOverviewData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topPagesData, setTopPagesData] = useState<PageData[]>([]);
  const [websitePagesData, setWebsitePagesData] = useState<WebsitePageData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<Array<{ time: string; views: number }>>([]);
  
  // Loading states
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingTopPages, setIsLoadingTopPages] = useState(false);
  const [isLoadingWebsitePages, setIsLoadingWebsitePages] = useState(false);

  // Set initial selected domain
  useEffect(() => {
    if (domains.length > 0 && !selectedDomainId) {
      const activeDomain = domains.find(d => d.isActive) || domains[0];
      setSelectedDomainId(activeDomain.id);
    }
  }, [domains, selectedDomainId]);

  // Fetch overview data
  useEffect(() => {
    async function loadOverview() {
      try {
        setIsLoadingOverview(true);
        const data = await fetchOverview();
        const colors = websiteColors;
        const formatted = data.domains.map((d, index) => ({
          name: d.domain,
          value: d.views,
          color: colors[index % colors.length],
        }));
        setOverviewData(formatted);
      } catch (error) {
        console.error('Failed to load overview:', error);
      } finally {
        setIsLoadingOverview(false);
      }
    }
    loadOverview();
  }, [domains]);

  // Fetch top pages (aggregated across all domains)
  useEffect(() => {
    async function loadTopPages() {
      if (domains.length === 0) {
        setTopPagesData([]);
        return;
      }

      try {
        setIsLoadingTopPages(true);
        const range = intervalToRange(topPagesInterval);
        const allPages: PageData[] = [];

        // Fetch top pages for each active domain
        for (const domain of domains.filter(d => d.isActive)) {
          try {
            const data = await fetchTopPages(domain.id, range, 10);
            const pages: PageData[] = data.pages.map(p => ({
              url: p.path || '/',
              views: p.count,
              website: domain.name,
            }));
            allPages.push(...pages);
          } catch (error) {
            console.error(`Failed to load top pages for ${domain.name}:`, error);
          }
        }

        // Sort and take top 10
        allPages.sort((a, b) => b.views - a.views);
        setTopPagesData(allPages.slice(0, 10));
      } catch (error) {
        console.error('Failed to load top pages:', error);
      } finally {
        setIsLoadingTopPages(false);
      }
    }
    loadTopPages();
  }, [topPagesInterval, domains]);

  // Fetch website-specific pages
  useEffect(() => {
    async function loadWebsitePages() {
      if (!selectedDomainId) {
        setWebsitePagesData([]);
        return;
      }

      try {
        setIsLoadingWebsitePages(true);
        const range = intervalToRange(websiteInterval);
        const data = await fetchTopPages(selectedDomainId, range, 20);
        const pages: WebsitePageData[] = data.pages.map(p => ({
          url: p.path || '/',
          views: p.count,
        }));
        setWebsitePagesData(pages);
      } catch (error) {
        console.error('Failed to load website pages:', error);
        setWebsitePagesData([]);
      } finally {
        setIsLoadingWebsitePages(false);
      }
    }
    loadWebsitePages();
  }, [selectedDomainId, websiteInterval, domains]);

  // Fetch time series data for selected page
  useEffect(() => {
    async function loadTimeSeries() {
      if (!selectedDomainId || !selectedPage) {
        setTimeSeriesData([]);
        return;
      }

      try {
        const range = intervalToRange(websiteInterval);
        // Use the path directly (it should already be in the format like "/home" or "/products")
        const pagePath = selectedPage.url.startsWith('/') ? selectedPage.url : `/${selectedPage.url}`;
        
        const data = await fetchTimeSeries(selectedDomainId, range, pagePath);
        
        // Format time series data
        const formatted = data.points.map((point) => {
          const date = new Date(point.bucket);
          let timeLabel = '';
          
          if (websiteInterval === '30mins') {
            const minutes = date.getMinutes();
            timeLabel = `${date.getHours()}:${minutes.toString().padStart(2, '0')}`;
          } else if (websiteInterval === '24hr') {
            timeLabel = `${date.getHours()}:00`;
          } else {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            timeLabel = `${dayNames[date.getDay()]} ${date.getDate()}`;
          }
          
          return {
            time: timeLabel,
            views: point.count,
          };
        });
        
        setTimeSeriesData(formatted);
      } catch (error) {
        console.error('Failed to load time series:', error);
        setTimeSeriesData([]);
      }
    }
    loadTimeSeries();
  }, [selectedDomainId, selectedPage, websiteInterval]);

  const handleAddDomain = async (domainName: string) => {
    try {
      const result = await addDomain(domainName);
      setDomains(prev => [result.domain, ...prev]);
      if (!selectedDomainId) {
        setSelectedDomainId(result.domain.id);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      await deleteDomain(id);
      setDomains(prev => prev.filter(d => d.id !== id));
      if (selectedDomainId === id) {
        const remaining = domains.filter(d => d.id !== id);
        setSelectedDomainId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const result = await toggleDomainStatus(id);
      setDomains(prev => prev.map(d => d.id === id ? result.domain : d));
    } catch (error) {
      throw error;
    }
  };

  const handlePageClick = (page: WebsitePageData) => {
    setSelectedPage(page);
    setTimeout(() => {
      document.getElementById('page-detail-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const selectedDomain = domains.find(d => d.id === selectedDomainId);
  const websiteNames = domains.filter(d => d.isActive).map(d => d.name);
  const activeDomainsCount = domains.filter(d => d.isActive).length;

  // Calculate metrics for selected page
  const peakTime = timeSeriesData.length > 0
    ? timeSeriesData.reduce((max, curr) => (curr.views > max.views ? curr : max)).time
    : 'N/A';

  const avgViews = timeSeriesData.length > 0
    ? timeSeriesData.reduce((sum, curr) => sum + curr.views, 0) / timeSeriesData.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">Track your website performance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <Globe className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {activeDomainsCount} / 5 Active Domains
                </span>
              </div>
              <UserAvatar email={userEmail} name={userName} image={userImage} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Banner for New Users */}
          {domains.length === 0 && (
            <WelcomeBanner />
          )}

          {/* Total Page Views Section */}
          {!isLoadingOverview && domains.length > 0 && (
            <TotalPageViewsSection data={overviewData} />
          )}

          {/* Top 10 Viewed Pages */}
          {domains.length > 0 && (
            <TopPagesBarChart
              data={topPagesData}
              timeInterval={topPagesInterval}
              onTimeIntervalChange={setTopPagesInterval}
              isLoading={isLoadingTopPages}
            />
          )}

          {/* Website Specific Bar Chart */}
          {selectedDomain && domains.length > 0 && (
            <WebsiteSpecificBarChart
              websiteName={selectedDomain.name}
              websites={websiteNames}
              data={websitePagesData}
              timeInterval={websiteInterval}
              onTimeIntervalChange={setWebsiteInterval}
              onWebsiteChange={(name) => {
                const domain = domains.find(d => d.name === name);
                if (domain) {
                  setSelectedDomainId(domain.id);
                  setSelectedPage(null); // Reset selected page when switching domains
                }
              }}
              onPageClick={handlePageClick}
              isLoading={isLoadingWebsitePages}
            />
          )}

          {/* Page View Detail Chart - Only shown when a page is clicked */}
          {selectedPage && selectedDomain && (
            <div id="page-detail-section">
              <PageViewDetailChart
                pageUrl={selectedPage.url}
                websiteName={selectedDomain.name}
                timeInterval={websiteInterval}
                data={timeSeriesData}
                totalViews={selectedPage.views}
                avgViewsPerInterval={avgViews}
                peakTime={peakTime}
              />
            </div>
          )}

          {/* Domains Table */}
          <DomainsTable
            domains={domains}
            onAddDomain={handleAddDomain}
            onDeleteDomain={handleDeleteDomain}
            onToggleStatus={handleToggleStatus}
            maxDomains={5}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2026 Analytics Dashboard. Real-time analytics for your websites.
          </p>
        </div>
      </footer>
    </div>
  );
}

