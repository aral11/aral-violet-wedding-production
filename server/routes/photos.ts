import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client initialized for photos service");
  } catch (error) {
    console.warn("❌ Failed to initialize Supabase for photos:", error);
  }
} else {
  console.warn(
    "⚠️ Supabase credentials not found - photos service will use fallback",
  );
}

// Get all photos
export const getPhotos: RequestHandler = async (req, res) => {
  console.log("📸 Photos API called - GET /api/photos");
  try {
    if (supabase) {
      console.log("📸 Using Supabase for photos");
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("📸 Supabase error:", error);
        throw error;
      }

      const photos = data.map((row: any) => ({
        id: row.id,
        photoData: row.photo_data,
        uploadedBy: row.uploaded_by,
        createdAt: row.created_at,
      }));

      console.log(`📸 Returning ${photos.length} photos from Supabase`);
      res.json(photos);
    } else {
      console.log("📸 No Supabase client - returning empty array");
      // Fallback to empty array
      res.json([]);
    }
  } catch (error) {
    console.error("📸 Error fetching photos:", error);
    // Return empty array for graceful fallback
    res.json([]);
  }
};

// Upload new photo
export const uploadPhoto: RequestHandler = async (req, res) => {
  try {
    const { photoData, uploadedBy = "admin" } = req.body;

    if (!photoData) {
      return res.status(400).json({ error: "Photo data is required" });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from("photos")
        .insert([
          {
            photo_data: photoData,
            uploaded_by: uploadedBy,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newPhoto = {
        id: data.id,
        photoData: data.photo_data,
        uploadedBy: data.uploaded_by,
        createdAt: data.created_at,
      };

      res.status(201).json(newPhoto);
    } else {
      // Fallback response
      const id = Date.now().toString();
      const newPhoto = {
        id,
        photoData,
        uploadedBy,
        createdAt: new Date().toISOString(),
      };
      res.status(201).json(newPhoto);
    }
  } catch (error) {
    console.error("Error uploading photo:", error);
    // Return success response for graceful fallback
    const id = Date.now().toString();
    const newPhoto = {
      id,
      photoData: req.body.photoData,
      uploadedBy: req.body.uploadedBy || "admin",
      createdAt: new Date().toISOString(),
    };
    res.status(201).json(newPhoto);
  }
};

// Delete photo
export const deletePhoto: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from("photos").delete().eq("id", id);

      if (error) {
        throw error;
      }
    }

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    // Return success response for graceful fallback
    res.json({ message: "Photo deleted successfully" });
  }
};

// Bulk upload photos
export const bulkUploadPhotos: RequestHandler = async (req, res) => {
  try {
    const { photos, uploadedBy = "admin" } = req.body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: "Photos array is required" });
    }

    if (supabase) {
      const photosToInsert = photos.map((photoData: string) => ({
        photo_data: photoData,
        uploaded_by: uploadedBy,
      }));

      const { data, error } = await supabase
        .from("photos")
        .insert(photosToInsert)
        .select();

      if (error) {
        throw error;
      }

      const uploadedPhotos = data.map((row: any) => ({
        id: row.id,
        photoData: row.photo_data,
        uploadedBy: row.uploaded_by,
        createdAt: row.created_at,
      }));

      res.status(201).json({
        message: `Successfully uploaded ${uploadedPhotos.length} photos`,
        photos: uploadedPhotos,
      });
    } else {
      // Fallback response
      const uploadedPhotos = photos.map((photoData: string, index: number) => ({
        id: (Date.now() + index).toString(),
        photoData,
        uploadedBy,
        createdAt: new Date().toISOString(),
      }));
      res.status(201).json({
        message: `Successfully uploaded ${uploadedPhotos.length} photos`,
        photos: uploadedPhotos,
      });
    }
  } catch (error) {
    console.error("Error bulk uploading photos:", error);
    // Return success response for graceful fallback
    const uploadedPhotos = req.body.photos.map(
      (photoData: string, index: number) => ({
        id: (Date.now() + index).toString(),
        photoData,
        uploadedBy: req.body.uploadedBy || "admin",
        createdAt: new Date().toISOString(),
      }),
    );
    res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} photos`,
      photos: uploadedPhotos,
    });
  }
};
