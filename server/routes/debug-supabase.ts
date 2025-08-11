import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

export const debugSupabase = async (req: Request, res: Response) => {
  try {
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    const debug = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlFormat: supabaseUrl ? (
          supabaseUrl.includes("supabase.co") ? "Valid format" : "Invalid format"
        ) : "Not set",
        urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "Not set",
        keyLength: supabaseKey ? supabaseKey.length : 0,
        keyFormat: supabaseKey ? (
          supabaseKey.startsWith("eyJ") ? "Valid JWT format" : "Invalid format"
        ) : "Not set",
      },
      connection: {},
      tables: {},
    };

    // Test Supabase connection
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        debug.connection.clientCreated = true;

        // Test basic connection
        try {
          const { data, error } = await supabase
            .from("photos")
            .select("count", { count: "exact", head: true });

          if (error) {
            debug.connection.testResult = "Error";
            debug.connection.error = {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            };
          } else {
            debug.connection.testResult = "Success";
            debug.connection.photosTableExists = true;
            debug.connection.photoCount = data || 0;
          }
        } catch (connectionError: any) {
          debug.connection.testResult = "Connection Failed";
          debug.connection.connectionError = connectionError.message;
          debug.connection.errorType = connectionError.name;
        }

        // Test table structure
        try {
          const { data: tableInfo, error: tableError } = await supabase
            .from("photos")
            .select("*")
            .limit(1);

          if (!tableError && Array.isArray(tableInfo)) {
            debug.tables.photosTable = {
              exists: true,
              hasData: tableInfo.length > 0,
              sampleColumns: tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [],
            };
          } else if (tableError) {
            debug.tables.photosTable = {
              exists: false,
              error: tableError.message,
              code: tableError.code,
            };
          }
        } catch (tableError: any) {
          debug.tables.photosTable = {
            exists: false,
            error: tableError.message,
          };
        }

        // Test storage bucket
        try {
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
          
          if (!bucketError && buckets) {
            const weddingBucket = buckets.find(b => b.name === "wedding-photos");
            debug.tables.storage = {
              bucketsFound: buckets.length,
              bucketNames: buckets.map(b => b.name),
              hasWeddingBucket: !!weddingBucket,
              weddingBucketPublic: weddingBucket?.public || false,
            };
          } else {
            debug.tables.storage = {
              error: bucketError?.message || "Unknown storage error",
            };
          }
        } catch (storageError: any) {
          debug.tables.storage = {
            error: storageError.message,
          };
        }

      } catch (clientError: any) {
        debug.connection.clientCreated = false;
        debug.connection.clientError = clientError.message;
      }
    } else {
      debug.connection.testResult = "No credentials";
      debug.connection.missingVars = [];
      if (!supabaseUrl) debug.connection.missingVars.push("SUPABASE_URL");
      if (!supabaseKey) debug.connection.missingVars.push("SUPABASE_ANON_KEY");
    }

    res.json({
      success: true,
      debug,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Debug failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
