import { Handler } from "@netlify/functions";
import twilio from "twilio";

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const debug: any = {
      environment: {
        hasSid: !!accountSid,
        hasToken: !!authToken,
        hasPhone: !!fromNumber,
        sidPrefix: accountSid ? accountSid.substring(0, 6) + "..." : "Not set",
        phoneNumber: fromNumber || "Not set",
      },
      credentials: {},
      twilioTest: {},
    };

    // Test Twilio client initialization
    try {
      if (accountSid && authToken) {
        const client = twilio(accountSid, authToken);
        debug.credentials.clientInitialized = true;

        // Try to fetch account info to validate credentials
        try {
          const account = await client.api.accounts(accountSid).fetch();
          debug.credentials.accountValid = true;
          debug.credentials.accountStatus = account.status;
          debug.credentials.accountFriendlyName = account.friendlyName;
        } catch (error: any) {
          debug.credentials.accountValid = false;
          debug.credentials.accountError = error.message;
          debug.credentials.errorCode = error.code;
        }

        // Test phone number validation
        if (fromNumber) {
          try {
            const phoneNumbers = await client.incomingPhoneNumbers.list();
            const ownedNumber = phoneNumbers.find(
              (p) => p.phoneNumber === fromNumber,
            );
            debug.twilioTest.phoneNumberOwned = !!ownedNumber;
            debug.twilioTest.totalOwnedNumbers = phoneNumbers.length;
            debug.twilioTest.ownedNumbers = phoneNumbers.map(
              (p) => p.phoneNumber,
            );
          } catch (error: any) {
            debug.twilioTest.phoneNumberError = error.message;
          }
        }
      } else {
        debug.credentials.clientInitialized = false;
        debug.credentials.missingVars = [];
        if (!accountSid)
          debug.credentials.missingVars.push("TWILIO_ACCOUNT_SID");
        if (!authToken) debug.credentials.missingVars.push("TWILIO_AUTH_TOKEN");
        if (!fromNumber)
          debug.credentials.missingVars.push("TWILIO_PHONE_NUMBER");
      }
    } catch (error: any) {
      debug.credentials.initError = error.message;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(debug),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Debug failed",
        message: error.message,
      }),
    };
  }
};
