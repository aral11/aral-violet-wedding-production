import { createClient } from "@supabase/supabase-js";

// Supabase configuration - you'll need to add your actual values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create Supabase client if environment variables are properly configured
export const supabase = (() => {
  // Check if environment variables are set and not placeholder values
  const isValidUrl =
    supabaseUrl &&
    supabaseUrl !== "YOUR_SUPABASE_URL" &&
    supabaseUrl !== "https://yourproject.supabase.co" &&
    supabaseUrl.includes("supabase.co");

  const isValidKey =
    supabaseKey &&
    supabaseKey !== "YOUR_SUPABASE_ANON_KEY" &&
    supabaseKey.length > 50; // Supabase keys are typically longer than 50 chars

  if (isValidUrl && isValidKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey);
      console.log("✅ Supabase client created successfully");
      console.log("📊 Supabase URL:", supabaseUrl.substring(0, 30) + "...");
      return client;
    } catch (error) {
      console.warn("❌ Failed to create Supabase client:", error);
      return null;
    }
  }

  // Log why Supabase is not configured
  if (!isValidUrl) {
    console.log(
      "⚠️ Supabase URL not configured properly. Current value:",
      supabaseUrl || "undefined",
    );
    console.log("💡 Add VITE_SUPABASE_URL to your .env.local file");
  }
  if (!isValidKey) {
    console.log(
      "⚠️ Supabase key not configured properly. Key length:",
      supabaseKey?.length || 0,
    );
    console.log("💡 Add VITE_SUPABASE_ANON_KEY to your .env.local file");
  }

  console.log("📝 Using localStorage fallback for data storage");
  return null;
})();

// Database types
export interface SupabaseGuest {
  id?: string;
  name: string;
  email: string;
  phone: string;
  attending: boolean;
  guests: number;
  side: "groom" | "bride";
  message?: string;
  dietary_restrictions?: string;
  needs_accommodation: boolean;
  needs_pickup?: boolean;
  pickup_from?: string;
  arrival_time?: string;
  pickup_people_count?: number;
  pickup_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabasePhoto {
  id?: string;
  photo_data: string;
  uploaded_by: string;
  guest_name?: string | null;
  created_at?: string;
}

export interface SupabaseWeddingFlow {
  id?: string;
  time: string;
  title: string;
  description: string;
  duration?: string;
  type: "ceremony" | "reception" | "entertainment" | "meal" | "special";
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseInvitation {
  id?: number;
  pdf_data: string;
  filename?: string;
  uploaded_at?: string;
}
