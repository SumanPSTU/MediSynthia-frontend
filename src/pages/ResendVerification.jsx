import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";
import { EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

function ResendVerification() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address", { autoClose: 2000 });
      return;
    }

    setLoading(true);
    try {
      // First, attempt to get the verification token from localStorage
      const verificationToken = localStorage.getItem("verificationToken");
      
      if (!verificationToken) {
        toast.error("Verification token not found. Please register again.", { autoClose: 3000 });
        setTimeout(() => navigate("/register"), 2000);
        setLoading(false);
        return;
      }

      const res = await axiosClient.post(
        "/user/resendverify",
        {},
        {
          headers: {
            Authorization: `Bearer ${verificationToken}`,
          },
        }
      );

      setSent(true);
      toast.success("✅ Verification email resent successfully!", { autoClose: 2000 });
      setTimeout(() => navigate("/login"), 3000);

    } catch (error) {
      const message = error.response?.data?.message || "Failed to resend verification email";
      toast.error(message, { autoClose: 3000 });
      
      // If token expired or invalid, redirect to register
      if (error.response?.status === 400 || error.response?.status === 401) {
        setTimeout(() => navigate("/register"), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dfe9f3] to-[#ffffff]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-10 w-[90%] max-w-md transition-all duration-500 transform hover:scale-[1.02]"
      >
        <button
          onClick={() => navigate("/register")}
          className="flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Register
        </button>

        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-300 blur-xl absolute opacity-30"></div>
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-inner">
              <EnvelopeIcon className="w-10 h-10 text-indigo-500" />
            </div>
          </div>

          {!sent ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 text-center">
                Resend Verification Email
              </h2>
              <p className="text-gray-500 text-sm text-center">
                Enter your email address and we'll resend your verification email.
              </p>

              <form onSubmit={handleResend} className="w-full space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-medium text-white transition-all transform ${
                    loading
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95"
                  }`}
                >
                  {loading ? "Sending..." : "Resend Verification Email"}
                </button>
              </form>

              <p className="text-gray-500 text-xs text-center">
                Check your spam folder if you don't receive the email within a few minutes.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 text-center">
                Email Sent! 🎉
              </h2>
              <p className="text-gray-500 text-sm text-center">
                We've resent the verification email to <strong>{email}</strong>
              </p>
              <p className="text-gray-500 text-xs text-center">
                You'll be redirected to login shortly.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-medium shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ResendVerification;
