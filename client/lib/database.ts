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

  async create(
    photoData: string,
    uploadedBy = "admin",
  ): Promise<SupabasePhoto> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("photos")
          .insert([{ photo_data: photoData, uploaded_by: uploadedBy }])
          .select()
          .single();

        if (error) throw error;

        // Also save to localStorage
        this.saveToLocalStorage(photoData);

        return data;
      } catch (error) {
        console.warn("Supabase unavailable, saving to localStorage:", error);
        this.saveToLocalStorage(photoData);
        return {
          id: Date.now().toString(),
          photo_data: photoData,
          uploaded_by: uploadedBy,
          created_at: new Date().toISOString(),
        };
      }
    }

    this.saveToLocalStorage(photoData);
    return {
      id: Date.now().toString(),
      photo_data: photoData,
      uploaded_by: uploadedBy,
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
    if (saved) {
      const photoData = JSON.parse(saved);
      return photoData.map((data: string, index: number) => ({
        id: index.toString(),
        photo_data: data,
        uploaded_by: "admin",
        created_at: new Date().toISOString(),
      }));
    }
    return [];
  },

  saveToLocalStorage(photoData: string): void {
    const existing = localStorage.getItem("wedding_photos");
    const photos = existing ? JSON.parse(existing) : [];
    photos.push(photoData);
    localStorage.setItem("wedding_photos", JSON.stringify(photos));
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

// Export unified service that auto-detects best storage method
export const database = {
  guests: guestService,
  photos: photoService,
  weddingFlow: weddingFlowService,

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
