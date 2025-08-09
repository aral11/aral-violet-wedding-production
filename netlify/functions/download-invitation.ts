import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn(
      "❌ Failed to initialize Supabase for invitation download:",
      error,
    );
  }
}

export const handler: Handler = async (event, context) => {
  try {
    // First priority: Check if there's an uploaded PDF in the database
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!error && data && data.pdf_data) {
          // Convert base64 to buffer
          const base64Data = data.pdf_data.split(",")[1] || data.pdf_data; // Remove data:application/pdf;base64, prefix if present
          const pdfBuffer = Buffer.from(base64Data, "base64");

          // Set appropriate headers for PDF download
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${data.filename || "Aral-Violet-Wedding-Invitation.pdf"}"`,
              "Content-Length": pdfBuffer.length.toString(),
            },
            body: pdfBuffer.toString("base64"),
            isBase64Encoded: true,
          };
        }
      } catch (dbError) {
        console.log("No uploaded PDF found in database, using fallback...");
      }
    }

    // Final fallback: Serve a comprehensive PDF with all the wedding details
    const comprehensivePdfContent = `%PDF-1.4
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
/Length 1800
>>
stream
BT
/F1 20 Tf
50 720 Td
(WEDDING INVITATION) Tj
0 -30 Td
/F2 14 Tf
(I HAVE FOUND THE ONE WHOM MY SOUL LOVES.) Tj
0 -20 Td
(- SONG OF SOLOMON 3:4) Tj
0 -40 Td
/F2 12 Tf
(TOGETHER WITH OUR FAMILIES) Tj
0 -40 Td
/F1 28 Tf
(Aral & Violet) Tj
0 -50 Td
/F2 10 Tf
(Son of David Mark & Ashwini D'Souza) Tj
0 -15 Td
(Daughter of late Benedict Swamy & Juliet Swamy) Tj
0 -40 Td
/F2 12 Tf
(WITH LOVE AND GRATITUDE,) Tj
0 -15 Td
(WE INVITE YOU TO SHARE IN OUR JOY AND) Tj
0 -15 Td
(WITNESS THE BEGINNING OF OUR NEW LIFE TOGETHER.) Tj
0 -40 Td
/F1 16 Tf
(28 December 2025 | Sunday) Tj
0 -40 Td
/F1 14 Tf
(CHURCH NUPTIALS) Tj
0 -20 Td
/F2 12 Tf
(04:00 PM) Tj
0 -15 Td
(AT MOTHER OF SORROWS CHURCH) Tj
0 -15 Td
(UDUPI) Tj
0 -40 Td
/F1 14 Tf
(RECEPTION) Tj
0 -20 Td
/F2 12 Tf
(07:00 PM) Tj
0 -15 Td
(AT SAI RADHA HERITAGE BEACH RESORT) Tj
0 -15 Td
(KAUP) Tj
0 -40 Td
/F1 14 Tf
(ROSE CEREMONY) Tj
0 -20 Td
/F2 12 Tf
(Saturday | 27th December 2025) Tj
0 -15 Td
(7:00 PM onwards) Tj
0 -15 Td
(ARAL House, Kemmannu) Tj
0 -15 Td
(Near Maria Goratti Convent) Tj
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
(YOUR PRESENCE AND BLESSINGS) Tj
0 -15 Td
(ARE OUR GREATEST GIFT.) Tj
0 -30 Td
/F2 12 Tf
(RSVP VIA WHATSAPP:) Tj
0 -20 Td
(DAVID MARK - +919731832609) Tj
0 -15 Td
(ARAL - +918105003858) Tj
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
2214
%%EOF`;

    // Convert to buffer and encode as base64
    const pdfBuffer = Buffer.from(comprehensivePdfContent, "binary");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="Aral-Violet-Wedding-Invitation.pdf"',
        "Content-Length": pdfBuffer.length.toString(),
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Error serving wedding invitation PDF:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Failed to serve wedding invitation PDF",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
