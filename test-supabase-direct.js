// Simple test script to check Supabase connection
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://rqhhevyrmwgoxvjwnvuc.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaGhldnlybXdnb3h2andubnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTczOTcsImV4cCI6MjA3MDA3MzM5N30.BdxPAjKz5j1GS6qbGkxqJ2MflVJsJGKcFfN8pRGOaAY";

console.log("Testing Supabase connection...");
console.log("URL:", supabaseUrl);
console.log("Key:", supabaseKey.substring(0, 20) + "...");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log("Querying photos table...");
    const { data, error } = await supabase.from("photos").select("*");

    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Success! Found", data.length, "photos");
      console.log("Photos:", data);
    }
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

testConnection();
