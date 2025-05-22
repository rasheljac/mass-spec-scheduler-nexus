
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../../contexts/AuthContext";
import Footer from "./Footer";

const AppLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Log authentication status when it changes
    console.log("Auth status in AppLayout:", isAuthenticated);
    console.log("Current user:", user);
  }, [isAuthenticated, user]);

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
