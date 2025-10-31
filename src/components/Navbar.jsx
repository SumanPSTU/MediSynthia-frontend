import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";
import UploadPrescriptionModal from "./UploadPrescriptionModal";

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);

  const navigate = useNavigate();

  // Directly check token from localStorage on every render
  const token = localStorage.getItem("token");
  const isLoggedIn = (token && token !== "null" && token !== "undefined");

  // Default avatar
  const defaultAvatar = "https://i.pravatar.cc/40?img=68";

  // ✅ Fetch categories from backend
  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await axiosClient.get("/category");
      if (res?.data?.success) {
        setCategories(res.data.categories || []);
      } else {
        toast.error(res?.data?.message || "Failed to load categories");
        setCategories([]);
      }
    } catch (err) {
      console.error("Navbar category fetch error:", err);
      toast.error("Error fetching categories");
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Navbar height variable (used for layout offset)
  useEffect(() => {
    const setNavbarHeight = () => {
      const el = document.getElementById("site-navbar");
      if (el) {
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${el.offsetHeight}px`
        );
      }
    };
    setNavbarHeight();
    window.addEventListener("resize", setNavbarHeight);
    return () => window.removeEventListener("resize", setNavbarHeight);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.elements.search?.value?.trim();
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  const onUploadSuccess = (prescription) => {
    console.log("uploaded prescription:", prescription);
  };

  const userImage = defaultAvatar; // for demo

  return (
    <nav
      id="site-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md"
    >
      {/* ---------- DESKTOP ---------- */}
      <div className="hidden md:block border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-2xl font-extrabold text-emerald-600 hover:opacity-90"
            >
              MediCare
            </Link>
            <span className="text-sm text-gray-500 hidden lg:inline">
              Trusted pharmacy & health store
            </span>
          </div>

          {/* Search */}
          <div className="flex-1">
            <form
              onSubmit={handleSearch}
              className="flex items-center max-w-3xl mx-auto"
            >
              <input
                name="search"
                type="search"
                placeholder="Search medicines, symptoms or brands..."
                className="w-full px-4 py-2 border border-gray-200 rounded-l-full focus:ring-2 focus:ring-emerald-300 outline-none shadow-sm"
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 rounded-r-full bg-emerald-600 hover:bg-emerald-700 text-white transition"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              Upload Prescription
            </button>

            <Link
              to="/cart"
              className="relative p-2 rounded-md hover:bg-gray-100"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                3
              </span>
            </Link>

            {/* Desktop */}
            {isLoggedIn ? (
              <button className="p-0">
                <img
                  src={defaultAvatar}
                  alt="profile"
                  className="w-9 h-9 rounded-full border-2 border-emerald-600 object-cover"
                />
              </button>
            ) : (
              <Link
                to="/login"
                className="px-5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition text-base font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Categories row */}
        <div className="bg-emerald-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3 justify-center">
            {loadingCats ? (
              <span className="text-gray-500 text-sm">Loading categories...</span>
            ) : categories.length === 0 ? (
              <span className="text-gray-500 text-sm">No categories</span>
            ) : (
              categories.map((cat) => (
                <div key={cat._id} className="relative group">
                  <Link
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-emerald-100 transition text-sm font-medium"
                  >
                    <span>{cat.name}</span>
                    {cat.subcategories?.length ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : null}
                  </Link>

                  {cat.subcategories?.length ? (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all">
                      <div className="py-2">
                        {cat.subcategories.map((s, i) => (
                          <Link
                            key={i}
                            to={`/products?category=${encodeURIComponent(
                              cat.name
                            )}&sub=${encodeURIComponent(s)}`}
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            {s}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ---------- MOBILE ---------- */}
      <div className="md:hidden border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setMobileMenu(true)}>
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <Link to="/" className="text-lg font-bold text-emerald-600">
            MediCare
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                2
              </span>
            </Link>

            {/* Mobile */}
            {isLoggedIn ?
              (
                <Link
                  to="/login"
                  className="w-full px-3 py-1 rounded-md bg-emerald-600 text-white text-center hover:bg-emerald-700 transition text-base font-medium"
                >
                  Login
                </Link>
              ) : (
                <img
                  src={defaultAvatar}
                  alt="profile"
                  className="w-8 h-8 rounded-full border-2 border-emerald-600 object-cover"
                />
              )}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearch} className="flex">
            <input
              name="search"
              type="search"
              placeholder="Search medicines..."
              className="w-full px-4 py-2 border border-gray-200 rounded-l-full focus:ring-2 focus:ring-emerald-300 outline-none"
            />
            <button
              type="submit"
              className="ml-2 px-4 py-2 rounded-r-full bg-emerald-600 text-white"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ---------- MOBILE SIDEBAR ---------- */}
      {
        mobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
              onClick={() => setMobileMenu(false)}
            />
            <aside className="fixed top-0 left-0 w-72 h-full bg-white shadow-lg z-50 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-emerald-600">Menu</h2>
                <button onClick={() => setMobileMenu(false)}>
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              <button
                onClick={() => {
                  setShowUploadModal(true);
                  setMobileMenu(false);
                }}
                className="w-full px-3 py-2 mb-3 rounded-md bg-emerald-600 text-white text-center hover:bg-emerald-700"
              >
                Upload Prescription
              </button>

              <nav>
                {loadingCats ? (
                  <p className="text-gray-500 text-sm">Loading categories...</p>
                ) : categories.length === 0 ? (
                  <p className="text-gray-500 text-sm">No categories available</p>
                ) : (
                  categories.map((cat) => {
                    const open = expandedCategory === cat._id;
                    return (
                      <div key={cat._id} className="mb-2">
                        <button
                          onClick={() =>
                            setExpandedCategory(open ? null : cat._id)
                          }
                          className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-emerald-50"
                        >
                          <span className="text-gray-700 font-medium">
                            {cat.name}
                          </span>
                          {cat.subcategories?.length ? (
                            <ChevronRight
                              className={`w-5 h-5 text-gray-500 transition-transform ${open ? "rotate-90" : ""
                                }`}
                            />
                          ) : null}
                        </button>

                        {open && cat.subcategories?.length && (
                          <div className="mt-2 ml-3 space-y-1">
                            {cat.subcategories.map((s, k) => (
                              <Link
                                key={k}
                                to={`/products?category=${encodeURIComponent(
                                  cat.name
                                )}&sub=${encodeURIComponent(s)}`}
                                onClick={() => setMobileMenu(false)}
                                className="block px-2 py-1 text-gray-600 hover:text-emerald-700"
                              >
                                {s}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </nav>
            </aside>
          </>
        )
      }

      <UploadPrescriptionModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={onUploadSuccess}
      />
    </nav >
  );
}
