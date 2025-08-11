import { createClient } from "@supabase/supabase-js";

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  // Only handle POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("📸 Netlify Function: Uploading photo to Supabase...");

    // Parse request body
    const { photoData, uploadedBy = "admin", guestName } = JSON.parse(event.body || "{}");

    if (!photoData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Photo data is required" }),
      };
    }

    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase credentials in Netlify environment");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Supabase credentials not configured",
          details: "Please set SUPABASE_URL and SUPABASE_ANON_KEY in Netlify environment variables"
        }),
      };
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client created for upload");

    // Generate unique uploader identifier for guest uploads
    const actualUploadedBy = uploadedBy === "guest"
      ? `guest_${guestName || "anonymous"}_${Date.now()}`
      : uploadedBy;

    // Insert photo into database
    const { data, error } = await supabase
      .from("photos")
      .insert([
        {
          photo_data: photoData,
          uploaded_by: actualUploadedBy,
          guest_name: guestName || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Failed to save photo",
          details: error.message,
          supabaseError: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          }
        }),
      };
    }

    console.log(`✅ Photo uploaded successfully by ${uploadedBy === "guest" ? `guest: ${guestName}` : "admin"}`);

    // Return the saved photo in the expected format
    const savedPhoto = {
      id: data.id,
      photoData: data.photo_data,
      uploadedBy: data.uploaded_by,
      guestName: data.guest_name,
      createdAt: data.created_at,
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(savedPhoto),
    };

  } catch (error) {
    console.error("❌ Netlify function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
