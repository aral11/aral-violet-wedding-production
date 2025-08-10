import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function TestPhotos() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Unknown");

  const testDirectSupabaseConnection = async () => {
    setLoading(true);
    try {
      console.log("🔍 Testing direct Supabase connection...");
      
      if (!supabase) {
        setConnectionStatus("No Supabase client");
        toast({
          title: "No Supabase Client",
          description: "Supabase client is not initialized",
          variant: "destructive",
        });
        return;
      }

      console.log("📱 Supabase client exists, querying photos...");
      
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📸 Direct query result:", { data, error });

      if (error) {
        console.error("❌ Supabase query error:", error);
        setConnectionStatus(`Error: ${error.message}`);
        toast({
          title: "Query Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setPhotos(data || []);
        setConnectionStatus(`Success - Found ${data?.length || 0} photos`);
        console.log("✅ Direct Supabase query successful:", data?.length || 0, "photos");
        
        toast({
          title: "Direct Query Success!",
          description: `Found ${data?.length || 0} photos in Supabase`,
          duration: 5000,
        });
      }
    } catch (err) {
      console.error("❌ Connection test failed:", err);
      setConnectionStatus(`Exception: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Connection Failed",
        description: `Error: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDirectSupabaseConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Direct Supabase Photo Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={testDirectSupabaseConnection}
                  disabled={loading}
                >
                  {loading ? "Testing..." : "Test Direct Connection"}
                </Button>
              </div>
              
              <div className="p-4 bg-gray-100 rounded">
                <strong>Connection Status:</strong> {connectionStatus}
              </div>
              
              <div className="p-4 bg-blue-100 rounded">
                <strong>Supabase Client:</strong> {supabase ? "✅ Initialized" : "❌ Not initialized"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos Found ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="space-y-4">
                {photos.map((photo, index) => (
                  <div key={photo.id || index} className="border p-4 rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div><strong>ID:</strong> {photo.id}</div>
                        <div><strong>Uploaded by:</strong> {photo.uploaded_by}</div>
                        <div><strong>Guest name:</strong> {photo.guest_name || "N/A"}</div>
                        <div><strong>Created:</strong> {photo.created_at}</div>
                        <div><strong>Data length:</strong> {photo.photo_data?.length || 0} chars</div>
                        <div><strong>Data type:</strong> {photo.photo_data?.substring(0, 30) || "No data"}</div>
                      </div>
                      <div>
                        {photo.photo_data && photo.photo_data.startsWith("data:image/") ? (
                          <img 
                            src={photo.photo_data} 
                            alt={`Photo ${index + 1}`}
                            className="w-32 h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                            No Image
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No photos found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
