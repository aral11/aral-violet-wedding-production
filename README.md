# 💒 Aral & Violet Wedding Website

A beautiful, responsive wedding website built with React, TypeScript, and Supabase for **December 28, 2025** in Udupi, Karnataka.

## ✨ Features

- 🎉 **RSVP System** with guest tracking (groom/bride side, accommodation)
- 📷 **Photo Gallery** with real-time uploads and admin controls
- 👑 **Admin Dashboard** with authentication and guest management
- ⏰ **Live Countdown** to the wedding day
- 📱 **Mobile Responsive** design for all devices
- 🔄 **Real-time sync** across all devices with Supabase
- 💍 **Proposal Video** embedded from YouTube
- 📋 **Wedding Timeline** download functionality
- 🎨 **Olive Green Theme** with elegant design

## 🚀 Quick Deploy

### 1. Set GitHub Secrets

Go to Repository Settings → Secrets → Actions and add:

- `VITE_SUPABASE_URL`: `https://rqhhevyrmwgoxvjwnvuc.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (see PRODUCTION_SETUP.md)

### 2. Push Code

Push to main branch - GitHub Actions will automatically deploy to GitHub Pages.

### 3. Enable GitHub Pages

Repository Settings → Pages → Source: "GitHub Actions"

**Live at:** `https://aral11.github.io/aral-violet-wedding/`

## 👑 Admin Access

Login credentials for the wedding couple:

- **Aral**: username `aral`, password `aral2025`
- **Violet**: username `violet`, password `violet2025`
- **Couple**: username `couple`, password `wedding2025`

## 🗄️ Database

- **Production**: Supabase (cross-device sync)
- **Fallback**: localStorage (offline functionality)
- **Capacity**: 500MB storage, 50K requests/month (free tier)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS with custom wedding theme
- **Database**: Supabase (PostgreSQL)
- **Deployment**: GitHub Pages with GitHub Actions
- **Storage**: Base64 encoding for photos and PDFs

## 📱 Device Compatibility

- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile devices (iOS Safari, Android Chrome)
- ✅ Tablet devices (iPad, Android tablets)
- ✅ Cross-device data synchronization

## 🎯 Wedding Day Features

- **Live RSVP tracking** for up to 1,500 guests
- **Real-time photo uploads** from guests
- **Admin dashboard** for wedding day management
- **Wedding timeline** download (available on Dec 28, 2025)
- **Invitation download** functionality

## 📞 Support

For technical issues or questions:

- Check `PRODUCTION_SETUP.md` for deployment details
- Review `SUPABASE_QUICK_SETUP.md` for database setup
- Verify `VIDEO_SETUP.md` for proposal video configuration

---

**Made with ❤️ by Aral D'Souza for Aral & Violet's Wedding**

_December 28, 2025 • Udupi, Karnataka, India_
