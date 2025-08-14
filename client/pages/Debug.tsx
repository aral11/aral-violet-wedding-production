import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { database } from "@/lib/database";
import { invitationApi } from "@/lib/api";
import ClearStorageButton from "@/components/ClearStorageButton";

export default function Debug() {
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addDebugResult = (step: string, success: boolean, data: any) => {
    setDebugResults((prev) => [
      ...prev,
      {
        step,
        success,
        data,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  const debugInvitationDownload = async () => {
    setIsLoading(true);
    clearResults();

    try {
      // 1. Check Supabase configuration
      addDebugResult("Supabase Configuration", database.isUsingSupabase(), {
        isConfigured: database.isUsingSupabase(),
        storageType: database.getStorageStatus(),
      });

      // 2. Check database invitation service
      try {
        const dbInvitation = await database.invitation.get();
        addDebugResult("Database Invitation Service", !!dbInvitation, {
          found: !!dbInvitation,
          invitation: dbInvitation
            ? {
                id: dbInvitation.id,
                filename: dbInvitation.filename,
                hasData: !!dbInvitation.pdf_data,
                dataLength: dbInvitation.pdf_data?.length,
                dataType: dbInvitation.pdf_data?.startsWith("data:")
                  ? "Data URL"
                  : "Unknown",
              }
            : null,
        });
      } catch (error) {
        addDebugResult("Database Invitation Service", false, {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // 3. Check API invitation service
      try {
        const apiInvitation = await invitationApi.get();
        addDebugResult("API Invitation Service", !!apiInvitation, {
          found: !!apiInvitation,
          invitation: apiInvitation
            ? {
                id: apiInvitation.id,
                filename: apiInvitation.filename,
                hasData: !!apiInvitation.pdfData,
                dataLength: apiInvitation.pdfData?.length,
              }
            : null,
        });
      } catch (error) {
        addDebugResult("API Invitation Service", false, {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // 4. Check localStorage
      const localStorageInvitation = localStorage.getItem("wedding_invitation_pdf");
      const localStorageFilename = localStorage.getItem("wedding_invitation_filename");
      addDebugResult("Local Storage Check", !!localStorageInvitation, {
        found: !!localStorageInvitation,
        filename: localStorageFilename,
        hasData: !!localStorageInvitation,
        dataLength: localStorageInvitation?.length,
        dataType: localStorageInvitation?.startsWith("data:")
          ? "Data URL"
          : "Unknown",
      });

      // 5. Test server endpoint
      try {
        const isNetlify = import.meta.env.VITE_DEPLOYMENT_PLATFORM === "netlify";
        const downloadEndpoint = isNetlify
          ? "/.netlify/functions/download-invitation"
          : "/api/download-invitation";
        
        const response = await fetch(downloadEndpoint, { method: "HEAD" });
        addDebugResult("Server Endpoint Test", response.ok, {
          status: response.status,
          statusText: response.statusText,
          endpoint: downloadEndpoint,
          headers: {
            contentType: response.headers.get("content-type"),
            contentLength: response.headers.get("content-length"),
          },
        });
      } catch (error) {
        addDebugResult("Server Endpoint Test", false, {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      toast({
        title: "Debug Complete! 🔍",
        description: "Check the results below to see what's happening with invitation download.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Debug error:", error);
      toast({
        title: "Debug Error ❌",
        description: "An error occurred during debugging.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectDownload = async () => {
    try {
      // Test the exact same logic as in Index.tsx
      console.log("🔍 Testing direct invitation download...");

      const uploadedInvitation = await database.invitation.get();
      console.log("📋 Database invitation result:", uploadedInvitation);

      if (uploadedInvitation && uploadedInvitation.pdf_data) {
        toast({
          title: "Database Invitation Found! ✅",
          description: `Found invitation: ${uploadedInvitation.filename || "wedding-invitation.pdf"}`,
          duration: 5000,
        });

        // Actually try to download it
        const link = document.createElement("a");
        link.href = uploadedInvitation.pdf_data;
        link.download = uploadedInvitation.filename || "debug-invitation-test.pdf";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          title: "No Database Invitation Found ❌",
          description: "No invitation found in database - will fall back to other methods.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Direct download test error:", error);
      toast({
        title: "Direct Download Test Failed ❌",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-olive-700 mb-4">
            Debug Console
          </h1>
          <p className="text-sage-600">
            Debug tools for troubleshooting the wedding website
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-olive-700">Invitation Download Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={debugInvitationDownload}
                disabled={isLoading}
                className="bg-olive-600 hover:bg-olive-700"
              >
                {isLoading ? "Debugging..." : "Debug Invitation Download"}
              </Button>
              <Button
                onClick={testDirectDownload}
                variant="outline"
                className="border-olive-600 text-olive-700"
              >
                Test Direct Download
              </Button>
              <Button
                onClick={clearResults}
                variant="outline"
                className="border-sage-400 text-sage-600"
              >
                Clear Results
              </Button>
            </div>

            {debugResults.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold text-olive-700">Debug Results:</h3>
                {debugResults.map((result, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      result.success
                        ? "border-l-green-500 bg-green-50"
                        : "border-l-red-500 bg-red-50"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            result.success ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></span>
                        <span className="font-medium">{result.step}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="bg-white p-3 rounded text-xs overflow-x-auto border">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-olive-700">Quick Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  If Supabase is not configured:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check your .env.local file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
                  <li>• Restart the dev server after adding environment variables</li>
                  <li>• Verify your Supabase project is active and accessible</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">
                  If database has no invitation:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Go to Admin Dashboard → Invitation Management</li>
                  <li>• Upload a PDF invitation file</li>
                  <li>• Verify the upload was successful</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  If everything looks good:
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Clear your browser cache and localStorage</li>
                  <li>• Try the download button again</li>
                  <li>• Check browser console for any errors</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
