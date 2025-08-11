import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Heart, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate loading delay
    setTimeout(() => {
      const success = login(credentials.username, credentials.password);

      if (!success) {
        setError("Invalid username or password. Please try again.");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50 flex items-center justify-center p-4">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
        }}
      ></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Heart className="mx-auto mb-4 text-olive-600" size={48} />
          <h1 className="text-3xl font-serif text-olive-700 mb-2">
            Admin Login
          </h1>
          <p className="text-sage-600">Access your wedding dashboard</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-sage-200 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-serif text-olive-700">
              Welcome Back
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400"
                    size={18}
                  />
                  <Input
                    type="text"
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        username: e.target.value,
                      })
                    }
                    placeholder="Enter your username"
                    className="pl-10 border-sage-300 focus:border-olive-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400"
                    size={18}
                  />
                  <Input
                    type="password"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    placeholder="Enter your password"
                    className="pl-10 border-sage-300 focus:border-olive-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-olive-600 hover:bg-olive-700 text-white py-3"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-sage-200">
              <p className="text-xs text-sage-500 text-center">
                This is a secure area for the wedding couple only.
                <br />
                If you're a guest, please return to the main page.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="text-sage-600 border-sage-300 hover:bg-sage-50"
          >
            ← Back to Wedding Site
          </Button>
        </div>
      </div>
    </div>
  );
}
