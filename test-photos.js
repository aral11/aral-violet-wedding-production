// Simple test to add photos to localStorage for testing
// Run this in browser console: copy and paste this code

const testPhotos = [
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23e8f5e8'/><circle cx='100' cy='100' r='50' fill='%234ade80'/><text x='100' y='110' text-anchor='middle' fill='white' font-size='16'>Photo 1</text></svg>",
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23fef3c7'/><circle cx='100' cy='100' r='50' fill='%23f59e0b'/><text x='100' y='110' text-anchor='middle' fill='white' font-size='16'>Photo 2</text></svg>",
];

// Add test photos to localStorage
localStorage.setItem("wedding_photos", JSON.stringify(testPhotos));
console.log("Test photos added to localStorage");

// Reload the page to see them
window.location.reload();
