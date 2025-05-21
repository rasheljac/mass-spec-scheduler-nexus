
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/auth/AuthModal";

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-mslab-100 p-4">
      <div className="mb-8 text-center">
        <img src="/lovable-uploads/d1df28cb-f0ae-4b17-aacf-f7e08d48d146.png" alt="MSLab Logo" className="h-16 w-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-primary">MSLab Scheduler</h1>
      </div>
      <AuthModal />
      <div className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} MSLab Scheduler. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;
