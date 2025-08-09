import { Request, Response } from "express";
import twilio from "twilio";

export const debugSMS = async (req: Request, res: Response) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const debug = {
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

    res.json(debug);
  } catch (error: any) {
    res.status(500).json({
      error: "Debug failed",
      message: error.message,
    });
  }
};
