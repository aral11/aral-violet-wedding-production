import { Request, Response } from "express";
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

// SMS notification endpoint
export const sendRSVPSMSNotification = async (req: Request, res: Response) => {
  try {
    const { rsvpDetails } = req.body;

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

      res.json({
        success: successCount > 0,
        message: `SMS notifications sent to ${successCount}/${NOTIFICATION_NUMBERS.length} recipients`,
        recipients: successCount,
        results: results,
        production: true,
      });
    } else {
      // Development/fallback mode - log only
      console.log("📱 SMS would be sent to recipients:", NOTIFICATION_NUMBERS);

      res.json({
        success: true,
        message: "SMS notifications logged (Twilio not configured)",
        recipients: NOTIFICATION_NUMBERS.length,
        development: true,
        note: "Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables to send actual SMS",
      });
    }
  } catch (error) {
    console.error("❌ SMS notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send SMS notifications",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// SMS test endpoint
export const testSMS = async (req: Request, res: Response) => {
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

        res.json({
          success: true,
          message: `Test SMS sent successfully to ${NOTIFICATION_NUMBERS[0]}`,
          sid: result.sid,
          production: true,
        });
      } catch (error) {
        console.error("❌ Test SMS failed:", error);
        res.status(500).json({
          success: false,
          error: "Test SMS failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } else {
      console.log("📱 Test SMS would be sent to:", NOTIFICATION_NUMBERS[0]);

      res.json({
        success: true,
        message: "Test SMS logged (Twilio not configured)",
        development: true,
        note: "Configure Twilio credentials to send actual SMS",
      });
    }
  } catch (error) {
    console.error("❌ SMS test error:", error);
    res.status(500).json({
      success: false,
      error: "SMS test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
