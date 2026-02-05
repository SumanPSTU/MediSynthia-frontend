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
  const [newReview, setNewReview] = useState({ content: "", rating: 5 });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [currentUser, setCurrentUser] = useState(null);

  const { addToCart } = useCart();

  // Check if user is logged in
  const checkAuth = async () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const res = await axiosClient.get("/user/profile");
        if (res.data.success) {
          setCurrentUser(res.data.data);
        }
      } catch (err) {
        // User not authenticated
        setCurrentUser(null);
      }
    }
  };

  // Fetch product details
  const fetchProduct = async () => {
    try {
      const res = await axiosClient.get(`/product/getproduct/${id}`);
      if (res.data.success) {
        setProduct(res.data.product);
        // Store current product's category and subcategory IDs
        setCurrentCategory(res.data.product.category?._id || res.data.product.category);
        setCurrentSubCategory(res.data.product.subCategory?._id || res.data.product.subCategory);
      } else {
        toast.error(res.data.message || "Product not found");
      }
    } catch (err) {
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews from backend
  const fetchReviews = async () => {
    try {
      const res = await axiosClient.get(`/user/comment/${id}`);
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews");
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;
    try {
      // Search only by generic
      if (product.productGeniric) {
        const genericId = typeof product.productGeniric === 'object' 
          ? product.productGeniric._id 
          : product.productGeniric;
        
        const relatedRes = await axiosClient.get(
          `/product/getproduct?productGeniric=${genericId}&exclude=${id}&limit=10`
        );
        
        if (relatedRes.data.success && relatedRes.data.products.length > 0) {
          setRelatedProducts(relatedRes.data.products);
        } else {
          setRelatedProducts([]);
        }
      } else {
        setRelatedProducts([]);
      }
    } catch (err) {
      setRelatedProducts([]);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchProduct();
    fetchReviews();
  }, [id]);

  // Fetch related products when category/subcategory/product changes
  useEffect(() => {
    fetchRelatedProducts();
  }, [currentCategory, currentSubCategory, product, id]);

  if (loading) return <p className="text-center mt-4">Loading...</p>;
  if (!product) return <p className="text-center mt-4">Product not found</p>;

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please login to submit a review");
      return;
    }
    if (!newReview.rating) {
      toast.error("Please select a rating");
      return;
    }
    if (!newReview.content.trim()) {
      toast.error("Please write a review");
      return;
    }
    if (newReview.content.length < 5) {
      toast.error("Review must be at least 5 characters");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await axiosClient.post("/user/comment", {
        productId: id,
        content: newReview.content,
        rating: newReview.rating,
      });
      if (res.data.success) {
        toast.success("Review submitted successfully");
        setNewReview({ content: "", rating: 5 });
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Update review
  const handleUpdateReview = async (reviewId) => {
    if (!editRating) {
      toast.error("Please select a rating");
      return;
    }
    if (!editContent.trim()) {
      toast.error("Please write a review");
      return;
    }
    if (editContent.length < 5) {
      toast.error("Review must be at least 5 characters");
      return;
    }

    try {
      const res = await axiosClient.put(`/user/comment/${reviewId}`, {
        content: editContent,
        rating: editRating,
      });
      if (res.data.success) {
        toast.success("Review updated successfully");
        setEditingReviewId(null);
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update review");
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const res = await axiosClient.delete(`/user/comment/${reviewId}`);
      if (res.data.success) {
        toast.success("Review deleted successfully");
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    }
  };

  // Start editing a review
  const startEditing = (review) => {
    setEditingReviewId(review._id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ----- Left: Product Images ----- */}
        <div className="flex flex-col gap-4">
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

          {/* Desktop purchase panel */}
          <div className="hidden lg:block">
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

            <div className="flex items-center gap-2 mt-4 bg-gray-100 rounded-lg p-1 w-fit">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const newQty = Math.max(1, parseInt(e.target.value) || 1);
                  setQuantity(newQty);
                }}
                min="1"
                className="w-12 text-center font-medium bg-white border border-gray-200 rounded outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                aria-label="Item quantity"
              />
              <button
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded transition-transform transform hover:scale-105"
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

        {/* ----- Right: Product Info ----- */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
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
          <div className="border-t border-b py-4 my-4 lg:hidden">
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
          <div className="flex items-center gap-2 mt-4 bg-gray-100 rounded-lg p-1 w-fit lg:hidden">
            <button
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const newQty = Math.max(1, parseInt(e.target.value) || 1);
                setQuantity(newQty);
              }}
              min="1"
              className="w-12 text-center font-medium bg-white border border-gray-200 rounded outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              aria-label="Item quantity"
            />
            <button
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          <button
            className="mt-4   bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded transition-transform transform hover:scale-105 lg:hidden"
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

        {/* Tabs */}
        <div className="mt-4 border-t pt-4 lg:col-start-1 lg:col-end-2">
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

        {/* Add Review Form */}
        {currentUser ? (
          <form onSubmit={handleSubmitReview} className="bg-white border rounded-lg shadow p-4 mb-6">
            <h3 className="font-semibold mb-3">Write a Review</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="text-2xl transition-colors"
                  >
                    <span className={star <= newReview.rating ? "text-yellow-400" : "text-gray-300"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <textarea
                value={newReview.content}
                onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows="4"
                placeholder="Share your experience with this product..."
                minLength="5"
                maxLength="500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              Please <Link to="/login" className="font-semibold underline">login</Link> to write a review
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div className="flex flex-col gap-6">
          {reviews.length > 0 ? (
            reviews.map((r) => (
              <div key={r._id} className="flex flex-col">
                <div className="flex justify-between items-center px-3 mb-2">
                  <p className="font-light text-gray-400">{r.userId?.username || "Anonymous"}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {editingReviewId === r._id ? (
                  // Edit Mode
                  <div className="w-full bg-white border rounded-lg shadow p-4">
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            className="text-2xl transition-colors"
                          >
                            <span className={star <= editRating ? "text-yellow-400" : "text-gray-300"}>
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full border rounded-lg p-3 mb-3 focus:ring-2 focus:ring-emerald-500"
                      rows="4"
                      minLength="5"
                      maxLength="500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateReview(r._id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingReviewId(null)}
                        className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="w-full bg-white border rounded-lg shadow p-4 hover:shadow-lg transition">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="sm:w-3/4">
                        <p className="font-mono text-gray-700">{r.content}</p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: r.rating }).map((_, idx) => (
                            <span key={idx} className="text-yellow-400">★</span>
                          ))}
                          {Array.from({ length: 5 - r.rating }).map((_, idx) => (
                            <span key={idx} className="text-gray-300">★</span>
                          ))}
                        </div>

                        {/* Edit/Delete buttons for own reviews */}
                        {currentUser && currentUser._id === r.userId?._id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(r)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReview(r._id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Reply */}
                    {r.adminReply?.content && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-emerald-800 mb-1">Admin Reply</p>
                          <p className="text-sm text-emerald-700">{r.adminReply.content}</p>
                          {r.adminReply.repliedAt && (
                            <p className="text-xs text-emerald-600 mt-2">
                              {new Date(r.adminReply.repliedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
          )}
        </div>
      </div>
    </div >
  );
}

