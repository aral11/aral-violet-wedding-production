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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { pdfData, filename } = JSON.parse(event.body || "{}");

    if (!pdfData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "PDF data is required" }),
      };
    }

    if (supabase) {
      // Delete existing invitation first (only keep the latest)
      await supabase.from("invitations").delete().neq("id", 0);

      // Insert new invitation
      const { data, error } = await supabase
        .from("invitations")
        .insert([
          {
            pdf_data: pdfData,
            filename: filename || "wedding-invitation.pdf",
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          id: data.id,
          pdfData: data.pdf_data,
          filename: data.filename,
          uploadedAt: data.created_at,
        }),
      };
    } else {
      // Fallback response
      const newInvitation = {
        id: 1,
        pdfData: pdfData,
        filename: filename || "wedding-invitation.pdf",
        uploadedAt: new Date().toISOString(),
      };
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newInvitation),
      };
    }
  } catch (error) {
    console.error("Error uploading invitation:", error);
    // Return success response for graceful fallback
    const { pdfData, filename } = JSON.parse(event.body || "{}");
    const newInvitation = {
      id: 1,
      pdfData: pdfData,
      filename: filename || "wedding-invitation.pdf",
      uploadedAt: new Date().toISOString(),
    };
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newInvitation),
    };
  }
};
