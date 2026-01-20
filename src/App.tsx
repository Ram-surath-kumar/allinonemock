import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />

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

              {/* Dynamic Routes */}
              <Route path="/:orgName/:userId" element={<Index />} />
              <Route path="/:orgName/:userId/:tab" element={<Index />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
