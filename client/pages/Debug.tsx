import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { photosApi, guestsApi, handleApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { database } from "@/lib/database";
import { testSMSService, isSMSConfigured } from "@/lib/sms-service";

export default function Debug() {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [apiStatus, setApiStatus] = useState<any>({});
  const [supabaseStatus, setSupabaseStatus] = useState<any>({});
  const [databaseStatus, setDatabaseStatus] = useState<any>({});
  const [smsStatus, setSmsStatus] = useState<any>({});

  useEffect(() => {
    // Load localStorage data
    const photos = localStorage.getItem("wedding_photos");
    const guests = localStorage.getItem("wedding_guests");
    const flow = localStorage.getItem("wedding_flow");
    const invitation = localStorage.getItem("wedding_invitation_pdf");

    setLocalStorageData({
      photos: photos ? JSON.parse(photos) : null,
      guests: guests ? JSON.parse(guests) : null,
      flow: flow ? JSON.parse(flow) : null,
      invitation: invitation || null,
    });
  }, []);

  const testSupabase = async () => {
    const results: any = {};

    // Check if Supabase client is configured
    if (!supabase) {
      setSupabaseStatus({
        configured: false,
        error: "Supabase client not configured - check environment variables",
      });
      return;
    }

    results.configured = true;
    results.url = import.meta.env.VITE_SUPABASE_URL || "Not set";
    results.hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      // Test connection by checking guests table
      const { data, error, count } = await supabase
        .from("guests")
        .select("*", { count: "exact" });

      if (error) {
        results.connection = {
          success: false,
          error: error.message,
          code: error.code,
        };

        if (error.code === "PGRST116") {
          results.tablesExist = false;
          results.message = "Tables don't exist - need to run SQL setup";
        }
      } else {
        results.connection = {
          success: true,
          guestCount: count || 0,
        };
        results.tablesExist = true;
      }
    } catch (err: any) {
      results.connection = {
        success: false,
        error: err.message,
      };
    }

    setSupabaseStatus(results);
  };

  const testDatabase = async () => {
    const results: any = {};

    // Get storage status
    results.storageStatus = database.getStorageStatus();
    results.isUsingSupabase = database.isUsingSupabase();

    try {
      // Test database service
      const guests = await database.guests.getAll();
      const photos = await database.photos.getAll();
      const weddingFlow = await database.weddingFlow.getAll();

      results.data = {
        guests: guests.length,
        photos: photos.length,
        weddingFlow: weddingFlow.length,
      };
      results.success = true;
    } catch (error: any) {
      results.success = false;
      results.error = error.message;
    }

    setDatabaseStatus(results);
  };

  const testSMS = async () => {
    const results: any = {};

    // Check if SMS is configured
    results.isConfigured = isSMSConfigured();
    results.accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || "Not set";
    results.hasAuthToken = !!import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    results.phoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || "Not set";

    if (results.isConfigured) {
      try {
        results.testMessage = "Sending test SMS...";
        const success = await testSMSService();
        results.testMessage = success
          ? "✅ Test SMS sent successfully!"
          : "❌ Test SMS failed";
        results.testSuccess = success;
      } catch (error: any) {
        results.testMessage = `❌ SMS test error: ${error.message}`;
        results.testSuccess = false;
      }
    } else {
      results.testMessage = "SMS service not configured";
    }

    setSmsStatus(results);
  };

  const testAPI = async () => {
    const results: any = {};

    try {
      const photos = await photosApi.getAll();
      results.photos = {
        success: true,
        data: photos,
        count: photos?.length || 0,
      };
    } catch (error) {
      results.photos = {
        success: false,
        error: "API not available - using localStorage fallback",
      };
    }

    try {
      const guests = await guestsApi.getAll();
      results.guests = {
        success: true,
        data: guests,
        count: guests?.length || 0,
      };
    } catch (error) {
      results.guests = { success: false, error: handleApiError(error) };
    }

    setApiStatus(results);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("wedding_photos");
    localStorage.removeItem("wedding_guests");
    localStorage.removeItem("wedding_flow");
    localStorage.removeItem("wedding_invitation_pdf");
    window.location.reload();
  };

  const addTestPhoto = () => {
    const testPhoto =
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23f0f0f0'/><text x='100' y='100' text-anchor='middle' dy='0.3em'>Test Photo</text></svg>";
    const photos = JSON.parse(localStorage.getItem("wedding_photos") || "[]");
    photos.push(testPhoto);
    localStorage.setItem("wedding_photos", JSON.stringify(photos));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">
          Wedding Website Debug
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>LocalStorage Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Photos:</strong>{" "}
                  {localStorageData.photos
                    ? `${localStorageData.photos.length} items`
                    : "Empty"}
                </div>
                <div>
                  <strong>Guests:</strong>{" "}
                  {localStorageData.guests
                    ? `${localStorageData.guests.length} items`
                    : "Empty"}
                </div>
                <div>
                  <strong>Wedding Flow:</strong>{" "}
                  {localStorageData.flow
                    ? `${localStorageData.flow.length} items`
                    : "Empty"}
                </div>
                <div>
                  <strong>Invitation:</strong>{" "}
                  {localStorageData.invitation ? "Available" : "Empty"}
                </div>
                <div className="space-x-2">
                  <Button onClick={addTestPhoto} size="sm">
                    Add Test Photo
                  </Button>
                  <Button
                    onClick={clearLocalStorage}
                    variant="destructive"
                    size="sm"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testAPI}>Test API Endpoints</Button>
                {apiStatus.photos && (
                  <div>
                    <strong>Photos API:</strong>{" "}
                    {apiStatus.photos.success
                      ? `✅ Success (${apiStatus.photos.count} items)`
                      : `❌ Failed: ${apiStatus.photos.error}`}
                  </div>
                )}
                {apiStatus.guests && (
                  <div>
                    <strong>Guests API:</strong>{" "}
                    {apiStatus.guests.success
                      ? `✅ Success (${apiStatus.guests.count} items)`
                      : `❌ Failed: ${apiStatus.guests.error}`}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Supabase Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testSupabase}>Test Supabase Connection</Button>
                {supabaseStatus.configured !== undefined && (
                  <div>
                    <strong>Configured:</strong>{" "}
                    {supabaseStatus.configured ? "✅ Yes" : "❌ No"}
                  </div>
                )}
                {supabaseStatus.url && (
                  <div>
                    <strong>URL:</strong> {supabaseStatus.url}
                  </div>
                )}
                {supabaseStatus.hasKey !== undefined && (
                  <div>
                    <strong>API Key:</strong>{" "}
                    {supabaseStatus.hasKey ? "✅ Set" : "❌ Missing"}
                  </div>
                )}
                {supabaseStatus.connection && (
                  <div>
                    <strong>Connection:</strong>{" "}
                    {supabaseStatus.connection.success
                      ? `✅ Success (${supabaseStatus.connection.guestCount} guests)`
                      : `❌ Failed: ${supabaseStatus.connection.error}`}
                  </div>
                )}
                {supabaseStatus.tablesExist !== undefined && (
                  <div>
                    <strong>Tables:</strong>{" "}
                    {supabaseStatus.tablesExist
                      ? "✅ Exist"
                      : "❌ Missing - need SQL setup"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testDatabase}>Test Database Service</Button>
                {databaseStatus.storageStatus && (
                  <div>
                    <strong>Storage Type:</strong>{" "}
                    {databaseStatus.storageStatus.type}
                  </div>
                )}
                {databaseStatus.isUsingSupabase !== undefined && (
                  <div>
                    <strong>Using Supabase:</strong>{" "}
                    {databaseStatus.isUsingSupabase
                      ? "✅ Yes"
                      : "❌ No (localStorage)"}
                  </div>
                )}
                {databaseStatus.data && (
                  <div>
                    <strong>Data Counts:</strong>
                    <ul className="ml-4 mt-1">
                      <li>Guests: {databaseStatus.data.guests}</li>
                      <li>Photos: {databaseStatus.data.photos}</li>
                      <li>Wedding Flow: {databaseStatus.data.weddingFlow}</li>
                    </ul>
                  </div>
                )}
                {databaseStatus.success === false && (
                  <div>
                    <strong>Error:</strong> {databaseStatus.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testSMS}>Test SMS Service</Button>
                {smsStatus.isConfigured !== undefined && (
                  <div>
                    <strong>Configured:</strong>{" "}
                    {smsStatus.isConfigured ? "✅ Yes" : "❌ No"}
                  </div>
                )}
                {smsStatus.accountSid && (
                  <div>
                    <strong>Account SID:</strong> {smsStatus.accountSid}
                  </div>
                )}
                {smsStatus.hasAuthToken !== undefined && (
                  <div>
                    <strong>Auth Token:</strong>{" "}
                    {smsStatus.hasAuthToken ? "✅ Set" : "❌ Missing"}
                  </div>
                )}
                {smsStatus.phoneNumber && (
                  <div>
                    <strong>Phone Number:</strong> {smsStatus.phoneNumber}
                  </div>
                )}
                {smsStatus.testMessage && (
                  <div>
                    <strong>Test Result:</strong> {smsStatus.testMessage}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <strong>Notification Numbers:</strong>
                  <ul className="mt-1">
                    <li>+918105003858</li>
                    <li>+917276700997</li>
                    <li>+919731832609</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(
                {
                  localStorageData,
                  apiStatus,
                  supabaseStatus,
                  databaseStatus,
                  smsStatus,
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
