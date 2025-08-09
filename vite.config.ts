import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Set base path for GitHub Pages if in production
  // The base path will be automatically set by GitHub Actions
  base:
    process.env.NODE_ENV === "production" &&
    process.env.GITHUB_REPOSITORY &&
    process.env.VITE_DEPLOYMENT_PLATFORM !== "netlify"
      ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
      : "/",
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      try {
        console.log("Initializing Express server...");
        const app = await createServer();
        console.log("Express server initialized successfully");

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);

        // Don't add fallback middleware if Express server works
        return;
      } catch (error) {
        console.error("Failed to initialize Express server:", error);
        console.log("Starting fallback API middleware...");
        // Create a fallback middleware that provides graceful responses
        server.middlewares.use("/api", (req, res, next) => {
          const url = req.url || "";
          const method = req.method || "GET";

          res.setHeader("Content-Type", "application/json");

          // Handle different API endpoints gracefully
          if (url.includes("/guests")) {
            if (method === "GET") {
              res.statusCode = 200;
              res.end(JSON.stringify([]));
            } else if (method === "POST") {
              res.statusCode = 201;
              res.end(
                JSON.stringify({
                  id: Date.now().toString(),
                  name: "Fallback User",
                  email: "fallback@example.com",
                  phone: "0000000000",
                  attending: true,
                  guests: 1,
                  side: "groom",
                  needsAccommodation: false,
                  createdAt: new Date().toISOString(),
                }),
              );
            } else {
              res.statusCode = 200;
              res.end(
                JSON.stringify({ message: "Operation completed successfully" }),
              );
            }
          } else if (url.includes("/photos")) {
            if (method === "GET") {
              res.statusCode = 200;
              res.end(JSON.stringify([]));
            } else if (method === "POST") {
              res.statusCode = 201;
              res.end(
                JSON.stringify({
                  id: Date.now().toString(),
                  photoData: "fallback-photo-data",
                  uploadedBy: "admin",
                  createdAt: new Date().toISOString(),
                }),
              );
            } else {
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  message: "Photo operation completed successfully",
                }),
              );
            }
          } else if (url.includes("/wedding-flow")) {
            if (method === "GET") {
              res.statusCode = 200;
              res.end(JSON.stringify([]));
            } else {
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  message: "Wedding flow operation completed successfully",
                }),
              );
            }
          } else if (url.includes("/invitation")) {
            if (method === "GET") {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "No invitation found" }));
            } else {
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  message: "Invitation operation completed successfully",
                }),
              );
            }
          } else if (url.includes("/sms")) {
            if (url.includes("/debug")) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                environment: {
                  hasSid: false,
                  hasToken: false,
                  hasPhone: false,
                  sidPrefix: "Not set",
                  phoneNumber: "Not set",
                },
                credentials: {
                  clientInitialized: false,
                  missingVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]
                },
                twilioTest: {},
                fallbackMode: true
              }));
            } else if (url.includes("/test")) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: "SMS test logged (fallback mode)",
                development: true,
                fallbackMode: true
              }));
            } else {
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: "SMS notification logged (fallback mode)",
                development: true,
                fallbackMode: true
              }));
            }
          } else if (url.includes("/ping")) {
            res.statusCode = 200;
            res.end(JSON.stringify({ message: "pong" }));
          } else {
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                message: "API endpoint available - fallback mode",
              }),
            );
          }
        });
      }
    },
  };
}
