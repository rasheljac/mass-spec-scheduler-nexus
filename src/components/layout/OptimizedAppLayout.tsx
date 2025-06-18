
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { useOptimizedBooking } from "../../contexts/OptimizedBookingContext";
import Footer from "./Footer";
import { Loader2 } from "lucide-react";

const OptimizedAppLayout: React.FC = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isLoading: bookingLoading } = useOptimizedBooking();
  const location = useLocation();
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Memoize activity handler to prevent recreation on every render
  const activityHandler = useCallback(() => {
    setLastActivity(Date.now());
  }, []);
  
  // Update last activity on user interactions (optimized)
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, [activityHandler]);
  
  // Auto-logout check (optimized with longer interval)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

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
    }, 30000); // Check every 30 seconds instead of 10
    
    return () => clearInterval(checkActivityInterval);
  }, [isAuthenticated, user, lastActivity, navigate]);
  
  // Handle authentication status and redirection (optimized)
  useEffect(() => {
    if (!authLoading && !initialCheckDone) {
      console.log("OptimizedAppLayout - Setting initial check as complete");
      setInitialCheckDone(true);
      
      if (location.pathname === "/" && isAuthenticated) {
        console.log("OptimizedAppLayout - Redirecting authenticated user from root to dashboard");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, location.pathname, navigate, authLoading, initialCheckDone]);
  
  // Memoize loading state
  const showLoading = useMemo(() => 
    authLoading || !initialCheckDone, 
    [authLoading, initialCheckDone]
  );
  
  // Memoize dashboard loading state
  const showDashboardLoading = useMemo(() => 
    bookingLoading && location.pathname === "/dashboard", 
    [bookingLoading, location.pathname]
  );
  
  // Show loading state if auth is still loading
  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-mslab-400" />
          <span className="text-lg text-mslab-400">Loading application...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("OptimizedAppLayout - User not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {showDashboardLoading ? (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-mslab-400" />
              <span className="text-lg text-mslab-400">Loading data...</span>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OptimizedAppLayout;
