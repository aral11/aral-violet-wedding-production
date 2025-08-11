import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

// Test Supabase connection
export const testSupabaseConnection: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Testing Supabase connection...");

    // Check environment variables
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      urlValid: supabaseUrl.includes("supabase.co"),
      urlNotPlaceholder:
        !supabaseUrl.includes("yourproject") &&
        supabaseUrl !== "https://yourproject.supabase.co",
      keyNotPlaceholder:
        supabaseKey !== "your_anon_key_here" &&
        supabaseKey !== "YOUR_SUPABASE_ANON_KEY",
      urlPreview: supabaseUrl
        ? supabaseUrl.substring(0, 50) + "..."
        : "not set",
      keyPreview: supabaseKey
        ? supabaseKey.substring(0, 20) + "..."
        : "not set",
    };

    console.log("🔍 Environment info:", envInfo);

    if (!supabaseUrl || !supabaseKey) {
      return res.json({
        success: false,
        error: "Missing Supabase credentials",
        envInfo,
        message: "Supabase URL or key not found in environment variables",
      });
    }

    if (
      !envInfo.urlValid ||
      !envInfo.urlNotPlaceholder ||
      !envInfo.keyNotPlaceholder
    ) {
      return res.json({
        success: false,
        error: "Invalid Supabase credentials",
        envInfo,
        message: "Supabase credentials appear to be placeholder values",
      });
    }

    // Try to create Supabase client
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log("✅ Supabase client created successfully");
    } catch (clientError) {
      console.error("❌ Failed to create Supabase client:", clientError);
      return res.json({
        success: false,
        error: "Failed to create Supabase client",
        details: clientError.message,
        envInfo,
      });
    }

    // Test connection with a simple query
    try {
      const { data: testData, error: testError } = await supabase
        .from("photos")
        .select("count", { count: "exact", head: true })
        .limit(1);

      if (testError) {
        console.error("❌ Supabase query failed:", testError);
        return res.json({
          success: false,
          error: "Supabase query failed",
          supabaseError: {
            message: testError.message,
            details: testError.details,
            hint: testError.hint,
            code: testError.code,
          },
          envInfo,
        });
      }

      console.log("✅ Supabase connection test successful");

      // Try to get actual photos count
      const { count, error: countError } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true });

      const photoCount = countError ? "unknown" : count;

      return res.json({
        success: true,
        message: "Supabase connection successful",
        photoCount,
        envInfo,
        timestamp: new Date().toISOString(),
      });
    } catch (queryError) {
      console.error("❌ Supabase query exception:", queryError);
      return res.json({
        success: false,
        error: "Supabase query exception",
        details: queryError.message,
        envInfo,
      });
    }
  } catch (error) {
    console.error("❌ Test connection failed:", error);
    return res.status(500).json({
      success: false,
      error: "Connection test failed",
      details: error.message,
    });
  }
};
