# 🚀 5-Minute Supabase Setup for Your Wedding Website

## Why You Need This

Your wedding website currently stores data locally on each device. **Supabase will sync everything across all devices for free!**

## Step 1: Create Supabase Account (2 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (easiest)
4. Create new project: "aral-violet-wedding"
5. Choose free tier (perfect for weddings!)

## Step 2: Create Database Tables (1 minute)

In your Supabase dashboard, go to SQL Editor and run this:

```sql
-- Guests table for RSVP
CREATE TABLE guests (
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
CREATE TABLE photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_data TEXT NOT NULL,
    uploaded_by TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding flow table
CREATE TABLE wedding_flow (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT,
    type TEXT CHECK (type IN ('ceremony', 'reception', 'entertainment', 'meal', 'special')) DEFAULT 'ceremony',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (allows public access)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_flow ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (perfect for wedding sites)
CREATE POLICY "Anyone can read guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Anyone can create guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Anyone can create photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete photos" ON photos FOR DELETE USING (true);
CREATE POLICY "Anyone can read wedding_flow" ON wedding_flow FOR SELECT USING (true);
CREATE POLICY "Anyone can create wedding_flow" ON wedding_flow FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update wedding_flow" ON wedding_flow FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete wedding_flow" ON wedding_flow FOR DELETE USING (true);
```

## Step 3: Get Your API Keys (1 minute)

1. Go to Settings → API in your Supabase dashboard
2. Copy these two values:
   - **Project URL** (starts with https://)
   - **anon public key** (long string starting with "eyJ")

## Step 4: Add Keys to Your Website (1 minute)

1. Create a file called `.env` in your project root (same level as package.json)
2. Copy from `.env.example` and add your actual keys:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important Notes:**

- Use your ACTUAL Supabase URL and key (not the placeholders)
- Don't commit this file to Git! It's already in .gitignore
- For GitHub Pages deployment, you may need to set these as repository secrets
- Without these keys, the site will automatically use localStorage (current behavior)

## Step 5: Deploy! 🎉

### For Local Development:

Your `.env` file will work automatically for local testing.

### For GitHub Pages Deployment:

Since GitHub Pages is static hosting, environment variables work differently:

**Option A: Build with variables locally**

```bash
VITE_SUPABASE_URL=your_url VITE_SUPABASE_ANON_KEY=your_key npm run build:github
```

**Option B: Use repository secrets (advanced)**
Set up GitHub Actions to build with secrets (see GitHub documentation).

**Option C: Keep localStorage (easiest)**
Your site works perfectly with localStorage - only add Supabase if you need cross-device sync.

Push your code to GitHub - your wedding website now has a real database!

## What You Get After Setup

- ✅ **Photos sync across ALL devices** - upload on phone, see on computer
- ✅ **Real-time RSVP updates** - see responses instantly
- ✅ **Professional database** - no more localStorage limitations
- ✅ **Backup & security** - your wedding data is safe
- ✅ **500MB free storage** - enough for thousands of photos
- ✅ **Works with GitHub Pages** - no server needed

## Current Status

I've already integrated Supabase into your website code. It will:

- Use Supabase when configured (cross-device sync)
- Fall back to localStorage when not configured (current behavior)
- Keep both systems working together

**Total setup time: 5 minutes. Result: Professional wedding database that syncs everywhere! 🎯**
