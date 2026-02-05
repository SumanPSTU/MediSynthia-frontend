import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PrivateRoute - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 * Shows loading state while checking authentication status
 * 
 * Usage: <PrivateRoute><ProfilePage /></PrivateRoute>
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();

  // Show loading while auth is being initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
