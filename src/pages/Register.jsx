import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import { toast } from 'react-hot-toast';

const OTP_MODAL_OPEN_KEY = 'registrationOtpModalOpen';
const OTP_EMAIL_KEY = 'registrationOtpEmail';
const OTP_LOCK_UNTIL_KEY = 'registrationOtpLockUntil';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .required('Full Name is required')
    .min(3, 'Full Name must be at least 3 characters'),
  email: Yup.string().required('Email is required').email('Email is invalid'),
  phone: Yup.string()
    .required('Phone number is required')
    .matches(
      /^01\d{9}$/,
      "Phone number must be exactly 11 digits and start with '01'",
    ),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: Yup.string()
    .required('Confirm Password is required')
    .oneOf([Yup.ref('password'), null], 'Passwords must match'),
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpBorderStates, setOtpBorderStates] = useState([
    'idle',
    'idle',
    'idle',
    'idle',
    'idle',
    'idle',
  ]);
  const [isOtpResultAnimating, setIsOtpResultAnimating] = useState(false);
  const [hasAttemptedCurrentOtp, setHasAttemptedCurrentOtp] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const otpInputRefs = useRef([]);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem(OTP_EMAIL_KEY) || '';
    const savedModalOpen = localStorage.getItem(OTP_MODAL_OPEN_KEY) === 'true';
    const savedLockUntil = Number(
      localStorage.getItem(OTP_LOCK_UNTIL_KEY) || 0,
    );

    if (savedEmail) {
      setRegisteredEmail(savedEmail);
    }

    if (savedLockUntil > 0) {
      setResendAvailableAt(savedLockUntil);
      const remaining = Math.max(
        0,
        Math.ceil((savedLockUntil - Date.now()) / 1000),
      );
      setResendCooldown(remaining);
    }

    if (savedModalOpen || (savedEmail && savedLockUntil > Date.now())) {
      setIsOtpModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOtpModalOpen || !resendAvailableAt) return;

    const intervalId = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((resendAvailableAt - Date.now()) / 1000),
      );
      setResendCooldown(remaining);

      if (remaining === 0) {
        clearInterval(intervalId);
      }
    }, 1000);

    const initialRemaining = Math.max(
      0,
      Math.ceil((resendAvailableAt - Date.now()) / 1000),
    );
    setResendCooldown(initialRemaining);

    return () => clearInterval(intervalId);
  }, [isOtpModalOpen, resendAvailableAt]);

  useEffect(() => {
    localStorage.setItem(OTP_MODAL_OPEN_KEY, isOtpModalOpen ? 'true' : 'false');
  }, [isOtpModalOpen]);

  useEffect(() => {
    if (registeredEmail) {
      localStorage.setItem(OTP_EMAIL_KEY, registeredEmail);
    }
  }, [registeredEmail]);

  useEffect(() => {
    if (resendAvailableAt > 0) {
      localStorage.setItem(OTP_LOCK_UNTIL_KEY, String(resendAvailableAt));
    }
  }, [resendAvailableAt]);

  const onSubmit = async (data) => {
    const lockUntil = Number(localStorage.getItem(OTP_LOCK_UNTIL_KEY) || 0);
    if (lockUntil > Date.now()) {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setResendAvailableAt(lockUntil);
      setResendCooldown(remaining);
      setIsOtpModalOpen(true);
      toast.error(`Please wait ${remaining}s before requesting another code.`);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosClient.post('/user/register', {
        username: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone.trim(),
      });

      toast.success(response?.data?.message || 'Registration successful!', {
        position: 'top-right',
        autoClose: 2000,
      });

      const emailFromResponse =
        response?.data?.data?.email || data.email.trim();
      setRegisteredEmail(emailFromResponse);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpBorderStates(['idle', 'idle', 'idle', 'idle', 'idle', 'idle']);
      setHasAttemptedCurrentOtp(false);
      const nextAvailableAt = Date.now() + 60 * 1000;
      setResendAvailableAt(nextAvailableAt);
      setResendCooldown(60);
      setIsOtpModalOpen(true);
    } catch (error) {
      let message = 'Registration failed!';

      if (error.response) {
        // Server responded with an error (like 400, 401, etc.)
        message = error.response.data?.message || message;
      } else if (error.request) {
        // Request was made but no response (server down or no internet)
        message =
          'No response from server. Please check your connection or try again later.';
      } else {
        // Something else happened
        message = error.message;
      }

      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const animateOtpBorders = useCallback(async (state) => {
    setIsOtpResultAnimating(true);
    setOtpBorderStates(['idle', 'idle', 'idle', 'idle', 'idle', 'idle']);

    for (let i = 0; i < 6; i += 1) {
      await sleep(90);
      setOtpBorderStates((prev) => {
        const next = [...prev];
        next[i] = state;
        return next;
      });
    }

    await sleep(220);
    setIsOtpResultAnimating(false);

    if (state === 'error') {
      await sleep(250);
      setOtpBorderStates(['idle', 'idle', 'idle', 'idle', 'idle', 'idle']);
    }
  }, []);

  const handleVerifyRegistrationOtp = useCallback(async () => {
    const otpCode = otpDigits.join('');

    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    if (!registeredEmail) {
      toast.error('Registered email not found. Please register again.');
      return;
    }

    setHasAttemptedCurrentOtp(true);
    setOtpSubmitting(true);
    try {
      const response = await axiosClient.post('/user/verify-registration-otp', {
        email: registeredEmail,
        otp: otpCode,
      });

      await animateOtpBorders('success');

      toast.success(response?.data?.message || 'Email verified successfully');
      localStorage.removeItem(OTP_MODAL_OPEN_KEY);
      localStorage.removeItem(OTP_EMAIL_KEY);
      localStorage.removeItem(OTP_LOCK_UNTIL_KEY);
      setResendAvailableAt(0);
      setResendCooldown(0);
      setIsOtpModalOpen(false);
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      await animateOtpBorders('error');
      const message =
        error.response?.data?.message || 'OTP verification failed';
      toast.error(message);
    } finally {
      setOtpSubmitting(false);
    }
  }, [otpDigits, registeredEmail, navigate, animateOtpBorders]);

  useEffect(() => {
    const otpCode = otpDigits.join('');
    if (!isOtpModalOpen) return;
    if (otpCode.length !== 6) return;
    if (hasAttemptedCurrentOtp) return;
    if (otpSubmitting || isOtpResultAnimating) return;

    handleVerifyRegistrationOtp();
  }, [
    otpDigits,
    isOtpModalOpen,
    hasAttemptedCurrentOtp,
    otpSubmitting,
    isOtpResultAnimating,
    handleVerifyRegistrationOtp,
  ]);

  const handleResendRegistrationOtp = async () => {
    if (resendCooldown > 0) return;

    if (!registeredEmail) {
      toast.error('Registered email not found. Please register again.');
      return;
    }

    setOtpResending(true);
    setHasAttemptedCurrentOtp(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpBorderStates(['idle', 'idle', 'idle', 'idle', 'idle', 'idle']);
    const nextAvailableAt = Date.now() + 60 * 1000;
    setResendAvailableAt(nextAvailableAt);
    setResendCooldown(60);
    try {
      const response = await axiosClient.post('/user/resend-registration-otp', {
        email: registeredEmail,
      });
      toast.success(response?.data?.message || 'OTP resent successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
    } finally {
      setOtpResending(false);
    }
  };

  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(1, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = cleanValue;
    setOtpDigits(nextDigits);
    setHasAttemptedCurrentOtp(false);
    setOtpBorderStates(['idle', 'idle', 'idle', 'idle', 'idle', 'idle']);

    if (cleanValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (index, event) => {
    event.preventDefault();

    const pastedText = event.clipboardData.getData('text');
    const pastedDigits = pastedText.replace(/\D/g, '').slice(0, 6);

    if (!pastedDigits) return;

    const nextDigits = [...otpDigits];
    for (let i = 0; i < pastedDigits.length && index + i < 6; i += 1) {
      nextDigits[index + i] = pastedDigits[i];
    }

    setOtpDigits(nextDigits);
    setHasAttemptedCurrentOtp(false);
    setOtpBorderStates(['idle', 'idle', 'idle', 'idle', 'idle', 'idle']);

    const focusIndex = Math.min(index + pastedDigits.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (otpDigits[index]) {
        const nextDigits = [...otpDigits];
        nextDigits[index] = '';
        setOtpDigits(nextDigits);
        return;
      }

      if (index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const getOtpBoxClass = (state) => {
    if (state === 'success') {
      return 'border-green-500 ring-2 ring-green-300';
    }

    if (state === 'error') {
      return 'border-red-500 ring-2 ring-red-300';
    }

    return 'border-emerald-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-300';
  };

  return (
    <div className="flex items-center justify-center py-20 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 animate-gradient-x">
      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Illustration */}
        <div className="md:flex-1 hidden md:flex flex-col items-center justify-center p-10 bg-emerald-700">
          <h1 className="text-4xl font-bold text-white mb-4 text-center">
            Join MediSynthia
          </h1>
          <p className="text-white mb-6 text-center">
            Sign up to enjoy seamless access to genuine medicines, wellness
            products, and exclusive offers.
          </p>
          <img
            src="/assets/l.png"
            alt="Medicines Illustration"
            className="rounded-xl shadow-lg"
          />
        </div>

        {/* Right Form */}
        <div className="md:flex-1 p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Register
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <div className="relative">
                <input
                  type="text"
                  {...register('fullName')}
                  placeholder="Full Name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="name"
                  aria-invalid={errors.fullName ? 'true' : 'false'}
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
                  {...register('email')}
                  placeholder="Email Address"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="email"
                  aria-invalid={errors.email ? 'true' : 'false'}
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
                  {...register('phone')}
                  placeholder="Phone Number"
                  maxLength={11}
                  onInput={(e) => {
                    e.target.value = e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 11);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="tel"
                  aria-invalid={errors.phone ? 'true' : 'false'}
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
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Password"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="new-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
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
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Confirm Password"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.confirmPassword
                      ? 'border-red-500'
                      : 'border-gray-300'
                  } bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby="confirmPassword-error"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  aria-label={
                    showConfirm
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                {errors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="text-red-600 text-sm mt-1"
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg transform transition ${
                  loading
                    ? 'bg-emerald-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105'
                }`}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <hr className="flex-1 border-gray-300" />
              <span className="mx-2 text-gray-400">or</span>
              <hr className="flex-1 border-gray-300" />
            </div>

            <p className="text-center text-gray-700 mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-emerald-600 font-semibold hover:underline"
              >
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

      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/45 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 p-7">
            <h3 className="text-2xl font-bold text-emerald-800 text-center">
              Verify OTP
            </h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              Enter 6 digit otp to verify
            </p>

            <form
              onSubmit={handleVerifyRegistrationOtp}
              className="mt-6 space-y-4"
            >
              <div className="flex items-center justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={(e) => handleOtpPaste(index, e)}
                    disabled={otpSubmitting || isOtpResultAnimating}
                    className={`w-11 h-12 text-center rounded-xl border bg-white outline-none font-semibold text-lg transition-all duration-200 ${getOtpBoxClass(
                      otpBorderStates[index],
                    )}`}
                  />
                ))}
              </div>

              <p className="text-sm text-gray-700 text-center font-medium">
                Time left: {formatCountdown(resendCooldown)}
              </p>
              {otpSubmitting && (
                <p className="text-sm text-emerald-700 text-center font-medium">
                  Verifying code...
                </p>
              )}
            </form>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600 font-medium">
                  Don't received OTP?
                </p>
                <button
                  type="button"
                  onClick={handleResendRegistrationOtp}
                  disabled={otpResending || resendCooldown > 0}
                  className={`text-sm font-semibold transition ${
                    resendCooldown > 0 || otpResending
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  {otpResending ? 'Resending...' : 'Resend'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
