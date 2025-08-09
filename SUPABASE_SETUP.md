# 🗄️ Supabase Database Setup for Wedding Website

## Why Supabase?

Supabase is perfect for GitHub Pages hosting because:

- ✅ **Free tier** - 500MB database, 2GB bandwidth
- ✅ **Static site compatible** - REST API calls work from any frontend
- ✅ **Real-time updates** - Guests can see live RSVP counts
- ✅ **Built-in authentication** - Secure admin access
- ✅ **No server required** - Works with GitHub Pages static hosting

## Quick Setup (Recommended)

### Option 1: Use MCP Integration

1. Click [Open MCP popover](#open-mcp-popover) in your interface
2. Connect to **Supabase MCP Server**
3. Follow the guided setup to create your database tables

### Option 2: Manual Setup

#### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub (recommended)
3. Create a new project: "aral-violet-wedding"

#### Step 2: Create Database Tables

Execute this SQL in Supabase SQL Editor:

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
    photo_data TEXT NOT NULL, -- base64 encoded image
    uploaded_by TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding flow/timeline table
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

-- Invitation table
CREATE TABLE invitations (
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

-- Create policies for public read access (guests can submit RSVP)
CREATE POLICY "Public can read guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Public can create guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public can read wedding flow" ON wedding_flow FOR SELECT USING (true);
CREATE POLICY "Public can read invitations" ON invitations FOR SELECT USING (true);

-- Admin policies (you can add admin authentication later)
CREATE POLICY "Admin can do everything on guests" ON guests FOR ALL USING (true);
CREATE POLICY "Admin can do everything on photos" ON photos FOR ALL USING (true);
CREATE POLICY "Admin can do everything on wedding_flow" ON wedding_flow FOR ALL USING (true);
CREATE POLICY "Admin can do everything on invitations" ON invitations FOR ALL USING (true);
```

#### Step 3: Get API Keys

1. Go to Project Settings → API
2. Copy your:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon public key**

#### Step 4: Add to Your Wedding Website

1. Install Supabase client: `npm install @supabase/supabase-js`
2. Create `client/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey);
```

3. Update your API functions to use Supabase instead of localStorage

## Benefits After Setup

- ✅ **Real-time RSVP tracking** - See responses immediately
- ✅ **Shared photo gallery** - All guests see the same photos
- ✅ **Data persistence** - No more localStorage limitations
- ✅ **Analytics** - Track RSVP patterns, popular photos
- ✅ **Backup** - Your wedding data is safely stored in the cloud

## Current Status

Your wedding website currently uses localStorage as the primary storage with API fallbacks. This works perfectly for GitHub Pages, but Supabase would provide better data persistence and real-time features.

**Recommendation**: Keep the current localStorage system working (it's solid!), and add Supabase as an enhancement when you have time.

---

Would you like me to help integrate Supabase into your wedding website? I can either:

1. Use the MCP integration to set it up automatically
2. Help you code the integration manually
3. Keep the current system (it works great as-is!)
