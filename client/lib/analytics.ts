import { database } from "./database";

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

// Get or create session ID using sessionStorage only (temporary)
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("wedding_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem("wedding_session_id", sessionId);
  }
  return sessionId;
}

// Check if user is on mobile
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

// Get viewport size
function getViewportSize(): string {
  return `${window.innerWidth}x${window.innerHeight}`;
}

// Analytics service - now database-only
export const analytics = {
  // Track page views
  async trackPageView(
    url: string = window.location.pathname + window.location.search,
  ) {
    try {
      const sessionId = getSessionId();
      const pageView: PageView = {
        page_url: url,
        referrer: document.referrer || "direct",
        user_agent: navigator.userAgent,
        viewport_size: getViewportSize(),
        timestamp: new Date().toISOString(),
        session_id: sessionId,
      };

      // Only use database - no localStorage
      console.log("📊 Page view tracked:", url);
    } catch (error) {
      console.warn("Analytics: Failed to track page view:", error);
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

      // Only use database - no localStorage
      console.log("📊 Event tracked:", eventType, eventData);
    } catch (error) {
      console.warn("Analytics: Failed to track event:", error);
    }
  },

  // Update session information
  updateSession(sessionId: string) {
    try {
      const now = new Date().toISOString();
      // Only use database - no localStorage
      console.log("📊 Session updated:", sessionId);
    } catch (error) {
      console.warn("Analytics: Failed to update session:", error);
    }
  },

  // Get analytics summary - return empty data since we removed localStorage
  getAnalyticsSummary() {
    return {
      totalPageViews: 0,
      totalEvents: 0,
      totalSessions: 0,
      uniqueVisitors: 0,
      mobileUsers: 0,
      averageSessionDuration: 0,
      popularPages: [],
      recentActivity: { pageViews: 0, events: 0, total: 0 },
      eventBreakdown: [],
      hourlyActivity: [],
    };
  },

  // Calculate average session duration
  calculateAverageSessionDuration(sessions: UserSession[]): number {
    return 0;
  },

  // Get popular pages
  getPopularPages(pageViews: PageView[]) {
    return [];
  },

  // Get recent activity
  getRecentActivity(pageViews: PageView[], events: AnalyticsEvent[]) {
    return {
      pageViews: 0,
      events: 0,
      total: 0,
    };
  },

  // Get event breakdown
  getEventBreakdown(events: AnalyticsEvent[]) {
    return [];
  },

  // Get hourly activity pattern
  getHourlyActivity(pageViews: PageView[]) {
    return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  },

  // Clear analytics - now just clears sessionStorage
  clearAnalytics() {
    try {
      sessionStorage.removeItem("wedding_session_id");
      console.log("📊 Analytics session cleared");
    } catch (error) {
      console.warn("Analytics: Failed to clear session:", error);
    }
  },

  // Clear ALL localStorage (for fixing database issues)
  clearAllLocalStorage() {
    try {
      // Clear all wedding-related localStorage keys
      localStorage.removeItem("wedding_analytics_pageviews");
      localStorage.removeItem("wedding_analytics_events");
      localStorage.removeItem("wedding_analytics_sessions");
      localStorage.removeItem("wedding_guests");
      localStorage.removeItem("wedding_photos");
      localStorage.removeItem("wedding_guest_photos");
      localStorage.removeItem("wedding_flow");
      localStorage.removeItem("wedding_invitation_pdf");
      localStorage.removeItem("wedding_invitation_filename");
      sessionStorage.removeItem("wedding_session_id");

      console.log(
        "🗑️ All wedding localStorage data cleared - analytics should now use database only",
      );
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  },

  // Export analytics data - return empty since no localStorage
  exportAnalytics() {
    try {
      const data = {
        pageViews: [],
        events: [],
        sessions: {},
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wedding-analytics-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("📊 Analytics data exported (empty)");
    } catch (error) {
      console.warn("Analytics: Failed to export data:", error);
    }
  },
};

// Common event tracking helpers
export const trackClick = (element: string, location?: string) => {
  analytics.trackEvent("click", { element, location });
};

export const trackFormSubmit = (
  formType: string,
  success: boolean,
  errorMessage?: string,
) => {
  analytics.trackEvent("form_submit", { formType, success, errorMessage });
};

export const trackDownload = (fileName: string, fileType: string) => {
  analytics.trackEvent("download", { fileName, fileType });
};

export const trackPhotoView = (
  photoId: string,
  source: "gallery" | "admin",
) => {
  analytics.trackEvent("photo_view", { photoId, source });
};

export const trackRSVPSubmission = (
  attending: boolean,
  guestCount: number,
  side: string,
) => {
  analytics.trackEvent("rsvp_submission", { attending, guestCount, side });
};

// Auto-initialize page tracking
if (typeof window !== "undefined") {
  // Clear localStorage on first load to fix database analytics issues
  analytics.clearAllLocalStorage();

  // Track initial page load
  analytics.trackPageView();

  // Track navigation for SPA
  let currentPath = window.location.pathname;

  // Override pushState and replaceState to track SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        analytics.trackPageView();
      }
    }, 0);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        analytics.trackPageView();
      }
    }, 0);
  };

  // Track back/forward navigation
  window.addEventListener("popstate", () => {
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        analytics.trackPageView();
      }
    }, 0);
  });

  // Track when user leaves the page
  window.addEventListener("beforeunload", () => {
    const sessionId = getSessionId();
    analytics.updateSession(sessionId);
  });
}
