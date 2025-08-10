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
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("photos")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Sync to localStorage
        if (data) {
          const photoData = data.map((p) => p.photo_data);
          localStorage.setItem("wedding_photos", JSON.stringify(photoData));
        }

        return data || [];
      } catch (error) {
        console.warn("Supabase unavailable, using localStorage:", error);
        return this.getFromLocalStorage();
      }
    }
    return this.getFromLocalStorage();
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
    const saved = localStorage.getItem("wedding_photos");
    const guestSaved = localStorage.getItem("wedding_guest_photos");
    const photos: SupabasePhoto[] = [];

    // Load admin photos
    if (saved) {
      try {
        const photoData = JSON.parse(saved);
        const adminPhotos = photoData.map((data: string, index: number) => ({
          id: `admin_${index}`,
          photo_data: data,
          uploaded_by: "admin",
          guest_name: null,
          created_at: new Date().toISOString(),
        }));
        photos.push(...adminPhotos);
      } catch (error) {
        console.warn("Error parsing admin photos from localStorage:", error);
      }
    }

    // Load guest photos
    if (guestSaved) {
      try {
        const guestPhotoData = JSON.parse(guestSaved);
        const guestPhotos = guestPhotoData.map((photo: any, index: number) => ({
          id: `guest_${index}`,
          photo_data: photo.photoData || photo.photo_data,
          uploaded_by:
            photo.uploadedBy ||
            photo.uploaded_by ||
            `guest_${photo.guestName}_${Date.now()}`,
          guest_name: photo.guestName || photo.guest_name,
          created_at:
            photo.createdAt || photo.created_at || new Date().toISOString(),
        }));
        photos.push(...guestPhotos);
      } catch (error) {
        console.warn("Error parsing guest photos from localStorage:", error);
      }
    }

    return photos.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
  },

  saveToLocalStorage(
    photoData: string,
    uploadedBy = "admin",
    guestName?: string,
  ): void {
    if (uploadedBy === "admin") {
      // Save admin photos to wedding_photos
      const existing = localStorage.getItem("wedding_photos");
      const photos = existing ? JSON.parse(existing) : [];
      photos.push(photoData);
      localStorage.setItem("wedding_photos", JSON.stringify(photos));
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
      localStorage.setItem("wedding_guest_photos", JSON.stringify(guestPhotos));
    }
  },

  removeFromLocalStorage(id: string): void {
    const photos = this.getFromLocalStorage();
    const filtered = photos.filter((p) => p.id !== id);
    const photoData = filtered.map((p) => p.photo_data);
    localStorage.setItem("wedding_photos", JSON.stringify(photoData));
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
