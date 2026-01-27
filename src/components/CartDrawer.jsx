import React, { useMemo, useState, useEffect } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2, Tag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import axiosClient from "../api/axiosClient";

// Get backend URL from axiosClient configuration
const BACKEND_URL = axiosClient.defaults.baseURL || "http://localhost:3000";

function Thumb({ image, name }) {
  
  if (image) {
    return (
      <img
        src={image.startsWith('http') ? image : `${BACKEND_URL}${image}`}
        alt={name || 'Product'}
        className="w-28 h-28 md:w-24 md:h-24 rounded-xl object-cover shadow-sm"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }
  
  const initial = (name || "PR")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
    
  return (
    <div className="w-28 h-28 md:w-24 md:h-24 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl shadow-sm">
      {initial}
    </div>
  );
}

export default function CartDrawer() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [lastRemoved, setLastRemoved] = useState(null);

  const subtotal = useMemo(
    () =>
      typeof totalPrice === "number"
        ? totalPrice
        : cart.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0),
    [cart, totalPrice]
  );

  const discount = appliedCoupon
    ? appliedCoupon.code === "MEDI10"
      ? +(subtotal * 0.1).toFixed(2)
      : appliedCoupon.code === "SAVE20"
      ? +(subtotal * 0.2).toFixed(2)
      : 0
    : 0;

  const shipping = subtotal - discount >= 100 || subtotal === 0 ? 0 : 10;
  const tax = +((subtotal - discount) * 0.05).toFixed(2);
  const total = +(subtotal - discount + shipping + tax).toFixed(2);

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    if (["MEDI10", "SAVE20"].includes(code)) {
      setAppliedCoupon({ code, appliedAt: Date.now() });
      setCoupon("");
    } else {
      alert("Invalid coupon (use MEDI10 or SAVE20)");
    }
  };

  const handleRemove = (item) => {
    removeFromCart(item._id || item.id);
    setLastRemoved(item);
  };

  const undoRemove = () => {
    if (lastRemoved) {
      addToCart(lastRemoved);
      setLastRemoved(null);
    }
  };

  useEffect(() => {
    if (!lastRemoved) return;
    const t = setTimeout(() => setLastRemoved(null), 6000);
    return () => clearTimeout(t);
  }, [lastRemoved]);

  return (
    <>
      {/* Trigger button */}
      <button
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        aria-label="Open cart"
        title="Cart"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="w-6 h-6 md:w-7 md:h-7 text-gray-700" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
            {cart.length > 9 ? '9+' : cart.length}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer - Responsive width for different screens */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md md:max-w-sm lg:max-w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b bg-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Your Cart</h2>
            {cart.length > 0 && (
              <span className="bg-emerald-100 text-emerald-700 text-xs md:text-sm px-2 py-0.5 rounded-full font-medium">
                {cart.length} items
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
          </button>
        </div>

        {/* Items Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-12 h-12 md:w-14 md:h-14 text-gray-400" />
              </div>
              <p className="text-base md:text-lg font-medium text-gray-600 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-400 mb-4">Add items to get started</p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/products");
                }}
                className="px-5 py-2.5 md:px-6 md:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm md:text-base"
              >
                Browse Products
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item._id || item.id}
                className="flex gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
              >
                <Thumb image={item.image} name={item.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate">
                    {item.name}
                  </h3>
                  <p className="text-emerald-600 font-bold mt-0.5 text-base md:text-lg">
                    ৳{item.price}
                  </p>
                  
                  {/* Quantity Controls */}
                  <div className="mt-2 md:mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item._id || item.id,
                            Math.max(1, (item.quantity || 1) - 1)
                          )
                        }
                        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                      </button>
                      <span className="w-7 md:w-8 text-center text-sm md:text-base font-semibold">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item._id || item.id, (item.quantity || 1) + 1)
                        }
                        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(item)}
                      className="ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Item Total */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-800 text-sm md:text-base lg:text-lg">
                    ৳{(item.price * (item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t bg-white p-4 md:p-5 space-y-4">
            {/* Coupon Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code"
                  className="w-full pl-9 pr-3 py-2.5 md:py-3 border border-gray-200 rounded-lg text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={applyCoupon}
                className="px-4 py-2.5 md:px-5 md:py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium text-sm md:text-base whitespace-nowrap"
              >
                Apply
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">৳{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-medium">-৳{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    `৳${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (5%)</span>
                <span className="font-medium">৳{tax.toFixed(2)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-base md:text-lg font-semibold text-gray-800">Total</span>
              <span className="text-xl md:text-2xl font-bold text-emerald-600">৳{total.toFixed(2)}</span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/checkout");
              }}
              className="w-full py-3 md:py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] text-sm md:text-base"
            >
              Checkout
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Clear Cart */}
            <button
              onClick={() => {
                if (window.confirm('Clear all items from cart?')) {
                  clearCart();
                }
              }}
              className="w-full py-2 md:py-3 text-gray-500 hover:text-red-600 text-sm md:text-base transition flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              Clear Cart
            </button>

            {/* Free Shipping Progress */}
            {subtotal - discount < 100 && subtotal > 0 && (
              <div className="bg-amber-50 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-amber-700 text-center">
                  Add <span className="font-semibold">৳{(100 - (subtotal - discount)).toFixed(2)}</span> more for free shipping!
                </p>
                <div className="mt-2 h-1.5 md:h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, ((subtotal - discount) / 100) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Undo Notification */}
            {lastRemoved && (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 md:p-4 rounded-lg">
                <span className="text-sm md:text-base">{lastRemoved.name} removed</span>
                <button
                  onClick={undoRemove}
                  className="text-sm md:text-base font-semibold hover:underline text-yellow-700"
                >
                  Undo
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

