# 🎥 Adding Your Proposal Video to the Wedding Website

## Why Your Video Isn't Playing

The video file isn't in your repository. This is actually common and expected! Here's why YouTube embed is the better solution:

### ❌ **Issues with Large Video Files:**

- GitHub has a 100MB file size limit
- Video files are usually much larger (200MB-2GB+)
- Large files slow down your website
- Mobile users struggle with big video downloads

### ✅ **YouTube Embed Benefits:**

- No file size limits
- Professional video player
- Works on all devices and speeds
- HD quality with adaptive streaming
- Free hosting forever

## 🚀 How to Add Your Proposal Video (YouTube Method)

### Step 1: Upload to YouTube

1. Go to [YouTube.com](https://youtube.com) and sign in
2. Click "Create" → "Upload Video"
3. Upload your proposal video
4. Set it to "Unlisted" (so only people with the link can see it)
5. Add a title like "Aral & Violet - Surprise Proposal"

### Step 2: Get the Video ID

From your YouTube URL like: `https://www.youtube.com/watch?v=ABC123DEF456`
Copy the part after `v=`: **ABC123DEF456**

### Step 3: Update Your Website

In `client/pages/Index.tsx`, find this line:

```javascript
src =
  "https://www.youtube.com/embed/YOUR_VIDEO_ID?rel=0&modestbranding=1&controls=1";
```

Replace `YOUR_VIDEO_ID` with your actual video ID:

```javascript
src =
  "https://www.youtube.com/embed/ABC123DEF456?rel=0&modestbranding=1&controls=1";
```

### Step 4: Hide the Fallback Message

Once you add your video ID, you can remove or comment out the fallback div to show only your video.

## Alternative: Vimeo Embed

If you prefer Vimeo:

1. Upload to Vimeo
2. Get the video ID from the URL
3. Replace the iframe src with:

```javascript
src = "https://player.vimeo.com/video/YOUR_VIMEO_ID";
```

## 🎬 Final Result

Your surprise proposal video will:

- ✅ Load instantly for all guests
- ✅ Work perfectly on mobile
- ✅ Have professional video controls
- ✅ Support HD quality
- ✅ Never slow down your website

## Current Status

Your website is ready! Just add your YouTube video ID and your proposal video will work perfectly.

**Next Steps:**

1. Upload video to YouTube (set as Unlisted)
2. Copy the video ID
3. Replace 'YOUR_VIDEO_ID' in the code
4. Push to GitHub
5. Your surprise proposal video is live! 💍
