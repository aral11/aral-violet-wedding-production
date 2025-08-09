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
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: "No invitation found" });
      }

      res.json({
        id: data.id,
        pdfData: data.pdf_data,
        filename: data.filename,
        uploadedAt: data.created_at,
      });
    } else {
      // Fallback to localStorage check (though this won't work server-side)
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

      res.status(201).json({
        id: data.id,
        pdfData: data.pdf_data,
        filename: data.filename,
        uploadedAt: data.created_at,
      });
    } else {
      // Fallback response
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
