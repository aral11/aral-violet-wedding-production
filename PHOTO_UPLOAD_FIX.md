# 🚨 PHOTO UPLOAD FIX - SUPABASE CONFIGURATION REQUIRED

## Root Cause Identified ✅

Your photos are not uploading or displaying because **Supabase environment variables are not configured**. The server logs show repeated `TypeError: fetch failed` errors when trying to connect to Supabase.

## Quick Fix Steps 🔧

### Step 1: Get Your Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (if you don't have one)
3. Go to **Settings > API** in your project dashboard
4. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anonymous Key** (long string starting with `eyJ...`)

### Step 2: Update Environment Variables
1. Open the `.env.local` file (I just created it for you)
2. Replace the placeholders with your actual values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-actual-key...
   ```

### Step 3: Set Up Supabase Database Tables
Run this SQL in your Supabase SQL Editor (Database > SQL Editor):

```sql
-- Enable Row Level Security and create tables
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_data TEXT NOT NULL,
    uploaded_by TEXT NOT NULL DEFAULT 'admin',
    guest_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public to read photos" ON public.photos
    FOR SELECT USING (true);

CREATE POLICY "Allow public to insert photos" ON public.photos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to delete photos" ON public.photos
    FOR DELETE USING (true);

-- Create storage bucket for photos (if using file storage)
INSERT INTO storage.buckets (id, name, public) VALUES ('wedding-photos', 'wedding-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow public to upload photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'wedding-photos');

CREATE POLICY "Allow public to read photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'wedding-photos');
```

### Step 4: Restart Development Server
```bash
npm run dev
```

## Alternative: Use Supabase MCP Integration 🔌

For easier setup, you can connect the **Supabase MCP server** which will help manage your database:

1. [Open MCP popover](#open-mcp-popover)
2. Connect to **Supabase** integration
3. This will help you manage your database, authentication, and storage

## Testing the Fix ✅

After configuration:
1. Go to the guest upload page (`/guest-upload`)
2. Try uploading a photo
3. Check the browser console - should see ✅ success messages instead of ❌ errors
4. Photos should now appear in your wedding gallery

## Current Fallback 📱

Right now your app is using **localStorage** as a fallback, which means:
- ✅ Photos work locally on each device
- ❌ Photos don't sync between devices
- ❌ Photos are lost when browser cache is cleared

Once Supabase is configured:
- ✅ Photos sync across all devices
- ✅ Photos are permanently stored
- ✅ Real-time updates for guests

## Need Help? 🆘

If you need assistance with Supabase setup, the **Supabase MCP integration** can help you:
- Create and manage database tables
- Set up authentication
- Configure storage buckets
- Monitor your database

[Open MCP popover](#open-mcp-popover) and connect to Supabase for guided setup.
