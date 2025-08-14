import { database } from './database';

// Types for analytics
export interface AnalyticsEvent {
  id?: string;
  event_type: string;
  event_data: Record<string, any>;
  page_url: string;
  user_agent: string;
  timestamp: string;
  session_id: string;
}

export interface PageView {
  id?: string;
  page_url: string;
  referrer: string;
  user_agent: string;
  viewport_size: string;
  timestamp: string;
  session_id: string;
}

export interface UserSession {
  session_id: string;
  start_time: string;
  end_time?: string;
  page_views: number;
  events: number;
  user_agent: string;
  is_mobile: boolean;
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('wedding_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('wedding_session_id', sessionId);
  }
  return sessionId;
}

// Check if user is on mobile
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get viewport size
function getViewportSize(): string {
  return `${window.innerWidth}x${window.innerHeight}`;
}

// Analytics service
export const analytics = {
  // Track page views
  async trackPageView(url: string = window.location.pathname + window.location.search) {
    try {
      const sessionId = getSessionId();
      const pageView: PageView = {
        page_url: url,
        referrer: document.referrer || 'direct',
        user_agent: navigator.userAgent,
        viewport_size: getViewportSize(),
        timestamp: new Date().toISOString(),
        session_id: sessionId,
      };

      // Save to localStorage for now (can be extended to Supabase later)
      const existingViews = JSON.parse(localStorage.getItem('wedding_analytics_pageviews') || '[]');
      existingViews.push(pageView);
      localStorage.setItem('wedding_analytics_pageviews', JSON.stringify(existingViews));

      // Update session info
      this.updateSession(sessionId);

      console.log('📊 Page view tracked:', url);
    } catch (error) {
      console.warn('Analytics: Failed to track page view:', error);
    }
  },

  // Track custom events
  async trackEvent(eventType: string, eventData: Record<string, any> = {}) {
    try {
      const sessionId = getSessionId();
      const event: AnalyticsEvent = {
        event_type: eventType,
        event_data: eventData,
        page_url: window.location.pathname + window.location.search,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
      };

      // Save to localStorage
      const existingEvents = JSON.parse(localStorage.getItem('wedding_analytics_events') || '[]');
      existingEvents.push(event);
      localStorage.setItem('wedding_analytics_events', JSON.stringify(existingEvents));

      // Update session info
      this.updateSession(sessionId);

      console.log('📊 Event tracked:', eventType, eventData);
    } catch (error) {
      console.warn('Analytics: Failed to track event:', error);
    }
  },

  // Update session information
  updateSession(sessionId: string) {
    try {
      const sessions = JSON.parse(localStorage.getItem('wedding_analytics_sessions') || '{}');
      const now = new Date().toISOString();

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          session_id: sessionId,
          start_time: now,
          page_views: 0,
          events: 0,
          user_agent: navigator.userAgent,
          is_mobile: isMobileDevice(),
        };
      }

      sessions[sessionId].end_time = now;
      sessions[sessionId].page_views = (sessions[sessionId].page_views || 0) + 1;

      localStorage.setItem('wedding_analytics_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.warn('Analytics: Failed to update session:', error);
    }
  },

  // Get analytics summary
  getAnalyticsSummary() {
    try {
      const pageViews = JSON.parse(localStorage.getItem('wedding_analytics_pageviews') || '[]');
      const events = JSON.parse(localStorage.getItem('wedding_analytics_events') || '[]');
      const sessions = JSON.parse(localStorage.getItem('wedding_analytics_sessions') || '{}');

      const sessionArray = Object.values(sessions) as UserSession[];

      // Calculate statistics
      const stats = {
        totalPageViews: pageViews.length,
        totalEvents: events.length,
        totalSessions: sessionArray.length,
        uniqueVisitors: new Set(pageViews.map((pv: PageView) => pv.session_id)).size,
        mobileUsers: sessionArray.filter(s => s.is_mobile).length,
        averageSessionDuration: this.calculateAverageSessionDuration(sessionArray),
        popularPages: this.getPopularPages(pageViews),
        recentActivity: this.getRecentActivity(pageViews, events),
        eventBreakdown: this.getEventBreakdown(events),
        hourlyActivity: this.getHourlyActivity(pageViews),
      };

      return stats;
    } catch (error) {
      console.warn('Analytics: Failed to get summary:', error);
      return null;
    }
  },

  // Calculate average session duration
  calculateAverageSessionDuration(sessions: UserSession[]): number {
    if (sessions.length === 0) return 0;

    const validSessions = sessions.filter(s => s.start_time && s.end_time);
    if (validSessions.length === 0) return 0;

    const totalDuration = validSessions.reduce((sum, session) => {
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time!).getTime();
      return sum + (end - start);
    }, 0);

    return Math.round(totalDuration / validSessions.length / 1000); // seconds
  },

  // Get popular pages
  getPopularPages(pageViews: PageView[]) {
    const pageCounts: Record<string, number> = {};
    pageViews.forEach(pv => {
      pageCounts[pv.page_url] = (pageCounts[pv.page_url] || 0) + 1;
    });

    return Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));
  },

  // Get recent activity (last 24 hours)
  getRecentActivity(pageViews: PageView[], events: AnalyticsEvent[]) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentPageViews = pageViews.filter(pv => 
      new Date(pv.timestamp) > last24Hours
    ).length;

    const recentEvents = events.filter(e => 
      new Date(e.timestamp) > last24Hours
    ).length;

    return {
      pageViews: recentPageViews,
      events: recentEvents,
      total: recentPageViews + recentEvents,
    };
  },

  // Get event breakdown
  getEventBreakdown(events: AnalyticsEvent[]) {
    const eventCounts: Record<string, number> = {};
    events.forEach(e => {
      eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([event, count]) => ({ event, count }));
  },

  // Get hourly activity pattern
  getHourlyActivity(pageViews: PageView[]) {
    const hourlyData: Record<number, number> = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    pageViews.forEach(pv => {
      const hour = new Date(pv.timestamp).getHours();
      hourlyData[hour]++;
    });

    return Object.entries(hourlyData).map(([hour, count]) => ({
      hour: parseInt(hour),
      count
    }));
  },

  // Clear all analytics data
  clearAnalytics() {
    try {
      localStorage.removeItem('wedding_analytics_pageviews');
      localStorage.removeItem('wedding_analytics_events');
      localStorage.removeItem('wedding_analytics_sessions');
      sessionStorage.removeItem('wedding_session_id');
      console.log('📊 Analytics data cleared');
    } catch (error) {
      console.warn('Analytics: Failed to clear data:', error);
    }
  },

  // Export analytics data
  exportAnalytics() {
    try {
      const data = {
        pageViews: JSON.parse(localStorage.getItem('wedding_analytics_pageviews') || '[]'),
        events: JSON.parse(localStorage.getItem('wedding_analytics_events') || '[]'),
        sessions: JSON.parse(localStorage.getItem('wedding_analytics_sessions') || '{}'),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wedding-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('📊 Analytics data exported');
    } catch (error) {
      console.warn('Analytics: Failed to export data:', error);
    }
  },
};

// Common event tracking helpers
export const trackClick = (element: string, location?: string) => {
  analytics.trackEvent('click', { element, location });
};

export const trackFormSubmit = (formType: string, success: boolean, errorMessage?: string) => {
  analytics.trackEvent('form_submit', { formType, success, errorMessage });
};

export const trackDownload = (fileName: string, fileType: string) => {
  analytics.trackEvent('download', { fileName, fileType });
};

export const trackPhotoView = (photoId: string, source: 'gallery' | 'admin') => {
  analytics.trackEvent('photo_view', { photoId, source });
};

export const trackRSVPSubmission = (attending: boolean, guestCount: number, side: string) => {
  analytics.trackEvent('rsvp_submission', { attending, guestCount, side });
};

// Auto-initialize page tracking
if (typeof window !== 'undefined') {
  // Track initial page load
  analytics.trackPageView();

  // Track navigation for SPA
  let currentPath = window.location.pathname;
  
  // Override pushState and replaceState to track SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        analytics.trackPageView();
      }
    }, 0);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        analytics.trackPageView();
      }
    }, 0);
  };

  // Track back/forward navigation
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        analytics.trackPageView();
      }
    }, 0);
  });

  // Track when user leaves the page
  window.addEventListener('beforeunload', () => {
    const sessionId = getSessionId();
    analytics.updateSession(sessionId);
  });
}
