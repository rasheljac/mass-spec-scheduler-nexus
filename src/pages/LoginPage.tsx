
import React, { useEffect } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/auth/AuthModal";

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, or default to dashboard
  const from = (location.state as { from?: string })?.from || "/";
  
  // Effect to handle authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    console.log("User is already authenticated on initial render, redirecting to:", from);
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-mslab-100 p-4">
      <div className="mb-8">
        <div className="mx-auto w-16 h-16 mb-4">
          <img 
            src="/lovable-uploads/d1df28cb-f0ae-4b17-aacf-f7e08d48d146.png" 
            alt="MSLab Logo" 
            className="h-full w-full object-contain" 
          />
        </div>
      </div>
      <AuthModal />
      <div className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} MSLab Scheduler. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;
