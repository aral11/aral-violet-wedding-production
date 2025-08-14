-- Supabase Analytics Tables Schema
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Analytics Events Table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_url VARCHAR(500) NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Analytics Page Views Table
CREATE TABLE analytics_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_url VARCHAR(500) NOT NULL,
    referrer VARCHAR(500) DEFAULT 'direct',
    user_agent TEXT,
    viewport_size VARCHAR(20),
    session_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Analytics User Sessions Table
CREATE TABLE analytics_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    page_views INTEGER DEFAULT 0,
    events INTEGER DEFAULT 0,
    user_agent TEXT,
    is_mobile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);

CREATE INDEX idx_analytics_page_views_session_id ON analytics_page_views(session_id);
CREATE INDEX idx_analytics_page_views_timestamp ON analytics_page_views(timestamp);
CREATE INDEX idx_analytics_page_views_page_url ON analytics_page_views(page_url);

CREATE INDEX idx_analytics_sessions_start_time ON analytics_sessions(start_time);
CREATE INDEX idx_analytics_sessions_is_mobile ON analytics_sessions(is_mobile);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all operations for now - restrict as needed)
CREATE POLICY "Allow all operations on analytics_events" ON analytics_events
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on analytics_page_views" ON analytics_page_views
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on analytics_sessions" ON analytics_sessions
    FOR ALL USING (true) WITH CHECK (true);
