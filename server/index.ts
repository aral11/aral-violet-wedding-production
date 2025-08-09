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

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" })); // Increased limit for base64 images/PDFs
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize database
  try {
    await initializeDatabase();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    console.log(
      "Server will continue with fallback mode - all data will be stored in localStorage",
    );
    // Don't throw error, let server start without DB for now
  }

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
  app.post("/api/photos", uploadPhoto);
  app.post("/api/photos/bulk", bulkUploadPhotos);
  app.delete("/api/photos/:id", deletePhoto);

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

  return app;
}
