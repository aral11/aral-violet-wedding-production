// Test script to add sample photos to localStorage for testing display
const samplePhotoData = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
];

const guestPhotos = [
  {
    photoData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    uploadedBy: "guest_john_doe_1234567890",
    guestName: "John Doe",
    createdAt: new Date().toISOString()
  },
  {
    photoData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    uploadedBy: "guest_jane_smith_1234567891",
    guestName: "Jane Smith",
    createdAt: new Date().toISOString()
  }
];

console.log("Adding test photos to localStorage...");
localStorage.setItem("wedding_photos", JSON.stringify(samplePhotoData));
localStorage.setItem("wedding_guest_photos", JSON.stringify(guestPhotos));
console.log("Test photos added successfully!");
console.log("Admin photos:", samplePhotoData.length);
console.log("Guest photos:", guestPhotos.length);
