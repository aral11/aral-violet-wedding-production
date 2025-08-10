import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import {
  Heart,
  Download,
  LogOut,
  Camera,
  Users,
  Upload,
  Trash2,
  Eye,
  Clock,
  Plus,
  Edit,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  guestsApi,
  photosApi,
  invitationApi,
  weddingFlowApi,
  handleApiError,
} from "@/lib/api";
import { database } from "@/lib/database";
import { getMobileFileAccept } from "@/lib/mobile-utils";
import MobileCompatibilityNotice from "@/components/MobileCompatibilityNotice";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  attending: boolean;
  guests: number;
  side: "groom" | "bride";
  message?: string;
  dietaryRestrictions?: string;
  needsAccommodation: boolean;
  createdAt: string;
}

interface WeddingFlowItem {
  id: string;
  time: string;
  title: string;
  description: string;
  duration?: string;
  type: "ceremony" | "reception" | "entertainment" | "meal" | "special";
}

export default function AdminDashboard() {
  const { isAuthenticated, logout, user } = useAuth();
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [guestPhotos, setGuestPhotos] = useState<Array<{id: string, photoData: string, guestName: string | null, uploadedBy: string, createdAt: string}>>([]);
  const [weddingFlow, setWeddingFlow] = useState<WeddingFlowItem[]>([]);
  const [invitationPDF, setInvitationPDF] = useState<string | null>(null);
  const [newFlowItem, setNewFlowItem] = useState<Omit<WeddingFlowItem, "id">>({
    time: "",
    title: "",
    description: "",
    duration: "",
    type: "reception",
  });
  const [editingFlow, setEditingFlow] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load data using database service (Supabase + localStorage fallback)
  useEffect(() => {
    const loadAllData = async () => {
      // Load guests using database service
      try {
        const guests = await database.guests.getAll();
        if (guests && guests.length > 0) {
          setGuests(
            guests.map((guest) => ({
              id: guest.id || Date.now().toString(),
              name: guest.name,
              email: guest.email,
              phone: guest.phone || "",
              attending: guest.attending,
              guests: guest.guests,
              side: guest.side,
              message: guest.message,
              dietaryRestrictions: guest.dietary_restrictions,
              needsAccommodation: guest.needs_accommodation,
              createdAt: guest.created_at || new Date().toISOString(),
            })),
          );
          const storageType = database.isUsingSupabase()
            ? "Supabase"
            : "localStorage";
          console.log(`Guests loaded from ${storageType}:`, guests.length);
        }
      } catch (error) {
        console.log("Error loading guests:", error);
        setGuests([]);
      }

      // Load photos using database service
      try {
        const photos = await database.photos.getAll();
        if (photos && photos.length > 0) {
          setUploadedPhotos(photos.map((photo) => photo.photo_data));
          const storageType = database.isUsingSupabase()
            ? "Supabase"
            : "localStorage";
          console.log(`Photos loaded from ${storageType}:`, photos.length);
        }
      } catch (error) {
        console.log("Error loading photos:", error);
        setUploadedPhotos([]);
      }

      // Load wedding flow using database service
      try {
        const weddingFlowData = await database.weddingFlow.getAll();
        if (weddingFlowData && weddingFlowData.length > 0) {
          setWeddingFlow(
            weddingFlowData.map((item) => ({
              id: item.id || Date.now().toString(),
              time: item.time,
              title: item.title,
              description: item.description,
              duration: item.duration,
              type: item.type,
              createdAt: item.created_at || new Date().toISOString(),
            })),
          );
          const storageType = database.isUsingSupabase()
            ? "Supabase"
            : "localStorage";
          console.log(
            `Wedding flow loaded from ${storageType}:`,
            weddingFlowData.length,
          );
        } else {
          const savedFlow = localStorage.getItem("wedding_flow");
          if (savedFlow) {
            setWeddingFlow(JSON.parse(savedFlow));
          } else {
            // Set default flow
            const defaultFlow: WeddingFlowItem[] = [
              {
                id: "1",
                time: "7:00 PM",
                title: "Welcome & Cocktails",
                description:
                  "Guests arrive and enjoy welcome drinks and appetizers",
                duration: "30 min",
                type: "reception",
              },
              {
                id: "2",
                time: "7:30 PM",
                title: "Grand Entrance",
                description: "Introduction of the newly married couple",
                duration: "10 min",
                type: "ceremony",
              },
              {
                id: "3",
                time: "8:00 PM",
                title: "Dinner Service",
                description: "Multi-cuisine buffet dinner",
                duration: "60 min",
                type: "meal",
              },
              {
                id: "4",
                time: "9:00 PM",
                title: "Cultural Performances",
                description: "Traditional dance and music performances",
                duration: "45 min",
                type: "entertainment",
              },
              {
                id: "5",
                time: "10:00 PM",
                title: "Cake Cutting",
                description: "Wedding cake cutting ceremony",
                duration: "15 min",
                type: "special",
              },
              {
                id: "6",
                time: "10:30 PM",
                title: "Dancing & Celebration",
                description: "Open dance floor for all guests",
                duration: "60 min",
                type: "entertainment",
              },
              {
                id: "7",
                time: "11:30 PM",
                title: "Send-off",
                description: "Farewell and thank you to all guests",
                duration: "",
                type: "ceremony",
              },
            ];
            setWeddingFlow(defaultFlow);
            localStorage.setItem("wedding_flow", JSON.stringify(defaultFlow));
          }
        }
      } catch (error) {
        console.log("API unavailable, loading wedding flow from localStorage");
        const savedFlow = localStorage.getItem("wedding_flow");
        if (savedFlow) {
          setWeddingFlow(JSON.parse(savedFlow));
        }
      }

      // Load invitation PDF using database service
      try {
        const invitation = await database.invitation.get();
        if (invitation && invitation.pdf_data) {
          setInvitationPDF(invitation.pdf_data);
          const storageType = database.isUsingSupabase()
            ? "Supabase"
            : "localStorage";
          console.log(`Invitation loaded from ${storageType}`);
        }
      } catch (error) {
        console.log("Error loading invitation:", error);
        // Fallback to localStorage
        const savedInvitation = localStorage.getItem("wedding_invitation_pdf");
        if (savedInvitation) {
          setInvitationPDF(savedInvitation);
        }
      }

      // Load guest photos using database service
      try {
        const guestPhotosData = await database.photos.getGuestPhotos();
        if (guestPhotosData && guestPhotosData.length > 0) {
          setGuestPhotos(guestPhotosData.map((photo) => ({
            id: photo.id || Date.now().toString(),
            photoData: photo.photo_data,
            guestName: photo.guest_name,
            uploadedBy: photo.uploaded_by,
            createdAt: photo.created_at || new Date().toISOString(),
          })));
          const storageType = database.isUsingSupabase()
            ? "Supabase"
            : "localStorage";
          console.log(`Guest photos loaded from ${storageType}:`, guestPhotosData.length);
        }
      } catch (error) {
        console.log("Error loading guest photos:", error);
        setGuestPhotos([]);
      }
    };

    loadAllData();
  }, []);

  // Data persistence is now handled by the database service (Supabase + localStorage fallback)
  // No need for manual localStorage saving since database service handles this automatically

  // Redirect if not authenticated (after all hooks)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const downloadWeddingFlow = () => {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const getTypeIcon = (type: string) => {
      switch (type) {
        case "ceremony":
          return "💒";
        case "reception":
          return "🎉";
        case "entertainment":
          return "🎵";
        case "meal":
          return "🍽️";
        case "special":
          return "✨";
        default:
          return "����";
      }
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case "ceremony":
          return "#5a6c57";
        case "reception":
          return "#84a178";
        case "entertainment":
          return "#9ca3af";
        case "meal":
          return "#6b7280";
        case "special":
          return "#d97706";
        default:
          return "#718096";
      }
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reception Flow - Aral & Violet Wedding</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #2d3748;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #84a178;
            padding: 30px;
            margin-bottom: 30px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .couple-names {
            font-size: 2.5em;
            color: #5a6c57;
            margin: 10px 0;
            font-weight: bold;
        }
        .wedding-date {
            font-size: 1.2em;
            color: #718096;
            margin-bottom: 15px;
        }
        .venue-info {
            margin: 15px 0;
            font-size: 1em;
            color: #718096;
        }
        .timeline-container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .timeline-header {
            text-align: center;
            color: #5a6c57;
            font-size: 1.8em;
            margin-bottom: 30px;
            border-bottom: 2px solid #84a178;
            padding-bottom: 15px;
        }
        .timeline {
            position: relative;
            padding-left: 60px;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 30px;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(to bottom, #84a178, #5a6c57);
        }
        .timeline-item {
            position: relative;
            margin-bottom: 40px;
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            border-left: 4px solid #84a178;
            transition: transform 0.2s;
        }
        .timeline-item:hover {
            transform: translateX(5px);
        }
        .timeline-marker {
            position: absolute;
            left: -48px;
            top: 25px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 3px solid #84a178;
            z-index: 1;
        }
        .timeline-time {
            font-size: 1.3em;
            font-weight: bold;
            color: #5a6c57;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .timeline-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .timeline-description {
            color: #4a5568;
            margin-bottom: 10px;
            line-height: 1.5;
        }
        .timeline-duration {
            font-size: 0.9em;
            color: #718096;
            font-style: italic;
            background: white;
            padding: 5px 10px;
            border-radius: 15px;
            display: inline-block;
        }
        .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
            margin-left: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 30px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .logo {
            color: #5a6c57;
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .note {
            background: #fef5e7;
            border: 2px solid #f6d55c;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        @media print {
            body {
                background: white;
            }
            .timeline-container, .header, .footer {
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">💐 Wedding Reception Timeline</div>
        <div class="couple-names">Aral & Violet</div>
        <div class="wedding-date">December 28, 2025</div>
        <div class="venue-info">
            <div><strong>📍 Venue:</strong> Sai Radha Heritage Beach Resort, Kaup</div>
            <div><strong>⏰ Reception:</strong> 7:00 PM – 11:30 PM</div>
        </div>
        <div style="font-size: 0.9em; color: #a0aec0; margin-top: 15px;">Timeline Generated: ${currentDate}</div>
    </div>

    <div class="note">
        <div style="font-size: 1.1em; font-weight: bold; color: #d97706; margin-bottom: 10px;">🎉 Join Us for an Evening of Celebration!</div>
        <div style="color: #92400e;">All times are approximate and may vary based on the flow of celebration</div>
    </div>

    <div class="timeline-container">
        <div class="timeline-header">🕐 Reception Schedule</div>

        <div class="timeline">
            ${weddingFlow
              .map(
                (item) => `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-time">
                    ⏰ ${item.time}
                    ${item.duration ? `<span class="timeline-duration">Duration: ${item.duration}</span>` : ""}
                </div>
                <div class="timeline-title">
                    ${getTypeIcon(item.type)} ${item.title}
                    <span class="type-badge" style="background-color: ${getTypeColor(item.type)}">
                        ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                </div>
                <div class="timeline-description">${item.description}</div>
            </div>
            `,
              )
              .join("")}
        </div>
    </div>

    <div class="footer">
        <div class="logo">❤️ TheVIRALWedding</div>
        <div style="font-size: 1.2em; margin: 10px 0;">A&V • 12.28.2025</div>
        <div style="color: #718096;">With hearts full of joy and blessings from above</div>
        <div style="margin-top: 15px; font-size: 0.9em; color: #a0aec0;">
            Thank you for being part of our special celebration
        </div>
    </div>
</body>
</html>
    `;

    // Create a new window and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Auto-download as PDF
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const downloadGuestList = () => {
    const attendingGuests = guests.filter((g) => g.attending);
    const notAttendingGuests = guests.filter((g) => !g.attending);
    const groomSideGuests = attendingGuests.filter((g) => g.side === "groom");
    const brideSideGuests = attendingGuests.filter((g) => g.side === "bride");
    const totalGuestCount = attendingGuests.reduce(
      (sum, guest) => sum + guest.guests,
      0,
    );
    const accommodationNeeded = attendingGuests.filter(
      (g) => g.needsAccommodation,
    );

    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wedding Guest List - Aral & Violet</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #2d3748;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #84a178;
            padding-bottom: 20px;
            margin-bottom: 30px;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .couple-names {
            font-size: 2.5em;
            color: #5a6c57;
            margin: 10px 0;
            font-weight: bold;
        }
        .wedding-date {
            font-size: 1.2em;
            color: #718096;
            margin-bottom: 10px;
        }
        .report-date {
            font-size: 0.9em;
            color: #a0aec0;
        }
        .summary {
            background: white;
            padding: 25px;
            margin: 20px 0;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .summary h2 {
            color: #5a6c57;
            border-bottom: 2px solid #84a178;
            padding-bottom: 10px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f7fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #84a178;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #5a6c57;
        }
        .stat-label {
            color: #718096;
            font-size: 0.9em;
        }
        .section {
            background: white;
            margin: 20px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .section-header {
            background: #5a6c57;
            color: white;
            padding: 15px 25px;
            font-size: 1.2em;
            font-weight: bold;
        }
        .guest-list {
            padding: 0;
        }
        .guest-item {
            padding: 25px;
            border-bottom: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: 3fr 2fr 1.5fr;
            gap: 25px;
            align-items: start;
            transition: background-color 0.2s;
        }
        .guest-item:hover {
            background-color: #f8fafc;
        }
        .guest-item:last-child {
            border-bottom: none;
        }
        .guest-main {
            color: #2d3748;
        }
        .guest-name {
            font-weight: bold;
            font-size: 1.1em;
            color: #5a6c57;
        }
        .guest-contact {
            font-size: 0.9em;
            color: #718096;
            margin: 5px 0;
        }
        .guest-details {
            font-size: 0.9em;
            color: #4a5568;
        }
        .guest-message {
            font-style: italic;
            color: #718096;
            margin-top: 10px;
            padding: 10px;
            background: #f7fafc;
            border-radius: 5px;
        }
        .side-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
        }
        .groom-side {
            background: #84a178;
        }
        .bride-side {
            background: #9ca3af;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #a0aec0;
            font-size: 0.9em;
        }
        .logo {
            color: #5a6c57;
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        @media print {
            body {
                background: white;
            }
            .section, .summary, .header {
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">❤��� TheVIRALWedding</div>
        <div class="couple-names">Aral & Violet</div>
        <div class="wedding-date">December 28, 2025</div>
        <div style="margin: 15px 0; font-size: 1em; color: #718096;">
            <div><strong>Church Nuptials:</strong> Mother of Sorrows Church, Udupi • 4:00 PM</div>
            <div><strong>Reception:</strong> Sai Radha Heritage Beach Resort, Kaup • 7:00 PM</div>
        </div>
        <div class="report-date">RSVP Report Generated: ${currentDate}</div>
    </div>

    <div class="summary">
        <h2>📊 Wedding Summary</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${guests.length}</div>
                <div class="stat-label">Total RSVPs</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${attendingGuests.length}</div>
                <div class="stat-label">Attending</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalGuestCount}</div>
                <div class="stat-label">Total Guests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${accommodationNeeded.length}</div>
                <div class="stat-label">Need Accommodation</div>
            </div>
        </div>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${groomSideGuests.length}</div>
                <div class="stat-label">Groom's Side</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${brideSideGuests.length}</div>
                <div class="stat-label">Bride's Side</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${notAttendingGuests.length}</div>
                <div class="stat-label">Not Attending</div>
            </div>
        </div>
    </div>

    ${
      attendingGuests.length > 0
        ? `
    <div class="section">
        <div class="section-header">✅ Attending Guests (${attendingGuests.length})</div>
        <div class="guest-list">
            ${attendingGuests
              .map(
                (guest) => `
            <div class="guest-item">
                <div class="guest-main">
                    <div class="guest-name">${guest.name}</div>
                    <div class="guest-contact">📧 ${guest.email}</div>
                    <div class="guest-contact">📱 ${guest.phone}</div>
                    <span class="side-badge ${guest.side === "groom" ? "groom-side" : "bride-side"}">
                        ${guest.side === "groom" ? "Aral's Side" : "Violet's Side"}
                    </span>
                    ${guest.message ? `<div class="guest-message">💌 "${guest.message}"</div>` : ""}
                </div>
                <div class="guest-details">
                    <div style="margin-bottom: 8px;"><strong>👥 Total Guests:</strong> ${guest.guests}</div>
                    <div style="margin-bottom: 8px;"><strong>🏨 Accommodation:</strong> ${guest.needsAccommodation ? "✅ Required" : "❌ Not needed"}</div>
                    ${guest.dietaryRestrictions ? `<div style="margin-bottom: 8px;"><strong>🍽️ Dietary:</strong> ${guest.dietaryRestrictions}</div>` : '<div style="margin-bottom: 8px;"><strong>🍽️ Dietary:</strong> None specified</div>'}
                </div>
                <div class="guest-details">
                    <div style="margin-bottom: 5px;"><strong>📅 RSVP Date:</strong></div>
                    <div style="font-size: 0.9em;">${new Date(guest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div style="font-size: 0.8em; color: #a0aec0; margin-top: 5px;">${new Date(guest.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
            </div>
            `,
              )
              .join("")}
        </div>
    </div>
    `
        : ""
    }

    ${
      accommodationNeeded.length > 0
        ? `
    <div class="section">
        <div class="section-header">🏨 Accommodation Required (${accommodationNeeded.length})</div>
        <div class="guest-list">
            ${accommodationNeeded
              .map(
                (guest) => `
            <div class="guest-item">
                <div class="guest-main">
                    <div class="guest-name">${guest.name}</div>
                    <div class="guest-contact">📧 ${guest.email}</div>
                    <div class="guest-contact">📱 ${guest.phone}</div>
                    <span class="side-badge ${guest.side === "groom" ? "groom-side" : "bride-side"}">
                        ${guest.side === "groom" ? "Aral's Side" : "Violet's Side"}
                    </span>
                </div>
                <div class="guest-details">
                    <div style="margin-bottom: 8px;"><strong>👥 Total Guests:</strong> ${guest.guests}</div>
                    <div style="margin-bottom: 8px;"><strong>🏨 Accommodation:</strong> �� Required</div>
                </div>
                <div class="guest-details">
                    <div style="margin-bottom: 5px;"><strong>📅 RSVP Date:</strong></div>
                    <div style="font-size: 0.9em;">${new Date(guest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div style="font-size: 0.8em; color: #a0aec0; margin-top: 5px;">${new Date(guest.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
            </div>
            `,
              )
              .join("")}
        </div>
    </div>
    `
        : ""
    }

    ${
      notAttendingGuests.length > 0
        ? `
    <div class="section">
        <div class="section-header">❌ Not Attending (${notAttendingGuests.length})</div>
        <div class="guest-list">
            ${notAttendingGuests
              .map(
                (guest) => `
            <div class="guest-item">
                <div class="guest-main">
                    <div class="guest-name">${guest.name}</div>
                    <div class="guest-contact">📧 ${guest.email}</div>
                    <div class="guest-contact">📱 ${guest.phone}</div>
                    <span class="side-badge ${guest.side === "groom" ? "groom-side" : "bride-side"}">
                        ${guest.side === "groom" ? "Aral's Side" : "Violet's Side"}
                    </span>
                    ${guest.message ? `<div class="guest-message">💌 "${guest.message}"</div>` : ""}
                </div>
                <div class="guest-details">
                    <div style="color: #e53e3e; font-weight: bold;">❌ Not Attending</div>
                </div>
                <div class="guest-details">
                    <div style="margin-bottom: 5px;"><strong>📅 RSVP Date:</strong></div>
                    <div style="font-size: 0.9em;">${new Date(guest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div style="font-size: 0.8em; color: #a0aec0; margin-top: 5px;">${new Date(guest.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
            </div>
            `,
              )
              .join("")}
        </div>
    </div>
    `
        : ""
    }

    <div class="footer">
        <div class="logo">❤️ TheVIRALWedding</div>
        <div>A&V • 12.28.2025</div>
        <div>With hearts full of joy and blessings from above</div>
    </div>
</body>
</html>
    `;

    // Create a new window and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Auto-download as PDF
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Photo upload function called");
    const files = e.target.files;

    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    console.log(`Processing ${files.length} files`);
    let successCount = 0;
    let errorCount = 0;
    const totalFiles = files.length;

    // Show initial processing message for better UX
    toast({
      title: "Processing Photos... ⏳",
      description: `Uploading ${totalFiles} photo${totalFiles !== 1 ? "s" : ""}. Please wait...`,
      duration: 2000,
    });

    // Process each file with improved mobile handling
    Array.from(files).forEach((file, index) => {
      console.log(
        `Processing file ${index + 1}: ${file.name}, Type: ${file.type}, Size: ${file.size}`,
      );

      // Enhanced file type validation (including file extension check for mobile)
      const isValidImage =
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name);

      if (!isValidImage) {
        console.error(`File ${file.name} is not an image`);
        toast({
          title: "Invalid File Type",
          description: `"${file.name}" is not a valid image file. Please upload JPG, PNG, GIF, or WebP files.`,
          variant: "destructive",
          duration: 4000,
        });
        errorCount++;
        return;
      }

      // Maximum file size limit (25MB as requested)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        console.error(`File ${file.name} is too large`);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        toast({
          title: "File Too Large",
          description: `"${file.name}" is ${sizeMB}MB. Please upload images up to 25MB.`,
          variant: "destructive",
          duration: 4000,
        });
        errorCount++;
        return;
      }

      // Convert to base64 with improved error handling
      const reader = new FileReader();

      // Add timeout for large files (25MB+ requires more time)
      const timeout = setTimeout(() => {
        console.error(`Timeout reading file ${file.name}`);
        toast({
          title: "Upload Timeout",
          description: `Timeout uploading "${file.name}". File too large or connection issue.`,
          variant: "destructive",
          duration: 4000,
        });
        errorCount++;
      }, 120000); // 2 minute timeout for large files

      reader.onload = async (event) => {
        clearTimeout(timeout);
        console.log(`File ${file.name} read successfully`);

        if (event.target?.result) {
          const base64String = event.target.result as string;

          // Validate base64 data
          if (!base64String.startsWith("data:image/")) {
            console.error(`Invalid base64 data for ${file.name}`);
            toast({
              title: "Upload Error",
              description: `Invalid image data for "${file.name}". Please try again.`,
              variant: "destructive",
            });
            errorCount++;
            return;
          }

          try {
            // Save photo using database service with retry logic
            let saveAttempts = 0;
            const maxAttempts = 3;

            while (saveAttempts < maxAttempts) {
              try {
                await database.photos.create(base64String, "admin");
                break; // Success, break out of retry loop
              } catch (saveError) {
                saveAttempts++;
                if (saveAttempts >= maxAttempts) {
                  throw saveError; // Throw error after max attempts
                }
                // Wait before retry
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * saveAttempts),
                );
              }
            }

            // Update local state
            setUploadedPhotos((prev) => {
              const newPhotos = [...prev, base64String];
              console.log(
                `Photo ${file.name} saved to database and added to gallery`,
              );
              return newPhotos;
            });
            successCount++;
          } catch (error) {
            console.error(`Error saving photo ${file.name}:`, error);
            errorCount++;
            toast({
              title: "Photo Upload Error",
              description: `Error saving "${file.name}". ${error instanceof Error ? error.message : "Please try again."}`,
              variant: "destructive",
              duration: 4000,
            });
          }

          // Show final message after processing all files
          if (successCount + errorCount === totalFiles) {
            if (successCount > 0) {
              const storageType = database.isUsingSupabase()
                ? "Supabase database"
                : "local storage";
              toast({
                title: "Photos Uploaded Successfully! 📷",
                description: `${successCount} photo${successCount !== 1 ? "s" : ""} saved to ${storageType} and synced across devices!`,
                duration: 4000,
              });
            }

            if (errorCount > 0) {
              toast({
                title: "Some uploads failed",
                description: `${errorCount} photo${errorCount !== 1 ? "s" : ""} failed to upload. Please try again.`,
                variant: "destructive",
                duration: 4000,
              });
            }
          }
        }
      };

      reader.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`Error reading file ${file.name}:`, error);
        toast({
          title: "Photo Read Error",
          description: `Error reading "${file.name}". Please try again or use a different file.`,
          variant: "destructive",
          duration: 4000,
        });
        errorCount++;
      };

      // Use readAsDataURL with error handling
      try {
        reader.readAsDataURL(file);
      } catch (readError) {
        clearTimeout(timeout);
        console.error(`Error starting to read file ${file.name}:`, readError);
        toast({
          title: "Photo Read Error",
          description: `Cannot read "${file.name}". File may be corrupted.`,
          variant: "destructive",
          duration: 4000,
        });
        errorCount++;
      }
    });

    // Clear the input so the same files can be uploaded again if needed
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    if (
      confirm(
        "Are you sure you want to delete this photo? This action cannot be undone.",
      )
    ) {
      const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
      setUploadedPhotos(newPhotos);
      // Immediately update localStorage
      localStorage.setItem("wedding_photos", JSON.stringify(newPhotos));
      console.log("Photo removed successfully");
    }
  };

  const addFlowItem = async () => {
    if (newFlowItem.time && newFlowItem.title) {
      try {
        // Save to database service
        await database.weddingFlow.create({
          time: newFlowItem.time,
          title: newFlowItem.title,
          description: newFlowItem.description,
          duration: newFlowItem.duration,
          type: newFlowItem.type,
        });

        // Update local state
        const flowItem: WeddingFlowItem = {
          ...newFlowItem,
          id: Date.now().toString(),
        };
        setWeddingFlow(
          [...weddingFlow, flowItem].sort((a, b) =>
            a.time.localeCompare(b.time),
          ),
        );

        // Clear form
        setNewFlowItem({
          time: "",
          title: "",
          description: "",
          duration: "",
          type: "reception",
        });

        const storageType = database.isUsingSupabase()
          ? "Supabase database"
          : "local storage";
        toast({
          title: "Event Added Successfully! 📅",
          description: `Event saved to ${storageType} and synced across devices!`,
          duration: 3000,
        });
      } catch (error) {
        console.error("Error adding wedding flow item:", error);
        toast({
          title: "Error Adding Event",
          description: "Failed to save event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const updateFlowItem = (id: string, updates: Partial<WeddingFlowItem>) => {
    setWeddingFlow(
      weddingFlow
        .map((item) => (item.id === id ? { ...item, ...updates } : item))
        .sort((a, b) => a.time.localeCompare(b.time)),
    );
    setEditingFlow(null);
  };

  const removeFlowItem = (id: string) => {
    setWeddingFlow(weddingFlow.filter((item) => item.id !== id));
  };

  const handleInvitationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Upload function called");
    const file = e.target.files?.[0];

    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log(
      "File selected:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size,
    );

    // Check if it's a PDF (more flexible check)
    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Please upload a PDF file for the invitation.");
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Please upload a PDF smaller than 10MB.");
      return;
    }

    console.log("File validation passed, reading file...");

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = async (event) => {
      console.log("File read successfully");
      if (event.target?.result) {
        const base64String = event.target.result as string;
        console.log("Setting invitation PDF...");

        try {
          // Save to database using the new database service
          await database.invitation.upload(base64String, file.name);
          console.log("Invitation saved to database");

          // Update local state
          setInvitationPDF(base64String);

          const storageType = database.isUsingSupabase()
            ? "Supabase database"
            : "local storage";

          toast({
            title: "Invitation Uploaded Successfully! 💌",
            description: `"${file.name}" saved to ${storageType} and synced across devices!`,
            duration: 3000,
          });
        } catch (error) {
          console.error("Error saving invitation:", error);
          // Fallback to localStorage only
          setInvitationPDF(base64String);
          localStorage.setItem("wedding_invitation_pdf", base64String);
          localStorage.setItem("wedding_invitation_filename", file.name);

          toast({
            title: "Invitation Uploaded! 💌",
            description: `"${file.name}" saved locally. Database sync may be limited.`,
            variant: "default",
          });
        }
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Error reading PDF file. Please try again.");
    };
    reader.readAsDataURL(file);

    // Clear the input
    e.target.value = "";
  };

  const downloadDocumentation = () => {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wedding Website Documentation - Aral & Violet</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #2d3748;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #84a178;
            padding: 30px;
            margin-bottom: 30px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .couple-names {
            font-size: 2.5em;
            color: #5a6c57;
            margin: 10px 0;
            font-weight: bold;
        }
        .section {
            background: white;
            margin: 20px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .section-header {
            background: #5a6c57;
            color: white;
            padding: 15px 25px;
            font-size: 1.2em;
            font-weight: bold;
        }
        .section-content {
            padding: 25px;
        }
        .credential-box {
            background: #f7fafc;
            border: 2px solid #84a178;
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid #edf2f7;
        }
        .feature-list li:before {
            content: "✅ ";
            margin-right: 8px;
        }
        .warning-box {
            background: #fef5e7;
            border: 2px solid #f6d55c;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        h3 {
            color: #5a6c57;
            border-bottom: 2px solid #84a178;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .logo {
            color: #5a6c57;
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        @media print {
            body {
                background: white;
            }
            .section, .header, .footer {
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">📚 Wedding Website Documentation</div>
        <div class="couple-names">Aral & Violet</div>
        <div style="font-size: 1.2em; color: #718096;">Complete User Guide & Admin Manual</div>
        <div style="font-size: 0.9em; color: #a0aec0; margin-top: 15px;">Generated: ${currentDate}</div>
    </div>

    <div class="section">
        <div class="section-header">🌐 Website Overview</div>
        <div class="section-content">
            <p><strong>Website Purpose:</strong> A comprehensive wedding website for Aral & Violet's wedding celebration on December 28, 2025.</p>

            <h3>Key Features</h3>
            <ul class="feature-list">
                <li>Beautiful wedding invitation with venue details</li>
                <li>RSVP management system with guest tracking</li>
                <li>Photo gallery for wedding memories</li>
                <li>Reception timeline management</li>
                <li>Guest accommodation tracking</li>
                <li>Side-by-side guest organization (Bride/Groom)</li>
                <li>Professional PDF downloads for planning</li>
            </ul>

            <h3>Website Sections</h3>
            <ul class="feature-list">
                <li><strong>Hero Section:</strong> Wedding details, countdown timer, invitation download</li>
                <li><strong>Our Story:</strong> Love story narrative in beautiful card layout</li>
                <li><strong>Wedding Details:</strong> Church nuptials and reception information</li>
                <li><strong>Photo Gallery:</strong> Wedding memories (view-only for guests)</li>
                <li><strong>RSVP Form:</strong> Complete guest information collection</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <div class="section-header">🔐 Admin Access Credentials</div>
        <div class="section-content">
            <div class="warning-box">
                <strong>⚠️ CONFIDENTIAL:</strong> Keep these credentials secure and do not share publicly.
            </div>

            <h3>Login Credentials</h3>
            <div class="credential-box">
                <strong>Username:</strong> aral<br>
                <strong>Password:</strong> aral2025
            </div>

            <div class="credential-box">
                <strong>Username:</strong> violet<br>
                <strong>Password:</strong> violet2025
            </div>

            <div class="credential-box">
                <strong>Username:</strong> couple<br>
                <strong>Password:</strong> wedding2025
            </div>

            <h3>Admin Dashboard Access</h3>
            <ul class="feature-list">
                <li>Access via small "Admin" button in top-right corner of website</li>
                <li>Or directly navigate to: /login</li>
                <li>After login, you'll be redirected to: /admin</li>
                <li>Session persists across browser sessions</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <div class="section-header">⚙️ Admin Dashboard Features</div>
        <div class="section-content">
            <h3>1. RSVP Management</h3>
            <ul class="feature-list">
                <li>View all guest responses with detailed information</li>
                <li>Download professional PDF reports</li>
                <li>Track attendance, accommodation needs, dietary restrictions</li>
                <li>Separate tracking for bride's side vs groom's side</li>
                <li>Statistics overview with real-time counts</li>
            </ul>

            <h3>2. Photo Gallery Management</h3>
            <ul class="feature-list">
                <li>Upload multiple wedding photos (5MB limit per photo)</li>
                <li>Photos automatically appear on public website</li>
                <li>Delete photos with confirmation</li>
                <li>Supports all common image formats</li>
            </ul>

            <h3>3. Wedding Reception Timeline</h3>
            <ul class="feature-list">
                <li>Create and manage reception schedule</li>
                <li>Add events with time, duration, description</li>
                <li>Categorize events (ceremony, reception, entertainment, meal, special)</li>
                <li>Download beautiful timeline PDF</li>
                <li>Real-time editing and reordering</li>
            </ul>

            <h3>4. Invitation Management</h3>
            <ul class="feature-list">
                <li>Upload custom PDF invitation (10MB limit)</li>
                <li>Replace default text invitation with your design</li>
                <li>Preview and remove uploaded invitations</li>
                <li>Guests download your custom PDF automatically</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <div class="section-header">👥 Guest Experience</div>
        <div class="section-content">
            <h3>Public Website Features</h3>
            <ul class="feature-list">
                <li><strong>Wedding Information:</strong> Date, time, venue details with Google Maps links</li>
                <li><strong>Invitation Download:</strong> Custom PDF or default invitation</li>
                <li><strong>RSVP Form:</strong> Complete form with all necessary details</li>
                <li><strong>Photo Gallery:</strong> View wedding photos (no upload ability)</li>
                <li><strong>Reception Timeline:</strong> Will be available on wedding day (Dec 28, 2025)</li>
            </ul>

            <h3>RSVP Information Collected</h3>
            <ul class="feature-list">
                <li>Guest name(s) and contact information</li>
                <li>Attendance confirmation</li>
                <li>Number of guests attending</li>
                <li>Bride's side or Groom's side affiliation</li>
                <li>Accommodation requirements for out-of-town guests</li>
                <li>Dietary restrictions and allergies</li>
                <li>Personal messages and wishes</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <div class="section-header">📅 Wedding Day Information</div>
        <div class="section-content">
            <h3>Event Details</h3>
            <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>�� Date:</strong> Sunday, December 28, 2025<br><br>

                <strong>⛪ Church Nuptials:</strong><br>
                📍 Mother of Sorrows Church, Udupi<br>
                🕐 4:00 PM – 5:15 PM<br>
                🗺️ <a href="https://g.co/kgs/kCfjJUM">Google Maps Directions</a><br><br>

                <strong>🎉 Reception:</strong><br>
                📍 Sai Radha Heritage Beach Resort, Kaup<br>
                🕐 7:00 PM – 11:30 PM<br>
                🗺️ <a href="https://g.co/kgs/MHHZo7T">Google Maps Directions</a>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">💡 Tips & Best Practices</div>
        <div class="section-content">
            <h3>For Administrators</h3>
            <ul class="feature-list">
                <li>Regularly download RSVP reports for planning purposes</li>
                <li>Upload photos regularly to keep guests engaged</li>
                <li>Update wedding timeline as needed leading up to the event</li>
                <li>Monitor accommodation requests for planning</li>
                <li>Keep backup copies of downloaded data</li>
            </ul>

            <h3>Data Management</h3>
            <ul class="feature-list">
                <li>All data is stored securely in browser localStorage</li>
                <li>Photos and RSVPs sync between admin and public views</li>
                <li>Download PDFs regularly as backups</li>
                <li>Data persists across browser sessions</li>
            </ul>

            <h3>Guest Communication</h3>
            <ul class="feature-list">
                <li>Share the main website URL with guests for RSVPs</li>
                <li>Reception timeline becomes available automatically on wedding day</li>
                <li>Encourage guests to submit RSVPs early for planning</li>
                <li>Use RSVP data to coordinate with vendors and venue</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <div class="section-header">🆘 Support & Troubleshooting</div>
        <div class="section-content">
            <h3>Common Issues</h3>
            <ul class="feature-list">
                <li><strong>File Upload Issues:</strong> Ensure files meet size limits (5MB photos, 10MB PDFs)</li>
                <li><strong>Login Problems:</strong> Use exact credentials listed above, check caps lock</li>
                <li><strong>Data Not Syncing:</strong> Refresh browser or clear cache</li>
                <li><strong>PDF Downloads:</strong> Ensure popup blockers are disabled</li>
            </ul>

            <h3>Browser Compatibility</h3>
            <ul class="feature-list">
                <li>Works best in Chrome, Firefox, Safari, Edge</li>
                <li>Mobile responsive design for all devices</li>
                <li>JavaScript must be enabled</li>
                <li>Modern browser required for full functionality</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <div class="logo">❤️ TheVIRALWedding</div>
        <div style="font-size: 1.2em; margin: 10px 0;">Aral & Violet • December 28, 2025</div>
        <div style="color: #718096;">With hearts full of joy and blessings from above</div>
        <div style="margin-top: 15px; font-size: 0.9em; color: #a0aec0;">
            © 2025 TheVIRALWedding. Made with love By Aral D'Souza.
        </div>
    </div>
</body>
</html>
    `;

    // Create a new window and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Auto-download as PDF
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const attendingGuests = guests.filter((g) => g.attending);
  const notAttendingGuests = guests.filter((g) => !g.attending);
  const totalGuestCount = attendingGuests.reduce(
    (sum, guest) => sum + guest.guests,
    0,
  );
  const accommodationNeeded = attendingGuests.filter(
    (g) => g.needsAccommodation,
  );
  const accommodationGuestCount = accommodationNeeded.reduce(
    (sum, guest) => sum + guest.guests,
    0,
  );
  const groomSideGuests = attendingGuests.filter((g) => g.side === "groom");
  const brideSideGuests = attendingGuests.filter((g) => g.side === "bride");

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-sage-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
              <Heart className="text-olive-600" size={24} />
              <div>
                <h1 className="text-xl font-serif text-olive-700">
                  Wedding Dashboard
                </h1>
                <p className="text-sm text-sage-600">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/", "_blank")}
                className="border-sage-300 text-sage-600 hover:bg-sage-50 flex-1 sm:flex-none"
              >
                <Eye className="mr-1 sm:mr-2" size={14} />
                <span className="hidden sm:inline">View Site</span>
                <span className="sm:hidden">Site</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-red-300 text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
              >
                <LogOut className="mr-1 sm:mr-2" size={14} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
            <CardContent className="p-6 text-center">
              <Users className="mx-auto mb-2 text-olive-600" size={32} />
              <p className="text-2xl font-bold text-olive-700">
                {guests.length}
              </p>
              <p className="text-sm text-sage-600">Total RSVPs</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
            <CardContent className="p-6 text-center">
              <Heart className="mx-auto mb-2 text-green-600" size={32} />
              <p className="text-2xl font-bold text-green-700">
                {attendingGuests.length}
              </p>
              <p className="text-sm text-sage-600">Attending</p>
              <p className="text-xs text-green-600 mt-1">
                {totalGuestCount} total guests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center items-center mb-2">
                <span className="text-2xl">🏨</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">
                {accommodationNeeded.length}
              </p>
              <p className="text-sm text-sage-600">Need Stay</p>
              <p className="text-xs text-amber-600 mt-1">
                {accommodationGuestCount} guests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
            <CardContent className="p-6 text-center">
              <Upload className="mx-auto mb-2 text-olive-600" size={32} />
              <p className="text-2xl font-bold text-olive-700">
                {uploadedPhotos.length}
              </p>
              <p className="text-sm text-sage-600">Photos</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center items-center mb-2">
                <span className="text-2xl">👰</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {brideSideGuests.length}
              </p>
              <p className="text-sm text-sage-600">Bride's Side</p>
              <p className="text-xs text-purple-600 mt-1">
                {brideSideGuests.reduce((sum, guest) => sum + guest.guests, 0)}{" "}
                guests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center items-center mb-2">
                <span className="text-2xl">🤵</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {groomSideGuests.length}
              </p>
              <p className="text-sm text-sage-600">Groom's Side</p>
              <p className="text-xs text-blue-600 mt-1">
                {groomSideGuests.reduce((sum, guest) => sum + guest.guests, 0)}{" "}
                guests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center items-center mb-2">
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-2xl font-bold text-red-700">
                {notAttendingGuests.length}
              </p>
              <p className="text-sm text-sage-600">Not Attending</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="rsvp" className="space-y-6">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="flex w-max min-w-full lg:grid lg:w-full lg:grid-cols-6 gap-1 h-auto p-1">
              <TabsTrigger
                value="rsvp"
                className="flex flex-col sm:flex-row items-center gap-1 text-xs px-2 sm:px-3 py-2 whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                title="RSVP Management"
              >
                <Users size={16} className="sm:hidden" />
                <Users size={14} className="hidden sm:inline" />
                <span className="hidden sm:inline lg:hidden">RSVP</span>
                <span className="hidden lg:inline">RSVP Management</span>
              </TabsTrigger>
              <TabsTrigger
                value="photos"
                className="flex flex-col sm:flex-row items-center gap-1 text-xs px-2 sm:px-3 py-2 whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                title="Admin Photos"
              >
                <Upload size={16} className="sm:hidden" />
                <Upload size={14} className="hidden sm:inline" />
                <span className="hidden sm:inline lg:hidden">Admin</span>
                <span className="hidden lg:inline">Admin Photos</span>
              </TabsTrigger>
              <TabsTrigger
                value="guest-photos"
                className="flex flex-col sm:flex-row items-center gap-1 text-xs px-2 sm:px-3 py-2 whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                title="Guest Photos"
              >
                <Camera size={16} className="sm:hidden" />
                <Camera size={14} className="hidden sm:inline" />
                <span className="hidden sm:inline lg:hidden">Guest</span>
                <span className="hidden lg:inline">Guest Photos</span>
              </TabsTrigger>
              <TabsTrigger
                value="flow"
                className="flex flex-col sm:flex-row items-center gap-1 text-xs px-2 sm:px-3 py-2 whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                title="Wedding Flow"
              >
                <Clock size={16} className="sm:hidden" />
                <Clock size={14} className="hidden sm:inline" />
                <span className="hidden sm:inline lg:hidden">Flow</span>
                <span className="hidden lg:inline">Wedding Flow</span>
              </TabsTrigger>
              <TabsTrigger
                value="invitation"
                className="flex flex-col sm:flex-row items-center gap-1 text-xs px-2 sm:px-3 py-2 whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                title="Invitation PDF"
              >
                <FileText size={16} className="sm:hidden" />
                <FileText size={14} className="hidden sm:inline" />
                <span className="hidden sm:inline lg:hidden">PDF</span>
                <span className="hidden lg:inline">Invitation</span>
              </TabsTrigger>
              <TabsTrigger
                value="documentation"
                className="flex flex-col sm:flex-row items-center gap-1 text-xs px-2 sm:px-3 py-2 whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                title="Documentation"
              >
                <FileText size={16} className="sm:hidden" />
                <FileText size={14} className="hidden sm:inline" />
                <span className="hidden sm:inline lg:hidden">Docs</span>
                <span className="hidden lg:inline">Documentation</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* RSVP Management */}
          <TabsContent value="rsvp" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <CardTitle className="text-olive-700">
                    Guest List Management
                  </CardTitle>
                  <Button
                    onClick={downloadGuestList}
                    disabled={guests.length === 0}
                    size="sm"
                    className="bg-olive-600 hover:bg-olive-700 text-white w-full sm:w-auto"
                  >
                    <Download className="mr-2" size={14} />
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {guests.length === 0 ? (
                    <p className="text-center py-8 text-sage-600">
                      No RSVPs received yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Attending Guests */}
                      {attendingGuests.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-green-700 mb-3">
                            Attending ({attendingGuests.length})
                          </h3>
                          <div className="space-y-3">
                            {attendingGuests.map((guest) => (
                              <div
                                key={guest.id}
                                className="p-4 border border-green-200 rounded-lg bg-green-50"
                              >
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-green-800">
                                      {guest.name}
                                    </h4>
                                    <p className="text-sm text-green-600">
                                      {guest.email}
                                    </p>
                                    <p className="text-sm text-green-600">
                                      {guest.phone}
                                    </p>
                                  </div>
                                  <div className="text-sm text-green-700">
                                    <p>
                                      <strong>Side:</strong>{" "}
                                      {guest.side === "groom"
                                        ? "Aral's (Groom)"
                                        : "Violet's (Bride)"}
                                    </p>
                                    <p>
                                      <strong>Guests:</strong> {guest.guests}
                                    </p>
                                    <p>
                                      <strong>Accommodation:</strong>{" "}
                                      {guest.needsAccommodation ? "Yes" : "No"}
                                    </p>
                                    {guest.dietaryRestrictions && (
                                      <p>
                                        <strong>Dietary:</strong>{" "}
                                        {guest.dietaryRestrictions}
                                      </p>
                                    )}
                                    {guest.message && (
                                      <p className="italic mt-2">
                                        "{guest.message}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Not Attending Guests */}
                      {notAttendingGuests.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-red-700 mb-3">
                            Not Attending ({notAttendingGuests.length})
                          </h3>
                          <div className="space-y-3">
                            {notAttendingGuests.map((guest) => (
                              <div
                                key={guest.id}
                                className="p-4 border border-red-200 rounded-lg bg-red-50"
                              >
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-red-800">
                                      {guest.name}
                                    </h4>
                                    <p className="text-sm text-red-600">
                                      {guest.email}
                                    </p>
                                    <p className="text-sm text-red-600">
                                      {guest.phone}
                                    </p>
                                  </div>
                                  <div className="text-sm text-red-700">
                                    <p>
                                      <strong>Side:</strong>{" "}
                                      {guest.side === "groom"
                                        ? "Aral's (Groom)"
                                        : "Violet's (Bride)"}
                                    </p>
                                    {guest.message && (
                                      <p className="italic mt-2">
                                        "{guest.message}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo Gallery Management */}
          <TabsContent value="photos" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
              <CardHeader>
                <CardTitle className="text-olive-700">
                  Photo Gallery Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Upload Section */}
                  <div className="text-center p-8 border-2 border-dashed border-sage-300 rounded-lg hover:border-sage-400 transition-colors">
                    <Upload className="mx-auto mb-4 text-olive-600" size={48} />
                    <h3 className="text-xl font-serif text-olive-700 mb-4">
                      Upload Wedding Photos
                    </h3>
                    <p className="text-sage-600 mb-6">
                      Upload high-quality photos (up to 25MB each) for the wedding gallery
                    </p>
                    <input
                      ref={photoInputRef}
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => {
                        console.log("Photo upload button clicked");
                        try {
                          if (photoInputRef.current) {
                            photoInputRef.current.value = "";
                            photoInputRef.current.click();
                            setTimeout(() => {
                              photoInputRef.current?.focus();
                            }, 100);
                          }
                        } catch (error) {
                          console.error(
                            "Error triggering file picker:",
                            error,
                          );
                          toast({
                            title: "Upload Error",
                            description:
                              "Could not open file picker. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 text-lg"
                      size="lg"
                    >
                      <Upload className="mr-2" size={20} />
                      Select Photos (up to 25MB each)
                    </Button>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm text-sage-600">
                        Select multiple photos • Up to 25MB per photo supported
                      </p>
                      <p className="text-xs text-sage-500">
                        Supports: JPG, PNG, GIF, WebP, BMP formats
                      </p>
                      <div className="text-xs text-sage-400 mt-2">
                        📱 File selection only - camera capture disabled
                      </div>
                    </div>
                  </div>

                  {/* Mobile Compatibility Notice */}
                  <MobileCompatibilityNotice
                    showForFeature="upload"
                    className="mt-4"
                  />

                  {/* Photos Grid */}
                  {uploadedPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden shadow-lg">
                            <img
                              src={photo}
                              alt={`Wedding photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sage-600">
                        No photos uploaded yet. Upload some beautiful memories!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guest Photos Management */}
          <TabsContent value="guest-photos" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
              <CardHeader>
                <CardTitle className="text-olive-700">
                  Guest Photo Uploads
                </CardTitle>
                <p className="text-sage-600">
                  View and manage photos uploaded by wedding guests via QR code
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* QR Code for Guest Uploads */}
                  <Card className="bg-sage-50 border-sage-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-olive-700">
                          QR Code for Guest Photo Uploads
                        </CardTitle>
                        <Button
                          onClick={() => {
                            const currentUrl = window.location.origin + (import.meta.env.PROD &&
                              import.meta.env.VITE_DEPLOYMENT_PLATFORM !== "netlify"
                                ? "/aral-violet-wedding"
                                : "") + "/guest-upload";
                            navigator.clipboard.writeText(currentUrl);
                            toast({
                              title: "Link Copied!",
                              description: "Guest upload link copied to clipboard.",
                            });
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Copy Link
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1">
                          <p className="text-sage-700 mb-4">
                            Share this QR code with guests during the wedding day. They can scan it to upload photos directly to your gallery!
                          </p>
                          <div className="space-y-2">
                            <p className="text-sm text-sage-600">
                              <strong>Guest Upload URL:</strong>
                            </p>
                            <code className="text-xs bg-white p-2 rounded border block break-all">
                              {window.location.origin + (import.meta.env.PROD &&
                                import.meta.env.VITE_DEPLOYMENT_PLATFORM !== "netlify"
                                  ? "/aral-violet-wedding"
                                  : "") + "/guest-upload"}
                            </code>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="bg-white p-4 rounded-lg border-2 border-olive-200 text-center">
                            <div className="w-32 h-32 bg-sage-100 border-2 border-dashed border-sage-300 rounded flex items-center justify-center mb-2">
                              <div className="text-center">
                                <Camera className="mx-auto mb-1 text-sage-500" size={24} />
                                <p className="text-xs text-sage-500">QR Code</p>
                                <p className="text-xs text-sage-400">Would appear here</p>
                              </div>
                            </div>
                            <p className="text-xs text-sage-600">Scan to upload photos</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-cream-100 rounded border-l-4 border-olive-500">
                        <p className="text-sm text-olive-700">
                          <strong>💡 Pro Tip:</strong> Print this QR code and place it on guest tables, or display it on screens around the venue for easy access!
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Guest Photos Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 text-center">
                      <Camera className="mx-auto mb-2 text-olive-600" size={32} />
                      <p className="text-2xl font-bold text-olive-700">
                        {guestPhotos.length}
                      </p>
                      <p className="text-sm text-sage-600">Guest Photos</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Users className="mx-auto mb-2 text-olive-600" size={32} />
                      <p className="text-2xl font-bold text-olive-700">
                        {new Set(guestPhotos.map(p => p.guestName)).size}
                      </p>
                      <p className="text-sm text-sage-600">Contributors</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Heart className="mx-auto mb-2 text-olive-600" size={32} />
                      <p className="text-2xl font-bold text-olive-700">
                        {guestPhotos.filter(p => p.createdAt && new Date(p.createdAt).toDateString() === new Date().toDateString()).length}
                      </p>
                      <p className="text-sm text-sage-600">Today</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Download className="mx-auto mb-2 text-olive-600" size={32} />
                      <Button
                        onClick={() => {
                          // Download all guest photos as ZIP
                          toast({
                            title: "Download Started",
                            description: "Preparing guest photos for download...",
                          });
                        }}
                        className="bg-olive-600 hover:bg-olive-700 text-white text-xs px-2 py-1"
                        size="sm"
                      >
                        Download All
                      </Button>
                    </Card>
                  </div>

                  {/* Guest Photos Grid */}
                  {guestPhotos.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-olive-700">
                          Guest Contributions
                        </h3>
                        <Button
                          onClick={async () => {
                            try {
                              const guestPhotosData = await database.photos.getGuestPhotos();
                              setGuestPhotos(guestPhotosData.map((photo) => ({
                                id: photo.id || Date.now().toString(),
                                photoData: photo.photo_data,
                                guestName: photo.guest_name,
                                uploadedBy: photo.uploaded_by,
                                createdAt: photo.created_at || new Date().toISOString(),
                              })));
                              toast({
                                title: "Guest Photos Refreshed",
                                description: "Latest guest uploads loaded successfully!",
                              });
                            } catch (error) {
                              toast({
                                title: "Refresh Failed",
                                description: "Could not refresh guest photos.",
                                variant: "destructive",
                              });
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Refresh
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {guestPhotos.map((photo) => (
                          <Card key={photo.id} className="overflow-hidden">
                            <div className="aspect-square relative">
                              <img
                                src={photo.photoData}
                                alt={`Photo by ${photo.guestName || 'Guest'}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-olive-700">
                                    {photo.guestName || 'Anonymous Guest'}
                                  </p>
                                  <p className="text-xs text-sage-500">
                                    {new Date(photo.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = photo.photoData;
                                    link.download = `${photo.guestName || 'guest'}_${photo.id}.jpg`;
                                    link.click();
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="mx-auto mb-4 text-sage-400" size={64} />
                      <h3 className="text-xl font-serif text-sage-600 mb-2">
                        No Guest Photos Yet
                      </h3>
                      <p className="text-sage-500 mb-4">
                        Share the QR code with guests during the wedding to start collecting photos!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wedding Flow Management */}
          <TabsContent value="flow" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-olive-700">
                    Reception Timeline Management
                  </CardTitle>
                  <Button
                    onClick={downloadWeddingFlow}
                    className="bg-olive-600 hover:bg-olive-700 text-white"
                  >
                    <Download className="mr-2" size={16} />
                    Download Timeline PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add New Flow Item */}
                  <Card className="border-2 border-dashed border-sage-300">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-serif text-olive-700 mb-4 flex items-center gap-2">
                        <Plus size={20} />
                        Add Timeline Event
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-sage-700 mb-2">
                            Time *
                          </label>
                          <Input
                            type="time"
                            value={newFlowItem.time}
                            onChange={(e) =>
                              setNewFlowItem({
                                ...newFlowItem,
                                time: e.target.value,
                              })
                            }
                            className="border-sage-300 focus:border-olive-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-sage-700 mb-2">
                            Duration
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., 30 min, 1 hour"
                            value={newFlowItem.duration}
                            onChange={(e) =>
                              setNewFlowItem({
                                ...newFlowItem,
                                duration: e.target.value,
                              })
                            }
                            className="border-sage-300 focus:border-olive-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-sage-700 mb-2">
                            Event Title *
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., Welcome Cocktails"
                            value={newFlowItem.title}
                            onChange={(e) =>
                              setNewFlowItem({
                                ...newFlowItem,
                                title: e.target.value,
                              })
                            }
                            className="border-sage-300 focus:border-olive-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-sage-700 mb-2">
                            Event Type
                          </label>
                          <select
                            value={newFlowItem.type}
                            onChange={(e) =>
                              setNewFlowItem({
                                ...newFlowItem,
                                type: e.target.value as WeddingFlowItem["type"],
                              })
                            }
                            className="w-full p-2 border border-sage-300 rounded-md focus:border-olive-500"
                          >
                            <option value="reception">Reception</option>
                            <option value="ceremony">Ceremony</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="meal">Meal</option>
                            <option value="special">Special</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-sage-700 mb-2">
                          Description
                        </label>
                        <Textarea
                          placeholder="Describe what happens during this event..."
                          value={newFlowItem.description}
                          onChange={(e) =>
                            setNewFlowItem({
                              ...newFlowItem,
                              description: e.target.value,
                            })
                          }
                          className="border-sage-300 focus:border-olive-500"
                        />
                      </div>
                      <Button
                        onClick={addFlowItem}
                        disabled={!newFlowItem.time || !newFlowItem.title}
                        className="mt-4 bg-sage-600 hover:bg-sage-700 text-white"
                      >
                        <Plus className="mr-2" size={16} />
                        Add Event
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Current Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif text-olive-700">
                      Current Reception Timeline
                    </h3>
                    {weddingFlow.length === 0 ? (
                      <p className="text-center py-8 text-sage-600">
                        No timeline events yet. Add some above to get started!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {weddingFlow.map((item) => (
                          <Card
                            key={item.id}
                            className="border-l-4 border-l-olive-500"
                          >
                            <CardContent className="p-4">
                              {editingFlow === item.id ? (
                                <div className="space-y-3">
                                  <div className="grid md:grid-cols-2 gap-3">
                                    <Input
                                      type="time"
                                      value={item.time}
                                      onChange={(e) =>
                                        updateFlowItem(item.id, {
                                          time: e.target.value,
                                        })
                                      }
                                    />
                                    <Input
                                      placeholder="Duration"
                                      value={item.duration}
                                      onChange={(e) =>
                                        updateFlowItem(item.id, {
                                          duration: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <Input
                                    value={item.title}
                                    onChange={(e) =>
                                      updateFlowItem(item.id, {
                                        title: e.target.value,
                                      })
                                    }
                                  />
                                  <Textarea
                                    value={item.description}
                                    onChange={(e) =>
                                      updateFlowItem(item.id, {
                                        description: e.target.value,
                                      })
                                    }
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => setEditingFlow(null)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingFlow(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-lg font-bold text-olive-700">
                                        {item.time}
                                      </span>
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full text-white ${
                                          item.type === "ceremony"
                                            ? "bg-olive-600"
                                            : item.type === "reception"
                                              ? "bg-sage-600"
                                              : item.type === "entertainment"
                                                ? "bg-gray-600"
                                                : item.type === "meal"
                                                  ? "bg-amber-600"
                                                  : "bg-purple-600"
                                        }`}
                                      >
                                        {item.type}
                                      </span>
                                      {item.duration && (
                                        <span className="text-sm text-sage-500">
                                          ({item.duration})
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="font-semibold text-sage-800 mb-1">
                                      {item.title}
                                    </h4>
                                    <p className="text-sage-600 text-sm">
                                      {item.description}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingFlow(item.id)}
                                    >
                                      <Edit size={14} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => removeFlowItem(item.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitation Management */}
          <TabsContent value="invitation" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
              <CardHeader>
                <CardTitle className="text-olive-700">
                  Wedding Invitation Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Upload Invitation */}
                  <div className="text-center p-8 border-2 border-dashed border-sage-300 rounded-lg">
                    <FileText
                      className="mx-auto mb-4 text-olive-600"
                      size={48}
                    />
                    <h3 className="text-xl font-serif text-olive-700 mb-4">
                      Upload Wedding Invitation PDF
                    </h3>
                    <p className="text-sage-600 mb-4">
                      Upload your custom wedding invitation PDF. This will be
                      downloaded when guests click the "Download Invitation"
                      button.
                    </p>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleInvitationUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-olive-600 hover:bg-olive-700 text-white"
                      >
                        <Upload className="mr-2" size={16} />
                        Choose PDF Invitation
                      </Button>
                    </div>
                    <p className="text-xs text-sage-500 mt-2">
                      Maximum file size: 10MB • PDF format only
                    </p>
                  </div>

                  {/* Current Invitation Status */}
                  <Card
                    className={`border-l-4 ${invitationPDF ? "border-l-green-500 bg-green-50" : "border-l-amber-500 bg-amber-50"}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg mb-2">
                            {invitationPDF
                              ? "✅ Custom Invitation Active"
                              : "⚠️ Using Default Text Invitation"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {invitationPDF
                              ? "Your custom PDF invitation is active. Guests will download your uploaded PDF when they click the invitation button."
                              : "No custom invitation uploaded. Guests will download a basic text invitation. Upload a PDF above for a professional invitation."}
                          </p>
                        </div>
                        {invitationPDF && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = invitationPDF;
                                link.download =
                                  "Wedding-Invitation-Preview.pdf";
                                link.click();
                              }}
                              className="bg-sage-600 hover:bg-sage-700 text-white"
                            >
                              <Download size={14} className="mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                try {
                                  await database.invitation.delete();
                                  setInvitationPDF(null);

                                  toast({
                                    title: "Invitation Removed! 🗑️",
                                    description:
                                      "Custom invitation has been removed. Guests will now download the default text invitation.",
                                    duration: 3000,
                                  });
                                } catch (error) {
                                  console.error(
                                    "Error removing invitation:",
                                    error,
                                  );
                                  // Fallback to local removal
                                  setInvitationPDF(null);
                                  localStorage.removeItem(
                                    "wedding_invitation_pdf",
                                  );
                                  localStorage.removeItem(
                                    "wedding_invitation_filename",
                                  );

                                  toast({
                                    title: "Invitation Removed! 🗑️",
                                    description:
                                      "Custom invitation has been removed locally.",
                                    duration: 3000,
                                  });
                                }
                              }}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Instructions */}
                  <Card className="bg-sage-50 border-sage-200">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-sage-800 mb-3">
                        📋 How it works:
                      </h4>
                      <ul className="space-y-2 text-sm text-sage-700">
                        <li>
                          • Upload your professionally designed wedding
                          invitation PDF
                        </li>
                        <li>
                          • Guests will download your custom invitation when
                          they click "Download Invitation"
                        </li>
                        <li>
                          • You can preview or remove the invitation anytime
                        </li>
                        <li>
                          • If no PDF is uploaded, guests get a basic text
                          invitation
                        </li>
                        <li>
                          • Maximum file size is 10MB for optimal download speed
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation */}
          <TabsContent value="documentation" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <CardTitle className="text-olive-700">
                    Website Documentation
                  </CardTitle>
                  <Button
                    onClick={downloadDocumentation}
                    className="bg-olive-600 hover:bg-olive-700 text-white w-full sm:w-auto"
                  >
                    <Download className="mr-2" size={16} />
                    <span className="hidden sm:inline">
                      Download Documentation PDF
                    </span>
                    <span className="sm:hidden">Download PDF</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overview */}
                  <Card className="border-l-4 border-l-olive-500 bg-olive-50">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-serif text-olive-700 mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        Complete User Guide
                      </h3>
                      <p className="text-sage-700 mb-4">
                        This documentation contains everything you need to know
                        about your wedding website, including login credentials,
                        feature explanations, and best practices.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-olive-700 mb-2">
                            📋 What's Included:
                          </h4>
                          <ul className="space-y-1 text-sage-600">
                            <li>• Login credentials for admin access</li>
                            <li>• Complete feature walkthrough</li>
                            <li>• Guest experience overview</li>
                            <li>• Wedding day information</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-olive-700 mb-2">
                            🎯 Perfect For:
                          </h4>
                          <ul className="space-y-1 text-sage-600">
                            <li>• Reference during wedding planning</li>
                            <li>• Sharing with family helpers</li>
                            <li>• Troubleshooting guidance</li>
                            <li>• Post-wedding documentation</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Reference */}
                  <Card className="bg-sage-50 border-sage-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-serif text-olive-700 mb-4">
                        🔑 Quick Access Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-olive-700 mb-3">
                            Admin Login Credentials:
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="bg-white p-3 rounded border">
                              <div>
                                <strong>Username:</strong> aral
                              </div>
                              <div>
                                <strong>Password:</strong> aral2025
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div>
                                <strong>Username:</strong> violet
                              </div>
                              <div>
                                <strong>Password:</strong> violet2025
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div>
                                <strong>Username:</strong> couple
                              </div>
                              <div>
                                <strong>Password:</strong> wedding2025
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-olive-700 mb-3">
                            Key Features:
                          </h4>
                          <ul className="space-y-2 text-sm text-sage-700">
                            <li>✅ RSVP Management with PDF downloads</li>
                            <li>✅ Photo Gallery with upload/delete</li>
                            <li>✅ Reception Timeline creation</li>
                            <li>✅ Custom Invitation PDF upload</li>
                            <li>✅ Guest accommodation tracking</li>
                            <li>✅ Bride/Groom side organization</li>
                            <li>✅ Real-time statistics dashboard</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Important Notes */}
                  <Card className="border-l-4 border-l-amber-500 bg-amber-50">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-serif text-amber-700 mb-4">
                        ⚠️ Important Notes
                      </h3>
                      <ul className="space-y-2 text-sm text-amber-800">
                        <li>
                          • Keep admin credentials confidential and secure
                        </li>
                        <li>• Download RSVP data regularly as backup</li>
                        <li>• Photo uploads support up to 25MB per image</li>
                        <li>
                          • Wedding timeline download for guests activates on
                          December 28, 2025
                        </li>
                        <li>
                          • All data is stored locally in browser - download
                          PDFs for permanent records
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card className="bg-white border-sage-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-serif text-olive-700 mb-4">
                        📞 Wedding Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-olive-700 mb-2">
                            ⛪ Church Nuptials:
                          </h4>
                          <div className="text-sage-700 space-y-1">
                            <div>
                              <strong>Venue:</strong> Mother of Sorrows Church,
                              Udupi
                            </div>
                            <div>
                              <strong>Time:</strong> 4:00 PM – 5:15 PM
                            </div>
                            <div>
                              <strong>Date:</strong> Sunday, December 28, 2025
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-olive-700 mb-2">
                            🎉 Reception:
                          </h4>
                          <div className="text-sage-700 space-y-1">
                            <div>
                              <strong>Venue:</strong> Sai Radha Heritage Beach
                              Resort, Kaup
                            </div>
                            <div>
                              <strong>Time:</strong> 7:00 PM – 11:30 PM
                            </div>
                            <div>
                              <strong>Date:</strong> Sunday, December 28, 2025
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
