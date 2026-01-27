import React, { useMemo, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import axiosClient from "../api/axiosClient";

/**
 * Full cart page for detailed editing.
 * - Save for later feature (local only).
 * - Coupon, shipping, tax calc, total.
 * - Fully responsive layout for all screen sizes (mobile, tablet, desktop).
 */

// Get backend URL from axiosClient configuration
const BACKEND_URL = axiosClient.defaults.baseURL || "http://localhost:3000";

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [selected, setSelected] = useState(new Set());
  const [coupon, setCoupon] = useState("");
  const navigate = useNavigate();

  const subtotal = useMemo(
    () => cart.filter(it => selected.has(it._id || it.id)).reduce((s, it) => s + Number(it.price || 0) * (it.quantity || 1), 0),
    [cart, selected]
  );

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const discount = appliedCoupon ? +(subtotal * (appliedCoupon.percent / 100)).toFixed(2) : 0;
  const shipping = subtotal - discount >= 100 || subtotal === 0 ? 0 : 10;
  const tax = +((subtotal - discount) * 0.05).toFixed(2);
  const total = +(subtotal - discount + shipping + tax).toFixed(2);

  const applyCoupon = () => {
    const c = coupon.trim().toUpperCase();
    if (!c) return;
    if (c === "MEDI10") setAppliedCoupon({ code: c, percent: 10 });
    else if (c === "SAVE20") setAppliedCoupon({ code: c, percent: 20 });
    else alert("Invalid coupon (demo: MEDI10 or SAVE20)");
    setCoupon("");
  };

  const toggleSelected = (itemId) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selected.size === cart.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(cart.map(it => it._id || it.id)));
    }
  };

  const handleCheckout = () => {
    if (selected.size === 0) {
      alert("Please select at least one item to checkout");
      return;
    }
    navigate("/checkout", { 
      state: { 
        selectedItems: cart.filter(it => selected.has(it._id || it.id))
      } 
    });
  };

  return (
    <div className="pt-[var(--navbar-height)] min-h-screen bg-gray-50 px-3 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Shopping Cart</h1>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm inline-block">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {/* Cart Items */}
          <section className="xl:col-span-3">
            {cart.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6 text-sm md:text-base">Looks like you haven't added anything to your cart yet.</p>
                <button
                  onClick={() => navigate("/products")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm md:text-base"
                >
                  Continue Shopping
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Select All Header */}
                <div className="p-4 md:p-5 border-b bg-gray-50 flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={selected.size === cart.length && cart.length > 0}
                    onChange={selectAll}
                    className="w-5 h-5 text-emerald-600 cursor-pointer rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select {selected.size > 0 ? `${selected.size}/${cart.length}` : 'all'}
                  </span>
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div
                      key={item._id || item.id}
                      className={`flex flex-col md:flex-row gap-3 md:gap-4 p-4 md:p-5 hover:bg-gray-50 transition ${selected.has(item._id || item.id) ? 'bg-emerald-50' : ''}`}
                    >
                      {/* Checkbox */}
                      <div className="flex-shrink-0 flex items-start pt-1 md:pt-2">
                        <input 
                          type="checkbox" 
                          checked={selected.has(item._id || item.id)}
                          onChange={() => toggleSelected(item._id || item.id)}
                          className="w-5 h-5 text-emerald-600 cursor-pointer rounded"
                        />
                      </div>

                      {/* Thumbnail - Bigger on mobile */}
                      <div className="flex-shrink-0 self-center md:self-auto flex justify-center md:block">
                        {item.image ? (
                          <img
                            src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`}
                            alt={item.name}
                            className="w-32 h-32 md:w-28 lg:w-32 rounded-xl object-cover shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-32 h-32 md:w-28 lg:w-32 rounded-xl bg-emerald-50 flex items-center justify-center shadow-sm"
                          style={{ display: item.image ? 'none' : 'flex' }}
                        >
                          <ShoppingBag className="w-14 h-14 md:w-12 md:h-12 lg:w-14 lg:h-14 text-emerald-400" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <h3 className="font-semibold text-gray-800 text-base md:text-lg truncate">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {item.subtitle || "Good quality product"}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-lg md:text-xl font-bold text-emerald-600">
                            ৳{(item.price * (item.quantity || 1)).toFixed(2)}
                          </span>
                          <span className="text-xs md:text-sm text-gray-400">
                            ৳{item.price?.toFixed(2)} each
                          </span>
                        </div>

                        {/* Actions Row */}
                        <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item._id || item.id, Math.max(1, (item.quantity || 1) - 1))}
                              className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <input
                              type="text"
                              value={item.quantity || 1}
                              readOnly
                              className="w-10 md:w-12 text-center text-sm md:text-base font-medium bg-transparent outline-none"
                            />
                            <button
                              onClick={() => updateQuantity(item._id || item.id, (item.quantity || 1) + 1)}
                              className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => removeFromCart(item._id || item.id)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition ml-auto md:ml-0"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-sm hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Item Total - Desktop */}
                      <div className="hidden md:block text-right flex-shrink-0">
                        <div className="font-bold text-gray-800 text-lg">
                          ৳{(item.price * (item.quantity || 1)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clear Cart Button */}
                {cart.length > 0 && (
                  <div className="p-4 border-t bg-gray-50">
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all items from your cart?')) {
                          clearCart();
                        }
                      }}
                      className="text-sm text-gray-500 hover:text-red-600 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Cart
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Order Summary - Sidebar */}
          <aside className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Order Summary</h2>

              {/* Coupon Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have a coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="MEDI10 or SAVE20"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ {appliedCoupon.code} applied ({appliedCoupon.percent}% off)
                  </p>
                )}
              </div>

              {/* Summary Details */}
              <div className="space-y-3 text-sm text-gray-600 pb-4 border-b">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-medium text-emerald-600">-৳{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-800">
                    {shipping === 0 ? (
                      <span className="text-emerald-600">Free</span>
                    ) : (
                      `৳${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span className="font-medium text-gray-800">৳{tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-4">
                <span className="text-base font-semibold text-gray-800">Total</span>
                <span className="text-xl md:text-2xl font-bold text-emerald-600">৳{total.toFixed(2)}</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || selected.size === 0}
                className={`w-full py-3 md:py-4 rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  cart.length === 0 || selected.size === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                }`}
              >
                Proceed to Checkout ({selected.size})
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Continue Shopping Link */}
              <button
                onClick={() => navigate("/products")}
                className="w-full mt-3 py-2 text-gray-500 hover:text-emerald-600 text-sm transition"
              >
                ← Continue Shopping
              </button>

              {/* Free Shipping Info */}
              {subtotal - discount < 100 && subtotal > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs md:text-sm text-emerald-700 text-center">
                    Add ৳{(100 - (subtotal - discount)).toFixed(2)} more for free shipping!
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

