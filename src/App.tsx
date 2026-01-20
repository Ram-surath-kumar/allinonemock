import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdmissionAdmin from "./pages/AdmissionAdmin";
// AdmissionPortal is already imported or not needed here if imported elsewhere?
import { AdmissionPortal } from "./components/students/Admission/AdmissionPortal";
import Facilities from "./pages/Facilities";

const queryClient = new QueryClient();

// Create a wrapper component to use useAuth hook
const AppContent = () => {
  const { currentUser, loading } = useAuth();

  // Debug logging
  console.log('App Render:', { currentUser, loading, path: window.location.pathname });

  // Optional: Redirect logic if needed at App level, but usually handled in protected routes or Index.jsx
  // if (!currentUser && !loading && window.location.pathname !== '/login') {
  //   return null; // Or reliance on Index.jsx to redirect
  // }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Index />} />
      <Route path="/admin/admissions" element={<AdmissionAdmin />} />

      {/* Main Sidebar Routes */}
      <Route path="/users" element={<Index />} />
      <Route path="/students" element={<Index />} />
      <Route path="/attendance" element={<Index />} />
      <Route path="/finance" element={<Index />} />
      <Route path="/facilities" element={<Index />} />
      <Route path="/hostel" element={<Index />} />
      <Route path="/library" element={<Index />} />
      <Route path="/exam" element={<Index />} />
      <Route path="/tools" element={<Index />} />
      <Route path="/settings" element={<Index />} />

      {/* Governance & Academics */}
      <Route path="/academics" element={<Index />} />
      <Route path="/governance/*" element={<Index />} />

      {/* Student Portal Routes */}
      <Route path="/student/*" element={<Index />} />

      <Route path="/:orgName/:userId" element={<Index />} />
      <Route path="/:orgName/:userId/:tab" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
