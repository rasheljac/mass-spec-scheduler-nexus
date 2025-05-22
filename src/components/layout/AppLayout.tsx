
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../../contexts/AuthContext";
import Footer from "./Footer";

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
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
