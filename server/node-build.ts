import path from "path";
import { createServer } from "./index";
import * as express from "express";
import { closeDbConnection } from "./config/database";

async function startServer() {
  try {
    const app = await createServer();
    const port = process.env.PORT || 3000;

    // In production, serve the built SPA files
    const __dirname = import.meta.dirname;
    const distPath = path.join(__dirname, "../spa");

    // Serve static files
    app.use(express.static(distPath));

    // Handle React Router - serve index.html for all non-API routes
    app.get("*", (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      res.sendFile(path.join(distPath, "index.html"));
    });

    app.listen(port, () => {
      console.log(`🚀 Wedding Website server running on port ${port}`);
      console.log(`📱 Frontend: http://localhost:${port}`);
      console.log(`🔧 API: http://localhost:${port}/api`);
      console.log(`💾 Database: Connected to SQL Server`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log("🛑 Shutting down gracefully...");
      try {
        await closeDbConnection();
        console.log("💾 Database connection closed");
      } catch (error) {
        console.error("Error closing database connection:", error);
      }
      process.exit(0);
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
