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
  Waves
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { database } from "@/lib/database";

interface RocePhoto {
  id: string;
  photo_data: string;
  guest_name: string;
  message?: string;
  created_at: string;
}

export default function AralRoce() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<RocePhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 8;
  
  const [uploadForm, setUploadForm] = useState({
    guestName: "",
    message: "",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Roce photos on component mount
  useEffect(() => {
    loadRocePhotos();
  }, []);

  const loadRocePhotos = async () => {
    try {
      // Get all photos and filter for Aral's Roce
      const allPhotos = await database.photos.getAll();
      const rocePhotos = allPhotos
        .filter(photo => photo.uploaded_by?.includes('aral_roce'))
        .map(photo => ({
          id: photo.id || '',
          photo_data: photo.photo_data,
          guest_name: photo.guest_name || 'Anonymous',
          message: extractMessageFromUploadedBy(photo.uploaded_by),
          created_at: photo.created_at || new Date().toISOString()
        }));
      
      setPhotos(rocePhotos);
    } catch (error) {
      console.error('Error loading Roce photos:', error);
    }
  };

  const extractMessageFromUploadedBy = (uploadedBy: string): string => {
    // Extract message from uploadedBy format: guest_aral_roce_guestName_timestamp_message
    const parts = uploadedBy.split('_');
    if (parts.length > 5) {
      return parts.slice(5).join('_');
    }
    return '';
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
            
            // Create unique uploaded_by identifier for Aral's Roce with message
            const timestamp = Date.now();
            const uploadedBy = `guest_aral_roce_${uploadForm.guestName.replace(/\s+/g, '')}_${timestamp}_${uploadForm.message.replace(/\s+/g, '_')}`;
            
            try {
              await database.photos.create(
                photoData,
                uploadedBy,
                uploadForm.guestName
              );

              // Reload photos
              await loadRocePhotos();
              
              toast({
                title: "Photo Uploaded! 📸",
                description: `Your wonderful Roce memory has been added to Aral's collection!`,
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

  // Check if Aral's Roce event has passed
  const isEventActive = () => {
    const now = new Date();
    const roceDate = new Date('2025-12-27'); // Dec 27, 2025
    const dayAfterRoce = new Date('2025-12-28'); // Dec 28, 2025
    
    // Allow uploads on Roce day and the day after (until wedding day)
    return now >= roceDate && now < dayAfterRoce;
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-teal-700 mb-4">
            Aral's Roce
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-teal-600 to-blue-600 mx-auto mb-6"></div>
          <p className="text-teal-700 text-lg mb-4">
            A cherished Mangalorean tradition celebrating the groom
          </p>
          
          {/* Event Details */}
          <Card className="bg-white/80 backdrop-blur-sm border-teal-200 shadow-lg max-w-md mx-auto mb-8">
            <CardContent className="p-6 text-center">
              <Waves className="mx-auto mb-4 text-teal-600" size={40} />
              <div className="space-y-2 text-teal-700">
                <p className="flex items-center justify-center gap-2">
                  <Calendar size={16} />
                  Friday, December 27, 2025
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Clock size={16} />
                  Evening Ceremony
                </p>
                <p className="flex items-center justify-center gap-2">
                  <MapPin size={16} />
                  At Aral's Home
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Upload Section */}
        <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 shadow-xl mb-12">
          <CardHeader>
            <CardTitle className="text-teal-700 flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Share Your Roce Moments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEventActive() ? (
              <div className="space-y-4">
                <p className="text-teal-600 mb-4">
                  Capture the traditions and celebrations of Aral's Roce ceremony! Share your photos and messages to preserve these precious memories.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-teal-700 mb-2">
                      <User className="inline w-4 h-4 mr-1" />
                      Your Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={uploadForm.guestName}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, guestName: e.target.value }))}
                      className="border-teal-300 focus:border-teal-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-teal-700 mb-2">
                      <MessageSquare className="inline w-4 h-4 mr-1" />
                      Message (Optional)
                    </label>
                    <Textarea
                      placeholder="Share a message with your photo..."
                      value={uploadForm.message}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, message: e.target.value }))}
                      className="border-teal-300 focus:border-teal-500"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3"
                  >
                    <Upload className="mr-2 w-5 h-5" />
                    {isUploading ? 'Uploading...' : 'Upload Roce Photos'}
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
                <Calendar className="mx-auto mb-4 text-teal-400" size={48} />
                <p className="text-teal-600 text-lg mb-2">
                  Photo uploads will be available on December 27, 2025
                </p>
                <p className="text-teal-500 text-sm">
                  Come back during Aral's Roce ceremony to share your photos!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        {photos.length > 0 ? (
          <>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif text-teal-700 mb-2">
                Roce Memories
              </h3>
              <p className="text-teal-600">
                {photos.length} special moment{photos.length !== 1 ? 's' : ''} shared
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
                        alt={`Roce memory ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-teal-700 flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {photo.guest_name}
                      </p>
                      {photo.message && (
                        <p className="text-xs text-teal-600 mt-1 italic">
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
                  className="border-teal-300 text-teal-600 hover:bg-teal-50"
                >
                  Previous
                </Button>
                
                <span className="text-teal-600">
                  Page {currentPage} of {Math.ceil(photos.length / photosPerPage)}
                </span>
                
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(photos.length / photosPerPage)))}
                  disabled={currentPage === Math.ceil(photos.length / photosPerPage)}
                  variant="outline"
                  size="sm"
                  className="border-teal-300 text-teal-600 hover:bg-teal-50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Camera className="mx-auto mb-4 text-teal-400" size={64} />
            <h3 className="text-xl font-serif text-teal-600 mb-2">
              No Roce photos yet
            </h3>
            <p className="text-teal-500">
              Be the first to share a wonderful moment from Aral's Roce ceremony!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
