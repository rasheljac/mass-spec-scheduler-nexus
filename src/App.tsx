
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BookingProvider } from "./contexts/BookingContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import InstrumentsPage from "./pages/InstrumentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BookingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/instruments" element={<InstrumentsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BookingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
