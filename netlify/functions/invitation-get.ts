import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client initialized for invitation service");
  } catch (error) {
    console.warn("❌ Failed to initialize Supabase for invitations:", error);
  }
} else {
  console.warn(
    "⚠️ Supabase credentials not found - invitation service will use fallback",
  );
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Supabase error fetching invitation:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No invitation found in database");
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "No invitation found" }),
        };
      }

      const invitation = data[0];
      console.log("✅ Invitation fetched from Supabase:", {
        id: invitation.id,
        filename: invitation.filename,
        dataLength: invitation.pdf_data?.length || 0,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: invitation.id,
          pdfData: invitation.pdf_data,
          filename: invitation.filename,
          uploadedAt: invitation.created_at,
        }),
      };
    } else {
      // Fallback to localStorage check (though this won't work server-side)
      console.log("Supabase not configured");
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "No invitation found" }),
      };
    }
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "No invitation found" }),
    };
  }
};
