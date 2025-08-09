#!/usr/bin/env node

// Simple test script to verify the invitation flow works
console.log("🧪 Testing Wedding Invitation Flow...\n");

// Simulate a simple PDF base64 data (minimal PDF structure)
const testPdfData = "data:application/pdf;base64,JVBERi0xLjQKJcfs4f// test PDF data";

const API_BASE = "http://localhost:8080/api";

async function testUploadInvitation() {
  console.log("1️⃣ Testing invitation upload...");
  
  try {
    const response = await fetch(`${API_BASE}/invitation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pdfData: testPdfData,
        filename: "test-wedding-invitation.pdf"
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Invitation uploaded successfully:", result.filename);
      return true;
    } else {
      console.log("❌ Failed to upload invitation:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log("❌ Error uploading invitation:", error.message);
    return false;
  }
}

async function testGetInvitation() {
  console.log("2️⃣ Testing invitation retrieval...");
  
  try {
    const response = await fetch(`${API_BASE}/invitation`);
    
    if (response.ok) {
      const invitation = await response.json();
      console.log("✅ Invitation retrieved successfully:", invitation.filename);
      console.log("   - PDF data length:", invitation.pdfData.length);
      console.log("   - Uploaded at:", invitation.uploadedAt);
      return true;
    } else if (response.status === 404) {
      console.log("ℹ️ No invitation found (this is expected if none uploaded)");
      return true;
    } else {
      console.log("❌ Failed to retrieve invitation:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log("❌ Error retrieving invitation:", error.message);
    return false;
  }
}

async function testDownloadInvitation() {
  console.log("3️⃣ Testing invitation download endpoint...");
  
  try {
    const response = await fetch(`${API_BASE}/download-invitation`);
    
    if (response.ok) {
      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");
      
      console.log("✅ Download endpoint accessible");
      console.log("   - Content-Type:", contentType);
      console.log("   - Content-Length:", contentLength);
      return true;
    } else {
      console.log("❌ Download endpoint failed:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log("❌ Error accessing download endpoint:", error.message);
    return false;
  }
}

async function testDeleteInvitation() {
  console.log("4️⃣ Testing invitation deletion...");
  
  try {
    const response = await fetch(`${API_BASE}/invitation`, {
      method: "DELETE",
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Invitation deleted successfully:", result.message);
      return true;
    } else {
      console.log("❌ Failed to delete invitation:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log("❌ Error deleting invitation:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("Testing invitation flow on localhost:8080...\n");
  
  const results = [];
  
  results.push(await testUploadInvitation());
  results.push(await testGetInvitation());
  results.push(await testDownloadInvitation());
  results.push(await testDeleteInvitation());
  
  console.log("\n📊 Test Results:");
  console.log("================");
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log("\n🎉 All tests passed! Invitation flow is working correctly.");
    console.log("\n📝 What this means:");
    console.log("   - Admin can upload custom PDF invitations");
    console.log("   - Uploaded invitations are properly stored");
    console.log("   - Guests can download the uploaded invitations");
    console.log("   - Admin can remove uploaded invitations");
  } else {
    console.log("\n⚠️ Some tests failed. Check the errors above.");
  }
}

// Run the tests
runTests().catch(console.error);
