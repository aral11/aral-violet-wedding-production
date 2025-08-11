#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Configuration - using the exact same values as the app
const supabaseUrl = "https://rqhhevyrmwgoxvjwnvuc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaGhldnlybXdnb3h2andubnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTczOTcsImV4cCI6MjA3MDA3MzM5N30.BdxPAjKz5j1GS6qbGkxqJ2MflVJsJGKcFfN8pRGOaAY";

console.log("🔗 Testing Supabase Photo Functionality");
console.log("📊 Supabase URL:", supabaseUrl);
console.log("🔑 Supabase Key:", supabaseKey.substring(0, 20) + "...");

async function testSupabasePhotos() {
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client created");

    // Test 1: Check connection and table access
    console.log("\n🧪 Test 1: Testing connection and table access...");
    const { data: testData, error: testError } = await supabase
      .from("photos")
      .select("count", { count: "exact", head: true });

    if (testError) {
      console.error("❌ Connection test failed:", testError);
      throw testError;
    }
    console.log("✅ Connection successful, photos table accessible");

    // Test 2: Retrieve existing photos
    console.log("\n🧪 Test 2: Retrieving existing photos...");
    const { data: photos, error: fetchError } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("❌ Error fetching photos:", fetchError);
      throw fetchError;
    }

    console.log(`📸 Found ${photos?.length || 0} photos in database`);
    
    if (photos && photos.length > 0) {
      console.log("📸 Sample photo data:");
      const firstPhoto = photos[0];
      console.log({
        id: firstPhoto.id,
        uploaded_by: firstPhoto.uploaded_by,
        guest_name: firstPhoto.guest_name,
        hasValidData: firstPhoto.photo_data && firstPhoto.photo_data.startsWith("data:"),
        dataType: firstPhoto.photo_data ? firstPhoto.photo_data.substring(0, 20) + "..." : "no data",
        created_at: firstPhoto.created_at
      });
    }

    // Test 3: Upload a test photo
    console.log("\n🧪 Test 3: Testing photo upload...");
    const testPhotoData = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e8f5e8'/><circle cx='50' cy='50' r='25' fill='%234ade80'/><text x='50' y='55' text-anchor='middle' fill='white' font-size='12'>TEST</text></svg>";
    
    const { data: uploadedPhoto, error: uploadError } = await supabase
      .from("photos")
      .insert([
        {
          photo_data: testPhotoData,
          uploaded_by: "test_script",
          guest_name: "Test User"
        }
      ])
      .select()
      .single();

    if (uploadError) {
      console.error("❌ Error uploading test photo:", uploadError);
      throw uploadError;
    }

    console.log("✅ Test photo uploaded successfully:");
    console.log({
      id: uploadedPhoto.id,
      uploaded_by: uploadedPhoto.uploaded_by,
      guest_name: uploadedPhoto.guest_name,
      created_at: uploadedPhoto.created_at
    });

    // Test 4: Verify the upload by retrieving it
    console.log("\n🧪 Test 4: Verifying uploaded photo...");
    const { data: verifyPhoto, error: verifyError } = await supabase
      .from("photos")
      .select("*")
      .eq("id", uploadedPhoto.id)
      .single();

    if (verifyError) {
      console.error("❌ Error verifying uploaded photo:", verifyError);
      throw verifyError;
    }

    console.log("✅ Photo verified successfully:");
    console.log({
      id: verifyPhoto.id,
      dataMatches: verifyPhoto.photo_data === testPhotoData,
      uploadedBy: verifyPhoto.uploaded_by,
      guestName: verifyPhoto.guest_name
    });

    // Test 5: Clean up test photo
    console.log("\n🧪 Test 5: Cleaning up test photo...");
    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", uploadedPhoto.id);

    if (deleteError) {
      console.error("❌ Error deleting test photo:", deleteError);
      throw deleteError;
    }

    console.log("✅ Test photo cleaned up successfully");

    console.log("\n🎉 All tests passed! Supabase photo functionality is working correctly.");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testSupabasePhotos();
