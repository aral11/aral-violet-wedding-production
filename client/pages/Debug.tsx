import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { database } from "@/lib/database";

export default function Debug() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<any[]>([]);
  const [adminPhotos, setAdminPhotos] = useState<any[]>([]);
  const [guestPhotos, setGuestPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testPhotoRetrieval = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Starting photo retrieval test...");
      
      // Test all photos
      const allPhotos = await database.photos.getAll();
      console.log("📸 All photos:", allPhotos);
      setPhotos(allPhotos);
      
      // Test admin photos
      const adminPhotosResult = await database.photos.getAdminPhotos();
      console.log("👨‍💼 Admin photos:", adminPhotosResult);
      setAdminPhotos(adminPhotosResult);
      
      // Test guest photos
      const guestPhotosResult = await database.photos.getGuestPhotos();
      console.log("👥 Guest photos:", guestPhotosResult);
      setGuestPhotos(guestPhotosResult);
      
      toast({
        title: "Photo Test Complete",
        description: `Found ${allPhotos.length} total photos (${adminPhotosResult.length} admin, ${guestPhotosResult.length} guest)`,
        duration: 5000,
      });
      
    } catch (err) {
      console.error("❌ Photo test failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      toast({
        title: "Photo Test Failed",
        description: "Check console for details",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    try {
      console.log("🔍 Testing Supabase connection...");
      const isUsing = database.isUsingSupabase();
      console.log("📊 Using Supabase:", isUsing);
      
      const status = database.getStorageStatus();
      console.log("💾 Storage status:", status);
      
      toast({
        title: "Storage Info",
        description: `Using: ${status.type} | Syncs: ${status.syncsAcrossDevices}`,
        duration: 5000,
      });
    } catch (err) {
      console.error("❌ Supabase test failed:", err);
    }
  };

  const checkLocalStorage = () => {
    console.log("🔍 Checking localStorage...");
    
    const adminPhotosLS = localStorage.getItem("wedding_photos");
    const guestPhotosLS = localStorage.getItem("wedding_guest_photos");
    
    console.log("👨‍💼 Admin photos in localStorage:", adminPhotosLS ? JSON.parse(adminPhotosLS).length : 0);
    console.log("👥 Guest photos in localStorage:", guestPhotosLS ? JSON.parse(guestPhotosLS).length : 0);
    
    if (adminPhotosLS) {
      console.log("Admin photos data:", JSON.parse(adminPhotosLS));
    }
    
    if (guestPhotosLS) {
      console.log("Guest photos data:", JSON.parse(guestPhotosLS));
    }
    
    toast({
      title: "LocalStorage Check",
      description: `Admin: ${adminPhotosLS ? JSON.parse(adminPhotosLS).length : 0}, Guest: ${guestPhotosLS ? JSON.parse(guestPhotosLS).length : 0}`,
      duration: 5000,
    });
  };

  useEffect(() => {
    testPhotoRetrieval();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Photo Debug Console</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={testPhotoRetrieval}
                  disabled={loading}
                >
                  {loading ? "Testing..." : "Test Photo Retrieval"}
                </Button>
                <Button onClick={testSupabaseConnection}>
                  Test Storage Connection
                </Button>
                <Button onClick={checkLocalStorage}>
                  Check LocalStorage
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  Error: {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>All Photos ({photos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {photos.map((photo, index) => (
                  <div key={index} className="text-sm border-b pb-2">
                    <div><strong>ID:</strong> {photo.id}</div>
                    <div><strong>Uploaded by:</strong> {photo.uploaded_by}</div>
                    <div><strong>Guest:</strong> {photo.guest_name || "N/A"}</div>
                    <div><strong>Data:</strong> {photo.photo_data.substring(0, 50)}...</div>
                    <div><strong>Created:</strong> {photo.created_at}</div>
                  </div>
                ))}
                {photos.length === 0 && (
                  <div className="text-gray-500">No photos found</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Photos ({adminPhotos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {adminPhotos.map((photo, index) => (
                  <div key={index} className="text-sm border-b pb-2">
                    <div><strong>ID:</strong> {photo.id}</div>
                    <div><strong>Data:</strong> {photo.photo_data.substring(0, 30)}...</div>
                  </div>
                ))}
                {adminPhotos.length === 0 && (
                  <div className="text-gray-500">No admin photos found</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Photos ({guestPhotos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guestPhotos.map((photo, index) => (
                  <div key={index} className="text-sm border-b pb-2">
                    <div><strong>ID:</strong> {photo.id}</div>
                    <div><strong>Guest:</strong> {photo.guest_name}</div>
                    <div><strong>Uploaded by:</strong> {photo.uploaded_by}</div>
                    <div><strong>Data:</strong> {photo.photo_data.substring(0, 30)}...</div>
                  </div>
                ))}
                {guestPhotos.length === 0 && (
                  <div className="text-gray-500">No guest photos found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Storage Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Using Supabase:</strong> {database.isUsingSupabase() ? "Yes" : "No"}</div>
              <div><strong>Storage Type:</strong> {database.getStorageStatus().type}</div>
              <div><strong>Syncs Across Devices:</strong> {database.getStorageStatus().syncsAcrossDevices ? "Yes" : "No"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
