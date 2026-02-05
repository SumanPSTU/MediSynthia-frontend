import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";

/**
 * OTPRouteGuard - Protects OTP verification pages
 * Prevents direct navigation to OTP pages without sending OTP first
 * 
 * Usage: <OTPRouteGuard><ForgotPassword /></OTPRouteGuard>
 */
const OTPRouteGuard = ({ children }) => {
  // Check if OTP was actually sent for password reset
  const isOTPSent = sessionStorage.getItem("otp_sent_reset");

  if (!isOTPSent) {
    // Show toast warning
    toast.error("Please request an OTP first");
    
    // Redirect to home page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OTPRouteGuard;
