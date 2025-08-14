import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Upload,
  Heart,
  Calendar,
  Clock,
  MapPin,
  User,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eventDatabase, EventPhoto } from "@/lib/event-database";
import PinAccess from "./PinAccess";

export default function VioletHaldi() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const photosPerPage = 8;

  const [uploadForm, setUploadForm] = useState({
    guestName: "",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check access and load photos on component mount
  useEffect(() => {
    checkAccess();
    checkSupabaseConnection();
  }, []);

  // Load photos when access is granted
  useEffect(() => {
    if (hasAccess && isSupabaseConnected) {
      loadHaldiPhotos();
    }
  }, [hasAccess, isSupabaseConnected]);

  const checkSupabaseConnection = async () => {
    const connected = await eventDatabase.testConnection();
    setIsSupabaseConnected(connected);

    if (!connected) {
      toast({
        title: "Supabase Connection Required ⚠️",
        description: "Event photos require Supabase database connection. Please configure Supabase to use this feature.",
        variant: "destructive",
        duration: 6000,
      });
    }
  };

  const checkAccess = () => {
    const now = new Date();
    const haldiDate = new Date('2025-12-26'); // Dec 26, 2025
    const dayAfterHaldi = new Date('2025-12-28'); // Dec 28, 2025 (allow until wedding day)

    // Check if it's the event date (allow from Haldi day until wedding day)
    const isEventPeriod = now >= haldiDate && now < dayAfterHaldi;

    if (isEventPeriod) {
      setHasAccess(true);
    }
  };

  const handleAccessGranted = () => {
    setHasAccess(true);
  };

  const loadHaldiPhotos = async () => {
    try {
      const haldiPhotos = await eventDatabase.photos.getByEventType('violet_haldi');
      setPhotos(haldiPhotos);
      console.log(`📸 Loaded ${haldiPhotos.length} Haldi photos from Supabase`);
    } catch (error) {
      console.error('Error loading Haldi photos:', error);
      toast({
        title: "Error Loading Photos",
        description: "Failed to load Haldi photos. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!uploadForm.guestName.trim()) {
      toast({
        title: "Name Required! ✋",
        description: "Please enter your name before uploading photos.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File Type",
            description: `${file.name} is not an image. Please select image files only.`,
            variant: "destructive",
            duration: 4000,
          });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast({
            title: "File Too Large",
            description: `${file.name} is too large. Please choose images under 10MB.`,
            variant: "destructive",
            duration: 4000,
          });
          continue;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const photoData = e.target.result as string;
            
            // Create unique uploaded_by identifier for Violet's Haldi with message
            const timestamp = Date.now();
            const uploadedBy = `guest_violet_haldi_${uploadForm.guestName.replace(/\s+/g, '')}_${timestamp}_${uploadForm.message.replace(/\s+/g, '_')}`;
            
            try {
              await database.photos.create(
                photoData,
                uploadedBy,
                uploadForm.guestName
              );

              // Reload photos
              await loadHaldiPhotos();
              
              toast({
                title: "Photo Uploaded! 📸",
                description: `Your beautiful Haldi memory has been added to Violet's collection!`,
                duration: 4000,
              });
            } catch (uploadError) {
              console.error('Photo upload error:', uploadError);
              toast({
                title: "Upload Failed",
                description: "Failed to upload photo. Please try again.",
                variant: "destructive",
                duration: 4000,
              });
            }
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Upload process error:', error);
      toast({
        title: "Upload Error",
        description: "There was an error processing your photos.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsUploading(false);
      // Reset form
      setUploadForm({ guestName: "", message: "" });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Check if Violet's Haldi event has passed
  const isEventActive = () => {
    const now = new Date();
    const haldiDate = new Date('2025-12-26'); // Dec 26, 2025
    const dayAfterHaldi = new Date('2025-12-27'); // Dec 27, 2025
    
    // Allow uploads on Haldi day and the day after
    return now >= haldiDate && now < dayAfterHaldi;
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-purple-700 mb-4">
            Violet's Haldi
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mb-6"></div>
          <p className="text-purple-700 text-lg mb-4">
            A beautiful pre-wedding tradition filled with joy and blessings
          </p>
          
          {/* Event Details */}
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg max-w-md mx-auto mb-8">
            <CardContent className="p-6 text-center">
              <Sparkles className="mx-auto mb-4 text-purple-600" size={40} />
              <div className="space-y-2 text-purple-700">
                <p className="flex items-center justify-center gap-2">
                  <Calendar size={16} />
                  Thursday, December 26, 2025
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Clock size={16} />
                  Evening Ceremony
                </p>
                <p className="flex items-center justify-center gap-2">
                  <MapPin size={16} />
                  At Violet's Home
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Upload Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl mb-12">
          <CardHeader>
            <CardTitle className="text-purple-700 flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Share Your Haldi Moments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEventActive() ? (
              <div className="space-y-4">
                <p className="text-purple-600 mb-4">
                  Capture the joy and traditions of Violet's Haldi ceremony! Share your photos and messages to create lasting memories.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      <User className="inline w-4 h-4 mr-1" />
                      Your Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={uploadForm.guestName}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, guestName: e.target.value }))}
                      className="border-purple-300 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      <MessageSquare className="inline w-4 h-4 mr-1" />
                      Message (Optional)
                    </label>
                    <Textarea
                      placeholder="Share a message with your photo..."
                      value={uploadForm.message}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, message: e.target.value }))}
                      className="border-purple-300 focus:border-purple-500"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                  >
                    <Upload className="mr-2 w-5 h-5" />
                    {isUploading ? 'Uploading...' : 'Upload Haldi Photos'}
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto mb-4 text-purple-400" size={48} />
                <p className="text-purple-600 text-lg mb-2">
                  Photo uploads will be available on December 26, 2025
                </p>
                <p className="text-purple-500 text-sm">
                  Come back during Violet's Haldi ceremony to share your photos!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        {photos.length > 0 ? (
          <>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif text-purple-700 mb-2">
                Haldi Memories
              </h3>
              <p className="text-purple-600">
                {photos.length} beautiful moment{photos.length !== 1 ? 's' : ''} shared
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {photos
                .slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage)
                .map((photo, index) => (
                  <Card key={photo.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div className="aspect-square">
                      <img
                        src={photo.photo_data}
                        alt={`Haldi memory ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-purple-700 flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {photo.guest_name}
                      </p>
                      {photo.message && (
                        <p className="text-xs text-purple-600 mt-1 italic">
                          "{photo.message}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Pagination */}
            {photos.length > photosPerPage && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  Previous
                </Button>
                
                <span className="text-purple-600">
                  Page {currentPage} of {Math.ceil(photos.length / photosPerPage)}
                </span>
                
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(photos.length / photosPerPage)))}
                  disabled={currentPage === Math.ceil(photos.length / photosPerPage)}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Camera className="mx-auto mb-4 text-purple-400" size={64} />
            <h3 className="text-xl font-serif text-purple-600 mb-2">
              No Haldi photos yet
            </h3>
            <p className="text-purple-500">
              Be the first to share a beautiful moment from Violet's Haldi ceremony!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
