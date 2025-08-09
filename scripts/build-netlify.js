import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

console.log("🚀 Building for Netlify...");

// Set environment variables for Netlify
process.env.NODE_ENV = "production";
process.env.VITE_DEPLOYMENT_PLATFORM = "netlify";

// Run the client build only for static deployment
try {
  execSync("vite build", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}

// Ensure proper redirects for SPA
const distPath = "dist";
const indexPath = join(distPath, "index.html");
const redirectsPath = join(distPath, "_redirects");

if (existsSync(indexPath)) {
  // Create _redirects file for SPA routing
  writeFileSync(redirectsPath, "/*    /index.html   200\n");
  console.log("✅ Created _redirects for SPA routing");

  console.log("🎉 Netlify build complete!");
  console.log("📁 Files ready for deployment in ./dist");
} else {
  console.error("❌ index.html not found in dist folder");
  process.exit(1);
}
