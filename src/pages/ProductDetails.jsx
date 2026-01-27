import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Slider from "react-slick";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaBuilding } from "react-icons/fa";

// Get backend URL from axiosClient configuration
const BACKEND_URL = axiosClient.defaults.baseURL || "http://localhost:3000";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubCategory, setCurrentSubCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState("description");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  const { addToCart } = useCart();

  // Fetch product details
  const fetchProduct = async () => {
    try {
      const res = await axiosClient.get(`/product/getproduct/${id}`);
      if (res.data.success) {
        setProduct(res.data.product);
        // Store current product's category and subcategory IDs
        setCurrentCategory(res.data.product.category?._id || res.data.product.category);
        setCurrentSubCategory(res.data.product.subCategory?._id || res.data.product.subCategory);

        // Simulate fetching reviews (replace with API if available)
        setReviews([
          { id: 1, user: "Milon Das", rating: 3, comment: "Tor Medicine cdi!" },
          { id: 2, user: "Ahsanul Ahmed", rating: 2, comment: "I was almost dead" },
          { id: 3, user: "Sumon Das", rating: 5, comment: "Very effective, Outstanding, Mindblowing, Attractive" },
          { id: 4, user: "Premananda Roy", rating: 1, comment: "After eating this Medicine my grand parans are died." },
        ]);
      } else {
        toast.error(res.data.message || "Product not found");
      }
    } catch (err) {
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!currentCategory || !currentSubCategory || !product) return;
    try {
      const productNameParts = product.productName.trim().split(/\s+/);
      const searchTerm = productNameParts[0].toLowerCase(); 
      

      
      const relatedRes = await axiosClient.get(
        `/product/getproduct?category=${currentCategory}&subCategory=${currentSubCategory}&search=${encodeURIComponent(searchTerm)}&exclude=${id}`
      );
      
      if (relatedRes.data.success) {
        setRelatedProducts(relatedRes.data.products);
      }
    } catch (err) {
      setRelatedProducts([]);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Fetch related products when category/subcategory/product changes
  useEffect(() => {
    fetchRelatedProducts();
  }, [currentCategory, currentSubCategory, product, id]);

  if (loading) return <p className="text-center mt-4">Loading...</p>;
  if (!product) return <p className="text-center mt-4">Product not found</p>;

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ----- Left: Product Images & Tabs ----- */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          <div className="relative">
            <Slider {...sliderSettings}>
              {product.images && product.images.length > 0
                ? product.images.map((img, idx) => (
                  <div key={idx}>
                    <img
                      src={img?.startsWith('http') ? img : `${BACKEND_URL}${img}`}
                      alt={`${product.productName} ${idx + 1}`}
                      className="w-full h-96 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 384 384"><text x="50%" y="50%" text-anchor="middle" fill="%23ccc" font-size="24">${product.productName}</text></svg>`;
                      }}
                    />
                  </div>
                ))
                : (
                  <img
                    src={product.productImgUrl?.startsWith('http') ? product.productImgUrl : `${BACKEND_URL}${product.productImgUrl}`}
                    alt={product.productName}
                    className="w-full h-96 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 384 384"><text x="50%" y="50%" text-anchor="middle" fill="%23ccc" font-size="24">${product.productName}</text></svg>`;
                    }}
                  />
                )}
            </Slider>
            {product.discountPercentage > 0 && (
              <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-3 py-2 rounded-lg shadow-lg">
                {Math.round(product.discountPercentage)}% OFF
              </div>
            )}
          </div>

          {/* Supplier */}
          <div className="flex items-center gap-2 mt-2 text-gray-700">
            <FaBuilding className="text-emerald-600 text-2xl" />
            <span className="font-medium">{product.productSuplier}</span>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-t pt-4">
            <div className="flex gap-4 border-b">
              <button
                className={`py-2 px-4 font-semibold ${selectedTab === "specs" ? "border-b-2 border-emerald-600" : "text-gray-500"
                  }`}
                onClick={() => setSelectedTab("specs")}
              >
                Specifications
              </button>
              <button
                className={`py-2 px-4 font-semibold ${selectedTab === "description" ? "border-b-2 border-emerald-600" : "text-gray-500"
                  }`}
                onClick={() => setSelectedTab("description")}
              >
                Description
              </button>
            </div>
            <div className="mt-4 text-gray-700">
              {selectedTab === "description" && <p>{product.productDescription}</p>}
              {selectedTab === "specs" && (
                <div className="space-y-2">
                  <p>Generic: {product.productGeniric}</p>
                  <p>Strength: {product.strength}</p>
                  <p>Dose: {product.dose}</p>
                  <div>
                    <p className="font-semibold">Side Effects:</p>
                    <p>{product.sideEffect}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ----- Right: Product Info ----- */}
        <div className="lg:w-1/2 flex flex-col gap-4 sticky top-24">
          <h1 className="text-2xl sm:text-3xl font-bold">{product.productName}</h1>
          <p className="text-gray-500 text-sm sm:text-base">{product.productGeniric}</p>

          <p className="text-gray-500 text-sm sm:text-base">Strength: {product.strength}</p>
          <p className="text-gray-500 text-sm sm:text-base">Dose: {product.dose}</p>
          <p className={`text-sm sm:text-base font-semibold ${product.isAvailable ? "text-green-600" : "text-red-600"}`}>
            {product.isAvailable ? "In Stock" : "Out of Stock"}
          </p>
          <div>
            <p className="text-red-600 text-sm sm:text-base mb-2">Side effects:</p>
            <p className="text-gray-700 text-sm sm:text-base">{product.sideEffect}</p>
          </div>
          
          {/* Pricing Section */}
          <div className="border-t border-b py-4 my-4">
            {product.discountPercentage > 0 ? (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-gray-500 text-xs">Original Price</p>
                  <p className="text-lg line-through text-gray-400">৳{product.productPrice}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Sale Price</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                    ৳{(product.productPrice * (1 - product.discountPercentage / 100)).toFixed(2)}
                  </p>
                </div>
                <div className="ml-auto">
                  <p className="text-sm text-gray-500">Save</p>
                  <p className="text-lg font-semibold text-red-600">
                    ৳{(product.productPrice * product.discountPercentage / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xl sm:text-2xl font-semibold text-emerald-600">৳{product.productPrice}</p>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-3 mt-2">
            <button
              className="px-4 py-1 border rounded hover:bg-gray-100 transition"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <span className="font-semibold">{quantity}</span>
            <button
              className="px-4 py-1 border rounded hover:bg-gray-100 transition"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          <button
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded transition-transform transform hover:scale-105"
            onClick={() =>
              addToCart({
                productId: product._id,
                quantity,
                price: product.productPrice,
                name: product.productName,
                image: product.productImgUrl,
              })
            }
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* ----- Related Products ----- */}
      <div className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Related Products</h2>
        {relatedProducts.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 py-2 pb-4">
            {relatedProducts.map((p) => (
              <div key={p._id} className="flex-none w-40 sm:w-48">
                <ProductCard product={p} showDiscountBadge={true} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No related products found</p>
        )}
      </div>

      {/* ----- Customer Reviews ----- */}
      <div className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Customer Reviews</h2>
        <div className="flex flex-col gap-6">
          {reviews.map((r) => (
            <div key={r.id} className="flex flex-col">
              <p className="font-light text-gray-400 px-3 mb-2">{r.user}</p>

              <div className="w-full bg-white border rounded-lg shadow p-4 hover:shadow-lg transition flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="sm:w-3/4">
                  <p className="font-mono text-gray-700">{r.comment}</p>
                </div>

                <div className="flex items-center gap-1 sm:w-1/4 justify-start sm:justify-end mt-2 sm:mt-0">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <span key={idx} className="text-yellow-400">★</span>
                  ))}
                  {Array.from({ length: 5 - r.rating }).map((_, idx) => (
                    <span key={idx} className="text-gray-300">★</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div >
  );
}

