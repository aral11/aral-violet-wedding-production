import {
  supabase,
  SupabaseGuest,
  SupabasePhoto,
  SupabaseWeddingFlow,
  SupabaseInvitation,
} from "./supabase";
import { measureAsyncOperation } from "./performance";

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return supabase !== null && supabase !== undefined;
};

// Test if Supabase is actually reachable
const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) return false;

  try {
    // Simple connectivity test
    const { data, error } = await supabase.from("photos").select("id").limit(1);

    return !error; // Return true if no error
  } catch (error) {
    console.warn("Supabase connectivity test failed:", error);
    return false;
  }
};

// Guest Database Service
export const guestService = {
  async getAll(): Promise<SupabaseGuest[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("guests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Sync to localStorage for offline access
        if (data) {
          localStorage.setItem("wedding_guests", JSON.stringify(data));
        }

        return data || [];
      } catch (error) {
        console.warn("Supabase unavailable, using localStorage:", error);
        return this.getFromLocalStorage();
      }
    }
    return this.getFromLocalStorage();
  },

  async create(
    guest: Omit<SupabaseGuest, "id" | "created_at" | "updated_at">,
  ): Promise<SupabaseGuest> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("guests")
          .insert([guest])
          .select()
          .single();

        if (error) throw error;

        // Also save to localStorage
        this.saveToLocalStorage(data);

        return data;
      } catch (error) {
        console.warn("Supabase unavailable, saving to localStorage:", error);
        return this.saveToLocalStorage({
          id: Date.now().toString(),
          ...guest,
          created_at: new Date().toISOString(),
        });
      }
    }

    return this.saveToLocalStorage({
      id: Date.now().toString(),
      ...guest,
      created_at: new Date().toISOString(),
    });
  },

  async update(
    id: string,
    updates: Partial<Omit<SupabaseGuest, "id" | "created_at">>,
  ): Promise<SupabaseGuest> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("guests")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        // Update localStorage as well
        this.updateInLocalStorage(id, data);

        return data;
      } catch (error) {
        console.warn("Supabase unavailable, updating in localStorage:", error);
        return this.updateInLocalStorage(id, updates);
      }
    }

    return this.updateInLocalStorage(id, updates);
  },

  getFromLocalStorage(): SupabaseGuest[] {
    const saved = localStorage.getItem("wedding_guests");
    return saved ? JSON.parse(saved) : [];
  },

  saveToLocalStorage(guest: SupabaseGuest): SupabaseGuest {
    const existing = this.getFromLocalStorage();
    const updated = [...existing, guest];
    localStorage.setItem("wedding_guests", JSON.stringify(updated));
    return guest;
  },

  updateInLocalStorage(
    id: string,
    updates: Partial<SupabaseGuest>,
  ): SupabaseGuest {
    const existing = this.getFromLocalStorage();
    const index = existing.findIndex((guest) => guest.id === id);

    if (index === -1) {
      throw new Error("Guest not found for update");
    }

    const updatedGuest = { ...existing[index], ...updates };
    existing[index] = updatedGuest;
    localStorage.setItem("wedding_guests", JSON.stringify(existing));
    return updatedGuest;
  },
};

