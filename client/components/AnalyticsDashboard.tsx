import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  MousePointer, 
  Clock, 
  Smartphone, 
  Download, 
  Eye,
  Activity,
  Calendar,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { analytics } from '@/lib/analytics';

interface AnalyticsData {
  totalPageViews: number;
  totalEvents: number;
  totalSessions: number;
  uniqueVisitors: number;
  mobileUsers: number;
  averageSessionDuration: number;
  popularPages: Array<{ page: string; count: number }>;
  recentActivity: { pageViews: number; events: number; total: number };
  eventBreakdown: Array<{ event: string; count: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = () => {
    setIsLoading(true);
    try {
      const data = analytics.getAnalyticsSummary();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPageDisplayName = (path: string): string => {
    const pages: Record<string, string> = {
      '/': 'Home Page',
      '/admin': 'Admin Dashboard',
      '/login': 'Login Page',
      '/guest-upload': 'Guest Photo Upload',
      '/supabase-setup': 'Database Setup'
    };
    return pages[path] || path;
  };

  const getPeakHour = (hourlyData: Array<{ hour: number; count: number }>) => {
    if (!hourlyData.length) return null;
    const peak = hourlyData.reduce((max, current) => 
      current.count > max.count ? current : max
    );
    return peak;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin text-olive-600" size={32} />
        <span className="ml-3 text-olive-700">Loading analytics...</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8">
        <BarChart3 className="mx-auto mb-4 text-sage-400" size={48} />
        <p className="text-sage-600">No analytics data available yet.</p>
        <p className="text-sm text-sage-500 mt-2">
          Data will appear once visitors start using the website.
        </p>
      </div>
    );
  }

  const peakHour = getPeakHour(analyticsData.hourlyActivity);
  const mobilePercentage = analyticsData.totalSessions > 0 
    ? Math.round((analyticsData.mobileUsers / analyticsData.totalSessions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-olive-700 mb-2">
            Website Analytics
          </h2>
          <p className="text-sage-600">
            Track visitor engagement and website performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadAnalytics}
            variant="outline"
            size="sm"
            className="border-sage-300 text-sage-600 hover:bg-sage-50"
          >
            <RefreshCw className="mr-2 w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={analytics.exportAnalytics}
            variant="outline"
            size="sm"
            className="border-olive-300 text-olive-600 hover:bg-olive-50"
          >
            <Download className="mr-2 w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
          <CardContent className="p-4 text-center">
            <Eye className="mx-auto mb-2 text-blue-600" size={24} />
            <p className="text-2xl font-bold text-blue-700">
              {analyticsData.totalPageViews}
            </p>
            <p className="text-sm text-sage-600">Page Views</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
          <CardContent className="p-4 text-center">
            <Users className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-2xl font-bold text-green-700">
              {analyticsData.uniqueVisitors}
            </p>
            <p className="text-sm text-sage-600">Unique Visitors</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
          <CardContent className="p-4 text-center">
            <MousePointer className="mx-auto mb-2 text-purple-600" size={24} />
            <p className="text-2xl font-bold text-purple-700">
              {analyticsData.totalEvents}
            </p>
            <p className="text-sm text-sage-600">User Actions</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-2 text-orange-600" size={24} />
            <p className="text-2xl font-bold text-orange-700">
              {formatDuration(analyticsData.averageSessionDuration)}
            </p>
            <p className="text-sm text-sage-600">Avg Session</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Device Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
          <CardHeader>
            <CardTitle className="text-olive-700 flex items-center">
              <Activity className="mr-2" size={20} />
              Recent Activity (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sage-600">Page Views</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {analyticsData.recentActivity.pageViews}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sage-600">User Actions</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {analyticsData.recentActivity.events}
                </Badge>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span className="text-olive-700">Total Activity</span>
                <Badge className="bg-olive-600 text-white">
                  {analyticsData.recentActivity.total}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
          <CardHeader>
            <CardTitle className="text-olive-700 flex items-center">
              <Smartphone className="mr-2" size={20} />
              Device Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sage-600">Mobile Users</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{mobilePercentage}%</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {analyticsData.mobileUsers}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sage-600">Desktop Users</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{100 - mobilePercentage}%</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {analyticsData.totalSessions - analyticsData.mobileUsers}
                  </Badge>
                </div>
              </div>
              {peakHour && (
                <div className="flex justify-between items-center">
                  <span className="text-sage-600">Peak Hour</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {peakHour.hour}:00 ({peakHour.count} views)
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Pages */}
      <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
        <CardHeader>
          <CardTitle className="text-olive-700 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Popular Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.popularPages.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.popularPages.slice(0, 5).map((page, index) => (
                <div key={page.page} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sage-700 font-medium">
                      {getPageDisplayName(page.page)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-sage-100 text-sage-800">
                    {page.count} views
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sage-500 text-center py-4">No page data available yet</p>
          )}
        </CardContent>
      </Card>

      {/* User Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
        <CardHeader>
          <CardTitle className="text-olive-700 flex items-center">
            <MousePointer className="mr-2" size={20} />
            User Actions Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.eventBreakdown.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {analyticsData.eventBreakdown.map((event) => (
                <div key={event.event} className="flex justify-between items-center p-3 bg-sage-50 rounded-lg">
                  <span className="text-sage-700 font-medium capitalize">
                    {event.event.replace(/_/g, ' ')}
                  </span>
                  <Badge variant="secondary" className="bg-olive-100 text-olive-800">
                    {event.count}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sage-500 text-center py-4">No user actions tracked yet</p>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
        <CardHeader>
          <CardTitle className="text-olive-700">Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={analytics.exportAnalytics}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Download className="mr-2 w-4 h-4" />
              Export Analytics Data
            </Button>
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
                  analytics.clearAnalytics();
                  loadAnalytics();
                }
              }}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Clear All Data
            </Button>
          </div>
          <p className="text-sm text-sage-500 mt-3">
            Analytics data is stored locally and will persist across browser sessions.
            Export data regularly for backup and reporting purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
