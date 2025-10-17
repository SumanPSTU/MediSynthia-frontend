import React, { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

/**
 * Full cart page for detailed editing.
 * - Save for later feature (local only).
 * - Coupon, shipping, tax calc, total.
 * - Responsive layout: grid on mobile, side-by-side on desktop.
 */

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [saved, setSaved] = useState([]);
  const [coupon, setCoupon] = useState("");
  const navigate = useNavigate();

  const subtotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * (it.quantity || 1), 0),
    [cart]
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
    else alert("Invalid coupon (demo: MEDI10, SAVE20)");
    setCoupon("");
  };

  const moveToSaved = (item) => {
    setSaved(prev => [...prev, item]);
    removeFromCart(item._id || item.id);
  };

  const restoreSaved = (item) => {
    // This assumes addToCart exists in context. If not, you will implement it.
    // addToCart(item);
    setSaved(prev => prev.filter(s => s._id !== item._id));
  };

  return (
    <div className="pt-[var(--navbar-height)] min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items (left / main) */}
        <section className="lg:col-span-2 bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Shopping Cart</h1>
            <div className="text-sm text-gray-600">{cart.length} items</div>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="mb-4">Your cart is empty.</div>
              <button onClick={() => navigate("/products")} className="px-4 py-2 bg-emerald-600 text-white rounded-md">Continue Shopping</button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item._id || item.id} className="flex gap-4 items-center p-4 border rounded-lg">
                  {/* thumbnail */}
                  <div className="w-24 h-24 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg width="40" height="40" viewBox="0 0 24 24" className="opacity-90">
                      <rect width="24" height="24" rx="6" fill="#10B981" fillOpacity="0.12"/>
                    </svg>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.subtitle || "Good quality product"}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-md border">
                        <button onClick={() => updateQuantity(item._id || item.id, Math.max(1, (item.quantity || 1) - 1))} className="px-3 py-1"><Minus className="w-4 h-4" /></button>
                        <input value={item.quantity || 1} onChange={(e) => updateQuantity(item._id || item.id, Math.max(1, parseInt(e.target.value || "1",10)))} className="w-14 px-2 text-center" />
                        <button onClick={() => updateQuantity(item._id || item.id, (item.quantity || 1) + 1)} className="px-3 py-1"><Plus className="w-4 h-4" /></button>
                      </div>

                      <button onClick={() => moveToSaved(item)} className="text-sm text-gray-600 hover:text-emerald-700">Save for later</button>
                      <button onClick={() => removeFromCart(item._id || item.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-gray-800">${(item.price * (item.quantity || 1)).toFixed(2)}</div>
                    <div className="text-sm text-gray-500">${item.price.toFixed(2)} each</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saved for later */}
          {saved.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-3">Saved for later</h3>
              <div className="space-y-3">
                {saved.map(s => (
                  <div key={s._id || s.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-sm text-gray-500">${(+s.price).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => restoreSaved(s)} className="px-3 py-1 bg-emerald-600 text-white rounded">Move to cart</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Order Summary (right) */}
        <aside className="bg-white p-6 rounded-2xl shadow h-fit sticky top-24">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm text-gray-600 mb-4">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>

            <div className="flex items-center gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon (MEDI10 / SAVE20)" className="flex-1 px-3 py-2 border rounded-md"/>
              <button onClick={() => {
                const c = coupon.trim().toUpperCase();
                if (c === "MEDI10") setAppliedCoupon({code:c,percent:10});
                else if (c === "SAVE20") setAppliedCoupon({code:c,percent:20});
                else alert("Invalid coupon");
                setCoupon("");
              }} className="px-3 py-2 bg-emerald-600 text-white rounded-md">Apply</button>
            </div>

            <div className="flex justify-between">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping===0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>

            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-md text-white font-semibold transition ${cart.length===0 ? "bg-gray-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            Proceed to Checkout
          </button>

          <button onClick={() => clearCart()} className="mt-3 w-full py-2 rounded-md border border-gray-200 text-gray-700">Clear Cart</button>
        </aside>
      </div>
    </div>
  );
}
