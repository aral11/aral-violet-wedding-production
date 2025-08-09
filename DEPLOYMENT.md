# 🚀 GitHub Pages Deployment Guide

## Automatic Deployment (Recommended)

Your wedding website is configured for automatic GitHub Pages deployment!

### Setup Steps:

1. **Push to GitHub**: Your code is automatically built and deployed when you push to the `main` branch

2. **Enable GitHub Pages**:

   - Go to your GitHub repository settings
   - Scroll to "Pages" section
   - Source: "GitHub Actions"
   - Save

3. **Your Site Will Be Live At**:
   ```
   https://yourusername.github.io/your-repo-name/
   ```

### Features Working on GitHub Pages:

- ✅ **Full Wedding Website**: Beautiful olive green theme
- ✅ **RSVP System**: Guests can submit responses (saved to localStorage)
- ✅ **Photo Gallery**: Display wedding photos
- ✅ **Admin Dashboard**: Manage content (login: aral/aral2025)
- ✅ **Downloads**: Wedding invitation and timeline
- ✅ **Mobile Responsive**: Works on all devices
- ✅ **Fast Loading**: Static files load instantly

### Manual Deployment (Alternative):

```bash
# Build the project
npm run build:github

# The files in 'dist' folder are ready for GitHub Pages
# Commit and push to trigger deployment
```

## Why GitHub Pages is Perfect:

- 🆓 **Free Hosting**: No hosting costs
- ⚡ **Fast**: CDN hosting worldwide
- 🔄 **Auto Deploy**: Updates automatically on push
- 📱 **Mobile Ready**: Works on all devices
- 🔒 **Secure**: HTTPS included
- 👥 **Handles Traffic**: Perfect for 100-1500 wedding guests

## Troubleshooting:

If the site shows "404" or blank page:

1. Check that GitHub Pages is enabled in repository settings
2. Ensure the source is set to "GitHub Actions"
3. Wait 2-3 minutes for deployment to complete
4. Check the Actions tab for build status

## Custom Domain (Optional):

To use your own domain (like weddingsite.com):

1. Add a CNAME file to the `public` folder with your domain
2. Configure DNS settings with your domain provider
3. Enable custom domain in GitHub Pages settings

Your wedding website is ready to share with guests! 🎉💒
