
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { toast } from "react-hot-toast";

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .required("Full Name is required")
    .min(3, "Full Name must be at least 3 characters"),
  email: Yup.string()
    .required("Email is required")
    .email("Email is invalid"),
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^01\d{9}$/, "Phone number must be exactly 11 digits and start with '01'"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: Yup.string()
    .required("Confirm Password is required")
    .oneOf([Yup.ref("password"), null], "Passwords must match"),
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // to track for resending


  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axiosClient.post("/user/register", {
        username: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone.trim(),
      });

      toast.success("Registration successful!", {
        position: "top-right",
        autoClose: 2000,
      });

      // Store the verification token for resending verification email
      if (response.data.data && response.data.data.token) {
        localStorage.setItem("verificationToken", response.data.data.token);
      }

      setEmailSent(true);
      setUserEmail(data.email.trim());

    } catch (error) {
      let message = "Registration failed!";

      if (error.response) {
        // Server responded with an error (like 400, 401, etc.)
        message = error.response.data?.message || message;
      } else if (error.request) {
        // Request was made but no response (server down or no internet)
        message = "No response from server. Please check your connection or try again later.";
      } else {
        // Something else happened
        message = error.message;
      }

      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-20 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 animate-gradient-x">
      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Illustration */}
        <div className="md:flex-1 hidden md:flex flex-col items-center justify-center p-10 bg-emerald-700">
          <h1 className="text-4xl font-bold text-white mb-4 text-center">Join MediCare</h1>
          <p className="text-white mb-6 text-center">
            Sign up to enjoy seamless access to genuine medicines, wellness products, and exclusive offers.
          </p>
          <img src="/assets/l.png" alt="Medicines Illustration" className="rounded-xl shadow-lg" />
        </div>

        {/* Right Form */}
        <div className="md:flex-1 p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Register</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <div className="relative">
                <input
                  type="text"
                  {...register("fullName")}
                  placeholder="Full Name"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? "border-red-500" : "border-gray-300"
                    } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="name"
                  aria-invalid={errors.fullName ? "true" : "false"}
                  aria-describedby="fullName-error"
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-red-600 text-sm mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  {...register("email")}
                  placeholder="Email Address"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.email ? "border-red-500" : "border-gray-300"
                    } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="email"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby="email-error"
                />
                {errors.email && (
                  <p id="email-error" className="text-red-600 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="relative">
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="Phone Number"
                  maxLength={11}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? "border-red-500" : "border-gray-300"
                    } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="tel"
                  aria-invalid={errors.phone ? "true" : "false"}
                  aria-describedby="phone-error"
                />
                {errors.phone && (
                  <p id="phone-error" className="text-red-600 text-sm mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Password"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.password ? "border-red-500" : "border-gray-300"
                    } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="new-password"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.password && (
                  <p id="password-error" className="text-red-600 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Confirm Password"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                  aria-describedby="confirmPassword-error"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-red-600 text-sm mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg transform transition ${loading
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
                  }`}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>

            {emailSent && (
              <div className="mt-6 bg-emerald-100 p-4 rounded-xl text-center text-emerald-800 border border-emerald-300">
                <p>
                  ✅ A verification email has been sent to <strong>{userEmail}</strong>.
                </p>
                <p className="mt-2">
                  Didn't receive it?{" "}
                  <button
                    className="text-emerald-600 font-semibold hover:underline"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("verificationToken");
                        await axiosClient.post(
                          "/user/resendverify",
                          {},
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );
                        toast.success("Verification email resent", {
                          position: "top-right",
                          autoClose: 2000,
                        });
                      } catch (error) {
                        toast.error("Failed to resend verification email", {
                          position: "top-right",
                          autoClose: 3000,
                        });
                      }
                    }}
                  >
                    Resend
                  </button>
                </p>
              </div>
            )}

            {/* Redirect to login */}
            <p className="text-center text-gray-700 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                Login
              </Link>
            </p>
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

