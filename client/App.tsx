import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import GuestUpload from "./pages/GuestUpload";
import Debug from "./pages/Debug";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        basename={
          import.meta.env.PROD &&
          import.meta.env.VITE_DEPLOYMENT_PLATFORM !== "netlify"
            ? "/aral-violet-wedding"
            : "/"
        }
      >
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/guest-upload" element={<GuestUpload />} />
            <Route path="/debug" element={<Debug />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Prevent createRoot warning during hot reloads
const container = document.getElementById("root")!;

// Use global variable to track root across hot reloads
declare global {
  var __REACT_ROOT__: ReturnType<typeof createRoot> | undefined;
}

if (!globalThis.__REACT_ROOT__) {
  globalThis.__REACT_ROOT__ = createRoot(container);
}

globalThis.__REACT_ROOT__.render(<App />);
