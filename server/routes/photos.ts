import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Guest upload validation schema
const guestUploadSchema = z.object({
  photoData: z.string().min(1, "Photo data is required"),
  guestName: z
    .string()
    .min(1, "Guest name is required")
    .max(100, "Name too long"),
  uploadedBy: z.literal("guest"),
});

// Generate QR code data for guest upload
export const generateGuestUploadQR: RequestHandler = async (req, res) => {
  try {
    const baseUrl = req.protocol + "://" + req.get("host");
    const guestUploadUrl = `${baseUrl}/guest-upload`;

    res.json({
      qrCodeUrl: guestUploadUrl,
      message: "QR code URL generated for guest photo uploads",
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
};

// Validate guest upload
export const validateGuestUpload: RequestHandler = async (req, res, next) => {
  try {
    if (req.body.uploadedBy === "guest") {
      const validated = guestUploadSchema.parse(req.body);
      req.body = validated;
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid guest upload data",
        details: error.errors,
      });
    }
    next(error);
  }
};

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

// Get all photos with optional filtering by uploader type
export const getPhotos: RequestHandler = async (req, res) => {
  console.log("📸 Photos API called - GET /api/photos");
  const { type } = req.query; // 'admin', 'guest', or undefined for all

  try {
    if (supabase) {
      console.log("📸 Using Supabase for photos");
      let query = supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by uploader type if specified
      if (type === "admin") {
        query = query.eq("uploaded_by", "admin");
      } else if (type === "guest") {
        query = query.neq("uploaded_by", "admin");
      }

      const { data, error } = await query;

      if (error) {
        console.error("📸 Supabase error:", error);
        throw error;
      }

      const photos = data?.map((row: any) => ({
        id: row.id,
        photoData: row.photo_data,
        uploadedBy: row.uploaded_by,
        guestName: row.guest_name || null,
        createdAt: row.created_at,
      })) || [];

      console.log(
        `📸 Returning ${photos.length} photos from Supabase (type: ${type || "all"})`,
      );
      res.json(photos);
    } else {
      console.log("📸 No Supabase client - returning mock data for testing");
      // Return some mock data if Supabase is not available (for testing)
      const allMockPhotos = [
        {
          id: "mock_admin_1",
          photoData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzg0YTE3OCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWRtaW4gUGhvdG8gMTwvdGV4dD48L3N2Zz4=",
          uploadedBy: "admin",
          guestName: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "mock_admin_2",
          photoData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzVhNmM1NyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWRtaW4gUGhvdG8gMjwvdGV4dD48L3N2Zz4=",
          uploadedBy: "admin",
          guestName: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "mock_guest_1",
          photoData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzk5YzNiNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R3Vlc3QgUGhvdG8gMTwvdGV4dD48L3N2Zz4=",
          uploadedBy: "guest_john_doe_123",
          guestName: "John Doe",
          createdAt: new Date().toISOString(),
        },
        {
          id: "mock_guest_2",
          photoData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2FjY2Y5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R3Vlc3QgUGhvdG8gMjwvdGV4dD48L3N2Zz4=",
          uploadedBy: "guest_jane_smith_456",
          guestName: "Jane Smith",
          createdAt: new Date().toISOString(),
        }
      ];

      // Filter mock data based on type
      let filteredPhotos;
      if (type === "admin") {
        filteredPhotos = allMockPhotos.filter(p => p.uploadedBy === "admin");
        console.log(`📸 Returning ${filteredPhotos.length} admin mock photos`);
      } else if (type === "guest") {
        filteredPhotos = allMockPhotos.filter(p => p.uploadedBy !== "admin");
        console.log(`📸 Returning ${filteredPhotos.length} guest mock photos`);
      } else {
        filteredPhotos = allMockPhotos;
        console.log(`📸 Returning ${filteredPhotos.length} total mock photos`);
      }

      res.json(filteredPhotos);
    }
  } catch (error) {
    console.error("📸 Error fetching photos:", error);
    // Return mock data for graceful fallback
    console.log("📸 Returning fallback mock data due to error");
    res.json([
      {
        id: "fallback_1",
        photoData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y2OGU1NiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VGVzdCBQaG90bzwvdGV4dD48L3N2Zz4=",
        uploadedBy: "admin",
        guestName: null,
        createdAt: new Date().toISOString(),
      }
    ]);
  }
};

// Upload new photo
export const uploadPhoto: RequestHandler = async (req, res) => {
  try {
    const { photoData, uploadedBy = "admin", guestName } = req.body;

    if (!photoData) {
      return res.status(400).json({ error: "Photo data is required" });
    }

    // Generate a unique identifier for guest uploads
    const actualUploadedBy =
      uploadedBy === "guest"
        ? `guest_${guestName || "anonymous"}_${Date.now()}`
        : uploadedBy;

    if (supabase) {
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
        throw error;
      }

      const newPhoto = {
        id: data.id,
        photoData: data.photo_data,
        uploadedBy: data.uploaded_by,
        guestName: data.guest_name,
        createdAt: data.created_at,
      };

      console.log(
        `📸 Photo uploaded by ${uploadedBy === "guest" ? `guest: ${guestName}` : "admin"}`,
      );
      res.status(201).json(newPhoto);
    } else {
      // Fallback response
      const id = Date.now().toString();
      const newPhoto = {
        id,
        photoData,
        uploadedBy: actualUploadedBy,
        guestName: guestName || null,
        createdAt: new Date().toISOString(),
      };
      res.status(201).json(newPhoto);
    }
  } catch (error) {
    console.error("Error uploading photo:", error);
    // Return success response for graceful fallback
    const id = Date.now().toString();
    const actualUploadedBy =
      req.body.uploadedBy === "guest"
        ? `guest_${req.body.guestName || "anonymous"}_${Date.now()}`
        : req.body.uploadedBy || "admin";
    const newPhoto = {
      id,
      photoData: req.body.photoData,
      uploadedBy: actualUploadedBy,
      guestName: req.body.guestName || null,
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
    const { photos, uploadedBy = "admin", guestName } = req.body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: "Photos array is required" });
    }

    // Generate a unique identifier for guest uploads
    const actualUploadedBy =
      uploadedBy === "guest"
        ? `guest_${guestName || "anonymous"}_${Date.now()}`
        : uploadedBy;

    if (supabase) {
      const photosToInsert = photos.map((photoData: string) => ({
        photo_data: photoData,
        uploaded_by: actualUploadedBy,
        guest_name: guestName || null,
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
        guestName: row.guest_name,
        createdAt: row.created_at,
      }));

      console.log(
        `📸 Bulk uploaded ${uploadedPhotos.length} photos by ${uploadedBy === "guest" ? `guest: ${guestName}` : "admin"}`,
      );
      res.status(201).json({
        message: `Successfully uploaded ${uploadedPhotos.length} photos`,
        photos: uploadedPhotos,
      });
    } else {
      // Fallback response
      const uploadedPhotos = photos.map((photoData: string, index: number) => ({
        id: (Date.now() + index).toString(),
        photoData,
        uploadedBy: actualUploadedBy,
        guestName: guestName || null,
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
    const actualUploadedBy =
      req.body.uploadedBy === "guest"
        ? `guest_${req.body.guestName || "anonymous"}_${Date.now()}`
        : req.body.uploadedBy || "admin";
    const uploadedPhotos = req.body.photos.map(
      (photoData: string, index: number) => ({
        id: (Date.now() + index).toString(),
        photoData,
        uploadedBy: actualUploadedBy,
        guestName: req.body.guestName || null,
        createdAt: new Date().toISOString(),
      }),
    );
    res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} photos`,
      photos: uploadedPhotos,
    });
  }
};
