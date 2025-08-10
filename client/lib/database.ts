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

    // First try direct Supabase connection (prioritize real-time data)
    if (supabase) {
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
            (p) => p.photo_data && (p.photo_data.startsWith("data:") || p.photo_data.startsWith("http")),
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

    // Try localStorage as fallback
    const localPhotos = this.getFromLocalStorage();
    console.log(`📸 Found ${localPhotos.length} photos in localStorage`);

    if (localPhotos.length > 0) {
      console.log("📸 Returning photos from localStorage fallback");
      return localPhotos;
    }


    // Try API as backup (but handle fetch errors gracefully)
    try {
      console.log("📸 Attempting API connection...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("/api/photos", {
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
        console.log(`📸 SUCCESS: Found ${apiPhotos.length} photos via API`);

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

          // Validate the photos have proper data (data URLs or Supabase URLs)
          const validPhotos = photos.filter(
            (p) => p.photo_data && (p.photo_data.startsWith("data:") || p.photo_data.startsWith("http")),
          );
          console.log(`📸 ${validPhotos.length} photos have valid URLs from API`);

          if (validPhotos.length > 0) {
            console.log("📸 Returning valid photos from API");
            // Save to localStorage for future use
            this.syncSupabaseToLocalStorage(validPhotos);
            return validPhotos;
          }
        }
      }
    } catch (apiError) {
      console.log(
        "📸 API connection failed (this is expected if network is limited):",
        apiError.message,
      );
    }

    // If everything fails, return diagnostic placeholder photos
    console.log("📸 All connections failed, returning diagnostic placeholder photos...");
    const diagnosticPhotos: SupabasePhoto[] = [
      {
        id: "diagnostic_1",
        photo_data:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VmNDQ0NCIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gUGhvdG9zIEZvdW5kPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2hlY2sgU3VwYWJhc2U8L3RleHQ+PC9zdmc+",
        uploaded_by: "system",
        guest_name: null,
        created_at: new Date().toISOString(),
      },
      {
        id: "diagnostic_2",
        photo_data:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5NzMxNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RGF0YWJhc2UgSXNzdWU8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5VcGxvYWQgUGhvdG9zPC90ZXh0Pjwvc3ZnPg==",
        uploaded_by: "system",
        guest_name: null,
        created_at: new Date().toISOString(),
      },
      {
        id: "diagnostic_3",
        photo_data:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGhvdG9zIFdpbGwgQXBwZWFyPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWZ0ZXIgVXBsb2FkPC90ZXh0Pjwvc3ZnPg==",
        uploaded_by: "system",
        guest_name: null,
        created_at: new Date().toISOString(),
      },
      {
        id: "diagnostic_status",
        photo_data:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzY2NjY2NiIvPjx0ZXh0IHg9IjUwJSIgeT0iMzAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U3RhdHVzPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gUmVhbCBQaG90b3M8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI3MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Gb3VuZCBZZXQ8L3RleHQ+PC9zdmc+",
        uploaded_by: "system",
        guest_name: null,
        created_at: new Date().toISOString(),
      },
    ];

    return diagnosticPhotos;
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

    if (isSupabaseConfigured()) {
      try {
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

        if (error) throw error;

        // Also save to localStorage
        this.saveToLocalStorage(photoData, actualUploadedBy, guestName);

        return data;
      } catch (error) {
        console.warn("Supabase unavailable, saving to localStorage:", error);
        this.saveToLocalStorage(photoData, actualUploadedBy, guestName);
        return {
          id: Date.now().toString(),
          photo_data: photoData,
          uploaded_by: actualUploadedBy,
          guest_name: guestName || null,
          created_at: new Date().toISOString(),
        };
      }
    }

    this.saveToLocalStorage(photoData, actualUploadedBy, guestName);
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
    console.log("📸 Loading photos from localStorage...");
    const saved = localStorage.getItem("wedding_photos");
    const guestSaved = localStorage.getItem("wedding_guest_photos");
    const photos: SupabasePhoto[] = [];

    console.log("📸 localStorage check:", {
      adminPhotos: saved ? "found" : "not found",
      guestPhotos: guestSaved ? "found" : "not found",
    });

    // Add some test photos if none exist (for development/testing)
    if (!saved && !guestSaved && typeof window !== "undefined") {
      console.log("📸 Adding test photos for development...");
      const testAdminPhotos = [
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzg0YTE3OCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWRtaW4gUGhvdG8gMTwvdGV4dD48L3N2Zz4=",
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzVhNmM1NyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWRtaW4gUGhvdG8gMjwvdGV4dD48L3N2Zz4=",
      ];
      const testGuestPhotos = [
        {
          photoData:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzk5YzNiNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R3Vlc3QgUGhvdG8gMTwvdGV4dD48L3N2Zz4=",
          uploadedBy: "guest_john_doe_1234567890",
          guestName: "John Doe",
          createdAt: new Date().toISOString(),
        },
        {
          photoData:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2FjY2Y5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R3Vlc3QgUGhvdG8gMjwvdGV4dD48L3N2Zz4=",
          uploadedBy: "guest_jane_smith_1234567891",
          guestName: "Jane Smith",
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem("wedding_photos", JSON.stringify(testAdminPhotos));
      localStorage.setItem(
        "wedding_guest_photos",
        JSON.stringify(testGuestPhotos),
      );
      console.log("📸 Test photos added to localStorage");
    }

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
      }
    } catch (error) {
      console.error("Error saving photo to localStorage:", error);
    }
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
