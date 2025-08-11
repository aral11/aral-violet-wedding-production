import { createClient } from "@supabase/supabase-js";

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only handle GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("📸 Netlify Function: Getting photos from Supabase...");

    // Get environment variables (these should be set in Netlify dashboard)
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    console.log("📸 Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValid: supabaseUrl?.includes("supabase.co"),
      urlPreview: supabaseUrl
        ? supabaseUrl.substring(0, 50) + "..."
        : "not set",
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase credentials in Netlify environment");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Supabase credentials not configured",
          details:
            "Please set SUPABASE_URL and SUPABASE_ANON_KEY in Netlify environment variables",
        }),
      };
    }

    // Validate credentials are not placeholder values
    if (supabaseUrl.includes("yourproject") || supabaseKey.includes("your_")) {
      console.error("❌ Supabase credentials appear to be placeholder values");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Invalid Supabase credentials",
          details:
            "Supabase credentials appear to be placeholder values. Please update environment variables.",
        }),
      };
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client created in Netlify function");

    // Query photos with error handling
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase query error:", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Database query failed",
          details: error.message,
          supabaseError: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
        }),
      };
    }

    console.log(
      `✅ Successfully retrieved ${data?.length || 0} photos from Supabase`,
    );

    // Transform data to match expected format
    const photos = (data || []).map((row: any) => ({
      id: row.id,
      photoData: row.photo_data,
      uploadedBy: row.uploaded_by,
      guestName: row.guest_name || null,
      createdAt: row.created_at,
    }));

    // Filter for valid photos (having proper data URLs)
    const validPhotos = photos.filter(
      (photo) =>
        photo.photoData &&
        (photo.photoData.startsWith("data:image/") ||
          photo.photoData.startsWith("http") ||
          photo.photoData.startsWith("blob:")),
    );

    console.log(
      `📸 Returning ${validPhotos.length} valid photos out of ${photos.length} total`,
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(validPhotos),
    };
  } catch (error) {
    console.error("❌ Netlify function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
