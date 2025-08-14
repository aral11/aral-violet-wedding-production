import {
  supabase,
  SupabaseGuest,
  SupabasePhoto,
  SupabaseWeddingFlow,
  SupabaseInvitation,
} from "./supabase";

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return supabase !== null && supabase !== undefined;
};

// Simplified Photo Database Service
export const photoService = {
  async getAll(): Promise<SupabasePhoto[]> {
    console.log("📸 photoService.getAll() called (simplified version)");

    // Only try direct Supabase connection
    if (isSupabaseConfigured()) {
      try {
        console.log("📸 Attempting direct Supabase connection from client...");

        // Test connection first
        const { data: testData, error: testError } = await supabase
          .from("photos")
          .select("count", { count: "exact", head: true });

        if (testError) {
          console.log("📸 Supabase connection test failed:", testError.message);
          throw testError;
        }

        const { data, error } = await supabase
          .from("photos")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          console.log(
            `📸 SUCCESS: Found ${data.length} photos via direct Supabase`,
          );

          const photos = data.map((row: any) => ({
            id: row.id,
            photo_data: row.photo_data,
            uploaded_by: row.uploaded_by,
            guest_name: row.guest_name || null,
            created_at: row.created_at,
          }));

          // Validate the photos have proper data
          const validPhotos = photos.filter(
            (p) =>
              p.photo_data &&
              (p.photo_data.startsWith("data:image/") ||
                p.photo_data.startsWith("http") ||
                p.photo_data.startsWith("blob:")),
          );
          console.log(
            `📸 ${validPhotos.length} photos have valid URLs/data from Supabase`,
          );

          return validPhotos;
        } else if (error) {
          console.log("📸 Direct Supabase error:", error.message);
          throw error;
        } else {
          console.log("📸 No photos found in Supabase");
        }
      } catch (supabaseError) {
        console.log("📸 Direct Supabase failed:", supabaseError);
      }
    }

    // Return empty array if no photos found
    console.log("📸 No photos found - returning empty array");
    return [];
  },

  async create(
    photoData: string,
    uploadedBy = "admin",
    guestName?: string,
  ): Promise<SupabasePhoto> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "Supabase not configured - photos require database connection",
      );
    }

    try {
      console.log("📸 Uploading to Supabase Storage...");

      // Convert base64 to blob
      const response = await fetch(photoData);
      const blob = await response.blob();

      // Generate unique filename
      const fileExtension = blob.type.split("/")[1] || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `wedding-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("wedding-photos")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        console.error("Storage upload error:", storageError);
        throw storageError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("wedding-photos")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log("✅ Photo uploaded to storage, public URL:", publicUrl);

      // Save photo record to database with public URL
      const { data, error } = await supabase
        .from("photos")
        .insert([
          {
            photo_data: publicUrl,
            uploaded_by: uploadedBy,
            guest_name: guestName || null,
          },
        ])
        .select()
        .single();

      if (error) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage.from("wedding-photos").remove([filePath]);
        throw error;
      }

      console.log("✅ Photo record saved to database");
      return data;
    } catch (error) {
      console.error("Photo upload failed:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase not configured");
    }

    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) throw error;
  },
};

// Simplified Guest Database Service
export const guestService = {
  async getAll(): Promise<SupabaseGuest[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("Guest service error:", error);
      return [];
    }
  },

  async create(
    guest: Omit<SupabaseGuest, "id" | "created_at" | "updated_at">,
  ): Promise<SupabaseGuest> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase not configured");
    }

    const { data, error } = await supabase
      .from("guests")
      .insert([guest])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Export unified service
export const database = {
  photos: photoService,
  guests: guestService,

  // Check if we're using Supabase
  isUsingSupabase: isSupabaseConfigured,

  // Get storage status for admin dashboard
  getStorageStatus() {
    return {
      type: isSupabaseConfigured() ? "Supabase Database" : "No Database",
      syncsAcrossDevices: isSupabaseConfigured(),
      realTime: isSupabaseConfigured(),
    };
  },
};
