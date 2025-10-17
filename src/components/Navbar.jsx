// src/components/Navbar.jsx
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

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null); // mobile expand
  const navigate = useNavigate();

  // Dummy categories & subcategories
  const categories = [
    { name: "Baby & Child", sub: ["Baby Food", "Diapers", "Child Vitamins", "Baby Skin Care"] },
    { name: "Vitamins & Supplements", sub: ["Multivitamins", "Vitamin C", "Omega-3", "Protein"] },
    { name: "Skin Care", sub: ["Moisturizers", "Acne Care", "Anti-aging", "Sunscreen"] },
    { name: "Diabetes Care", sub: ["Test Strips", "Insulin", "Glucose Monitors"] },
    { name: "First Aid", sub: ["Bandages", "Antiseptics", "Pain Relievers"] },
    { name: "Heart Health", sub: ["BP Monitors", "Cholesterol Care"] },
    { name: "Personal Care", sub: ["Oral Care", "Feminine Care", "Hair Care"] },
    { name: "Wellness", sub: ["Immunity", "Sleep Aids", "Stress Support"] },
  ];

  const isLoggedIn = false; // toggle for testing
  const userImage = "https://i.pravatar.cc/40";

  // Set CSS variable --navbar-height so page content can add padding-top and avoid overlap
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
    // set initially and on resize
    setNavbarHeight();
    window.addEventListener("resize", setNavbarHeight);
    return () => window.removeEventListener("resize", setNavbarHeight);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // dummy behavior: navigate to products page with query param
    const q = e.target.elements.search?.value?.trim();
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <nav
      id="site-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md"
      aria-label="Main navigation"
    >
      {/* ---------- DESKTOP (md+) ---------- */}
      <div className="hidden md:block border-b border-gray-200">
        {/* Row 1 */}
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="text-2xl font-extrabold text-emerald-600 hover:opacity-90">
              MediCare
            </Link>
            <span className="text-sm text-gray-500 hidden lg:inline">Trusted pharmacy & health store</span>
          </div>

          {/* Search - centered */}
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex items-center max-w-3xl mx-auto">
              <input
                name="search"
                type="search"
                placeholder="Search medicines, symptoms or brands..."
                className="w-full px-4 py-2 border border-gray-200 rounded-l-full focus:ring-2 focus:ring-emerald-300 outline-none shadow-sm"
                aria-label="Search medicines"
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 rounded-r-full bg-emerald-600 hover:bg-emerald-700 text-white transition"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-6">
            <Link
              to="/cart"
              className="relative p-2 rounded-md hover:bg-gray-100"
              aria-label="Cart"
              title="Cart"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                3
              </span>
            </Link>

            {!isLoggedIn ? (
              <Link to="/login" className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100">
                <User className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Login</span>
              </Link>
            ) : (
              <button className="p-0">
                <img src={userImage} alt="profile" className="w-9 h-9 rounded-full border-2 border-emerald-600" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2 - Categories (no scroll, wraps to new line if needed) */}
        <div className="bg-emerald-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3 justify-center">
            {categories.map((cat, idx) => (
              <div key={idx} className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-emerald-100 transition"
                  aria-haspopup={!!cat.sub}
                  aria-expanded="false"
                >
                  <span className="text-sm font-medium">{cat.name}</span>
                  {cat.sub && <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                {/* dropdown on hover (desktop) */}
                {cat.sub && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all">
                    <div className="py-2">
                      {cat.sub.map((s, i) => (
                        <Link
                          key={i}
                          to={`/products?category=${encodeURIComponent(cat.name)}&sub=${encodeURIComponent(s)}`}
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          {s}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- MOBILE (sm & down) ---------- */}
      <div className="md:hidden border-b border-gray-200">
        {/* Row 1 */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu btn */}
          <button onClick={() => setMobileMenu(true)} aria-label="Open menu">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          {/* Site name */}
          <div className="flex items-center gap-2">
            <Link to="/" className="text-lg font-bold text-emerald-600">MediCare</Link>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            <button className="relative" aria-label="Cart">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">2</span>
            </button>
            {!isLoggedIn ? (
              <Link to="/login" aria-label="Login">
                <User className="w-6 h-6 text-gray-700" />
              </Link>
            ) : (
              <img src={userImage} alt="profile" className="w-8 h-8 rounded-full border-2 border-emerald-600" />
            )}
          </div>
        </div>

        {/* Row 2 - Search only */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearch} className="flex">
            <input
              name="search"
              type="search"
              placeholder="Search medicines..."
              className="w-full px-4 py-2 border border-gray-200 rounded-l-full focus:ring-2 focus:ring-emerald-300 outline-none"
            />
            <button type="submit" className="ml-2 px-4 py-2 rounded-r-full bg-emerald-600 text-white">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ---------- MOBILE SIDEBAR + OVERLAY ---------- */}
      {mobileMenu && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
            onClick={() => setMobileMenu(false)}
            aria-hidden="true"
          />

          {/* sidebar */}
          <aside className="fixed top-0 left-0 w-72 h-full bg-white shadow-lg z-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-emerald-600">Categories</h2>
              <button onClick={() => setMobileMenu(false)} aria-label="Close menu">
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* optional search inside sidebar */}
            <div className="mb-4">
              <form onSubmit={(e) => { e.preventDefault(); /* optional */ }}>
                <div className="flex">
                  <input className="flex-1 px-3 py-2 border rounded-l-md" placeholder="Search..." />
                  <button className="px-3 py-2 bg-emerald-600 text-white rounded-r-md"><Search className="w-4 h-4" /></button>
                </div>
              </form>
            </div>

            {/* category list (expandable) */}
            <nav>
              {categories.map((cat, i) => {
                const open = expandedCategory === cat.name;
                return (
                  <div key={i} className="mb-2">
                    <button
                      onClick={() => setExpandedCategory(open ? null : cat.name)}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-emerald-50"
                      aria-expanded={open}
                    >
                      <span className="text-gray-700 font-medium">{cat.name}</span>
                      {cat.sub ? (
                        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${open ? "rotate-90" : ""}`} />
                      ) : null}
                    </button>

                    {open && cat.sub && (
                      <div className="mt-2 ml-3 space-y-1">
                        {cat.sub.map((s, k) => (
                          <a
                            key={k}
                            href="#"
                            className="block px-2 py-1 text-gray-600 hover:text-emerald-700"
                            onClick={() => {
                              // example: navigate to subcategory
                              // navigate(`/products?category=${encodeURIComponent(cat.name)}&sub=${encodeURIComponent(s)}`);
                              setMobileMenu(false);
                            }}
                          >
                            {s}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </nav>
  );
}