// Photo Database Service
export const photoService = {
  async getAll(): Promise<SupabasePhoto[]> {
    console.log("📸 photoService.getAll() called");

    // Check deployment environment more carefully
    const hostname = window.location.hostname;
    const isNetlifyDeployment =
      hostname.includes("netlify") ||
      hostname.includes("netlify.app") ||
      import.meta.env.VITE_DEPLOYMENT_PLATFORM === "netlify";

    console.log("📸 Environment check:", {
      hostname,
      isNetlifyDeployment,
      deploymentPlatform: import.meta.env.VITE_DEPLOYMENT_PLATFORM
    });

    // Only try Netlify functions if we're actually on Netlify
    if (isNetlifyDeployment) {
      console.log("📸 Detected Netlify deployment, using Netlify Functions...");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced timeout

        // Try the dedicated Netlify function first
        const response = await fetch("/.netlify/functions/photos-get", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const apiPhotos = await response.json();
          console.log(
            `📸 SUCCESS: Found ${apiPhotos.length} photos via Netlify API`,
          );

          if (apiPhotos && apiPhotos.length > 0) {
            // Convert API response to SupabasePhoto format
            const photos = apiPhotos.map((photo: any) => ({
              id: photo.id,
              photo_data: photo.photoData || photo.photo_data,
              uploaded_by: photo.uploadedBy || photo.uploaded_by || "admin",
              guest_name: photo.guestName || photo.guest_name || null,
              created_at:
                photo.createdAt || photo.created_at || new Date().toISOString(),
            }));

            // Validate the photos have proper data (data URLs or HTTP URLs)
            const validPhotos = photos.filter(
              (p) =>
                p.photo_data &&
                (p.photo_data.startsWith("data:image/") ||
                  p.photo_data.startsWith("http") ||
                  p.photo_data.startsWith("blob:")),
            );
            console.log(
              `📸 ${validPhotos.length} photos have valid URLs from Netlify API`,
            );

            if (validPhotos.length > 0) {
              console.log("📸 Returning valid photos from Netlify API");
              return validPhotos;
            }
          }
        } else {
          console.log(
            `📸 Netlify API returned ${response.status}: ${response.statusText}`,
          );
        }
      } catch (apiError) {
        console.log(
          "📸 Netlify API connection failed:",
          apiError instanceof Error ? apiError.message : apiError,
        );
      }
    }

    // Try direct Supabase connection for non-Netlify environments
    if (supabase && !isNetlifyDeployment) {
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

          if (validPhotos.length > 0) {
            console.log("📸 Returning photos from direct Supabase connection");
            // Save to localStorage for next time
            this.syncSupabaseToLocalStorage(validPhotos);
            return validPhotos;
          }
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

    // If everything fails, return empty array - no fallback photos
    console.log(
      "📸 No photos found from any source. Upload photos via admin panel or guest upload to see them here.",
    );
    return [];
  },

  async getAdminPhotos(): Promise<SupabasePhoto[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("photos")
          .select("*")
          .eq("uploaded_by", "admin")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn("Supabase unavailable, filtering localStorage:", error);
        return this.getFromLocalStorage().filter(
          (p) => p.uploaded_by === "admin",
        );
      }
    }
    return this.getFromLocalStorage().filter((p) => p.uploaded_by === "admin");
  },

  async getGuestPhotos(): Promise<SupabasePhoto[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("photos")
          .select("*")
          .neq("uploaded_by", "admin")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn("Supabase unavailable, filtering localStorage:", error);
        return this.getFromLocalStorage().filter(
          (p) => p.uploaded_by !== "admin",
        );
      }
    }
    return this.getFromLocalStorage().filter((p) => p.uploaded_by !== "admin");
  },

  async create(
    photoData: string,
    uploadedBy = "admin",
    guestName?: string,
  ): Promise<SupabasePhoto> {
    const actualUploadedBy =
      uploadedBy === "guest"
        ? `guest_${guestName || "anonymous"}_${Date.now()}`
        : uploadedBy;

    // Check if we're on Netlify
    const isNetlifyDeployment =
      window.location.hostname.includes("netlify") ||
      window.location.hostname.includes("netlify.app") ||
      import.meta.env.VITE_DEPLOYMENT_PLATFORM === "netlify";

    // For Netlify deployments, use Netlify Functions
    if (isNetlifyDeployment) {
      try {
        console.log("📸 Using Netlify Functions for photo upload...");
        const response = await fetch("/.netlify/functions/photos-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            photoData,
            uploadedBy,
            guestName,
          }),
        });

        if (response.ok) {
          const savedPhoto = await response.json();
          console.log("✅ Photo uploaded via Netlify Functions");

          // Convert response to SupabasePhoto format
          const photo = {
            id: savedPhoto.id,
            photo_data: savedPhoto.photoData || savedPhoto.photo_data,
            uploaded_by: savedPhoto.uploadedBy || savedPhoto.uploaded_by,
            guest_name: savedPhoto.guestName || savedPhoto.guest_name,
            created_at: savedPhoto.createdAt || savedPhoto.created_at,
          };

          // Also save to localStorage for offline access
          this.saveToLocalStorage(
            photo.photo_data,
            actualUploadedBy,
            guestName,
          );

          // Trigger gallery refresh
          this.clearGalleryCache();

          return photo;
        } else {
          const errorData = await response.json();
          console.error("❌ Netlify Functions upload failed:", errorData);
          throw new Error(errorData.error || "Upload failed");
        }
      } catch (error) {
        console.warn(
          "Netlify Functions unavailable, falling back to direct Supabase:",
          error,
        );
      }
    }

    // For non-Netlify or fallback, try direct Supabase with Storage
    if (isSupabaseConfigured()) {
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
        const { data: storageData, error: storageError } =
          await supabase.storage.from("wedding-photos").upload(filePath, blob, {
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
              uploaded_by: actualUploadedBy,
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

        // Also save to localStorage for offline access
        this.saveToLocalStorage(publicUrl, actualUploadedBy, guestName);

        // Trigger gallery refresh
        this.clearGalleryCache();

        return data;
      } catch (error) {
        console.warn(
          "Direct Supabase unavailable, saving to localStorage:",
          error,
        );
      }
    }

    // Fallback to localStorage only
    console.log("📸 Saving photo to localStorage as fallback");
    this.saveToLocalStorage(photoData, actualUploadedBy, guestName);

    // Trigger gallery refresh
    this.clearGalleryCache();

    return {
      id: Date.now().toString(),
      photo_data: photoData,
      uploaded_by: actualUploadedBy,
      guest_name: guestName || null,
      created_at: new Date().toISOString(),
    };
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("photos").delete().eq("id", id);

        if (error) throw error;

        // Also remove from localStorage
        this.removeFromLocalStorage(id);
      } catch (error) {
        console.warn(
          "Supabase unavailable, removing from localStorage:",
          error,
        );
        this.removeFromLocalStorage(id);
      }
    } else {
      this.removeFromLocalStorage(id);
    }
  },

  getFromLocalStorage(): SupabasePhoto[] {
    console.log("📸 localStorage disabled for analytics fix - returning empty array");
    return [];

    console.log("📸 localStorage check:", {
      adminPhotos: saved ? "found" : "not found",
      guestPhotos: guestSaved ? "found" : "not found",
    });

    // No fallback photos - show empty state when no real photos exist
    // This ensures users only see actual uploaded photos

    // Load admin photos
    if (saved) {
      try {
        const photoData = JSON.parse(saved);
        console.log(
          `📸 Found ${photoData.length} admin photos in localStorage`,
        );

        const adminPhotos = photoData
          .filter((data: string) => data && data.startsWith("data:image/"))
          .map((data: string, index: number) => ({
            id: `admin_${index}`,
            photo_data: data,
            uploaded_by: "admin",
            guest_name: null,
            created_at: new Date().toISOString(),
          }));
        photos.push(...adminPhotos);
        console.log(`📸 Loaded ${adminPhotos.length} valid admin photos`);
      } catch (error) {
        console.warn(
          "��� Error parsing admin photos from localStorage:",
          error,
        );
      }
    }

    // Load guest photos
    if (guestSaved) {
      try {
        const guestPhotoData = JSON.parse(guestSaved);
        console.log(
          `📸 Found ${guestPhotoData.length} guest photos in localStorage`,
        );

        const guestPhotos = guestPhotoData
          .filter(
            (photo: any) => photo && (photo.photoData || photo.photo_data),
          )
          .map((photo: any, index: number) => ({
            id: `guest_${index}`,
            photo_data: photo.photoData || photo.photo_data,
            uploaded_by:
              photo.uploadedBy ||
              photo.uploaded_by ||
              `guest_${photo.guestName || "anonymous"}_${Date.now()}`,
            guest_name: photo.guestName || photo.guest_name,
            created_at:
              photo.createdAt || photo.created_at || new Date().toISOString(),
          }));
        photos.push(...guestPhotos);
        console.log(`📸 Loaded ${guestPhotos.length} valid guest photos`);
      } catch (error) {
        console.warn("📸 Error parsing guest photos from localStorage:", error);
      }
    }

    const sortedPhotos = photos.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );

    console.log(`📸 localStorage total: ${sortedPhotos.length} photos`);
    return sortedPhotos;
  },

  saveToLocalStorage(
    photoData: string,
    uploadedBy = "admin",
    guestName?: string,
  ): void {
    try {
      if (uploadedBy === "admin") {
        // Save admin photos to wedding_photos
        const existing = localStorage.getItem("wedding_photos");
        const photos = existing ? JSON.parse(existing) : [];
        photos.push(photoData);
        localStorage.setItem("wedding_photos", JSON.stringify(photos));
        console.log(`📸 Admin photo saved to localStorage`);

        // Clear gallery cache to force refresh
        this.clearGalleryCache();
      } else {
        // Save guest photos to wedding_guest_photos with metadata
        const existing = localStorage.getItem("wedding_guest_photos");
        const guestPhotos = existing ? JSON.parse(existing) : [];
        const guestPhoto = {
          photoData,
          uploadedBy,
          guestName,
          createdAt: new Date().toISOString(),
        };
        guestPhotos.push(guestPhoto);
        localStorage.setItem(
          "wedding_guest_photos",
          JSON.stringify(guestPhotos),
        );
        console.log(`📸 Guest photo from ${guestName} saved to localStorage`);

        // Clear gallery cache to force refresh
        this.clearGalleryCache();
      }
    } catch (error) {
      console.error("Error saving photo to localStorage:", error);
    }
  },

  // Clear all gallery-related cache
  clearGalleryCache(): void {
    try {
      // Clear any potential cached photo URLs
      console.log("🗑️ Clearing gallery cache...");

      // Dispatch storage event to notify other components
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "wedding_photos",
          storageArea: localStorage,
        }),
      );

      // Also dispatch for guest photos
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "wedding_guest_photos",
          storageArea: localStorage,
        }),
      );

      console.log("✅ Gallery cache cleared");
    } catch (error) {
      console.error("Error clearing gallery cache:", error);
    }
  },

  // Force refresh all photo data
  async forceRefresh(): Promise<SupabasePhoto[]> {
    console.log("🔄 Force refreshing photo data...");

    // Clear cache first
    this.clearGalleryCache();

    // Get fresh data
    const photos = await this.getAll();
    console.log(`🔄 Force refresh complete: ${photos.length} photos loaded`);

    return photos;
  },

  removeFromLocalStorage(id: string): void {
    const photos = this.getFromLocalStorage();
    const filtered = photos.filter((p) => p.id !== id);
    const photoData = filtered.map((p) => p.photo_data);
    localStorage.setItem("wedding_photos", JSON.stringify(photoData));
  },

  syncSupabaseToLocalStorage(photos: SupabasePhoto[]): void {
    try {
      // Separate admin and guest photos for proper storage
      const adminPhotos = photos
        .filter((p) => p.uploaded_by === "admin")
        .map((p) => p.photo_data);

      const guestPhotos = photos
        .filter((p) => p.uploaded_by !== "admin")
        .map((p) => ({
          photoData: p.photo_data,
          uploadedBy: p.uploaded_by,
          guestName: p.guest_name,
          createdAt: p.created_at,
        }));

      if (adminPhotos.length > 0) {
        localStorage.setItem("wedding_photos", JSON.stringify(adminPhotos));
      }

      if (guestPhotos.length > 0) {
        localStorage.setItem(
          "wedding_guest_photos",
          JSON.stringify(guestPhotos),
        );
      }

      console.log(`📸 Synced ${photos.length} photos to localStorage`);
    } catch (error) {
      console.error("📸 Error syncing photos to localStorage:", error);
    }
  },
};

