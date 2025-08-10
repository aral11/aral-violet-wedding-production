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

-- Photos table (updated with guest_name column)
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_data TEXT NOT NULL, -- base64 encoded image
    uploaded_by TEXT DEFAULT 'admin',
    guest_name TEXT, -- Name of the guest who uploaded the photo
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add guest_name column to photos table if it doesn't exist
ALTER TABLE photos ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Enable Row Level Security (RLS)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can read guests" ON guests;
DROP POLICY IF EXISTS "Public can create guests" ON guests;
DROP POLICY IF EXISTS "Public can read photos" ON photos;
DROP POLICY IF EXISTS "Public can create photos" ON photos;
DROP POLICY IF EXISTS "Public can read wedding flow" ON wedding_flow;
DROP POLICY IF EXISTS "Public can read invitations" ON invitations;
DROP POLICY IF EXISTS "Admin can do everything on guests" ON guests;
DROP POLICY IF EXISTS "Admin can do everything on photos" ON photos;
DROP POLICY IF EXISTS "Admin can do everything on wedding_flow" ON wedding_flow;
DROP POLICY IF EXISTS "Admin can do everything on invitations" ON invitations;

-- Create policies for public read access (guests can submit RSVP and upload photos)
CREATE POLICY "Public can read guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Public can create guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public can create photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read wedding flow" ON wedding_flow FOR SELECT USING (true);
CREATE POLICY "Public can read invitations" ON invitations FOR SELECT USING (true);

-- Admin policies (you can add admin authentication later)
CREATE POLICY "Admin can do everything on guests" ON guests FOR ALL USING (true);
CREATE POLICY "Admin can do everything on photos" ON photos FOR ALL USING (true);
CREATE POLICY "Admin can do everything on wedding_flow" ON wedding_flow FOR ALL USING (true);
CREATE POLICY "Admin can do everything on invitations" ON invitations FOR ALL USING (true);
