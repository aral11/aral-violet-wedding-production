import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

console.log("🚀 Manual GitHub Pages Deployment...");

// Get repository name from user input or current directory
const getRepoName = () => {
  try {
    // Try to get from git remote
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf8",
    }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
    if (match) {
      return match[2];
    }
  } catch (error) {
    console.log("Could not get repo name from git remote");
  }

  // Fallback to directory name
  return process.cwd().split("/").pop() || "aral-violet-wedding";
};

const repoName = getRepoName();
console.log(`📁 Repository name: ${repoName}`);

// Set environment variables
process.env.NODE_ENV = "production";
process.env.GITHUB_REPOSITORY = `aral11/${repoName}`;

console.log(`🔧 Building for: https://aral11.github.io/${repoName}/`);

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

  // Create .nojekyll file to prevent Jekyll processing
  writeFileSync(join(distPath, ".nojekyll"), "");
  console.log("✅ Created .nojekyll file");

  // Create CNAME file if custom domain needed (optional)
  // writeFileSync(join(distPath, "CNAME"), "yourdomain.com");

  console.log("�� Manual build complete!");
  console.log("📁 Files ready for deployment in ./dist");
  console.log(
    `🌐 Upload ./dist contents to: https://github.com/aral11/${repoName}/settings/pages`,
  );
  console.log(`📍 Your site will be at: https://aral11.github.io/${repoName}/`);
} else {
  console.error("❌ index.html not found in dist folder");
  process.exit(1);
}
