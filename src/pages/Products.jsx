import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient.js";
import { toast } from "react-hot-toast";
import ProductCard from "../components/ProductCard.jsx";
import { Filter, X } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Get filter values from URL
  const category = searchParams.get("category");
  const subcategory = searchParams.get("sub");
  const searchQuery = searchParams.get("search");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosClient.get("/category");
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      // Silent catch - categories might not exist
    }
  }, []);

  const fetchSubcategories = useCallback(async () => {
    try {
      const res = await axiosClient.get("/subcategory");
      if (res.data.success) {
        return res.data.subCategories || [];
      }
      return [];
    } catch (err) {
      return [];
    }
  }, []);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/product/getproduct?page=1&limit=1000`);
      
      if (res.data.success) {
        const products = res.data.products || [];
        setAllProducts(products);
        setTotalProducts(products.length);
      } else {
        setAllProducts([]);
        setTotalProducts(0);
      }
    } catch (err) {
      toast.error("Something went wrong while fetching products!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchCategories();
      await fetchAllProducts();
    };
    init();
  }, [fetchCategories, fetchAllProducts]);

  // Filter products based on category/subcategory/search
  useEffect(() => {
    if (allProducts.length === 0) return;

    let result = [...allProducts];

    // Apply category filter
    if (category) {
      const categoryFromUrl = decodeURIComponent(category).trim().toLowerCase();
      
      result = result.filter(p => {
        if (p.category && typeof p.category === 'object') {
          const catName = p.category.name?.trim().toLowerCase() || '';
          return catName === categoryFromUrl || 
                 catName.includes(categoryFromUrl) || 
                 categoryFromUrl.includes(catName);
        }
        return false;
      });
    }

    if (subcategory) {
      const subcategoryFromUrl = decodeURIComponent(subcategory).trim().toLowerCase();
      
      result = result.filter(p => {
        if (p.subCategory && typeof p.subCategory === 'object') {
          // Normalize the product's subcategory name
          const subCatName = p.subCategory.name?.trim().toLowerCase() || '';
          return subCatName === subcategoryFromUrl || 
                 subCatName.includes(subcategoryFromUrl) || 
                 subcategoryFromUrl.includes(subCatName);
        }
        return false;
      });
    }

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.productName?.toLowerCase().includes(search) ||
        p.productGeneric?.toLowerCase().includes(search)
      );
    }

    setFilteredProducts(result);
    setTotalProducts(result.length);
    setHasMore(result.length > ITEMS_PER_PAGE);
    setPage(1);
  }, [category, subcategory, searchQuery, allProducts]);

  const getPaginatedProducts = useCallback(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [page, filteredProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [category, subcategory, searchQuery]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore || searchQuery) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setPage(prev => prev + 1);
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
  }, [loading, loadingMore, hasMore, searchQuery]);

  const clearFilters = () => {
    setSearchParams({});
  };

  const getPageTitle = () => {
    if (subcategory) {
      return subcategory;
    }
    if (category) {
      return category;
    }
    return "All Medicines";
  };

  // Get subtitle based on filters
  const getPageSubtitle = () => {
    if (subcategory && category) {
      return `Products in ${subcategory} under ${category}`;
    }
    if (category) {
      return `Products in ${category} category`;
    }
    return "Browse our complete collection of genuine medicines and healthcare products";
  };

  // Current page products
  const currentProducts = searchQuery ? filteredProducts : getPaginatedProducts();
  const displayHasMore = searchQuery 
    ? (page * ITEMS_PER_PAGE) < filteredProducts.length
    : hasMore;

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* -------------------- Header -------------------- */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          {getPageTitle()}
        </h1>
        <p className="text-gray-600 text-sm md:text-base mb-4">
          {getPageSubtitle()}
        </p>

        {/* Active Filters Display */}
        {(category || subcategory || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Filter className="w-4 h-4" /> Filters:
            </span>
            {category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                Category: {category}
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("category");
                    params.delete("sub");
                    setSearchParams(params);
                  }}
                  className="hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {subcategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Subcategory: {subcategory}
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("sub");
                    setSearchParams(params);
                  }}
                  className="hover:text-blue-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                Search: {searchQuery}
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("search");
                    setSearchParams(params);
                  }}
                  className="hover:text-amber-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* -------------------- Products Grid -------------------- */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-4">
            {category || subcategory
              ? `No products found in this category`
              : "No products available"
            }
          </p>
          <button 
            onClick={clearFilters}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            View All Products
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-6">
            Showing {currentProducts.length} of {filteredProducts.length} products
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 md:gap-6">
            {currentProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Load More Trigger Element */}
          {!searchQuery && (
            <div ref={loadMoreRef} className="mt-8">
              {loadingMore && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-600">Loading more products...</span>
                </div>
              )}
              
              {!displayHasMore && currentProducts.length > 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    All products loaded
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

