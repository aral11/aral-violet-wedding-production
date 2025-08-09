import { Handler } from "@netlify/functions";
import twilio from "twilio";

// Twilio configuration from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Family phone numbers to notify
const NOTIFICATION_NUMBERS = [
  "+918105003858",
  "+917276700997",
  "+919731832609",
];

// Initialize Twilio client
let twilioClient: any = null;

try {
  if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
    console.log("✅ Twilio SMS service initialized for production");
  } else {
    console.log(
      "⚠️ Twilio credentials not configured - SMS will be logged only",
    );
  }
} catch (error) {
  console.warn("❌ Failed to initialize Twilio:", error);
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { rsvpDetails } = JSON.parse(event.body || "{}");

    console.log("📱 RSVP SMS Notification Request:", {
      name: rsvpDetails.name,
      email: rsvpDetails.email,
      attending: rsvpDetails.attending,
      side: rsvpDetails.side,
      guests: rsvpDetails.guests,
    });

    const attendingText = rsvpDetails.attending
      ? "✅ Will Attend"
      : "❌ Cannot Attend";
    const sideText =
      rsvpDetails.side === "groom" ? "Aral's side" : "Violet's side";

    // Create optimized message for trial account (under 160 chars to avoid segments)
    const message = `RSVP: ${rsvpDetails.name} ${attendingText} +${rsvpDetails.guests} guests (${sideText}) - A&V Wedding`;

    console.log(
      "📱 SMS Message to be sent to",
      NOTIFICATION_NUMBERS.length,
      "numbers:",
    );
    console.log(message);

    if (twilioClient && fromNumber) {
      // Send actual SMS messages
      const results = [];

      for (const phoneNumber of NOTIFICATION_NUMBERS) {
        try {
          const result = await twilioClient.messages.create({
            body: message,
            from: fromNumber,
            to: phoneNumber,
          });

          console.log(
            `✅ SMS sent successfully to ${phoneNumber}:`,
            result.sid,
          );
          results.push({ phoneNumber, success: true, sid: result.sid });
        } catch (error) {
          console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error);
          results.push({ phoneNumber, success: false, error: error });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `📱 SMS notifications: ${successCount}/${NOTIFICATION_NUMBERS.length} sent successfully`,
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: successCount > 0,
          message: `SMS notifications sent to ${successCount}/${NOTIFICATION_NUMBERS.length} recipients`,
          recipients: successCount,
          results: results,
          production: true,
        }),
      };
    } else {
      // Development/fallback mode - log only
      console.log("📱 SMS would be sent to recipients:", NOTIFICATION_NUMBERS);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "SMS notifications logged (Twilio not configured)",
          recipients: NOTIFICATION_NUMBERS.length,
          development: true,
          note: "Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables to send actual SMS",
        }),
      };
    }
  } catch (error) {
    console.error("❌ SMS notification error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Failed to send SMS notifications",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
