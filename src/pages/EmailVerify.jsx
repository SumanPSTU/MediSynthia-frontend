import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EmailVerify() {
  const { id, token } = useParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axiosClient.get(`/user/${id}/verify/${token}`);
        toast.success("Email verified successfully!", {
          autoClose: 2000,
        });
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        toast.error("Email verification failed", {
          autoClose: 3000,
        });
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [id, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer />
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        {loading ? (
          <p>Verifying your email...</p>
        ) : success ? (
          <p>Your email has been successfully verified! Redirecting to login...</p>
        ) : (
          <p>Verification failed. The link may be invalid or expired.</p>
        )}
      </div>
    </div>
  );
}

export default EmailVerify;
