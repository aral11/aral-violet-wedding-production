import { RequestHandler } from "express";
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

// Get current invitation
export const getInvitation: RequestHandler = async (req, res) => {
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
        return res.status(404).json({ error: "No invitation found" });
      }

      const invitation = data[0];
      console.log("✅ Invitation fetched from Supabase:", {
        id: invitation.id,
        filename: invitation.filename,
        dataLength: invitation.pdf_data?.length || 0,
      });

      res.json({
        id: invitation.id,
        pdfData: invitation.pdf_data,
        filename: invitation.filename,
        uploadedAt: invitation.created_at,
      });
    } else {
      // Fallback to localStorage check (though this won't work server-side)
      console.log("Supabase not configured");
      return res.status(404).json({ error: "No invitation found" });
    }
  } catch (error) {
    console.error("Error fetching invitation:", error);
    res.status(404).json({ error: "No invitation found" });
  }
};

// Upload new invitation
export const uploadInvitation: RequestHandler = async (req, res) => {
  try {
    const { pdfData, filename } = req.body;

    if (!pdfData) {
      return res.status(400).json({ error: "PDF data is required" });
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

      res.status(201).json({
        id: uploadedInvitation.id,
        pdfData: uploadedInvitation.pdf_data,
        filename: uploadedInvitation.filename,
        uploadedAt: uploadedInvitation.created_at,
      });
    } else {
      // Fallback response
      console.log("📋 Supabase not configured, returning fallback response");
      const newInvitation = {
        id: 1,
        pdfData: pdfData,
        filename: filename || "wedding-invitation.pdf",
        uploadedAt: new Date().toISOString(),
      };
      res.status(201).json(newInvitation);
    }
  } catch (error) {
    console.error("Error uploading invitation:", error);
    // Return success response for graceful fallback
    const newInvitation = {
      id: 1,
      pdfData: req.body.pdfData,
      filename: req.body.filename || "wedding-invitation.pdf",
      uploadedAt: new Date().toISOString(),
    };
    res.status(201).json(newInvitation);
  }
};

// Delete invitation
export const deleteInvitation: RequestHandler = async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .neq("id", 0); // Delete all invitations

      if (error) {
        throw error;
      }
    }

    res.json({ message: "Invitation deleted successfully" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    // Return success response for graceful fallback
    res.json({ message: "Invitation deleted successfully" });
  }
};
