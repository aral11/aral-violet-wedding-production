import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

console.log("🚀 Building for GitHub Pages...");

// Set environment variables
process.env.NODE_ENV = "production";
process.env.GITHUB_REPOSITORY = "aral11/aral-violet-wedding";

// Run the build
try {
  execSync("vite build", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}

// Create 404.html for SPA routing on GitHub Pages
const distPath = "dist";
const indexPath = join(distPath, "index.html");
const notFoundPath = join(distPath, "404.html");

if (existsSync(indexPath)) {
  const indexContent = readFileSync(indexPath, "utf8");
  writeFileSync(notFoundPath, indexContent);
  console.log("✅ Created 404.html for SPA routing");

  console.log("🎉 GitHub Pages build complete!");
  console.log("📁 Files ready for deployment in ./dist");
} else {
  console.error("❌ index.html not found in dist folder");
  process.exit(1);
}