// Wedding Flow Database Service
export const weddingFlowService = {
  async getAll(): Promise<SupabaseWeddingFlow[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("wedding_flow")
          .select("*")
          .order("time", { ascending: true });

        if (error) throw error;

        // Sync to localStorage
        if (data) {
          localStorage.setItem("wedding_flow", JSON.stringify(data));
        }

        return data || [];
      } catch (error) {
        console.warn("Supabase unavailable, using localStorage:", error);
        return this.getFromLocalStorage();
      }
    }
    return this.getFromLocalStorage();
  },

  async create(
    flowItem: Omit<SupabaseWeddingFlow, "id" | "created_at" | "updated_at">,
  ): Promise<SupabaseWeddingFlow> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("wedding_flow")
          .insert([flowItem])
          .select()
          .single();

        if (error) throw error;

        // Also save to localStorage
        this.saveToLocalStorage(data);

        return data;
      } catch (error) {
        console.warn("Supabase unavailable, saving to localStorage:", error);
        return this.saveToLocalStorage({
          id: Date.now().toString(),
          ...flowItem,
          created_at: new Date().toISOString(),
        });
      }
    }

    return this.saveToLocalStorage({
      id: Date.now().toString(),
      ...flowItem,
      created_at: new Date().toISOString(),
    });
  },

  getFromLocalStorage(): SupabaseWeddingFlow[] {
    const saved = localStorage.getItem("wedding_flow");
    return saved ? JSON.parse(saved) : [];
  },

  saveToLocalStorage(flowItem: SupabaseWeddingFlow): SupabaseWeddingFlow {
    const existing = this.getFromLocalStorage();
    const updated = [...existing, flowItem];
    localStorage.setItem("wedding_flow", JSON.stringify(updated));
    return flowItem;
  },
};

