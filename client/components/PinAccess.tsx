import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PinAccessProps {
  onAccessGranted: () => void;
  eventName: string;
  eventDate: string;
}

export default function PinAccess({ onAccessGranted, eventName, eventDate }: PinAccessProps) {
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    // PIN for admin access
    const ADMIN_PIN = "0000";

    if (pin === ADMIN_PIN) {
      toast({
        title: "Admin Access Granted! 🔓",
        description: `You now have admin access to ${eventName}.`,
        duration: 3000,
      });
      onAccessGranted();
    } else {
      toast({
        title: "Access Denied ❌",
        description: "Invalid PIN. Please check the PIN and try again.",
        variant: "destructive",
        duration: 4000,
      });
    }

    setIsVerifying(false);
    setPin("");
  };

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm border-2 border-sage-200 shadow-xl">
        <CardHeader className="text-center">
          <Lock className="mx-auto mb-4 text-sage-600" size={48} />
          <CardTitle className="text-2xl font-serif text-sage-700">
            Access Required
          </CardTitle>
          <p className="text-sage-600 mt-2">
            {eventName}
          </p>
          <p className="text-sm text-sage-500">
            {eventDate}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sage-700 mb-4">
              This section is available during the event or with admin access.
            </p>
            <div className="bg-sage-50 p-4 rounded-lg border border-sage-200">
              <p className="text-sm text-sage-600 mb-2">
                <strong>For Guests:</strong> This section will be accessible on {eventDate}
              </p>
              <p className="text-sm text-sage-600">
                <strong>Only admins can access before event dates</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                Enter Admin PIN
              </label>
              <Input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                className="text-center text-lg tracking-widest border-sage-300 focus:border-sage-500"
              />
            </div>
            
            <Button
              type="submit"
              disabled={pin.length !== 4 || isVerifying}
              className="w-full bg-sage-600 hover:bg-sage-700 text-white"
            >
              {isVerifying ? (
                "Verifying..."
              ) : (
                <>
                  <Unlock className="mr-2 w-4 h-4" />
                  Access Testing Mode
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-sage-500">
              Regular access will be available automatically on the event date
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
