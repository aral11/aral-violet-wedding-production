# 🗄️ Updated Supabase Setup for Wedding Website

## Required Database Schema Updates

Execute this SQL in your Supabase SQL Editor to ensure all tables have the correct structure:

```sql
-- Update photos table to include guest_name column
ALTER TABLE photos ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Ensure all required tables exist with correct structure
-- (Re-run these if tables don't exist)

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

-- Photos table with guest support
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_data TEXT NOT NULL, -- base64 encoded image
    uploaded_by TEXT DEFAULT 'admin',
    guest_name TEXT, -- Name of guest who uploaded (for guest uploads)
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read guests" ON guests;
DROP POLICY IF EXISTS "Public can create guests" ON guests;
DROP POLICY IF EXISTS "Public can read photos" ON photos;
DROP POLICY IF EXISTS "Public can create photos" ON photos;
DROP POLICY IF EXISTS "Public can delete photos" ON photos;
DROP POLICY IF EXISTS "Public can read wedding flow" ON wedding_flow;
DROP POLICY IF EXISTS "Public can read invitations" ON invitations;
DROP POLICY IF EXISTS "Admin can do everything on guests" ON guests;
DROP POLICY IF EXISTS "Admin can do everything on photos" ON photos;
DROP POLICY IF EXISTS "Admin can do everything on wedding_flow" ON wedding_flow;
DROP POLICY IF EXISTS "Admin can do everything on invitations" ON invitations;

-- Create policies for public access (guests can submit RSVP and upload photos)
CREATE POLICY "Public can read guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Public can create guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update guests" ON guests FOR UPDATE USING (true);

CREATE POLICY "Public can read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public can create photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete photos" ON photos FOR DELETE USING (true);

CREATE POLICY "Public can read wedding flow" ON wedding_flow FOR SELECT USING (true);
CREATE POLICY "Public can create wedding flow" ON wedding_flow FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read invitations" ON invitations FOR SELECT USING (true);
CREATE POLICY "Public can create invitations" ON invitations FOR INSERT WITH CHECK (true);

-- Admin policies (for full access)
CREATE POLICY "Admin can do everything on guests" ON guests FOR ALL USING (true);
CREATE POLICY "Admin can do everything on photos" ON photos FOR ALL USING (true);
CREATE POLICY "Admin can do everything on wedding_flow" ON wedding_flow FOR ALL USING (true);
CREATE POLICY "Admin can do everything on invitations" ON invitations FOR ALL USING (true);
```

## Environment Variables Setup

### For Local Development

1. Copy `.env.local.example` to `.env.local`
2. Add your actual Supabase credentials:

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### For Production (Netlify)

Add these environment variables in Netlify Dashboard:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Testing the Setup

1. Restart your development server: `npm run dev`
2. Check the console for Supabase connection status
3. Try uploading a photo via admin panel
4. Try uploading a photo via guest upload
5. Verify photos appear in the gallery

## Troubleshooting

### Photos Not Uploading

- Check browser console for Supabase errors
- Verify environment variables are set correctly
- Ensure RLS policies allow public access to photos table

### Photos Not Displaying

- Check that photos table has data
- Verify environment variables are configured
- Check network tab for API errors

### Database Connection Issues

- Verify Supabase URL and key are correct
- Check Supabase project is active (not paused)
- Ensure RLS policies are properly configured

## Current Storage Approach

The system currently stores photos as base64-encoded data directly in the database. This approach:

✅ **Pros:**

- Simple to implement
- No additional storage configuration needed
- Works immediately with existing setup

⚠️ **Limitations:**

- Database size grows quickly with many photos
- Base64 encoding increases file size by ~33%

### Future Enhancement: Supabase Storage

For production use with many photos, consider upgrading to Supabase Storage:

```sql
-- Create storage bucket (optional future enhancement)
INSERT INTO storage.buckets (id, name, public) VALUES ('wedding-photos', 'wedding-photos', true);

-- Allow public uploads to bucket
CREATE POLICY "Public can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wedding-photos');
CREATE POLICY "Public can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'wedding-photos');
```

But for now, the base64 database approach works perfectly for wedding-size photo collections.
