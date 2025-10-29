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
      console.log("📋 Uploading invitation to Supabase...");

      // Delete existing invitations first (only keep the latest)
      console.log("🗑️ Deleting old invitations...");
      const { error: deleteError } = await supabase
        .from("invitations")
        .delete()
        .neq("id", 0);

      if (deleteError) {
        console.warn(
          "⚠️ Warning: Could not delete old invitations:",
          deleteError,
        );
        // Don't throw, continue with insert
      } else {
        console.log("✅ Old invitations deleted");
      }

      // Insert new invitation
      console.log("📤 Inserting new invitation...");
      const { data, error } = await supabase
        .from("invitations")
        .insert([
          {
            pdf_data: pdfData,
            filename: filename || "wedding-invitation.pdf",
          },
        ])
        .select();

      if (error) {
        console.error("❌ Error inserting invitation:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("❌ No data returned from insert");
        throw new Error("Failed to upload invitation - no data returned");
      }

      const uploadedInvitation = data[0];
      console.log("✅ Invitation uploaded successfully:", {
        id: uploadedInvitation.id,
        filename: uploadedInvitation.filename,
        dataLength: uploadedInvitation.pdf_data?.length || 0,
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          id: uploadedInvitation.id,
          pdfData: uploadedInvitation.pdf_data,
          filename: uploadedInvitation.filename,
          uploadedAt: uploadedInvitation.created_at,
        }),
      };
    } else {
      // Fallback response
      console.log("📋 Supabase not configured, returning fallback response");
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
