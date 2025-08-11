import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/database";

interface ConnectionTest {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export default function Debug() {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionTest | null>(null);
  const [supabaseDebug, setSupabaseDebug] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoStats, setPhotoStats] = useState<any>(null);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test-connection");
      const result = await response.json();
      setConnectionStatus({
        success: result.success,
        message: result.message,
        details: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: "Failed to connect to API",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  };

  const testSupabaseDebug = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/debug-supabase");
      const result = await response.json();
      setSupabaseDebug(result);
    } catch (error) {
      setSupabaseDebug({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  };

  const testPhotosLoad = async () => {
    setIsLoading(true);
    try {
      const photos = await database.photos.getAll();
      setPhotoStats({
        totalPhotos: photos.length,
        validPhotos: photos.filter(
          (p) => p.photo_data && p.photo_data.startsWith("data:"),
        ).length,
        photos: photos.slice(0, 3), // First 3 for preview
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setPhotoStats({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Auto-test on page load
    testConnection();
    testSupabaseDebug();
    testPhotosLoad();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-sage-50 to-olive-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-olive-700 mb-2">
            Debug & Connection Test
          </h1>
          <p className="text-sage-600">
            Test Supabase connection and photo functionality
          </p>
        </div>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-olive-700">
              Environment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Platform:</strong>{" "}
                {window.location.hostname.includes("netlify")
                  ? "Netlify"
                  : "Local/Other"}
              </div>
              <div>
                <strong>Hostname:</strong> {window.location.hostname}
              </div>
              <div>
                <strong>Storage Type:</strong>{" "}
                {database.isUsingSupabase() ? "Supabase" : "localStorage"}
              </div>
              <div>
                <strong>Deployment Platform:</strong>{" "}
                {import.meta.env.VITE_DEPLOYMENT_PLATFORM || "Not set"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-olive-700 flex items-center justify-between">
              Supabase Connection Test
              <Button
                onClick={testConnection}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? "Testing..." : "Retest"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionStatus ? (
              <div
                className={`p-4 rounded-lg ${connectionStatus.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <div className="flex items-center mb-2">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${connectionStatus.success ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <strong>{connectionStatus.message}</strong>
                </div>
                <div className="text-sm text-gray-600">
                  Tested at:{" "}
                  {new Date(connectionStatus.timestamp).toLocaleString()}
                </div>
                {connectionStatus.details && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Show Details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(connectionStatus.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-gray-500">
                No connection test results yet...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Supabase Debug */}
        <Card>
          <CardHeader>
            <CardTitle className="text-olive-700 flex items-center justify-between">
              Detailed Supabase Debug
              <Button
                onClick={testSupabaseDebug}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? "Testing..." : "Retest"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supabaseDebug ? (
              <div>
                {/* Environment Variables Status */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Environment Variables</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div
                      className={`p-2 rounded ${supabaseDebug.debug?.environment?.hasUrl ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <strong>Supabase URL:</strong>{" "}
                      {supabaseDebug.debug?.environment?.hasUrl
                        ? "✅ Set"
                        : "❌ Missing"}
                      <br />
                      <span className="text-xs text-gray-600">
                        Format: {supabaseDebug.debug?.environment?.urlFormat}
                      </span>
                    </div>
                    <div
                      className={`p-2 rounded ${supabaseDebug.debug?.environment?.hasKey ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <strong>Supabase Key:</strong>{" "}
                      {supabaseDebug.debug?.environment?.hasKey
                        ? "✅ Set"
                        : "❌ Missing"}
                      <br />
                      <span className="text-xs text-gray-600">
                        Format: {supabaseDebug.debug?.environment?.keyFormat}
                      </span>
                    </div>
                  </div>
                  {supabaseDebug.debug?.environment?.urlPreview && (
                    <div className="mt-2 text-xs text-gray-600">
                      URL Preview: {supabaseDebug.debug.environment.urlPreview}
                    </div>
                  )}
                </div>

                {/* Connection Status */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Connection Status</h4>
                  <div
                    className={`p-3 rounded-lg ${supabaseDebug.debug?.connection?.testResult === "Success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                  >
                    <strong>Result:</strong>{" "}
                    {supabaseDebug.debug?.connection?.testResult || "Unknown"}
                    {supabaseDebug.debug?.connection?.error && (
                      <div className="mt-2">
                        <strong>Error:</strong>{" "}
                        {supabaseDebug.debug.connection.error.message}
                        {supabaseDebug.debug.connection.error.hint && (
                          <div className="text-sm text-gray-600 mt-1">
                            Hint: {supabaseDebug.debug.connection.error.hint}
                          </div>
                        )}
                      </div>
                    )}
                    {supabaseDebug.debug?.connection?.connectionError && (
                      <div className="mt-2">
                        <strong>Connection Error:</strong>{" "}
                        {supabaseDebug.debug.connection.connectionError}
                      </div>
                    )}
                    {supabaseDebug.debug?.connection?.missingVars && (
                      <div className="mt-2">
                        <strong>Missing Variables:</strong>{" "}
                        {supabaseDebug.debug.connection.missingVars.join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tables Status */}
                {supabaseDebug.debug?.tables && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Database Tables</h4>

                    {supabaseDebug.debug.tables.photosTable && (
                      <div
                        className={`p-3 rounded mb-2 ${supabaseDebug.debug.tables.photosTable.exists ? "bg-green-50" : "bg-red-50"}`}
                      >
                        <strong>Photos Table:</strong>{" "}
                        {supabaseDebug.debug.tables.photosTable.exists
                          ? "✅ Exists"
                          : "❌ Missing"}
                        {supabaseDebug.debug.tables.photosTable.exists && (
                          <div className="mt-1 text-sm">
                            <div>
                              Has Data:{" "}
                              {supabaseDebug.debug.tables.photosTable.hasData
                                ? "Yes"
                                : "No"}
                            </div>
                            {supabaseDebug.debug.tables.photosTable
                              .sampleColumns?.length > 0 && (
                              <div>
                                Columns:{" "}
                                {supabaseDebug.debug.tables.photosTable.sampleColumns.join(
                                  ", ",
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {supabaseDebug.debug.tables.photosTable.error && (
                          <div className="mt-1 text-sm text-red-600">
                            Error:{" "}
                            {supabaseDebug.debug.tables.photosTable.error}
                          </div>
                        )}
                      </div>
                    )}

                    {supabaseDebug.debug.tables.storage && (
                      <div
                        className={`p-3 rounded ${supabaseDebug.debug.tables.storage.hasWeddingBucket ? "bg-green-50" : "bg-yellow-50"}`}
                      >
                        <strong>Storage:</strong>
                        {supabaseDebug.debug.tables.storage.error ? (
                          <span className="text-red-600">
                            {" "}
                            Error accessing storage
                          </span>
                        ) : (
                          <span>
                            {" "}
                            Found{" "}
                            {
                              supabaseDebug.debug.tables.storage.bucketsFound
                            }{" "}
                            buckets
                            {supabaseDebug.debug.tables.storage
                              .hasWeddingBucket &&
                              " (including wedding-photos)"}
                          </span>
                        )}

                        {supabaseDebug.debug.tables.storage.bucketNames && (
                          <div className="mt-1 text-sm">
                            Buckets:{" "}
                            {supabaseDebug.debug.tables.storage.bucketNames.join(
                              ", ",
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Show Full Debug Data
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(supabaseDebug, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-gray-500">
                Loading Supabase debug info...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-olive-700 flex items-center justify-between">
              Photo Database Test
              <Button
                onClick={testPhotosLoad}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? "Loading..." : "Reload"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photoStats ? (
              <div>
                {photoStats.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <strong>Error loading photos:</strong> {photoStats.error}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <strong>Total Photos:</strong> {photoStats.totalPhotos}
                      </div>
                      <div>
                        <strong>Valid Photos:</strong> {photoStats.validPhotos}
                      </div>
                    </div>

                    {photoStats.photos && photoStats.photos.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Sample Photos:</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {photoStats.photos.map(
                            (photo: any, index: number) => (
                              <div
                                key={index}
                                className="border rounded p-2 text-xs"
                              >
                                <div>
                                  <strong>ID:</strong> {photo.id}
                                </div>
                                <div>
                                  <strong>By:</strong> {photo.uploaded_by}
                                </div>
                                <div>
                                  <strong>Data:</strong>{" "}
                                  {photo.photo_data
                                    ? photo.photo_data.substring(0, 30) + "..."
                                    : "No data"}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-gray-600">
                      Last checked:{" "}
                      {new Date(photoStats.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Loading photo statistics...</div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-olive-700">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="mr-2"
              >
                ← Back to Home
              </Button>
              <Button
                onClick={() => (window.location.href = "/admin")}
                variant="outline"
                className="mr-2"
              >
                Admin Dashboard
              </Button>
              <Button
                onClick={() => localStorage.clear()}
                variant="outline"
                className="mr-2"
              >
                Clear localStorage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