// Invitation Database Service
export const invitationService = {
  async get(): Promise<SupabaseInvitation | null> {
    if (isSupabaseConfigured()) {
      try {
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
          return this.getFromLocalStorage();
        }

        // Sync to localStorage
        this.saveToLocalStorage(data);

        return data;
      } catch (error) {
        console.warn("Supabase unavailable, using localStorage:", error);
        return this.getFromLocalStorage();
      }
    }
    return this.getFromLocalStorage();
  },

  async upload(
    pdfData: string,
    filename?: string,
  ): Promise<SupabaseInvitation> {
    if (isSupabaseConfigured()) {
      try {
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

        if (error) throw error;

        // Also save to localStorage
        this.saveToLocalStorage(data);

        return data;
      } catch (error) {
        console.warn("Supabase unavailable, saving to localStorage:", error);
        return this.saveToLocalStorage({
          id: 1,
          pdf_data: pdfData,
          filename: filename || "wedding-invitation.pdf",
          uploaded_at: new Date().toISOString(),
        });
      }
    }

    return this.saveToLocalStorage({
      id: 1,
      pdf_data: pdfData,
      filename: filename || "wedding-invitation.pdf",
      uploaded_at: new Date().toISOString(),
    });
  },

  async delete(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("invitations")
          .delete()
          .neq("id", 0); // Delete all invitations

        if (error) throw error;

        // Also remove from localStorage
        this.removeFromLocalStorage();
      } catch (error) {
        console.warn(
          "Supabase unavailable, removing from localStorage:",
          error,
        );
        this.removeFromLocalStorage();
      }
    } else {
      this.removeFromLocalStorage();
    }
  },

  getFromLocalStorage(): SupabaseInvitation | null {
    const savedPdf = localStorage.getItem("wedding_invitation_pdf");
    const savedFilename = localStorage.getItem("wedding_invitation_filename");

    if (savedPdf) {
      return {
        id: 1,
        pdf_data: savedPdf,
        filename: savedFilename || "wedding-invitation.pdf",
        uploaded_at: new Date().toISOString(),
      };
    }
    return null;
  },

  saveToLocalStorage(invitation: SupabaseInvitation): SupabaseInvitation {
    localStorage.setItem("wedding_invitation_pdf", invitation.pdf_data);
    if (invitation.filename) {
      localStorage.setItem("wedding_invitation_filename", invitation.filename);
    }
    return invitation;
  },

  removeFromLocalStorage(): void {
    localStorage.removeItem("wedding_invitation_pdf");
    localStorage.removeItem("wedding_invitation_filename");
  },
};

// Export unified service that auto-detects best storage method
export const database = {
  guests: guestService,
  photos: photoService,
  weddingFlow: weddingFlowService,
  invitation: invitationService,

  // Check if we're using Supabase or localStorage
  isUsingSupabase: isSupabaseConfigured,

  // Get storage status for admin dashboard
  getStorageStatus() {
    return {
      type: isSupabaseConfigured() ? "Supabase Database" : "Local Storage",
      syncsAcrossDevices: isSupabaseConfigured(),
      realTime: isSupabaseConfigured(),
    };
  },
};
