import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Upload, Camera, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { database } from "@/lib/database";

export default function GuestUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [guestName, setGuestName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!guestName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before uploading photos.",
        variant: "destructive",
      });
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;
    const totalFiles = files.length;

    toast({
      title: "Uploading Photos... ⏳",
      description: `Processing ${totalFiles} photo${totalFiles !== 1 ? "s" : ""}...`,
    });

    // Process files with proper async handling and improved error management
    const uploadPromises = Array.from(files).map(async (file, index) => {
      console.log(`🔄 Processing file ${index + 1}/${totalFiles}: ${file.name}`);

      // Validate file type
      const isValidImage =
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name);

      if (!isValidImage) {
        const errorMsg = `"${file.name}" is not a valid image file. Please upload JPG, PNG, GIF, WebP, or SVG files.`;
        console.error(`❌ ${errorMsg}`);
        toast({
          title: "Invalid File Type",
          description: errorMsg,
          variant: "destructive",
          duration: 4000,
        });
        throw new Error(`Invalid file type: ${file.name}`);
      }

      // Check file size (25MB max)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const errorMsg = `"${file.name}" is ${sizeMB}MB. Maximum size is 25MB.`;
        console.error(`❌ ${errorMsg}`);
        toast({
          title: "File Too Large",
          description: errorMsg,
          variant: "destructive",
          duration: 4000,
        });
        throw new Error(`File too large: ${file.name}`);
      }

      try {
        // Convert to base64 with timeout protection
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          // Add timeout for large files (2 minute timeout)
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout reading file ${file.name}`));
          }, 120000);

          reader.onload = (event) => {
            clearTimeout(timeout);
            if (event.target?.result) {
              resolve(event.target.result as string);
            } else {
              reject(new Error("Failed to read file"));
            }
          };

          reader.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`File read error for ${file.name}`));
          };

          reader.readAsDataURL(file);
        });

        // Validate base64 data
        if (!base64String.startsWith("data:image/")) {
          throw new Error(`Invalid image data for ${file.name}`);
        }

        // Upload to database with proper guest metadata and retry logic
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          try {
            const savedPhoto = await database.photos.create(base64String, "guest", guestName.trim());
            console.log(`✅ Guest photo ${file.name} uploaded successfully:`, savedPhoto.id);
            return { success: true, fileName: file.name, photoId: savedPhoto.id };
          } catch (uploadError) {
            attempts++;
            console.error(`❌ Guest photo upload attempt ${attempts} failed for ${file.name}:`, uploadError);

            if (attempts >= maxAttempts) {
              throw uploadError;
            }

            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.allSettled(uploadPromises);

    // Count successes and failures
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        successCount++;
      } else {
        errorCount++;
        console.error("Upload error:", result.reason);
      }
    });

    setIsUploading(false);
    setUploadedCount(successCount);

    if (successCount > 0) {
      setIsSuccess(true);
      const storageType = database.isUsingSupabase() ? 'Supabase database' : 'local storage';
      toast({
        title: "Photos Uploaded Successfully! 📷",
        description: `${successCount} photo${successCount !== 1 ? "s" : ""} from ${guestName} uploaded to the wedding gallery and saved to ${storageType}!`,
        duration: 6000,
      });

      console.log(`🎉 Guest upload complete: ${successCount} photos from ${guestName}`);
    }

    if (errorCount > 0) {
      toast({
        title: `Upload Issues (${errorCount}/${totalFiles})`,
        description: `${errorCount} photo${errorCount !== 1 ? "s" : ""} failed to upload. ${successCount > 0 ? `${successCount} photo${successCount !== 1 ? 's' : ''} uploaded successfully.` : 'Please try again.'}`,
        variant: errorCount === totalFiles ? "destructive" : "default",
        duration: 6000,
      });
    }

    // Clear the input
    e.target.value = "";
  };

  const handleUploadClick = () => {
    if (!guestName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before selecting photos.",
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-sage-50 to-olive-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-sage-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-olive-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-serif text-olive-700 mb-4">
              Thank You, {guestName}!
            </h2>
            <p className="text-sage-600 mb-6">
              Your {uploadedCount} photo
              {uploadedCount !== 1 ? "s have" : " has"} been successfully added
              to Aral & Violet's wedding gallery.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setIsSuccess(false);
                  setUploadedCount(0);
                  setGuestName("");
                }}
                className="w-full bg-olive-600 hover:bg-olive-700 text-white"
              >
                Upload More Photos
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full border-sage-300 text-sage-700 hover:bg-sage-50"
              >
                View Wedding Website
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-sage-50 to-olive-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sage-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-sage-700 hover:text-olive-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wedding
          </Button>
          <div className="flex items-center space-x-2 text-olive-700">
            <Heart className="w-5 h-5" />
            <span className="font-serif text-lg">A&V Wedding</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-white/90 backdrop-blur-sm border-sage-200 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-olive-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-serif text-olive-700 mb-2">
              Share Your Couple Photos
            </CardTitle>
            <p className="text-sage-600 text-lg">
              Did you take photos of Aral & Violet during the wedding? Share
              them with us for our memories!
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Guest Name Input */}
            <div className="space-y-2">
              <Label htmlFor="guestName" className="text-sage-700 font-medium">
                Your Name *
              </Label>
              <Input
                id="guestName"
                type="text"
                placeholder="Enter your full name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="border-sage-300 focus:border-olive-500 focus:ring-olive-500"
                disabled={isUploading}
              />
              <p className="text-sm text-sage-500">
                We'll use this to identify your photos in the gallery
              </p>
            </div>

            {/* Upload Section */}
            <div className="text-center p-8 border-2 border-dashed border-sage-300 rounded-lg hover:border-sage-400 transition-colors">
              <Upload className="mx-auto mb-4 text-olive-600" size={48} />
              <h3 className="text-xl font-serif text-olive-700 mb-4">
                Upload Your Couple Photos
              </h3>
              <p className="text-sage-600 mb-6">
                Share the photos you took of the couple during the wedding (up
                to 25MB per photo)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />

              <Button
                onClick={handleUploadClick}
                disabled={isUploading || !guestName.trim()}
                className="bg-olive-600 hover:bg-olive-700 text-white px-8 py-3 text-lg"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Upload className="mr-2 w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 w-5 h-5" />
                    Select Photos
                  </>
                )}
              </Button>

              <div className="mt-4 space-y-1">
                <p className="text-sm text-sage-600">
                  Select multiple photos • Up to 25MB per photo supported
                </p>
                <p className="text-xs text-sage-500">
                  Supports: JPG, PNG, GIF, WebP, BMP formats
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-sage-50 rounded-lg p-4">
              <h4 className="font-medium text-sage-700 mb-2">Quick Tips:</h4>
              <ul className="text-sm text-sage-600 space-y-1">
                <li>
                  • Upload photos you took of the couple during the wedding
                </li>
                <li>• Make sure to enter your name before uploading</li>
                <li>• You can select multiple photos at once</li>
                <li>• Photos will appear in the main wedding gallery</li>
                <li>• High-quality photos are welcome (up to 25MB each)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
