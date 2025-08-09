// API utility functions for wedding website

const API_BASE = "/api";

// Types
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  attending: boolean;
  guests: number;
  side: "groom" | "bride";
  message?: string;
  dietaryRestrictions?: string;
  needsAccommodation: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface WeddingPhoto {
  id: string;
  photoData: string;
  uploadedBy: string;
  createdAt: string;
}

export interface WeddingFlowItem {
  id: string;
  time: string;
  title: string;
  description: string;
  duration?: string;
  type: "ceremony" | "reception" | "entertainment" | "meal" | "special";
  createdAt: string;
  updatedAt?: string;
}

export interface WeddingInvitation {
  id: number;
  pdfData: string;
  filename?: string;
  uploadedAt: string;
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return response.json();
  } catch (error) {
    // Handle all fetch-related errors gracefully
    if (error instanceof TypeError) {
      // This includes "Failed to fetch" and other network errors
      throw new Error("API_UNAVAILABLE");
    }

    // Handle other response errors
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unknown errors
    throw new Error("API_ERROR");
  }
}

// Guests API
export const guestsApi = {
  async getAll(): Promise<Guest[]> {
    return apiCall<Guest[]>("/guests");
  },

  async create(
    guest: Omit<Guest, "id" | "createdAt" | "updatedAt">,
  ): Promise<Guest> {
    return apiCall<Guest>("/guests", {
      method: "POST",
      body: JSON.stringify(guest),
    });
  },

  async update(
    id: string,
    guest: Partial<Guest>,
  ): Promise<{ message: string }> {
    return apiCall<{ message: string }>(`/guests/${id}`, {
      method: "PUT",
      body: JSON.stringify(guest),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiCall<{ message: string }>(`/guests/${id}`, {
      method: "DELETE",
    });
  },
};

// Photos API
export const photosApi = {
  async getAll(): Promise<WeddingPhoto[]> {
    return apiCall<WeddingPhoto[]>("/photos");
  },

  async upload(photoData: string, uploadedBy = "admin"): Promise<WeddingPhoto> {
    return apiCall<WeddingPhoto>("/photos", {
      method: "POST",
      body: JSON.stringify({ photoData, uploadedBy }),
    });
  },

  async bulkUpload(
    photos: string[],
    uploadedBy = "admin",
  ): Promise<{ message: string; photos: WeddingPhoto[] }> {
    return apiCall<{ message: string; photos: WeddingPhoto[] }>(
      "/photos/bulk",
      {
        method: "POST",
        body: JSON.stringify({ photos, uploadedBy }),
      },
    );
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiCall<{ message: string }>(`/photos/${id}`, {
      method: "DELETE",
    });
  },
};

// Wedding Flow API
export const weddingFlowApi = {
  async getAll(): Promise<WeddingFlowItem[]> {
    return apiCall<WeddingFlowItem[]>("/wedding-flow");
  },

  async create(
    flowItem: Omit<WeddingFlowItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<WeddingFlowItem> {
    return apiCall<WeddingFlowItem>("/wedding-flow", {
      method: "POST",
      body: JSON.stringify(flowItem),
    });
  },

  async update(
    id: string,
    flowItem: Partial<WeddingFlowItem>,
  ): Promise<{ message: string }> {
    return apiCall<{ message: string }>(`/wedding-flow/${id}`, {
      method: "PUT",
      body: JSON.stringify(flowItem),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiCall<{ message: string }>(`/wedding-flow/${id}`, {
      method: "DELETE",
    });
  },
};

// Invitation API
export const invitationApi = {
  async get(): Promise<WeddingInvitation | null> {
    try {
      return await apiCall<WeddingInvitation>("/invitation");
    } catch (error) {
      // Return null if no invitation found
      if (
        error instanceof Error &&
        error.message.includes("No invitation found")
      ) {
        return null;
      }
      throw error;
    }
  },

  async upload(pdfData: string, filename?: string): Promise<WeddingInvitation> {
    return apiCall<WeddingInvitation>("/invitation", {
      method: "POST",
      body: JSON.stringify({ pdfData, filename }),
    });
  },

  async delete(): Promise<{ message: string }> {
    return apiCall<{ message: string }>("/invitation", {
      method: "DELETE",
    });
  },
};

// Error handling utility
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
