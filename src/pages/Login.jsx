import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosClient from "../api/axiosClient";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Send Google token to backend for verification and user creation
      const res = await axiosClient.post("/user/google-auth", {
        idToken,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });

      if (res.data?.success && res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        toast.success("Login successful!", { autoClose: 2000 });
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Google login failed";
      toast.error(message, { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

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

    const { accessToken, refreshToken, message } = res.data;

    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    toast.success(message);

    setTimeout(() => navigate("/"), 1500);

  } catch (err) {
    const message = err.response?.data?.message || "Login failed!";
    toast.error(message);
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

            {/* Google login */}
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-xl hover:shadow-lg transition disabled:opacity-50"
              >
                <FcGoogle className="w-5 h-5" /> Google
              </button>
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