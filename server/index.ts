import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initializeDatabase } from "./models";
import {
  getGuests,
  createGuest,
  updateGuest,
  deleteGuest,
} from "./routes/guests";
import {
  getPhotos,
  uploadPhoto,
  deletePhoto,
  bulkUploadPhotos,
  generateGuestUploadQR,
  validateGuestUpload,
} from "./routes/photos";
import {
  getWeddingFlow,
  createFlowItem,
  updateFlowItem,
  deleteFlowItem,
} from "./routes/wedding-flow";
import {
  getInvitation,
  uploadInvitation,
  deleteInvitation,
} from "./routes/invitation";
import { sendRSVPSMSNotification, testSMS } from "./routes/sms";
import { debugSMS } from "./routes/debug-sms";
import { downloadInvitation } from "./routes/download-invitation";
import { testSupabaseConnection } from "./routes/test-connection";

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" })); // Increased limit for base64 images/PDFs
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Skip SQL Server initialization - using Supabase instead
  console.log("Using Supabase database - skipping SQL Server initialization");

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Wedding Website API routes

  // Guests API
  app.get("/api/guests", getGuests);
  app.post("/api/guests", createGuest);
  app.put("/api/guests/:id", updateGuest);
  app.delete("/api/guests/:id", deleteGuest);

  // Photos API
  app.get("/api/photos", getPhotos);
  app.post("/api/photos", validateGuestUpload, uploadPhoto);
  app.post("/api/photos/bulk", validateGuestUpload, bulkUploadPhotos);
  app.delete("/api/photos/:id", deletePhoto);

  // Guest upload QR code
  app.get("/api/guest-upload-qr", generateGuestUploadQR);

  // Wedding Flow API
  app.get("/api/wedding-flow", getWeddingFlow);
  app.post("/api/wedding-flow", createFlowItem);
  app.put("/api/wedding-flow/:id", updateFlowItem);
  app.delete("/api/wedding-flow/:id", deleteFlowItem);

  // Invitation API
  app.get("/api/invitation", getInvitation);
  app.post("/api/invitation", uploadInvitation);
  app.delete("/api/invitation", deleteInvitation);

  // SMS API
  app.post("/api/sms/send-rsvp-notification", sendRSVPSMSNotification);
  app.post("/api/sms/test", testSMS);
  app.get("/api/sms/debug", debugSMS);

  // Download invitation PDF
  app.get("/api/download-invitation", downloadInvitation);

  // Test Supabase connection (for debugging)
  app.get("/api/test-connection", testSupabaseConnection);

  return app;
}
