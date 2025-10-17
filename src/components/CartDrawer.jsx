import React, { useMemo, useState, useEffect } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Thumb({ name }) {
  const initial = (name || "PR")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="w-12 h-12 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
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
        className="relative p-2 rounded-md hover:bg-gray-100"
        aria-label="Cart"
        title="Cart"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="w-6 h-6 text-gray-700" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {cart.length}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              Your cart is empty.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item._id || item.id}
                className="flex gap-3 items-center p-3 border rounded-lg"
              >
                <Thumb name={item.name} />
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <div className="text-sm text-gray-500">${item.price}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item._id || item.id,
                          Math.max(1, (item.quantity || 1) - 1)
                        )
                      }
                      className="p-1 border rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item._id || item.id, (item.quantity || 1) + 1)
                      }
                      className="p-1 border rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ${(item.price * (item.quantity || 1)).toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleRemove(item)}
                    className="text-red-500 hover:text-red-600 text-sm mt-1"
                  >
                    <Trash2 className="w-4 h-4 inline" /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 space-y-3">
          {/* Coupon */}
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon"
              className="flex-1 px-2 py-1 border rounded"
            />
            <button
              onClick={applyCoupon}
              className="px-3 py-1 bg-emerald-600 text-white rounded"
            >
              Apply
            </button>
          </div>

          {/* Totals */}
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/checkout");
            }}
            disabled={cart.length === 0}
            className={`w-full py-2 rounded-md text-white font-semibold ${
              cart.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            Checkout
          </button>

          <button
            onClick={clearCart}
            className="w-full py-2 text-gray-600 border rounded-md"
          >
            Clear Cart
          </button>

          {/* Undo */}
          {lastRemoved && (
            <div className="flex justify-between items-center bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded">
              <span>{lastRemoved.name} removed</span>
              <button onClick={undoRemove} className="font-medium">
                Undo
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
