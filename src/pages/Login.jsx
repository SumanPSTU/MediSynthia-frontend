import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosClient from "../api/axiosClient";
import { setupTokenRefresh, clearTokenRefresh } from "../utils/tokenManager";
import { useAuth } from "../context/AuthContext.jsx";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

// Yup validation schema
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .required("Email is required")
    .email("Email is invalid"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

const onSubmit = async (data) => {
  setLoading(true);
  try {
    const res = await axiosClient.post("/user/login", {
      email: data.email.trim(),
      password: data.password,
    });

    // Check if login was successful
    if (!res.data.success) {
      toast.error(res.data.message || "Login failed!");
      setLoading(false);
      return;
    }

    const { accessToken, refreshToken, message } = res.data;

    // Validate tokens exist
    if (!accessToken || !refreshToken) {
      toast.error("Invalid response from server");
      setLoading(false);
      return;
    }

    // Use auth context to login
    login({ accessToken, refreshToken, email: data.email.trim() });

    // Setup automatic token refresh
    setupTokenRefresh(() => {
      axiosClient.post("/user/refresh-token", {
        refreshToken: localStorage.getItem("refreshToken")
      }).catch(() => {
        clearTokenRefresh();
        navigate("/login");
      });
    });

    toast.success(message || "Login successful!");

    // Redirect to home with replace to prevent back button issues
    setTimeout(() => navigate("/", { replace: true }), 1500);

  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Login failed!";
    toast.error(errorMsg);
    console.error("Login error:", err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center py-20 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 animate-gradient-x">
      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Illustration */}
        <div className="md:flex-1 hidden md:flex flex-col items-center justify-center p-10 bg-emerald-700">
          <h1 className="text-4xl font-bold text-white mb-4 text-center">Welcome to MediSynthia</h1>
          <p className="text-white mb-6 text-center">
            Your one-stop online pharmacy for genuine medicines, wellness, and baby care products.
          </p>
          <img src="/assets/l.png" alt="Medicines Illustration" className="rounded-xl shadow-lg" />
        </div>

        {/* Right Form */}
        <div className="md:flex-1 p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  {...register("email")}
                  placeholder="Enter your email address (e.g., user@example.com)"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.email ? "border-red-500" : "border-gray-300"
                    } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password (min. 8 characters)"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.password ? "border-red-500" : "border-gray-300"
                    } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-emerald-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg transform transition ${loading
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
                  }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <hr className="flex-1 border-gray-300" />
              <span className="mx-2 text-gray-400">or</span>
              <hr className="flex-1 border-gray-300" />
            </div>

            {/* Register Link */}
            <p className="text-center text-gray-700 mt-6">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Background animation */}
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