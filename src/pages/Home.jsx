import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function HomePage() {
  // ----- Ads -----

  const [ads, setAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(0);

  const fetchAds = async () => {
    try {
      const res = await axiosClient.get("/banneradd/getallBanner");
      if (res.data.success) {
        const activeAds = res.data.banners.filter((ad) => ad.activeStatus);
        setAds(activeAds);
      } else {
        toast.error(res.data.message || "Failed to fetch ads");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while fetching ads!");
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [ads]);

  const prevAd = () => setCurrentAd((prev) => (prev - 1 + ads.length) % ads.length);
  const nextAd = () => setCurrentAd((prev) => (prev + 1) % ads.length);

  // ----- Categories -----
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/category");
      if (res.data.success) setCategories(res.data.categories);
      else throw new Error(res.data.message || "Failed to fetch categories");
    } catch (error) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoadingCategories(false);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  // ----- Products -----
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get("/product/getproduct?page=1&limit=12");
      if (res.data.success) {
        setProducts(res.data.products);
      } else {
        toast.error(res.data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while fetching products!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* -------------------- Hero Slider -------------------- */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {ads?.length > 0 ? (
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}${ads[currentAd].addImgUrl}`}
              alt={ads[currentAd].addDescription || `Ad ${currentAd + 1}`}
              className="w-full h-64 sm:h-96 object-cover transition-all duration-700"
            />
            <button
              onClick={prevAd}
              className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-90 rounded-full p-2 shadow"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <button
              onClick={nextAd}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-90 rounded-full p-2 shadow"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {ads.map((ad, idx) => (
                <span
                  key={ad._id}
                  className={`w-3 h-3 rounded-full cursor-pointer ${idx === currentAd ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                  onClick={() => setCurrentAd(idx)}
                ></span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Loading ads...</p>
        )}
      </div>

      {/* -------------------- Categories -------------------- */}
      <div>
        <ToastContainer position="top-right" autoClose={3000} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <h2 className="text-xl font-bold mb-4">Shop by Category</h2>

          {loadingCategories ? (
            <p className="text-center text-gray-500">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-500">No categories available</p>
          ) : (
            <div className="flex flex-wrap gap-6 justify-center">
              {categories.map((cat) => (
                <Link
                  to={`/products?category=${cat.name}`}
                  key={cat._id} // use _id from database
                  className="flex flex-col items-center gap-2 hover:scale-105 transform transition"
                >
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${cat.imageUrl}`} // image from database
                    alt={cat.name}
                    className="w-full h-20 rounded-full object-cover shadow-md"
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* -------------------- Products -------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="text-xl font-bold mb-4">Featured Products</h2>
        {loading ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products available</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((p) => (
              <div
                key={p._id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer flex flex-col"
              >
                <img src={`${import.meta.env.VITE_BACKEND_URL}${p.productImgUrl}`} alt={p.productName} />
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">{p.productName}</h3>
                    <p className="text-sm font-semibold text-emerald-600">${p.productPrice}</p>
                  </div>
                  <button
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 rounded transition"
                    onClick={() => toast.success(`${p.productName} added to cart!`)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}









// I want you to rewrite my React HomePage component. Keep my existing hero ads slider, categories, and product layout. But for the product section, implement infinite scrolling like YouTube/Facebook: fetch products in batches of 30 from the backend, automatically load more when the user scrolls near the bottom, append new products to the list, and show a loader while fetching. Use TailwindCSS for styling and ensure the layout is responsive and polished. Also, make sure broken images show the product/ads name as a fallback.