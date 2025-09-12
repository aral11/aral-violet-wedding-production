import { database } from "./database";
import { supabase } from "./supabase";

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

// Keys for localStorage
const PV_KEY = "wedding_analytics_pageviews";
const EV_KEY = "wedding_analytics_events";
const SS_KEY = "wedding_analytics_sessions";
const VISITOR_KEY = "wedding_visitor_id";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Supabase config check
const isSupabaseConfigured = () => supabase !== null && supabase !== undefined;

// Analytics service - uses Supabase when available, falls back to localStorage
export const analytics = {
  // Track page views
  async trackPageView(
    url: string = window.location.pathname + window.location.search,
  ) {
    try {
      const sessionId = getSessionId();
      const visitorId = getVisitorId();
      const pageView: PageView = {
        page_url: url,
        referrer: document.referrer || "direct",
        user_agent: navigator.userAgent,
        viewport_size: getViewportSize(),
        timestamp: new Date().toISOString(),
        session_id: sessionId,
      };

      // Try Supabase first
      if (isSupabaseConfigured()) {
        try {
          await supabase!.from("analytics_pageviews").insert([
            {
              page_url: pageView.page_url,
              referrer: pageView.referrer,
              user_agent: pageView.user_agent,
              viewport_size: pageView.viewport_size,
              timestamp: pageView.timestamp,
              session_id: pageView.session_id,
            },
          ]);

          // Upsert session summary
          await supabase!.from("analytics_sessions").upsert(
            [
              {
                session_id: sessionId,
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                page_views: 1,
                events: 0,
                user_agent: navigator.userAgent,
                is_mobile: isMobileDevice(),
              },
            ],
            { onConflict: "session_id" },
          );
        } catch (dbErr) {
          console.warn("Supabase pageview insert failed, falling back:", dbErr);
          // Fallback to local
          const pageViews = loadJSON<PageView[]>(PV_KEY, []);
          pageViews.push(pageView);
          saveJSON(PV_KEY, pageViews);

          const sessions = loadJSON<Record<string, UserSession>>(SS_KEY, {});
          if (!sessions[sessionId]) {
            sessions[sessionId] = {
              session_id: sessionId,
              start_time: new Date().toISOString(),
              end_time: undefined,
              page_views: 0,
              events: 0,
              user_agent: navigator.userAgent,
              is_mobile: isMobileDevice(),
            };
          }
          sessions[sessionId].page_views += 1;
          sessions[sessionId].end_time = new Date().toISOString();
          saveJSON(SS_KEY, sessions);
        }
      } else {
        // Local storage path
        const pageViews = loadJSON<PageView[]>(PV_KEY, []);
        pageViews.push(pageView);
        saveJSON(PV_KEY, pageViews);

        const sessions = loadJSON<Record<string, UserSession>>(SS_KEY, {});
        if (!sessions[sessionId]) {
          sessions[sessionId] = {
            session_id: sessionId,
            start_time: new Date().toISOString(),
            end_time: undefined,
            page_views: 0,
            events: 0,
            user_agent: navigator.userAgent,
            is_mobile: isMobileDevice(),
            visitor_id: visitorId,
          };
        }
        sessions[sessionId].page_views += 1;
        sessions[sessionId].end_time = new Date().toISOString();
        saveJSON(SS_KEY, sessions);
      }

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

      if (isSupabaseConfigured()) {
        try {
          await supabase!.from("analytics_events").insert([
            {
              event_type: event.event_type,
              event_data: event.event_data,
              page_url: event.page_url,
              user_agent: event.user_agent,
              timestamp: event.timestamp,
              session_id: event.session_id,
            },
          ]);

          // Note: session event counts are derived from events table during summary; no direct increment needed
        } catch (dbErr) {
          console.warn("Supabase event insert failed, falling back:", dbErr);
          const events = loadJSON<AnalyticsEvent[]>(EV_KEY, []);
          events.push(event);
          saveJSON(EV_KEY, events);

          const sessions = loadJSON<Record<string, UserSession>>(SS_KEY, {});
          if (sessions[sessionId]) {
            sessions[sessionId].events += 1;
            sessions[sessionId].end_time = new Date().toISOString();
            saveJSON(SS_KEY, sessions);
          }
        }
      } else {
        const events = loadJSON<AnalyticsEvent[]>(EV_KEY, []);
        events.push(event);
        saveJSON(EV_KEY, events);

        const sessions = loadJSON<Record<string, UserSession>>(SS_KEY, {});
        if (sessions[sessionId]) {
          sessions[sessionId].events += 1;
          sessions[sessionId].end_time = new Date().toISOString();
          saveJSON(SS_KEY, sessions);
        }
      }

      console.log("📊 Event tracked:", eventType, eventData);
    } catch (error) {
      console.warn("Analytics: Failed to track event:", error);
    }
  },

  // Update session information
  async updateSession(sessionId: string) {
    try {
      if (isSupabaseConfigured()) {
        try {
          await supabase!
            .from("analytics_sessions")
            .update({ end_time: new Date().toISOString() })
            .eq("session_id", sessionId);
        } catch (dbErr) {
          console.warn("Supabase session update failed, falling back:", dbErr);
          const sessions = loadJSON<Record<string, UserSession>>(SS_KEY, {});
          if (sessions[sessionId]) {
            sessions[sessionId].end_time = new Date().toISOString();
            saveJSON(SS_KEY, sessions);
          }
        }
      } else {
        const sessions = loadJSON<Record<string, UserSession>>(SS_KEY, {});
        if (sessions[sessionId]) {
          sessions[sessionId].end_time = new Date().toISOString();
          saveJSON(SS_KEY, sessions);
        }
      }
      console.log("📊 Session updated:", sessionId);
    } catch (error) {
      console.warn("Analytics: Failed to update session:", error);
    }
  },

  // Get analytics summary
  getAnalyticsSummary() {
    // If Supabase configured, try to build from DB synchronously via async wrapper
    // Note: For simplicity in this SPA, we fetch synchronously by returning latest cached if available
    // Use local fallback immediately; trigger background refresh for DB
    const localSummary = (() => {
      const pageViews = loadJSON<PageView[]>(PV_KEY, []);
      const events = loadJSON<AnalyticsEvent[]>(EV_KEY, []);
      const sessions = loadJSON<Record<string, UserSession>>(SS_KEY, {});

      const sessionList = Object.values(sessions);
      const totalPageViews = pageViews.length;
      const totalEvents = events.length;
      const totalSessions = sessionList.length;
      const uniqueVisitors = totalSessions;
      const mobileUsers = sessionList.filter((s) => s.is_mobile).length;
      const averageSessionDuration = analytics.calculateAverageSessionDuration(
        sessionList,
      );

      const popularPages = analytics.getPopularPages(pageViews);
      const recentActivity = analytics.getRecentActivity(pageViews, events);
      const eventBreakdown = analytics.getEventBreakdown(events);
      const hourlyActivity = analytics.getHourlyActivity(pageViews);

      return {
        totalPageViews,
        totalEvents,
        totalSessions,
        uniqueVisitors,
        mobileUsers,
        averageSessionDuration,
        popularPages,
        recentActivity,
        eventBreakdown,
        hourlyActivity,
      };
    })();

    if (isSupabaseConfigured()) {
      // Fire-and-forget background sync to refresh local cache from DB
      (async () => {
        try {
          const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: pvData } = await supabase!
            .from("analytics_page_views")
            .select("page_url,timestamp")
            .gte("timestamp", sinceISO)
            .limit(5000);
          const { data: evData } = await supabase!
            .from("analytics_events")
            .select("event_type,timestamp")
            .gte("timestamp", sinceISO)
            .limit(5000);
          const { data: ssData } = await supabase!
            .from("analytics_sessions")
            .select("session_id,start_time,end_time,user_agent,is_mobile")
            .gte("start_time", sinceISO)
            .limit(5000);

          if (pvData) saveJSON(PV_KEY, pvData as any);
          if (evData) saveJSON(EV_KEY, evData as any);
          if (ssData) saveJSON(SS_KEY, (ssData as any[]).reduce((acc, s: any) => { acc[s.session_id] = s; return acc; }, {} as Record<string, any>));
        } catch (dbErr) {
          console.warn("Supabase analytics fetch failed:", dbErr);
        }
      })();
    }

    return localSummary;
  },

  // Calculate average session duration
  calculateAverageSessionDuration(sessions: UserSession[]): number {
    if (!sessions.length) return 0;
    const durations = sessions.map((s) => {
      const start = new Date(s.start_time).getTime();
      const end = new Date(s.end_time || new Date().toISOString()).getTime();
      return Math.max(0, Math.floor((end - start) / 1000));
    });
    const avg = Math.floor(durations.reduce((a, b) => a + b, 0) / durations.length);
    return avg;
  },

  // Get popular pages
  getPopularPages(pageViews: PageView[]) {
    const counts: Record<string, number> = {};
    for (const pv of pageViews) {
      counts[pv.page_url] = (counts[pv.page_url] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Get recent activity (last 24h)
  getRecentActivity(pageViews: PageView[], events: AnalyticsEvent[]) {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const pv = pageViews.filter((p) => new Date(p.timestamp).getTime() >= since).length;
    const ev = events.filter((e) => new Date(e.timestamp).getTime() >= since).length;
    return { pageViews: pv, events: ev, total: pv + ev };
  },

  // Get event breakdown
  getEventBreakdown(events: AnalyticsEvent[]) {
    const counts: Record<string, number> = {};
    for (const ev of events) {
      counts[ev.event_type] = (counts[ev.event_type] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Get hourly activity pattern
  getHourlyActivity(pageViews: PageView[]) {
    const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    for (const pv of pageViews) {
      const h = new Date(pv.timestamp).getHours();
      buckets[h].count += 1;
    }
    return buckets;
  },

  // Clear analytics (local)
  async clearAnalytics() {
    try {
      if (isSupabaseConfigured()) {
        try {
          await supabase!.from("analytics_pageviews").delete().neq("session_id", "");
          await supabase!.from("analytics_events").delete().neq("session_id", "");
          await supabase!.from("analytics_sessions").delete().neq("session_id", "");
        } catch (dbErr) {
          console.warn("Supabase clear failed:", dbErr);
        }
      }
      localStorage.removeItem(PV_KEY);
      localStorage.removeItem(EV_KEY);
      localStorage.removeItem(SS_KEY);
      sessionStorage.removeItem("wedding_session_id");
      console.log("📊 Analytics data cleared");
    } catch (error) {
      console.warn("Analytics: Failed to clear:", error);
    }
  },

  // Export analytics data
  async exportAnalytics() {
    try {
      let pageViews = loadJSON<PageView[]>(PV_KEY, []);
      let events = loadJSON<AnalyticsEvent[]>(EV_KEY, []);
      let sessions = loadJSON<Record<string, UserSession>>(SS_KEY, {});

      if (isSupabaseConfigured()) {
        try {
          const { data: pvData } = await supabase!.from("analytics_page_views").select("*").limit(10000);
          const { data: evData } = await supabase!.from("analytics_events").select("*").limit(10000);
          const { data: ssData } = await supabase!.from("analytics_sessions").select("*").limit(10000);
          if (pvData) pageViews = pvData as any;
          if (evData) events = evData as any;
          if (ssData) sessions = (ssData as any[]).reduce((acc, s: any) => { acc[s.session_id] = s; return acc; }, {} as Record<string, any>);
        } catch (dbErr) {
          console.warn("Supabase export fetch failed, using local cache:", dbErr);
        }
      }

      const data = {
        pageViews,
        events,
        sessions,
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

      console.log("📊 Analytics data exported");
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
