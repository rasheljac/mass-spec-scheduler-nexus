
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/auth/AuthModal";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2 } from "lucide-react";

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAutoLogoutAlert, setShowAutoLogoutAlert] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  // Get the redirect path from location state, or default to dashboard
  const from = (location.state as { from?: string })?.from || "/dashboard";
  const autoLogout = (location.state as { autoLogout?: boolean })?.autoLogout || false;
  
  // Show auto-logout message if applicable
  useEffect(() => {
    if (autoLogout) {
      setShowAutoLogoutAlert(true);
      // Hide the alert after 5 seconds
      const timer = setTimeout(() => setShowAutoLogoutAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [autoLogout]);
  
  // Effect to handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("User is authenticated, redirecting to:", from);
      navigate(from, { replace: true });
      setRedirectAttempted(true);
    }
  }, [isAuthenticated, from, navigate, isLoading]);

  console.log("Auth loading state:", isLoading, "isAuthenticated:", isAuthenticated);

  // Redirect to dashboard if already authenticated
  if (isAuthenticated && !isLoading && !redirectAttempted) {
    console.log("User is already authenticated on initial render, redirecting to:", from);
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-mslab-100 p-4">
      {showAutoLogoutAlert && (
        <div className="absolute top-4 w-full max-w-md">
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertDescription>
              You have been automatically logged out due to inactivity.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="mb-8">
        <div className="mx-auto w-16 h-16 mb-4">
          <img 
            src="/lovable-uploads/d1df28cb-f0ae-4b17-aacf-f7e08d48d146.png" 
            alt="MSLab Logo" 
            className="h-full w-full object-contain" 
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-mslab-400" />
          <span className="text-mslab-400">Checking authentication...</span>
        </div>
      ) : (
        <AuthModal />
      )}
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} MSLab Scheduler. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;
