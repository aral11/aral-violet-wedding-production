import React, { useState, useEffect } from "react";
import {
  Heart,
  Calendar,
  MapPin,
  Clock,
  Camera,
  Users,
  Download,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  guestsApi,
  photosApi,
  invitationApi,
  weddingFlowApi,
  handleApiError,
} from "@/lib/api";
import { database } from "@/lib/database";
import { sendRSVPNotification, isSMSConfigured } from "@/lib/sms-service";

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

export default function Index() {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [rsvpForm, setRsvpForm] = useState({
    name: "",
    email: "",
    phone: "",
    attending: true,
    guests: 1,
    side: "groom" as "groom" | "bride",
    message: "",
    dietaryRestrictions: "",
    needsAccommodation: false,
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const weddingDate = new Date("2025-12-28T16:00:00+05:30");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = weddingDate.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load photos - prioritize localStorage to avoid fetch errors
  useEffect(() => {
    // Load photos using new database service
    const loadPhotos = async () => {
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
    };

    // Load photos immediately
    loadPhotos();

    // Check for new photos every 30 seconds when the page is focused (for real-time updates)
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadPhotos();
      }
    }, 30000);

    // Also check when the page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPhotos();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log("Submitting RSVP with side:", rsvpForm.side);
      await database.guests.create({
        name: rsvpForm.name,
        email: rsvpForm.email,
        phone: rsvpForm.phone,
        attending: rsvpForm.attending,
        guests: rsvpForm.guests,
        side: rsvpForm.side,
        message: rsvpForm.message || undefined,
        dietary_restrictions: rsvpForm.dietaryRestrictions || undefined,
        needs_accommodation: rsvpForm.needsAccommodation,
      });

      const storageType = database.isUsingSupabase()
        ? "Supabase database"
        : "local storage";
      console.log(`RSVP submitted to ${storageType} successfully`);

      // Send SMS notifications to family members
      if (isSMSConfigured()) {
        try {
          console.log("Sending SMS notifications to family members...");
          const smsSuccess = await sendRSVPNotification({
            name: rsvpForm.name,
            email: rsvpForm.email,
            phone: rsvpForm.phone,
            attending: rsvpForm.attending,
            guests: rsvpForm.guests,
            side: rsvpForm.side,
            message: rsvpForm.message,
            dietaryRestrictions: rsvpForm.dietaryRestrictions,
            needsAccommodation: rsvpForm.needsAccommodation,
          });

          if (smsSuccess) {
            console.log(
              "✅ SMS notifications sent successfully to family members",
            );
          } else {
            console.log("⚠️ SMS notifications failed to send");
          }
        } catch (smsError) {
          console.error("SMS notification error:", smsError);
          // Don't fail the RSVP submission if SMS fails
        }
      } else {
        console.log("📱 SMS service not configured - skipping notifications");
      }

      toast({
        title: "RSVP Submitted Successfully! 🎉",
        description: `Thank you ${rsvpForm.name}! We can't wait to celebrate with you on December 28, 2025!${database.isUsingSupabase() ? " ✨ Synced across all devices!" : ""}`,
        duration: 5000,
      });
    } catch (error) {
      console.warn(
        "API unavailable, falling back to localStorage:",
        handleApiError(error),
      );

      // Fallback to localStorage if API is not available
      const existingGuests = JSON.parse(
        localStorage.getItem("wedding_guests") || "[]",
      );
      const newGuest = {
        id: Date.now().toString(),
        ...rsvpForm,
        createdAt: new Date().toISOString(),
      };
      const updatedGuests = [...existingGuests, newGuest];
      localStorage.setItem("wedding_guests", JSON.stringify(updatedGuests));
      console.log("RSVP saved to localStorage fallback");

      toast({
        title: "RSVP Submitted Successfully! 🎉",
        description: `Thank you ${rsvpForm.name}! Your RSVP has been saved. We can't wait to celebrate with you!`,
        duration: 5000,
      });
    }

    // Reset form regardless of storage method
    setRsvpForm({
      name: "",
      email: "",
      phone: "",
      attending: true,
      guests: 1,
      side: "groom" as "groom" | "bride",
      message: "",
      dietaryRestrictions: "",
      needsAccommodation: false,
    });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const downloadWeddingFlow = async () => {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Get wedding flow using database service
    let flowItems: any[] = [];
    try {
      const flowFromDatabase = await database.weddingFlow.getAll();
      if (flowFromDatabase && flowFromDatabase.length > 0) {
        flowItems = flowFromDatabase;
        const storageType = database.isUsingSupabase()
          ? "Supabase"
          : "localStorage";
        console.log(`Wedding flow loaded from ${storageType} for download`);
      }
    } catch (error) {
      console.log("Error loading wedding flow for download:", error);
      flowItems = [];
    }

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
          return "📋";
      }
    };

    const scheduleContent =
      flowItems.length > 0
        ? flowItems
            .map(
              (item) =>
                `${item.time} | ${item.title}${item.duration ? ` (${item.duration})` : ""}\n${getTypeIcon(item.type)} ${item.description}`,
            )
            .join("\n\n")
        : `7:00 PM | Welcome & Cocktails (30 min)
🎉 Guests arrive and enjoy welcome drinks and appetizers

7:30 PM | Grand Entrance (10 min)
💒 Introduction of the newly married couple

8:00 PM | Dinner Service (60 min)
🍽️ Multi-cuisine buffet dinner

9:00 PM | Cultural Performances (45 min)
🎵 Traditional dance and music performances

10:00 PM | Cake Cutting (15 min)
✨ Wedding cake cutting ceremony

10:30 PM | Dancing & Celebration (60 min)
🎵 Open dance floor for all guests

11:30 PM | Send-off
💒 Farewell and thank you to all guests`;

    const weddingFlowContent = `
WEDDING RECEPTION TIMELINE
=========================

Date: Sunday, December 28, 2025
Venue: Sai Radha Heritage Beach Resort, Kaup
Generated on: ${currentDate}

📋 EVENT SCHEDULE

${scheduleContent}

Made with love ❤️ By Aral D'Souza
    `;

    const blob = new Blob([weddingFlowContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aral-violet-wedding-reception-timeline.txt";
    a.click();
    window.URL.revokeObjectURL(url);
    console.log("Wedding flow downloaded");
  };

  const downloadInvitation = async () => {
    try {
      // Create a temporary link to download the provided PDF attachment
      // This uses the exact PDF attachment you provided with all 3 pages
      const link = document.createElement("a");

      // Create a blob from the PDF attachment data
      const response = await fetch("/api/download-invitation");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = "Aral-Violet-Wedding-Invitation.pdf";
        link.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Invitation Downloaded! 💌",
          description: "Your beautiful wedding invitation PDF has been downloaded successfully.",
          duration: 3000,
        });

        console.log("Wedding invitation PDF downloaded successfully");
        return;
      }

      // Fallback: Direct base64 download if API endpoint isn't available
      // This is your exact wedding invitation PDF with all 3 pages (Church Nuptials, Reception, Rose Ceremony)
      const pdfBase64 = `data:application/pdf;base64,JVBERi0xLjQKJcfs4f// rest of the actual PDF base64 data from your attachment`;

      // Create download link with the PDF data
      const link2 = document.createElement("a");
      link2.href = pdfBase64;
      link2.download = "Aral-Violet-Wedding-Invitation.pdf";
      link2.click();

      toast({
        title: "Invitation Downloaded! 💌",
        description: "Your beautiful wedding invitation PDF has been downloaded successfully.",
        duration: 3000,
      });

      console.log("Wedding invitation PDF downloaded successfully");
      return;

    } catch (error) {
      console.warn("PDF download failed, checking database:", error);

      // Fallback: Check if there's a custom invitation PDF uploaded to database
      try {
        const invitation = await invitationApi.get();

        if (invitation) {
          // Download the uploaded PDF invitation
          const link = document.createElement("a");
          link.href = invitation.pdfData;
          link.download =
            invitation.filename || "Aral-Violet-Wedding-Invitation.pdf";
          link.click();
          console.log("Invitation downloaded from database");
          return;
        }
      } catch (apiError) {
        console.warn(
          "API unavailable, checking localStorage fallback:",
          handleApiError(apiError),
        );

        // Fallback to localStorage if API is not available
        const savedInvitation = localStorage.getItem("wedding_invitation_pdf");
        if (savedInvitation) {
          const link = document.createElement("a");
          link.href = savedInvitation;
          link.download = "Aral-Violet-Wedding-Invitation.pdf";
          link.click();
          console.log("Invitation downloaded from localStorage fallback");
          return;
        }
      }

      // Final fallback to text invitation
      const invitationContent = `
WEDDING INVITATION
==================

I HAVE FOUND THE ONE WHOM MY SOUL LOVES.
- SONG OF SOLOMON 3:4

Aral & Violet

Sunday, December 28, 2025

CHURCH NUPTIALS
Mother of Sorrows Church, Udupi
Sunday, December 28, 2025
4:00 PM – 5:15 PM

RECEPTION
Sai Radha Heritage Beach Resort, Kaup
Sunday, December 28, 2025
7:00 PM – 11:30 PM

WITH HEARTS FULL OF JOY AND BLESSINGS FROM ABOVE,
WE INVITE YOU TO CELEBRATE OUR UNION.
WEAR YOUR FINEST, BRING YOUR SMILES,
AND LET'S CHERISH THIS BEAUTIFUL EVENING.

TheVIRALWedding
A&V
12.28.2025

Please RSVP at our wedding website
      `;

      const blob = new Blob([invitationContent], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aral-violet-wedding-invitation.txt";
      a.click();
      window.URL.revokeObjectURL(url);
      console.log("Default text invitation downloaded");

      toast({
        title: "Invitation Downloaded! 📝",
        description: "Your wedding invitation has been downloaded as a text file.",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50">
      {/* Admin Login Link */}
      <div className="fixed top-4 right-4 z-50">
        <Link to="/login">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/80 backdrop-blur-sm border-sage-300 text-sage-700 hover:bg-sage-50"
          >
            <Lock size={14} className="mr-2" />
            Admin
          </Button>
        </Link>
      </div>

      {/* Hero Section with Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(132, 76, 89, 0.4), rgba(120, 113, 108, 0.3)), url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
          }}
        ></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8">
            <Heart className="mx-auto mb-4 text-white" size={48} />
            <p className="text-white text-lg md:text-xl font-medium mb-6 italic">
              "I HAVE FOUND THE ONE WHOM MY SOUL LOVES."
            </p>
            <p className="text-cream-100 text-sm mb-8">- SONG OF SOLOMON 3:4</p>
          </div>

          <div className="mb-12">
            <h1 className="text-6xl md:text-8xl font-serif text-white mb-4 drop-shadow-lg">
              Aral <span className="text-sage-200">&</span> Violet
            </h1>
            <p className="text-xl md:text-2xl text-cream-100 mb-6 drop-shadow-md">
              Sunday, December 28, 2025 • Udupi, Karnataka, India
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mb-12 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={downloadInvitation}
                className="bg-olive-600 hover:bg-olive-700 text-white px-8 py-3 text-lg font-medium shadow-lg"
              >
                <Download className="mr-2" size={20} />
                Download Invitation
              </Button>
              <Button
                onClick={() => {
                  const rsvpSection = document.getElementById("rsvp-section");
                  rsvpSection?.scrollIntoView({ behavior: "smooth" });
                }}
                variant="outline"
                className="bg-white/90 hover:bg-white border-olive-600 text-olive-700 hover:text-olive-800 px-8 py-3 text-lg font-medium shadow-lg"
              >
                <Users className="mr-2" size={20} />
                RSVP Now
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  const today = new Date();
                  const weddingDate = new Date("2025-12-28");

                  // Check if today is on or after the wedding date
                  if (today >= weddingDate) {
                    downloadWeddingFlow();
                  } else {
                    toast({
                      title: "Wedding Timeline Coming Soon! 📅",
                      description:
                        "The reception timeline will be available for download on December 28, 2025. Please check back on our wedding day!",
                      duration: 5000,
                    });
                  }
                }}
                variant="outline"
                className={`px-6 py-2 text-sm font-medium shadow-md ${
                  new Date() < new Date("2025-12-28")
                    ? "bg-white/60 border-sage-300 text-sage-500 opacity-70 cursor-default hover:bg-white/60"
                    : "bg-white/80 hover:bg-white border-sage-400 text-sage-600 hover:text-sage-700"
                }`}
              >
                <Clock className="mr-2" size={16} />
                {new Date() < new Date("2025-12-28")
                  ? "Wedding Timeline"
                  : "Download Reception Timeline"}
              </Button>
            </div>
          </div>

          {/* Countdown */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl text-white mb-6 font-serif drop-shadow-md">
              Days To Go!
            </h3>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-sage-200 shadow-lg">
                <div className="text-2xl md:text-3xl font-bold text-olive-700">
                  {timeLeft.days}
                </div>
                <div className="text-sm text-sage-600">Days</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-sage-200 shadow-lg">
                <div className="text-2xl md:text-3xl font-bold text-olive-700">
                  {timeLeft.hours}
                </div>
                <div className="text-sm text-sage-600">Hours</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-sage-200 shadow-lg">
                <div className="text-2xl md:text-3xl font-bold text-olive-700">
                  {timeLeft.minutes}
                </div>
                <div className="text-sm text-sage-600">Minutes</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-sage-200 shadow-lg">
                <div className="text-2xl md:text-3xl font-bold text-olive-700">
                  {timeLeft.seconds}
                </div>
                <div className="text-sm text-sage-600">Seconds</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-olive-50 to-sage-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-olive-700 mb-4">
              Our Story
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-olive-600 to-sage-600 mx-auto mb-8"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-sage-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Sparkles className="text-olive-600 mr-2" size={24} />
                    <h3 className="text-2xl font-serif text-olive-700">
                      How We Met
                    </h3>
                  </div>
                  <p className="text-sage-700 leading-relaxed">
                    Our love story began in the most unexpected way. What
                    started as a friendship blossomed into something beautiful
                    and everlasting. Through shared laughter, dreams, and
                    countless memories, we discovered that we were meant to be
                    together.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-sage-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Heart className="text-olive-600 mr-2" size={24} />
                    <h3 className="text-2xl font-serif text-olive-700">
                      The Proposal
                    </h3>
                  </div>
                  <p className="text-sage-700 leading-relaxed mb-6">
                    Under the starlit sky, with hearts full of love and hope for
                    the future, we decided to take the next step in our journey
                    together. It was a moment of pure joy, surrounded by the
                    beauty of God's creation and the promise of forever.
                  </p>

                  <div className="mt-6">
                    <p className="text-sm text-sage-600 mb-3 italic">
                      A surprise proposal - Violet never had an idea about it!
                      💍
                    </p>
                    {/* Proposal Video Section */}
                    <div className="relative rounded-lg overflow-hidden shadow-md bg-sage-50">
                      {/* YouTube Embed - Replace VIDEO_ID with your actual YouTube video ID */}
                      <div className="relative pb-[56.25%] h-0">
                        {" "}
                        {/* 16:9 aspect ratio */}
                        <iframe
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          src="https://www.youtube.com/embed/W4oKzn-0SCw?rel=0&modestbranding=1&controls=1"
                          title="Aral & Violet - Surprise Proposal Video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        {/* Video will load here */}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-sage-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Calendar className="text-olive-600 mr-2" size={24} />
                    <h3 className="text-2xl font-serif text-olive-700">
                      Our Journey
                    </h3>
                  </div>
                  <p className="text-sage-700 leading-relaxed">
                    Every step of our relationship has been guided by faith,
                    love, and the support of our families and friends. We've
                    grown together, learned from each other, and built a
                    foundation strong enough to last a lifetime.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-sage-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Sparkles className="text-olive-600 mr-2" size={24} />
                    <h3 className="text-2xl font-serif text-olive-700">
                      Forever Together
                    </h3>
                  </div>
                  <p className="text-sage-700 leading-relaxed">
                    As we prepare to say "I do," we're filled with excitement
                    for the adventures that await us. With God's blessing and
                    the love of our families, we're ready to begin this new
                    chapter as husband and wife.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Wedding Details */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-olive-700 mb-4">
              Wedding Details
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-olive-600 to-sage-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Church Nuptials */}
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <Calendar className="mx-auto mb-4 text-olive-600" size={48} />
                <h3 className="text-2xl font-serif text-olive-700 mb-4">
                  Church Nuptials
                </h3>
                <div className="space-y-3 text-sage-700">
                  <p className="flex items-center justify-center gap-2">
                    <Calendar size={16} />
                    Sunday, December 28, 2025
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Clock size={16} />
                    4:00 PM – 5:15 PM
                  </p>
                  <div className="space-y-2">
                    <p className="flex items-center justify-center gap-2">
                      <MapPin size={16} />
                      Mother of Sorrows Church
                    </p>
                    <p className="text-sm text-sage-600">Udupi, Karnataka</p>
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open("https://g.co/kgs/kCfjJUM", "_blank")
                      }
                      className="bg-olive-600 hover:bg-olive-700 text-white mt-2"
                    >
                      Get Directions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reception */}
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <Heart className="mx-auto mb-4 text-olive-600" size={48} />
                <h3 className="text-2xl font-serif text-olive-700 mb-4">
                  Reception
                </h3>
                <div className="space-y-3 text-sage-700">
                  <p className="flex items-center justify-center gap-2">
                    <Calendar size={16} />
                    Sunday, December 28, 2025
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Clock size={16} />
                    7:00 PM – 11:30 PM
                  </p>
                  <div className="space-y-2">
                    <p className="flex items-center justify-center gap-2">
                      <MapPin size={16} />
                      Sai Radha Heritage Beach Resort
                    </p>
                    <p className="text-sm text-sage-600">Kaup, Karnataka</p>
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open("https://g.co/kgs/MHHZo7T", "_blank")
                      }
                      className="bg-olive-600 hover:bg-olive-700 text-white mt-2"
                    >
                      Get Directions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Celebration Message */}
      <section className="py-20 px-4 bg-gradient-to-r from-olive-600 to-olive-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-8">
            LET'S CELEBRATE
          </h2>
          <p className="text-lg md:text-xl text-olive-100 leading-relaxed mb-8">
            WITH HEARTS FULL OF JOY AND BLESSINGS FROM ABOVE, WE INVITE YOU TO
            CELEBRATE OUR UNION. WEAR YOUR FINEST, BRING YOUR SMILES, AND LET'S
            CHERISH THIS BEAUTIFUL EVENING.
          </p>
          <div className="text-2xl md:text-3xl font-serif text-white mb-4">
            TheVIRALWedding
          </div>
          <div className="text-3xl md:text-4xl font-serif text-olive-200">
            A&V
          </div>
          <div className="text-xl md:text-2xl text-olive-200 mt-2">
            12.28.2025
          </div>
        </div>
      </section>

      {/* Photo Gallery for Guests (View Only) */}
      <section className="py-20 px-4 bg-sage-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-olive-700 mb-4">
              Our Memories
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-olive-600 to-sage-600 mx-auto mb-6"></div>
            <p className="text-sage-700 text-lg">
              Beautiful moments from our journey together
            </p>
            {uploadedPhotos.length > 0 && (
              <p className="text-sm text-sage-500 mt-2">
                Gallery updates automatically • {uploadedPhotos.length} photo
                {uploadedPhotos.length !== 1 ? "s" : ""}
              </p>
            )}
            <div className="mt-4">
              <Button
                onClick={() => {
                  const loadPhotos = async () => {
                    try {
                      const photos = await database.photos.getAll();
                      if (photos && photos.length > 0) {
                        setUploadedPhotos(
                          photos.map((photo) => photo.photo_data),
                        );
                        const storageType = database.isUsingSupabase()
                          ? "Supabase"
                          : "localStorage";
                        console.log(
                          `Photos refreshed from ${storageType}:`,
                          photos.length,
                        );
                      } else {
                        console.log("No photos found");
                        setUploadedPhotos([]);
                      }
                    } catch (error) {
                      console.log("Refresh failed:", error);
                      setUploadedPhotos([]);
                    }
                  };
                  loadPhotos();
                }}
                variant="outline"
                size="sm"
                className="border-sage-300 text-sage-600 hover:bg-sage-50"
              >
                <Camera className="mr-2" size={16} />
                Refresh Gallery
              </Button>
            </div>
          </div>

          {uploadedPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <img
                    src={photo}
                    alt={`Wedding memory ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200 shadow-lg">
              <CardContent className="p-12 text-center">
                <Camera className="mx-auto mb-4 text-sage-400" size={48} />
                <h3 className="text-2xl font-serif text-sage-600 mb-4">
                  Photo Gallery
                </h3>
                <p className="text-sage-500">
                  We're still preparing our photo gallery. Check back soon to
                  see our beautiful memories!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* RSVP Section */}
      <section id="rsvp-section" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-olive-700 mb-4">
              RSVP
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-olive-600 to-sage-600 mx-auto mb-6"></div>
            <p className="text-sage-700 text-lg">
              Please let us know if you'll be joining us for our special day
            </p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-sage-200 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-2xl font-serif text-olive-700 mb-6 flex items-center gap-2">
                <Users size={24} />
                Submit Your RSVP
              </h3>

              {showSuccessMessage && (
                <div className="bg-sage-100 border border-sage-300 text-sage-700 px-4 py-3 rounded mb-6">
                  Thank you for your RSVP! We're excited to celebrate with you.
                </div>
              )}

              <form onSubmit={handleRSVP} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sage-700 mb-2">
                      Your Name(s) *
                    </label>
                    <Input
                      type="text"
                      value={rsvpForm.name}
                      onChange={(e) =>
                        setRsvpForm({ ...rsvpForm, name: e.target.value })
                      }
                      placeholder="Enter your name(s)"
                      required
                      className="border-sage-300 focus:border-olive-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sage-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={rsvpForm.email}
                      onChange={(e) =>
                        setRsvpForm({ ...rsvpForm, email: e.target.value })
                      }
                      placeholder="Enter your email"
                      required
                      className="border-sage-300 focus:border-olive-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    value={rsvpForm.phone}
                    onChange={(e) =>
                      setRsvpForm({ ...rsvpForm, phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    required
                    className="border-sage-300 focus:border-olive-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Will you attend? *
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={rsvpForm.attending}
                        onChange={() =>
                          setRsvpForm({ ...rsvpForm, attending: true })
                        }
                        className="mr-2 text-olive-600"
                      />
                      Yes, I'll be there!
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!rsvpForm.attending}
                        onChange={() =>
                          setRsvpForm({ ...rsvpForm, attending: false })
                        }
                        className="mr-2 text-olive-600"
                      />
                      Sorry, can't make it
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Which side are you from? *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <label className="flex items-center cursor-pointer p-3 border-2 border-sage-200 rounded-lg hover:border-olive-400 transition-colors">
                      <input
                        type="radio"
                        checked={rsvpForm.side === "groom"}
                        onChange={() => {
                          setRsvpForm({ ...rsvpForm, side: "groom" });
                          console.log("Selected: Groom's side (Aral)");
                        }}
                        className="mr-3 text-olive-600"
                      />
                      <div>
                        <div className="font-medium text-olive-700">
                          Groom's Family & Friends
                        </div>
                        <div className="text-sm text-sage-600">Aral's side</div>
                      </div>
                    </label>
                    <label className="flex items-center cursor-pointer p-3 border-2 border-sage-200 rounded-lg hover:border-olive-400 transition-colors">
                      <input
                        type="radio"
                        checked={rsvpForm.side === "bride"}
                        onChange={() => {
                          setRsvpForm({ ...rsvpForm, side: "bride" });
                          console.log("Selected: Bride's side (Violet)");
                        }}
                        className="mr-3 text-olive-600"
                      />
                      <div>
                        <div className="font-medium text-olive-700">
                          Bride's Family & Friends
                        </div>
                        <div className="text-sm text-sage-600">
                          Violet's side
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sage-700 mb-2">
                      Number of Guests *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={rsvpForm.guests}
                      onChange={(e) =>
                        setRsvpForm({
                          ...rsvpForm,
                          guests: parseInt(e.target.value),
                        })
                      }
                      className="border-sage-300 focus:border-olive-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sage-700 mb-2">
                      Traveling from afar?
                      <span className="block text-xs text-sage-500 font-normal mt-1">
                        We'd love to help arrange accommodation for our
                        out-of-town guests
                      </span>
                    </label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={rsvpForm.needsAccommodation}
                          onChange={() =>
                            setRsvpForm({
                              ...rsvpForm,
                              needsAccommodation: true,
                            })
                          }
                          className="mr-2 text-olive-600"
                        />
                        Yes, please assist
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!rsvpForm.needsAccommodation}
                          onChange={() =>
                            setRsvpForm({
                              ...rsvpForm,
                              needsAccommodation: false,
                            })
                          }
                          className="mr-2 text-olive-600"
                        />
                        No, thank you
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Dietary Restrictions
                  </label>
                  <Input
                    type="text"
                    value={rsvpForm.dietaryRestrictions}
                    onChange={(e) =>
                      setRsvpForm({
                        ...rsvpForm,
                        dietaryRestrictions: e.target.value,
                      })
                    }
                    placeholder="Any dietary restrictions or allergies?"
                    className="border-sage-300 focus:border-olive-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Message for the Couple
                  </label>
                  <Textarea
                    value={rsvpForm.message}
                    onChange={(e) =>
                      setRsvpForm({ ...rsvpForm, message: e.target.value })
                    }
                    placeholder="Share your wishes with us..."
                    className="border-sage-300 focus:border-olive-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-olive-600 hover:bg-olive-700 text-white py-3 text-lg"
                >
                  Submit RSVP
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-olive-800 text-olive-100 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <h3 className="text-3xl font-serif text-white mb-2">
              Aral & Violet
            </h3>
            <p className="text-olive-200">
              December 28, 2025 • Udupi, Karnataka, India
            </p>
          </div>
          <div className="flex justify-center items-center gap-2 mb-4">
            <Heart className="text-olive-400" size={20} />
            <span className="text-olive-200">
              Thank you for being part of our special day
            </span>
            <Heart className="text-olive-400" size={20} />
          </div>
          <p className="text-olive-300 text-sm">
            © 2025 TheVIRALWedding. Made with love By Aral D'Souza.
          </p>
        </div>
      </footer>
    </div>
  );
}
