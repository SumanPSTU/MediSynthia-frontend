import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Slider from "react-slick";
import axiosClient from "../api/axiosClient";
import { toast, ToastContainer } from "react-toastify";
import { useCart } from "../context/CartContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaBuilding } from "react-icons/fa";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
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

        // Fetch related products by category
        const relatedRes = await axiosClient.get(
          `/product/getproduct?category=${res.data.product.category}&limit=10`
        );
        if (relatedRes.data.success) setRelatedProducts(relatedRes.data.products.filter(p => p._id !== id));

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
      console.error(err);
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

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
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ----- Left: Product Images & Tabs ----- */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          <Slider {...sliderSettings}>
            {product.images && product.images.length > 0
              ? product.images.map((img, idx) => (
                <div key={idx}>
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${img}`}
                    alt={`${product.productName} ${idx + 1}`}
                    className="w-full h-96 object-cover rounded-lg shadow-md"
                  />
                </div>
              ))
              : (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${product.productImgUrl}`}
                  alt={product.productName}
                  className="w-full h-96 object-cover rounded-lg shadow-md"
                />
              )}
          </Slider>

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
                  <p>Side Effects: {product.sideEffect}</p>
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
          <p className="text-red-600 text-sm sm:text-base">Side effects: {product.sideEffect}</p>
          <p className="text-xl sm:text-2xl font-semibold text-emerald-600">${product.productPrice}</p>

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
        <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 py-2">
          {relatedProducts.map((p) => (
            <Link
              to={`/product/${p._id}`}
              key={p._id}
              className="flex-none w-40 sm:w-48 bg-white border rounded-lg shadow hover:shadow-lg transition"
            >
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${p.productImgUrl}`}
                alt={p.productName}
                className="w-full h-36 sm:h-44 object-cover rounded-t-lg"
              />
              <div className="p-2">
                <p className="text-sm sm:text-base font-medium text-gray-700">{p.productName}</p>
                <p className="text-sm sm:text-base font-semibold text-emerald-600">${p.productPrice}</p>
              </div>
            </Link>
          ))}
        </div>
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






// Image gallery – multiple product images with thumbnails.
// Tabbed sections – Description, Reviews, Specifications.
// Sticky Add to Cart panel for mobile.
// Related products carousel at the bottom.