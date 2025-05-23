
import React, { useEffect, useState } from "react";
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
import { toast } from "sonner";

function App() {
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [supabaseError, setSupabaseError] = useState(false);
  
  // Check Supabase connection on app initialization
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        console.log("Checking Supabase connection");
        // Just check if Supabase is accessible
        const { error } = await supabase.from('profiles').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {  // PGRST116 is 'JWT role claim invalid' which is normal when not logged in
          console.error('Supabase connection error:', error);
          toast.error('Failed to connect to database');
          setSupabaseError(true);
        } else {
          console.log('Supabase connected successfully');
          setSupabaseReady(true);
        }
      } catch (e) {
        console.error('Supabase initialization error:', e);
        toast.error('Database initialization error');
        setSupabaseError(true);
      }
    };
    
    checkSupabase();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (!supabaseReady && !supabaseError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-mslab-400 border-t-transparent"></div>
          <span className="text-lg text-mslab-400">Connecting to database...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BookingProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster richColors />
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
