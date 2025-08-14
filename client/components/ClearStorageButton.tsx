import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface ClearStorageButtonProps {
  variant?: "destructive" | "outline";
  size?: "sm" | "default" | "lg";
}

export default function ClearStorageButton({
  variant = "outline",
  size = "sm",
}: ClearStorageButtonProps) {
  const { toast } = useToast();

  const clearLocalStorage = () => {
    try {
      // Clear invitation-related localStorage items
      localStorage.removeItem("wedding_invitation_pdf");
      localStorage.removeItem("wedding_invitation_filename");

      console.log("🗑️ Cleared invitation localStorage items");

      toast({
        title: "Storage Cleared! 🗑️",
        description:
          "Invitation localStorage items have been cleared. Try downloading again.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      toast({
        title: "Clear Storage Failed ❌",
        description: "Failed to clear localStorage items.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Button
      onClick={clearLocalStorage}
      variant={variant}
      size={size}
      className="gap-2"
    >
      <Trash2 size={16} />
      Clear Invitation Cache
    </Button>
  );
}
