
import React from "react";
import { Routes, Route } from "react-router-dom";
import { BookingProvider } from "./contexts/BookingContext";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import InstrumentsPage from "./pages/InstrumentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import "./App.css";
import Index from "./pages/Index";
import { Toaster } from "./components/ui/sonner";
import { supabase } from "./integrations/supabase/client";

function App() {
  // Move the Supabase check inside the component function
  React.useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          console.error('Supabase connection error:', error);
        } else {
          console.log('Supabase connected successfully');
        }
      } catch (e) {
        console.error('Supabase initialization error:', e);
      }
    };
    
    checkSupabase();
  }, []);

  return (
    <AuthProvider>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/instruments" element={<InstrumentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
