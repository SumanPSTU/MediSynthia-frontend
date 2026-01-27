import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";
import ProductCard from "../components/ProductCard";

// Get backend URL from axiosClient configuration
const BACKEND_URL = axiosClient.defaults.baseURL || "http://localhost:3000";
const ITEMS_PER_PAGE = 12;

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

  // ----- Products with Infinite Scroll -----
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const fetchProducts = useCallback(async (pageNum, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await axiosClient.get(`/product/getproduct?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);
      
      if (res.data.success) {
        const newProducts = res.data.products || [];
        const total = res.data.totalProducts || 0;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

        setTotalProducts(total);
        setHasMore(pageNum < totalPages);

        if (isLoadMore) {
          // Append new products to existing ones, avoiding duplicates
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p._id));
            const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p._id));
            return [...prev, ...uniqueNewProducts];
          });
        } else {
          setProducts(newProducts);
        }
      } else {
        // If response says no success, no more products
        setHasMore(false);
      }
    } catch (error) {
      // Handle 404 (no more products) gracefully
      if (error.response?.status === 404) {
        setHasMore(false);
      } else {
        toast.error("Something went wrong while fetching products!");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchProducts(nextPage, true);
            return nextPage;
          });
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, fetchProducts]);

  return (
    <div>
      {/* -------------------- Hero Slider -------------------- */}
      <div className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-8 lg:mt-8 mt-4">
        {ads?.length > 0 ? (
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img
              src={`${BACKEND_URL}${ads[currentAd].addImgUrl}`}
              alt={ads[currentAd].addDescription || `Ad ${currentAd + 1}`}
              className="w-full h-38 sm:h-76 lg:max-h-80 object-fill transition-all duration-700"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 mt-5">
          <h2 className="text-xl font-bold mb-1">Shop by Category</h2>

          {loadingCategories ? (
            <p className="text-center text-gray-500">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-500">No categories available</p>
          ) : (
            <div className="flex overflow-x-auto gap-9 py-4 px-4 scrollbar-hide min-w-0">
              {categories.map((cat) => (
                <Link
                  to={`/products?category=${cat.name}`}
                  key={cat._id}
                  className="flex-shrink-0 flex flex-col items-center gap-2 hover:scale-105 transform transition"
                >
                  <img
                    src={`${BACKEND_URL}${cat.imageUrl}`}
                    alt={cat.name}
                    className="w-20 h-20 rounded-full object-cover shadow-md"
                  />
                  <span className="text-sm font-medium whitespace-nowrap">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* -------------------- Products with Infinite Scroll -------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 mt-6">
        <h2 className="text-xl font-bold mb-4">Featured Products</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products available</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Load More Trigger Element */}
            <div ref={loadMoreRef} className="mt-8">
              {loadingMore && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-600">Loading more products...</span>
                </div>
              )}
              
            {!hasMore && products.length > 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500">
                  All products loaded
                </p>
              </div>
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

