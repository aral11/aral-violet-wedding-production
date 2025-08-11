import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function SupabaseSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "untested" | "success" | "failed"
  >("untested");

  const testConnection = async () => {
    setTestingConnection(true);

    try {
      if (!supabase) {
        throw new Error("Supabase client not configured");
      }

      // Test basic connection
      const { data, error } = await supabase
        .from("photos")
        .select("count", { count: "exact", head: true });

      if (error) {
        throw error;
      }

      setConnectionStatus("success");
      toast({
        title: "Connection Successful! ✅",
        description: "Supabase is properly configured and connected.",
        duration: 5000,
      });
    } catch (error) {
      setConnectionStatus("failed");
      toast({
        title: "Connection Failed ❌",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied! 📋",
      description: "SQL command copied to clipboard",
      duration: 2000,
    });
  };

  const sqlSetup = `-- Update photos table to include guest_name column
ALTER TABLE photos ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Ensure all required tables exist with correct structure

-- Photos table with guest support
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_data TEXT NOT NULL,
    uploaded_by TEXT DEFAULT 'admin',
    guest_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
DROP POLICY IF EXISTS "Public can read photos" ON photos;
DROP POLICY IF EXISTS "Public can create photos" ON photos;
DROP POLICY IF EXISTS "Public can delete photos" ON photos;

CREATE POLICY "Public can read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public can create photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete photos" ON photos FOR DELETE USING (true);`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-sage-50 to-olive-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sage-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-sage-700 hover:text-olive-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2 text-olive-700">
            <span className="font-serif text-lg">Supabase Setup</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-olive-700 mb-4">
            Configure Supabase Database
          </h1>
          <p className="text-sage-600 text-lg">
            Set up your Supabase database to enable photo uploads and real-time
            sync
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectionStatus === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-sage-300" />
              )}
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Supabase Client:</span>
                <span className={supabase ? "text-green-600" : "text-red-600"}>
                  {supabase ? "✅ Configured" : "❌ Not Configured"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Database Connection:</span>
                <span
                  className={
                    connectionStatus === "success"
                      ? "text-green-600"
                      : connectionStatus === "failed"
                        ? "text-red-600"
                        : "text-sage-500"
                  }
                >
                  {connectionStatus === "success"
                    ? "✅ Connected"
                    : connectionStatus === "failed"
                      ? "❌ Failed"
                      : "⏳ Not Tested"}
                </span>
              </div>

              <Button
                onClick={testConnection}
                disabled={testingConnection || !supabase}
                className="w-full"
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <div className="space-y-6">
          {/* Step 1: Create Supabase Project */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Create Supabase Project</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sage-700">
                <li>
                  Go to{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-olive-600 hover:text-olive-700 inline-flex items-center gap-1"
                  >
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Sign up with GitHub (recommended)</li>
                <li>Create a new project: "aral-violet-wedding"</li>
                <li>Choose a region close to your location</li>
                <li>Set a strong database password</li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 2: Set up Database */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Set up Database Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sage-700">
                  Execute this SQL in your Supabase SQL Editor:
                </p>

                <div className="relative">
                  <pre className="bg-sage-50 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{sqlSetup}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(sqlSetup)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Tip:</strong> Go to your Supabase project → SQL
                    Editor → New query, paste the above SQL, and click "Run".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Get API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Get API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sage-700 mb-4">
                <li>Go to Project Settings → API in your Supabase dashboard</li>
                <li>Copy your Project URL (e.g., https://xxxxx.supabase.co)</li>
                <li>Copy your Anonymous/Public Key</li>
              </ol>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> Never share your service role key
                  publicly. Only use the anonymous/public key for this wedding
                  website.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Configure Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Configure Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sage-700 mb-2">
                    For Local Development:
                  </h4>
                  <p className="text-sm text-sage-600 mb-3">
                    Create a `.env.local` file in your project root with:
                  </p>
                  <pre className="bg-sage-50 p-3 rounded text-sm">
                    {`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-sage-700 mb-2">
                    For Netlify Production:
                  </h4>
                  <p className="text-sm text-sage-600 mb-3">
                    Add these in Netlify Dashboard → Site Settings → Environment
                    Variables:
                  </p>
                  <pre className="bg-sage-50 p-3 rounded text-sm">
                    {`SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Test */}
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Test Everything</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sage-700">
                <li>
                  Restart your development server:{" "}
                  <code className="bg-sage-100 px-1 rounded">npm run dev</code>
                </li>
                <li>Click "Test Connection" above to verify the setup</li>
                <li>Try uploading a photo via the admin panel</li>
                <li>Try uploading a photo via guest upload</li>
                <li>Verify photos appear in the gallery</li>
              </ol>

              {connectionStatus === "success" && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    🎉 <strong>Success!</strong> Your Supabase database is
                    properly configured. You can now upload and view photos that
                    sync across all devices.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center space-x-4">
          <Button onClick={() => navigate("/login")} variant="outline">
            Admin Panel
          </Button>
          <Button onClick={() => navigate("/guest-upload")} variant="outline">
            Test Guest Upload
          </Button>
          <Button onClick={() => navigate("/")} variant="outline">
            View Gallery
          </Button>
        </div>
      </div>
    </div>
  );
}
