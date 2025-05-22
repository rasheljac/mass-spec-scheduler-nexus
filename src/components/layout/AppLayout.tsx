
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../../contexts/AuthContext";
import Footer from "./Footer";

const AppLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  
  // Update last activity on user interactions
  useEffect(() => {
    // Event types to track
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Handler for any activity
    const activityHandler = () => {
      setLastActivity(Date.now());
    };
    
    // Add activity listeners
    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });
    
    // Clean up listeners on unmount
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, []);
  
  // Check for auto-logout based on user's settings
  useEffect(() => {
    if (isAuthenticated && user) {
      // Get user settings from localStorage
      const savedSettings = localStorage.getItem('mslab_user_settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : { autoLogout: 30 };
      
      // Convert minutes to milliseconds
      const autoLogoutTime = settings.autoLogout * 60 * 1000;
      
      // Set interval to check for inactivity
      const checkActivityInterval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastActivity;
        
        // Log out if inactive for longer than the set time
        if (elapsedTime > autoLogoutTime) {
          console.log(`Auto logout triggered after ${settings.autoLogout} minutes of inactivity`);
          // Clear the interval before logging out
          clearInterval(checkActivityInterval);
          // Logout the user
          navigate('/login', { state: { autoLogout: true } });
          window.location.reload(); // Force reload to ensure auth state is reset
        }
      }, 10000); // Check every 10 seconds
      
      // Clean up interval on unmount
      return () => clearInterval(checkActivityInterval);
    }
  }, [isAuthenticated, user, lastActivity, navigate]);
  
  useEffect(() => {
    // Log authentication status when it changes
    console.log("Auth status in AppLayout:", isAuthenticated);
    console.log("Current user:", user);
    
    // If on root path, redirect to dashboard
    if (location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  if (!isAuthenticated) {
    console.log("User is not authenticated, redirecting to login");
    // Save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
