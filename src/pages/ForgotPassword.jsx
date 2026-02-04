import React, { useState } from "react";
import { Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Mail, Lock, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // OTP input handling
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const newOtp = otp.split("");
    newOtp[index] = value;
    const updatedOtp = newOtp.join("");
    setOtp(updatedOtp);
    
    // Auto-focus next input
    if (value && e.target.nextSibling) {
      e.target.nextSibling.focus();
    }
  };
  
  // Handle backspace
  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      const prevInput = e.target.previousSibling;
      if (prevInput) {
        prevInput.focus();
        const newOtp = otp.split("");
        newOtp[index - 1] = "";
        setOtp(newOtp.join(""));
      }
    }
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post("/user/forget", { email: email.trim() });
      toast.success(res.data.message || "OTP sent to your email!");
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to send OTP";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post(`/user/verifyotp/${encodeURIComponent(email)}`, { otp });
      toast.success(res.data.message || "OTP verified successfully!");
      setStep(3);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Invalid or expired OTP";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    try {
      const res = await axiosClient.post("/user/forget", { email: email.trim() });
      toast.success(res.data.message || "OTP resent successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to resend OTP";
      toast.error(errorMsg);
    } finally {
      setResending(false);
    }
  };

  // Step 3: Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    if (!confirmPassword) {
      toast.error("Please confirm your password");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post(`/user/changepass/${encodeURIComponent(email)}`, {
        password: newPassword,
        confirmPassword: confirmPassword
      });
      toast.success(res.data.message || "Password changed successfully!");
      setStep(4);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to change password";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Go to login
  const handleGoToLogin = () => {
    navigate("/login");
  };

  // Go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="flex items-center justify-center py-20 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 animate-gradient-x">
      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Illustration */}
        <div className="md:flex-1 hidden md:flex flex-col items-center justify-center p-10 bg-emerald-700">
          <h1 className="text-4xl font-bold text-white mb-4 text-center">Reset Password</h1>
          <p className="text-white mb-6 text-center">
            No worries! Enter your email and we'll help you reset your password.
          </p>
          <img src="/assets/l.png" alt="Password Reset Illustration" className="rounded-xl shadow-lg" />
        </div>

        {/* Right Form */}
        <div className="md:flex-1 p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((stepNum) => (
                <React.Fragment key={stepNum}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= stepNum
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {step > stepNum ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 rounded transition-all ${
                        step > stepNum ? "bg-emerald-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "New Password"}
              {step === 4 && "Success!"}
            </h2>
            
            <p className="text-gray-600 text-center mb-8">
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && `Enter the 6-digit code sent to ${email}`}
              {step === 3 && "Enter your new password"}
              {step === 4 && "Your password has been reset successfully"}
            </p>

            {/* Step 1: Email Form */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg transform transition flex items-center justify-center gap-2 ${
                    loading
                      ? "bg-emerald-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send OTP <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index] || ""}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                      placeholder="-"
                    />
                  ))}
                </div>

                {otp.length > 0 && otp.length < 6 && (
                  <p className="text-center text-sm text-gray-500">
                    Enter all 6 digits
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
                  >
                    <ArrowLeft className="w-5 h-5 inline mr-2" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className={`flex-1 text-white font-semibold py-3 rounded-xl shadow-lg transform transition flex items-center justify-center gap-2 ${
                      loading || otp.length !== 6
                        ? "bg-emerald-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                      {resending ? "Sending..." : "Resend OTP"}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min. 8 characters)"
                    className="w-full px-4 py-3 pl-12 pr-12 rounded-xl border border-gray-300 bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full px-4 py-3 pl-12 pr-12 rounded-xl border border-gray-300 bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? "text-green-600" : ""}`}>
                      <CheckCircle className={`w-4 h-4 ${newPassword.length >= 6 ? "opacity-100" : "opacity-30"}`} />
                      At least 6 characters
                    </li>
                    <li className={`flex items-center gap-2 ${newPassword === confirmPassword && confirmPassword ? "text-green-600" : ""}`}>
                      <CheckCircle className={`w-4 h-4 ${newPassword === confirmPassword && confirmPassword ? "opacity-100" : "opacity-30"}`} />
                      Passwords match
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
                  >
                    <ArrowLeft className="w-5 h-5 inline mr-2" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 text-white font-semibold py-3 rounded-xl shadow-lg transform transition flex items-center justify-center gap-2 ${
                      loading
                        ? "bg-emerald-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Password Reset Complete!</span>
                  </div>
                  <p className="text-green-600 text-sm">
                    Your password has been successfully changed. You can now login with your new password.
                  </p>
                </div>

                <button
                  onClick={handleGoToLogin}
                  className="w-full text-white font-semibold py-3 rounded-xl shadow-lg transform transition flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
                >
                  Go to Login <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Back to Login Link */}
            {step !== 4 && (
              <p className="text-center text-gray-700 mt-6">
                Remember your password?{" "}
                <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                  Login
                </Link>
              </p>
            )}

            {/* Help Card */}
            {step === 1 && (
              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Having trouble?</p>
                    <p>Make sure you enter the email address you used during registration. If the email doesn't arrive, check your spam folder.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animated gradient background */}
      <style>{`
        @keyframes gradient-x {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 10s ease infinite;
        }
      `}</style>
    </div>
  );
}

