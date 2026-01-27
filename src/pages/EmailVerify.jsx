import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

function EmailVerify() {
  const location = useLocation();
  const { token: tokenFromParams } = useParams();
  const navigate = useNavigate();

  // Extract token from URL if useParams fails
  const tokenFromUrl = location.pathname.split("/verify/")[1];
  const token = tokenFromParams || tokenFromUrl;

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [data, setData] = useState(null);


  const verifyEmail = async () => {
    try {
      const res = await axiosClient.post(
        "user/verify",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(res.data);
      setSuccess(true);
      toast.success("✨ Email verified successfully!", { autoClose: 2000 });
      setTimeout(() => navigate("/login"), 2500);

    } catch (err) {
      setSuccess(false);
      toast.error("Verification failed. Please try again.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dfe9f3] to-[#ffffff]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-10 w-[90%] max-w-md text-center transition-all duration-500 transform hover:scale-[1.02]"
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-300 blur-xl absolute opacity-30"></div>
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-inner">
              {loading && (
                <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              {!loading && success && (
                <CheckCircleIcon className="w-12 h-12 text-green-500" />
              )}
              {!loading && success === false && (
                <XCircleIcon className="w-12 h-12 text-red-500 animate-pulse" />
              )}
            </div>
          </div>

          {loading && (
            <>
              <h2 className="text-xl font-semibold text-gray-700 animate-pulse">
                Verifying your email
              </h2>
              <p className="text-gray-500 text-sm">
                Please wait a moment while we confirm your account.
              </p>
            </>
          )}

          {!loading && success && (
            <>
              <h2 className="text-2xl font-semibold text-gray-800">
                Email Verified 🎉
              </h2>
              <p className="text-gray-500 text-sm">
                You’ll be redirected to login shortly.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-3 px-6 py-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-medium shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                Go to Login
              </button>
            </>
          )}

          {!loading && success === false && (
            <>
              <h2 className="text-2xl font-semibold text-gray-800">
                Verification Failed 😔
              </h2>
              <p className="text-gray-500 text-sm">
                This link may have expired or already been used.
              </p>
              <button
                onClick={() => navigate("/resend-verification")}
                className="mt-3 px-6 py-2 rounded-full bg-gradient-to-r from-rose-400 to-red-400 text-white font-medium shadow-md hover:shadow-lg hover:from-rose-500 hover:to-red-500 transition-all"
              >
                Resend Verification Email
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default EmailVerify;
