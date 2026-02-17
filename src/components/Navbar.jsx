import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";
import UploadPrescriptionModal from "./UploadPrescriptionModal";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [searchInput, setSearchInput] = useState("");
  const categoriesRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  // Default avatar
  const defaultAvatar = "https://i.pravatar.cc/40?img=68";

  // Scroll categories left/right
  const scrollCategories = (direction) => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      categoriesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
      toast.error("Error fetching categories");
    } finally {
      setLoadingCats(false);
    }
  };

  // ✅ Fetch subcategories for a specific category
  const fetchSubcategories = async (categoryId) => {
    if (subcategories[categoryId]) return; // Already loaded

    setLoadingSubs(true);
    try {
      const res = await axiosClient.get(`/subcategory/by-category/${categoryId}`);
      if (res.data.success) {
        const subs = res.data.subCategories || res.data.subcategories || [];
        setSubcategories(prev => ({
          ...prev,
          [categoryId]: subs
        }));
      }
    } catch (err) {
      // Silent catch - subcategories might not exist
    } finally {
      setLoadingSubs(false);
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

  // Auto search on typing with debouncing
  const handleSearchChange = (value) => {
    setSearchInput(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If input is empty, navigate to home
    if (!value.trim()) {
      navigate("/");
      return;
    }

    // Debounce search by 500ms to avoid too many requests
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        navigate(`/products?search=${encodeURIComponent(value.trim())}`);
      }
    }, 500);
  };

  const onUploadSuccess = (prescription) => {
    // Prescription uploaded successfully
  };

  // Handle mouse enter to show dropdown
  const handleMouseEnter = (categoryId, event) => {
    fetchSubcategories(categoryId);
    
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setActiveDropdown(categoryId);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
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
              MediSynthia
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
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
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
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Desktop */}
            {isAuthenticated ? (
              <Link to="/profile">
              <img
                src={defaultAvatar}
                alt="profile"
                className="w-9 h-9 rounded-full border-2 border-emerald-600 object-cover cursor-pointer hover:opacity-90 transition"
              />
              </Link>
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

        {/* Categories row with scroll buttons */}
        <div className="relative bg-emerald-50">
          {/* Left Scroll Button */}
          <button
            onClick={() => scrollCategories('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-1 hover:bg-gray-100 transition hidden md:block"
            style={{ marginLeft: '0.5rem' }}
          >
            <ChevronLeft className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Right Scroll Button */}
          <button
            onClick={() => scrollCategories('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-1 hover:bg-gray-100 transition hidden md:block"
            style={{ marginRight: '0.5rem' }}
          >
            <ChevronRight className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Categories Container */}
          <div
            ref={categoriesRef}
            className="overflow-x-auto scrollbar-hide mx-10"
          >
            <div className="flex items-center gap-3 py-3 min-w-max px-4">
              {loadingCats ? (
                <span className="text-gray-500 text-sm">Loading categories...</span>
              ) : categories.length === 0 ? (
                <span className="text-gray-500 text-sm">No categories</span>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="relative flex-shrink-0"
                    onMouseEnter={(e) => handleMouseEnter(cat._id, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-gray-700 hover:bg-emerald-100 transition text-sm font-medium whitespace-nowrap"
                    >
                      <span>{cat.name}</span>
                      {(subcategories[cat._id] && subcategories[cat._id].length > 0) || loadingSubs ? (
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      ) : null}
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fixed Dropdown Overlay */}
          {activeDropdown && subcategories[activeDropdown] && subcategories[activeDropdown].length > 0 && (
            <div
              className="fixed bg-white border rounded-lg shadow-xl z-50"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                minWidth: '200px'
              }}
              onMouseEnter={() => setActiveDropdown(activeDropdown)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="py-2">
                {subcategories[activeDropdown].map((sub) => {
                  const cat = categories.find(c => c._id === activeDropdown);
                  return (
                    <Link
                      key={sub._id}
                      to={`/products?category=${encodeURIComponent(
                        cat?.name || ''
                      )}&sub=${encodeURIComponent(sub.name)}`}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => {
                        setActiveDropdown(null);
                        setMobileMenu(false);
                      }}
                    >
                      {sub.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- MOBILE ---------- */}
      <div className="md:hidden border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setMobileMenu(true)}>
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <Link to="/" className="text-lg font-bold text-emerald-600">
            MediSynthia
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Mobile */}
            {isAuthenticated ? (
              <Link to="/profile">
                <img
                  src={defaultAvatar}
                  alt="profile"
                  className="w-8 h-8 rounded-full border-2 border-emerald-600 object-cover"
                />
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full px-3 py-1 rounded-md bg-emerald-600 text-white text-center hover:bg-emerald-700 transition text-base font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearch} className="flex">
            <input
              name="search"
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
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
                    const catSubcategories = subcategories[cat._id] || [];
                    return (
                      <div key={cat._id} className="mb-2">
                        <button
                          onClick={() => {
                            setExpandedCategory(open ? null : cat._id);
                            if (!open) fetchSubcategories(cat._id);
                          }}
                          className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-emerald-50"
                        >
                          <span className="text-gray-700 font-medium">
                            {cat.name}
                          </span>
                          {(catSubcategories.length > 0 || loadingSubs) && (
                            <ChevronRight
                              className={`w-5 h-5 text-gray-500 transition-transform ${open ? "rotate-90" : ""}`}
                            />
                          )}
                        </button>

                        {open && catSubcategories.length > 0 && (
                          <div className="mt-2 ml-3 space-y-1">
                            {catSubcategories.map((sub) => (
                              <Link
                                key={sub._id}
                                to={`/products?category=${encodeURIComponent(
                                  cat.name
                                )}&sub=${encodeURIComponent(sub.name)}`}
                                onClick={() => setMobileMenu(false)}
                                className="block px-2 py-1 text-gray-600 hover:text-emerald-700"
                              >
                                {sub.name}
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
