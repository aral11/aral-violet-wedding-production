import { createClient } from "@supabase/supabase-js";

// Replace with your actual Supabase credentials
const supabaseUrl = "https://your-project.supabase.co";
const supabaseKey = "your-supabase-anon-key-here";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing Supabase connection...");

  try {
    // Test connection
    const { data, error } = await supabase
      .from("guests")
      .select("count", { count: "exact" });

    if (error) {
      console.error("Error connecting to Supabase:", error);
      if (error.code === "PGRST116") {
        console.log("❌ Tables do not exist. Need to create database tables.");
        return false;
      }
    } else {
      console.log("✅ Supabase connection successful!");
      console.log("✅ Tables exist and accessible");
      return true;
    }
  } catch (err) {
    console.error("Connection failed:", err);
    return false;
  }
}

testConnection().then((success) => {
  if (success) {
    console.log("🎉 Database is ready for cross-device sync!");
  } else {
    console.log("❗ Need to set up database tables first");
  }
});
