import React from "react";
import { Info, Smartphone } from "lucide-react";
import { detectMobile, getDownloadInstructions } from "@/lib/mobile-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MobileCompatibilityNoticeProps {
  showForFeature?: "download" | "upload" | "general";
  className?: string;
}

export default function MobileCompatibilityNotice({
  showForFeature = "general",
  className = "",
}: MobileCompatibilityNoticeProps) {
  const { isMobile, isIOS, isAndroid } = detectMobile();

  // Only show on mobile devices
  if (!isMobile) return null;

  const getFeatureInstructions = () => {
    switch (showForFeature) {
      case "download":
        return {
          title: "Mobile Download Tips",
          description: getDownloadInstructions(),
        };
      case "upload":
        return {
          title: "Mobile Upload Tips",
          description: isIOS
            ? 'On iOS: Tap "Choose Photos" or use "Take/Upload Photo" for camera access.'
            : "On Android: Select photos from gallery or take new photos with the camera button.",
        };
      default:
        return {
          title: "Mobile Experience",
          description:
            "This website is optimized for mobile devices. Download and upload features work best with the tips shown above.",
        };
    }
  };

  const { title, description } = getFeatureInstructions();

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Smartphone className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">{title}</AlertTitle>
      <AlertDescription className="text-blue-700 text-sm">
        {description}
      </AlertDescription>
    </Alert>
  );
}
