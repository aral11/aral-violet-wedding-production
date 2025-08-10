import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { database } from "@/lib/database";

export default function TestPhotos() {
  const { toast } = useToast();
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<string>("Not tested");
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setConnectionStatus("Testing...");
    
    try {
      if (!supabase) {
        setConnectionStatus("❌ Supabase client not initialized - check credentials");
        return;
      }

      // Test basic connection
      console.log("🔍 Testing Supabase connection...");
      const { data: testData, error: testError } = await supabase
        .from("photos")
        .select("count", { count: "exact", head: true });

      if (testError) {
        setConnectionStatus(`❌ Connection failed: ${testError.message}`);
        console.error("Connection test error:", testError);
        return;
      }

      setConnectionStatus("✅ Connection successful");
      
      // Try to fetch actual photos
      console.log("📸 Fetching photos from Supabase...");
      const { data: photosData, error: photosError } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (photosError) {
        console.error("Photos fetch error:", photosError);
        setConnectionStatus(`✅ Connected but photo fetch failed: ${photosError.message}`);
        return;
      }

      console.log("Raw photos data from Supabase:", photosData);
      setPhotos(photosData || []);
      setConnectionStatus(`✅ Connected and found ${photosData?.length || 0} photos`);

    } catch (error) {
      console.error("Test error:", error);
      setConnectionStatus(`❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseService = async () => {
    setIsLoading(true);
    
    try {
      console.log("🔧 Testing database service...");
      const photos = await database.photos.getAll();
      console.log("Database service returned:", photos);
      
      toast({
        title: "Database Service Test",
        description: `Found ${photos.length} photos via database service`,
        duration: 3000,
      });
      
      setPhotos(photos);
    } catch (error) {
      console.error("Database service error:", error);
      toast({
        title: "Database Service Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testApiEndpoint = async () => {
    setIsLoading(true);
    
    try {
      console.log("🌐 Testing API endpoint...");
      const response = await fetch("/api/photos");
      const data = await response.json();
      console.log("API endpoint returned:", data);
      
      toast({
        title: "API Endpoint Test",
        description: `API returned ${data.length} photos`,
        duration: 3000,
      });
      
      setPhotos(data);
    } catch (error) {
      console.error("API test error:", error);
      toast({
        title: "API Test Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSupabaseCredentials = () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both Supabase URL and API key",
        variant: "destructive",
      });
      return;
    }

    // Note: In a real app, you'd want to restart with new env vars
    // For now, just show instructions
    toast({
      title: "Credentials Updated",
      description: "To apply new credentials, you'll need to restart the dev server with updated environment variables",
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>📸 Photo System Diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Status</h3>
              <p className="text-sm text-gray-600">
                Supabase Client: {supabase ? "✅ Initialized" : "❌ Not initialized"}
              </p>
              <p className="text-sm text-gray-600">
                Connection: {connectionStatus}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={testSupabaseConnection} disabled={isLoading}>
                Test Supabase Direct
              </Button>
              <Button onClick={testDatabaseService} disabled={isLoading}>
                Test Database Service
              </Button>
              <Button onClick={testApiEndpoint} disabled={isLoading}>
                Test API Endpoint
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔧 Supabase Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supabase URL</label>
              <Input
                type="text"
                placeholder="https://yourproject.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supabase Anon Key</label>
              <Input
                type="password"
                placeholder="Your anon key here"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
            </div>
            <Button onClick={updateSupabaseCredentials}>
              Update Credentials (Requires Restart)
            </Button>
            
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <strong>To fix the photo issue:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Get your actual Supabase URL and API key from your Supabase project</li>
                <li>Update the environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
                <li>Restart the development server</li>
                <li>Test the connection using the buttons above</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📄 Photo Data ({photos.length} photos found)</CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photos.slice(0, 6).map((photo, index) => (
                    <div key={photo.id || index} className="border rounded p-3">
                      <div className="text-sm space-y-2">
                        <p><strong>ID:</strong> {photo.id || "No ID"}</p>
                        <p><strong>Uploaded by:</strong> {photo.uploaded_by || photo.uploadedBy || "Unknown"}</p>
                        <p><strong>Guest:</strong> {photo.guest_name || photo.guestName || "N/A"}</p>
                        <p><strong>Data type:</strong> {
                          photo.photo_data || photo.photoData 
                            ? (photo.photo_data || photo.photoData).startsWith("data:") 
                              ? "Data URL" 
                              : (photo.photo_data || photo.photoData).startsWith("http")
                                ? "HTTP URL"
                                : "Unknown format"
                            : "No data"
                        }</p>
                        {(photo.photo_data || photo.photoData) && (
                          <div className="w-20 h-20 border">
                            <img 
                              src={photo.photo_data || photo.photoData} 
                              alt="Photo preview" 
                              className="w-full h-full object-cover"
                              onError={() => console.log("Failed to load image:", photo.id)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {photos.length > 6 && (
                  <p className="text-sm text-gray-500">... and {photos.length - 6} more photos</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No photos found. Try testing the connections above.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
