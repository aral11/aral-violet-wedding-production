export interface RSVPDetails {
  name: string;
  email: string;
  phone: string;
  attending: boolean;
  guests: number;
  side: "groom" | "bride";
  message?: string;
  dietaryRestrictions?: string;
  needsAccommodation: boolean;
}

const API_BASE = "/api";

export const sendRSVPNotification = async (
  rsvpDetails: RSVPDetails,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/sms/send-rsvp-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rsvpDetails }),
    });

    if (!response.ok) {
      console.error("SMS API error:", response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    console.log("SMS API response:", result);

    return result.success || false;
  } catch (error) {
    console.error("Failed to send SMS notification:", error);
    return false;
  }
};

export const testSMSService = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/sms/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "SMS test API error:",
        response.status,
        response.statusText,
      );
      return false;
    }

    const result = await response.json();
    console.log("SMS test API response:", result);

    return result.success || false;
  } catch (error) {
    console.error("Failed to test SMS service:", error);
    return false;
  }
};

export const isSMSConfigured = (): boolean => {
  // SMS is now handled server-side, so it's always "configured" from client perspective
  // The server will handle whether Twilio is actually configured or not
  return true;
};
