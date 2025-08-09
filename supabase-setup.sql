-- Wedding Website Database Tables for Supabase
-- Run this SQL in your Supabase dashboard

-- Guests table for RSVP
CREATE TABLE IF NOT EXISTS guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    attending BOOLEAN DEFAULT true,
    guests INTEGER DEFAULT 1,
    side TEXT CHECK (side IN ('groom', 'bride')) DEFAULT 'groom',
    message TEXT,
    dietary_restrictions TEXT,
    needs_accommodation BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_data TEXT NOT NULL, -- base64 encoded image
    uploaded_by TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding flow/timeline table
CREATE TABLE IF NOT EXISTS wedding_flow (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT,
    type TEXT CHECK (type IN ('ceremony', 'reception', 'entertainment', 'meal', 'special')) DEFAULT 'ceremony',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitation table
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    pdf_data TEXT NOT NULL, -- base64 encoded PDF
    filename TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a wedding website)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read guests" ON guests;
DROP POLICY IF EXISTS "Public can create guests" ON guests;
DROP POLICY IF EXISTS "Public can read photos" ON photos;
DROP POLICY IF EXISTS "Public can create photos" ON photos;
DROP POLICY IF EXISTS "Public can read wedding flow" ON wedding_flow;
DROP POLICY IF EXISTS "Public can create wedding flow" ON wedding_flow;
DROP POLICY IF EXISTS "Public can read invitations" ON invitations;
DROP POLICY IF EXISTS "Admin can do everything on guests" ON guests;
DROP POLICY IF EXISTS "Admin can do everything on photos" ON photos;
DROP POLICY IF EXISTS "Admin can do everything on wedding_flow" ON wedding_flow;
DROP POLICY IF EXISTS "Admin can do everything on invitations" ON invitations;

-- Public read access
CREATE POLICY "Public can read guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Public can read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public can read wedding flow" ON wedding_flow FOR SELECT USING (true);
CREATE POLICY "Public can read invitations" ON invitations FOR SELECT USING (true);

-- Public create access (for RSVP and photo uploads)
CREATE POLICY "Public can create guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create wedding flow" ON wedding_flow FOR INSERT WITH CHECK (true);

-- Admin policies (allow all operations)
CREATE POLICY "Admin can do everything on guests" ON guests FOR ALL USING (true);
CREATE POLICY "Admin can do everything on photos" ON photos FOR ALL USING (true);
CREATE POLICY "Admin can do everything on wedding_flow" ON wedding_flow FOR ALL USING (true);
CREATE POLICY "Admin can do everything on invitations" ON invitations FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guests_created_at ON guests(created_at);
CREATE INDEX IF NOT EXISTS idx_guests_attending ON guests(attending);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_wedding_flow_time ON wedding_flow(time);

-- Insert some sample data to test (optional)
INSERT INTO wedding_flow (time, title, description, type) VALUES
('14:00', 'Welcome & Gathering', 'Guests arrive and mingle', 'ceremony'),
('14:30', 'Wedding Ceremony', 'Exchange of vows', 'ceremony'),
('15:30', 'Photo Session', 'Wedding party photos', 'special'),
('16:30', 'Cocktail Hour', 'Drinks and appetizers', 'reception'),
('18:00', 'Dinner Reception', 'Main course and speeches', 'meal'),
('20:00', 'Dancing & Celebration', 'Live music and dancing', 'entertainment')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup complete! Tables created successfully.' as message;
