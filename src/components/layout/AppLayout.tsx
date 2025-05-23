
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { useBooking } from "../../contexts/BookingContext";
import Footer from "./Footer";
import { Loader2 } from "lucide-react";

const AppLayout: React.FC = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isLoading: bookingLoading } = useBooking();
  const location = useLocation();
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  
  // Update last activity on user interactions
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const activityHandler = () => {
      setLastActivity(Date.now());
    };
    
    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, []);
  
  // Check for auto-logout based on user's settings
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedSettings = localStorage.getItem('mslab_user_settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : { autoLogout: 30 };
      const autoLogoutTime = settings.autoLogout * 60 * 1000;
      
      const checkActivityInterval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastActivity;
        
        if (elapsedTime > autoLogoutTime) {
          console.log(`Auto logout triggered after ${settings.autoLogout} minutes of inactivity`);
          clearInterval(checkActivityInterval);
          navigate('/login', { state: { autoLogout: true } });
          window.location.reload();
        }
      }, 10000);
      
      return () => clearInterval(checkActivityInterval);
    }
  }, [isAuthenticated, user, lastActivity, navigate]);
  
  useEffect(() => {
    console.log("Auth status in AppLayout:", isAuthenticated);
    console.log("Current user:", user);
    
    // If on root path, redirect to dashboard
    if (location.pathname === "/" && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  // Show loading state if auth is still loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-mslab-400" />
          <span className="text-lg text-mslab-400">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("User is not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {bookingLoading ? (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <Loader2 className="h-10 w-10 animate-spin text-mslab-400" />
            <span className="ml-2 text-lg text-mslab-400">Loading data...</span>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
