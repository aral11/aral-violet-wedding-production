import { Request, Response } from "express";
import path from "path";
import fs from "fs";

// This endpoint serves the wedding invitation PDF
export const downloadInvitation = async (req: Request, res: Response) => {
  try {
    // Try to serve PDF file from public directory first
    const pdfPath = path.join(process.cwd(), "public", "Aral-Violet-Wedding-Invitation.pdf");
    
    if (fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Set appropriate headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="Aral-Violet-Wedding-Invitation.pdf"',
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      
      // Send the PDF buffer
      res.send(pdfBuffer);
      
      console.log("Wedding invitation PDF served from file system successfully");
      return;
    }

    // Fallback: Create a proper PDF with wedding invitation content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
/F2 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 800
>>
stream
BT
/F1 20 Tf
50 720 Td
(WEDDING INVITATION) Tj
0 -50 Td
/F1 16 Tf
(I HAVE FOUND THE ONE WHOM MY SOUL LOVES) Tj
0 -25 Td
/F2 12 Tf
(- SONG OF SOLOMON 3:4) Tj
0 -50 Td
/F1 32 Tf
(Aral & Violet) Tj
0 -60 Td
/F1 18 Tf
(Sunday, December 28, 2025) Tj
0 -40 Td
/F1 14 Tf
(CHURCH NUPTIALS) Tj
0 -25 Td
/F2 12 Tf
(Mother of Sorrows Church, Udupi) Tj
0 -20 Td
(4:00 PM - 5:15 PM) Tj
0 -40 Td
/F1 14 Tf
(RECEPTION) Tj
0 -25 Td
/F2 12 Tf
(Sai Radha Heritage Beach Resort, Kaup) Tj
0 -20 Td
(7:00 PM - 11:30 PM) Tj
0 -40 Td
/F2 10 Tf
(WITH HEARTS FULL OF JOY AND BLESSINGS FROM ABOVE,) Tj
0 -15 Td
(WE INVITE YOU TO CELEBRATE OUR UNION.) Tj
0 -15 Td
(WEAR YOUR FINEST, BRING YOUR SMILES,) Tj
0 -15 Td
(AND LET'S CHERISH THIS BEAUTIFUL EVENING.) Tj
0 -30 Td
/F1 16 Tf
(TheVIRALWedding) Tj
0 -25 Td
(A&V) Tj
0 -20 Td
(12.28.2025) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000364 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
1174
%%EOF`;

    // Convert to buffer
    const pdfBuffer = Buffer.from(pdfContent, 'binary');

    // Set appropriate headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Aral-Violet-Wedding-Invitation.pdf"',
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send the PDF buffer
    res.send(pdfBuffer);

    console.log("Wedding invitation PDF served successfully (generated)");
  } catch (error) {
    console.error("Error serving wedding invitation PDF:", error);
    res.status(500).json({
      success: false,
      error: "Failed to serve wedding invitation PDF",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
