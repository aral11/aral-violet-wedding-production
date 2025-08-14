-- Supabase Event Photos and Messages Schema
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Event Photos Table (for Haldi and Roce events)
CREATE TABLE event_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('violet_haldi', 'aral_roce')),
    photo_data TEXT NOT NULL, -- Base64 or URL
    guest_name VARCHAR(255) NOT NULL,
    message TEXT, -- Optional message from guest
    uploaded_by VARCHAR(255) DEFAULT 'guest',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Event Messages Table (for dynamic homepage messages)
CREATE TABLE event_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'haldi_day', 'roce_day', 'wedding_day_before', etc.
    title TEXT NOT NULL,
    subtitle TEXT,
    show_countdown BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default event messages
INSERT INTO event_messages (message_key, title, subtitle, show_countdown) VALUES
('default', 'Aral & Violet', 'Sunday, December 28, 2025 • Udupi, Karnataka, India', true),
('haldi_day', 'Violet''s Haldi Day', 'A beautiful pre-wedding tradition filled with joy and blessings 💛', false),
('roce_day', 'Aral''s Roce Day', 'A cherished Mangalorean tradition celebrating the groom 🌊', false),
('wedding_day_before', 'Aral Weds Violet Today', 'The big day is finally here! 🎉', false),
('wedding_day_after', 'We Are Hitched', 'Just married! Thanks for celebrating with us! 💒', false),
('post_wedding', 'Wedding is done — we''ll be back soon with something exciting!', 'Thank you for celebrating with us! 💕', false);

-- Indexes for better performance
CREATE INDEX idx_event_photos_event_type ON event_photos(event_type);
CREATE INDEX idx_event_photos_created_at ON event_photos(created_at);
CREATE INDEX idx_event_messages_message_key ON event_messages(message_key);

-- Enable Row Level Security (RLS)
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all operations for now - restrict as needed)
CREATE POLICY "Allow all operations on event_photos" ON event_photos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on event_messages" ON event_messages
    FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_event_photos_updated_at BEFORE UPDATE ON event_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_messages_updated_at BEFORE UPDATE ON event_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
