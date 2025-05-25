
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
import MyBookingsPage from "./pages/MyBookingsPage";
import "./App.css";
import Index from "./pages/Index";
import { Toaster } from "./components/ui/sonner";
import { supabase } from "./integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "./components/ui/button";

function App() {
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [supabaseError, setSupabaseError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Function to check Supabase connection
  const checkSupabase = async () => {
    try {
      setIsRetrying(true);
      console.log("Checking Supabase connection");
      // Just check if Supabase is accessible
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error && error.code !== 'PGRST116') {  // PGRST116 is 'JWT role claim invalid' which is normal when not logged in
        console.error('Supabase connection error:', error);
        toast.error('Failed to connect to database');
        setSupabaseError(true);
        setSupabaseReady(false);
      } else {
        console.log('Supabase connected successfully');
        setSupabaseReady(true);
        setSupabaseError(false);
        
        // If we were previously in error state, show success message
        if (supabaseError) {
          toast.success('Connection restored successfully');
        }
      }
    } catch (e) {
      console.error('Supabase initialization error:', e);
      toast.error('Database initialization error');
      setSupabaseError(true);
      setSupabaseReady(false);
    } finally {
      setIsRetrying(false);
    }
  };
  
  // Check Supabase connection on app initialization
  useEffect(() => {
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
          <Loader2 className="h-10 w-10 animate-spin text-mslab-400" />
          <span className="text-lg text-mslab-400">Connecting to database...</span>
        </div>
      </div>
    );
  }
  
  if (supabaseError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-6 max-w-md p-8 border rounded-lg shadow-lg">
          <AlertTriangle className="h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-center">Connection Error</h1>
          <p className="text-center text-gray-600">
            We're having trouble connecting to the database. This could be due to:
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>Network connectivity issues</li>
            <li>The database server is temporarily unavailable</li>
            <li>Your internet connection is unstable</li>
          </ul>
          <Button 
            onClick={checkSupabase} 
            disabled={isRetrying} 
            className="w-full mt-4"
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : "Retry Connection"}
          </Button>
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
            <Route path="/my-bookings" element={<MyBookingsPage />} />
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
