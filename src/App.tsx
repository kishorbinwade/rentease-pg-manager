import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import AllTenants from "./pages/AllTenants";
import PastTenants from "./pages/PastTenants";
import Rent from "./pages/Rent";
import Complaints from "./pages/Complaints";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/rooms" element={
              <ProtectedRoute requireAdmin>
                <Rooms />
              </ProtectedRoute>
            } />
            <Route path="/tenants" element={
              <ProtectedRoute requireAdmin>
                <Tenants />
              </ProtectedRoute>
            } />
            <Route path="/all-tenants" element={
              <ProtectedRoute requireAdmin>
                <AllTenants />
              </ProtectedRoute>
            } />
            <Route path="/past-tenants" element={
              <ProtectedRoute requireAdmin>
                <PastTenants />
              </ProtectedRoute>
            } />
            <Route path="/rent" element={
              <ProtectedRoute requireAdmin>
                <Rent />
              </ProtectedRoute>
            } />
            <Route path="/complaints" element={
              <ProtectedRoute>
                <Complaints />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
