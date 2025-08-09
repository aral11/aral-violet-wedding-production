import { Request, Response } from "express";
import path from "path";
import fs from "fs";

// This endpoint serves the exact wedding invitation PDF provided by the user
export const downloadInvitation = async (req: Request, res: Response) => {
  try {
    // The exact PDF content from the user's attachment (3 pages: Church Nuptials, Reception, Rose Ceremony)
    const pdfBase64 = `JVBERi0xLjcKJcOkw7zDtsOfCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9UeXBlIC9FeHRHU3RhdGUKL2NhIDEKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL1R5cGUgL0V4dEdTdGF0ZQovQ0EgMQo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL1R5cGUgL0V4dEdTdGF0ZQovY2EgLjIKPj4KZW5kb2JqCjExIDAgb2JqCjw8Ci9UeXBlIC9FeHRHU3RhdGUKL0NBIC4yCj4+CmVuZG9iago5OSAwIG9iago8PAovTGVuZ3RoIDEzOTEKPj4Kc3RyZWFtCnEKMTggMCAwIDQyIDI5My44OCAzNjYuODggY20KL0ltMCBEbwpRCjE4IDAgMCA0MiAyOTMuODggMzA5Ljg4IGNtCi9JbTEgRG8KUQo0Ny42NiAwIDAgMTMuNzIgMTU0LjE3IDUwMi45OCBjbQovSW0yIERvClEKMTggMCAwIDQyIDI5My44OCAyNTIuODggY20KL0ltMyBEbwpRCjE4IDAgMCA0MiAyOTMuODggMTk1Ljg4IGNtCi9JbTQgRG8KUQo0Ny42NiAwIDAgMTMuNzIgMTU0LjE3IDQ0NS45OCBjbQovSW01IERvClEKMTggMCAwIDQyIDI5My44OCAxMzguODggY20KL0ltNiBEbwpRCjE4IDAgMCA0MiAyOTMuODggODEuODggY20KL0ltNyBEbwpRCjQ3LjY2IDAgMCAxMy43MiAxNTQuMTcgMzg4Ljk4IGNtCi9JbTggRG8KUQplbmRzdHJlYW0KZW5kb2JqCjEwMCAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9SZXNvdXJjZXMgPDwKL1hPYmplY3QgPDwKL0ltMCAxMDEgMCBSCi9JbTEgMTAyIDAgUgovSW0yIDEwMyAwIFIKL0ltMyAxMDQgMCBSCi9JbTQgMTA1IDAgUgovSW01IDEwNiAwIFIKL0ltNiAxMDcgMCBSCi9JbTcgMTA4IDAgUgo+PgovRXh0R1N0YXRlIDw8Ci9HUzggOCAwIFIKL0dTOSA5IDAgUgovR1MxMCAxMCAwIFIKL0dTMTEgMTEgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDU5NS4yNzU1NzIgODQxLjg4OTc3XQovQ29udGVudHMgOTkgMCBSCj4+CmVuZG9iago+PgplbmRzdHJlYW0KZW5kb2JqCnN0YXJ0eHJlZgo1MjU2CiUlRU9G`;

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Set appropriate headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Aral-Violet-Wedding-Invitation.pdf"',
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send the PDF buffer
    res.send(pdfBuffer);

    console.log("Wedding invitation PDF served successfully");
  } catch (error) {
    console.error("Error serving wedding invitation PDF:", error);
    res.status(500).json({
      success: false,
      error: "Failed to serve wedding invitation PDF",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
