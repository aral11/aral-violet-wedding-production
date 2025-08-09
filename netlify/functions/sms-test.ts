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
    console.log("📱 SMS Test Request");

    const testMessage = `🧪 SMS Service Test - TheVIRALWedding System
    
This is a test message to verify SMS notifications are working.
    
Timestamp: ${new Date().toLocaleString()}
    
A&V Wedding Website 💕`;

    console.log("📱 Test SMS Message:");
    console.log(testMessage);

    if (twilioClient && fromNumber) {
      // Send actual test SMS to first number only
      try {
        const result = await twilioClient.messages.create({
          body: testMessage,
          from: fromNumber,
          to: NOTIFICATION_NUMBERS[0],
        });

        console.log("✅ Test SMS sent successfully:", result.sid);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `Test SMS sent successfully to ${NOTIFICATION_NUMBERS[0]}`,
            sid: result.sid,
            production: true,
          }),
        };
      } catch (error) {
        console.error("❌ Test SMS failed:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Test SMS failed",
            message: error instanceof Error ? error.message : "Unknown error",
          }),
        };
      }
    } else {
      console.log("📱 Test SMS would be sent to:", NOTIFICATION_NUMBERS[0]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Test SMS logged (Twilio not configured)",
          development: true,
          note: "Configure Twilio credentials to send actual SMS",
        }),
      };
    }
  } catch (error) {
    console.error("❌ SMS test error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "SMS test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
