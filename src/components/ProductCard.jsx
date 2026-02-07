import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient.js";
import { useCart } from "../context/CartContext.jsx";

// Get backend URL from axiosClient configuration
const BACKEND_URL = axiosClient.defaults.baseURL || "http://localhost:3000";

// Helper component for robust image loading with extension fallback
function ProductImage({ src, alt, className }) {
  const [imgSrc, setImgSrc] = useState(src);
  const tried = useRef(new Set());

  const handleError = () => {
    if (tried.current.has(src)) {
      // Already tried this exact URL, try different extensions
      const baseName = src?.replace(/\.[^/.]+$/, '') || '';
      const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
      const currentExt = src?.match(/\.[^/.]+$/)?.[0] || '';
      
      for (const ext of extensions) {
        if (ext === currentExt) continue;
        const newUrl = baseName + ext;
        if (!tried.current.has(newUrl)) {
          tried.current.add(newUrl);
          setImgSrc(newUrl.startsWith('http') ? newUrl : `${BACKEND_URL}${newUrl}`);
          return;
        }
      }
      return; // All extensions tried, show fallback
    }
    
    // First failure - retry same URL with timestamp to bypass cache
    tried.current.add(src);
    setImgSrc(src + (src.includes('?') ? '&' : '?') + 't=' + Date.now());
  };

  return (
    <img
      src={imgSrc}
      alt={alt || 'Product'}
      className={className}
      onError={handleError}
    />
  );
}

export default function ProductCard({ product, showDiscountBadge = true }) {
  const { addToCart } = useCart();
  
  const price = Number(product.productPrice) || 0;
  const prodDisc = Number(product.discountPercentage) || 0;
  const effectivePrice = prodDisc > 0 ? +(price * (1 - prodDisc / 100)).toFixed(2) : price;
  const isOnSale = prodDisc > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart({
      productId: product._id,
      quantity: 1,
      price: effectivePrice,
      name: product.productName,
      image: product.productImgUrl
    });
  };

  return (
    <div 
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <Link to={`/product/${product._id}`} className="block">
        <div className="relative overflow-hidden bg-gray-50">
          <ProductImage
            src={product.productImgUrl?.startsWith('http') ? product.productImgUrl : `${BACKEND_URL}${product.productImgUrl}`}
            alt={product.productName}
            className="w-full h-44 md:h-52 object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
          {/* Discount Badge Over Image */}
          {showDiscountBadge && isOnSale && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">
              {prodDisc}% OFF
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/product/${product._id}`}>
            <h3 className="font-semibold text-gray-800 text-sm md:text-base line-clamp-2 group-hover:text-emerald-600 transition-colors">
              {product.productName}
            </h3>
          </Link>
          <p className="text-gray-500 text-xs md:text-sm mt-0.5 line-clamp-1">
            {product.productGeneric}
          </p>
        </div>
        
        <div className="mt-2">
          {/* Price Display with Discount */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              {isOnSale ? (
                <>
                  <span className="text-emerald-600 font-bold text-lg md:text-xl">
                    ৳{effectivePrice.toFixed(2)}
                  </span>
                  <span className="text-gray-400 line-through text-sm">
                    ৳{price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-emerald-600 font-bold text-lg md:text-xl">
                  ৳{price.toFixed(2)}
                </span>
              )}
            </div>
            {product.isAvailable ? (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                In Stock
              </span>
            ) : (
              <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                Out of Stock
              </span>
            )}
          </div>
          
          <button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={handleAddToCart}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

