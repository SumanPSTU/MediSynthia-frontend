import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

import { Link } from "react-router-dom";
import axios from "axios";

import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaWhatsapp,
  FaHeadset,
  FaBriefcaseMedical,
  FaUserMd,
  FaHospitalAlt,
} from "react-icons/fa";

const ContactUs = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Check login status and get user data on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "null" && token !== "undefined") {
      setIsLoggedIn(true);
      // Decode JWT to get user data
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserData({
          id: payload.id,
          email: payload.email || '',
        });
      } catch (e) {
        console.warn('Could not decode token');
      }
    }
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to send a message");
      setLoading(false);
      return;
    }

    try {
      // Decode JWT to get user ID
      let userId = null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.id;
      } catch (decodeErr) {
        console.warn('Could not decode token:', decodeErr);
      }

      const payload = {
        ...form,
        userId
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/contact`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setForm({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.data.message || "Failed to send message");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send message. Please try again."
      );
      console.error("Contact form error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-gray-800 overflow-hidden">
      {/* ================= HERO ================= */}
      <section className="relative bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 text-white py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto" data-aos="fade-down">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Contact MediSynthia
          </h1>
          <p className="text-lg md:text-xl opacity-95">
            Reliable healthcare support, professional guidance, and instant
            communication.
          </p>
        </div>
      </section>

      {/* ================= QUICK CONTACT CARDS ================= */}
        <section className="py-24 px-6 md:px-20 bg-gray-50">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        { icon: <FaPhoneAlt />, title: "Call Us", text: "+880 1714-153444" },
        { icon: <FaEnvelope />, title: "Email Support", text: "support@medisynthia.com" },
        { icon: <FaMapMarkerAlt />, title: "Head Office", text: "Jatrabari, Dhaka, Bangladesh" },
        { icon: <FaClock />, title: "Service Hours", text: "Sun - Sat (7/24 Support)" },
      ].map((item, i) => (
        <div
          key={i}
          data-aos="fade-up"
          data-aos-delay={i * 100}
          className="bg-white rounded-3xl shadow-xl p-8 text-center hover:-translate-y-2 transition-all"
        >
          {/* Icon container */}
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50">
            <span className="text-4xl text-emerald-600">
              {item.icon}
            </span>
          </div>

          <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
          <p className="text-gray-600">{item.text}</p>
        </div>
      ))}
    </div>
        </section>


      {/* ================= DEPARTMENTS + FORM ================= */}
      <section className="py-28 px-6 md:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* FORM */}
          <div
            className="bg-white rounded-3xl shadow-2xl p-10"
            data-aos="fade-right"
          >
            <h2 className="text-3xl font-bold mb-8">
              Send Us a Message
            </h2>

            {success && (
              <div className="bg-emerald-100 text-emerald-700 p-4 rounded-lg mb-6">
                ✅ Message sent successfully!
              </div>
            )}

            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {!isLoggedIn ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <FaEnvelope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">You need to be logged in to send us a message</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Link
                    to="/login"
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition font-medium"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                  className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  required
                  className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                  className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your message..."
                  rows="5"
                  required
                  className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            )}
          </div>

          {/* DEPARTMENTS */}
          <div data-aos="fade-left">
            <h2 className="text-3xl font-bold mb-10">
              Contact by Department
            </h2>
            <div className="space-y-6">
              {[
                {
                  icon: <FaHeadset />,
                  title: "Customer Support",
                  desc: "Orders, payments, delivery issues",
                },
                {
                  icon: <FaBriefcaseMedical />,
                  title: "Pharmacy Desk",
                  desc: "Prescription & medicine verification",
                },
                {
                  icon: <FaUserMd />,
                  title: "Medical Experts",
                  desc: "Certified pharmacist consultation",
                },
                {
                  icon: <FaHospitalAlt />,
                  title: "Hospital Partnerships",
                  desc: "Institutional & bulk medicine services",
                },
              ].map((d, i) => (
                <div
                  key={i}
                  className="flex gap-6 bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition"
                >
                  <div className="text-3xl text-emerald-600">
                    {d.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {d.title}
                    </h3>
                    <p className="text-gray-600">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIAL CAROUSEL ================= */}
      <section className="py-24 bg-gray-50 px-6">
        <h2
          className="text-3xl font-bold text-center mb-12"
          data-aos="fade-up"
        >
          What People Say About Our Support
        </h2>

        <Carousel
          autoPlay
          infiniteLoop
          showThumbs={false}
          showStatus={false}
        >
          {[
            "Excellent support and very fast response!",
            "The pharmacist helped me choose the right medicine.",
            "Best online pharmacy customer service in Bangladesh.",
          ].map((text, i) => (
            <div key={i} className="max-w-3xl mx-auto">
              <div className="bg-white p-10 rounded-3xl shadow-xl">
                <p className="text-xl italic text-gray-700">
                  “{text}”
                </p>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ================= MAP ================= */}
            <section className="px-6 md:px-20 pb-28">
              <div
                className="rounded-3xl overflow-hidden shadow-2xl h-[420px]"
                data-aos="zoom-in"
              >
                <iframe
                  title="MediSynthia Location"
                  src="https://www.google.com/maps?q=Tony%20Tower,%20Dhaka&t=k&z=18&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </section>


      {/* ================= CTA ================= */}
      <section className="bg-gradient-to-r from-emerald-600 to-green-500 text-white py-24 text-center px-6">
        <h2 className="text-4xl font-extrabold mb-6">
          Need Medicines Right Now?
        </h2>
        <p className="max-w-2xl mx-auto mb-10 text-lg">
          Browse our verified medicines and get fast delivery to your home.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            to="/"
            className="bg-white text-emerald-600 px-10 py-4 rounded-full font-semibold hover:scale-105 transition"
          >
            Shop Medicines
          </Link>
          <Link
            to="/aboutUs"
            className="border border-white px-10 py-4 rounded-full font-semibold hover:bg-white hover:text-emerald-600 transition"
          >
            Learn More
          </Link>
        </div>

        <div className="flex justify-center gap-6 text-2xl mt-10">
          <FaFacebookF />
          <FaTwitter />
          <FaLinkedinIn />
          <FaWhatsapp />
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
