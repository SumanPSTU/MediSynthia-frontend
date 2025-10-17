import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../context/CartContext";

export default function CheckoutPage() {
  const { cart } = useCart();
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState(null);
  const [form, setForm] = useState({});
  const [delivery, setDelivery] = useState("standard");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Simulate fetching user info from DB
    setTimeout(() => {
      setUserInfo({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "01712345678",
        address: "123 Street, Dhaka, Bangladesh",
      });
    }, 500);
  }, []);

  useEffect(() => {
    if (userInfo) setForm(userInfo);
  }, [userInfo]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = delivery === "express" ? 80 : 40;
  const tax = subtotal * 0.05;
  const total = subtotal + shippingCost + tax;

  const handleNextStep = () => {
    if (step === 1) {
      // Step 1: Shipping info validation
      const { fullName, email, phone, address } = form;
      if (!fullName || !email || !phone || !address) {
        toast.error("Please complete all shipping fields before continuing!");
        return;
      }
    } else if (step === 2) {
      // Step 2: Delivery validation
      if (!delivery) {
        toast.error("Please select a delivery option!");
        return;
      }
    } else if (step === 3) {
      // Step 3: Payment validation
      const paymentSelected = document.querySelector(
        'input[name="payment"]:checked'
      );
      if (!paymentSelected) {
        toast.error("Please select a payment method!");
        return;
      }
    }

    // If validation passes, go to next step
    setStep((prev) => prev + 1);
  };

  const handlePlaceOrder = () => setShowConfirm(true);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center lg:text-left">Checkout</h1>

      {/* Progress Stepper */}
      <div className="flex justify-between mb-6 flex-wrap">
        {["Shipping", "Delivery", "Payment", "Review"].map((label, i) => (
          <div key={i} className="flex-1 text-center mb-3 sm:mb-0">
            <div
              className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-semibold transition-all ${step > i ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
            >
              {i + 1}
            </div>
            <p className="mt-2 text-sm">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE - Steps */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1 - Shipping */}
          {step === 1 && (
            <div className="bg-white p-6 rounded-2xl shadow-md w-full space-y-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Shipping Information</h2>

              {/* Recently Selected Products */}
              <div className="mt-2">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">
                  Recently Selected Products
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      name: "Wireless Headphones",
                      image: "https://source.unsplash.com/80x80/?headphones",
                      price: 59.99,
                      quantity: 1,
                    },
                    {
                      id: 2,
                      name: "Smart Watch",
                      image: "https://source.unsplash.com/80x80/?smartwatch",
                      price: 129.99,
                      quantity: 1,
                    },
                    {
                      id: 3,
                      name: "Gaming Mouse",
                      image: "https://source.unsplash.com/80x80/?mouse",
                      price: 39.99,
                      quantity: 1,
                    },
                    {
                      id: 4,
                      name: "Bluetooth Speaker",
                      image: "https://source.unsplash.com/80x80/?speaker",
                      price: 49.99,
                      quantity: 1,
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow hover:shadow-md transition-all flex-col sm:flex-row gap-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <div className="flex-1 text-center sm:text-left">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-emerald-600 font-bold">${item.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Form */}
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.fullName || ""}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <textarea
                  placeholder="Address"
                  value={form.address || ""}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={3}
                  className="p-3 border rounded-lg w-full sm:col-span-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                ></textarea>
              </form>

              {/* Continue Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-all duration-200"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2 - Delivery */}
          {step === 2 && (
            <div className="bg-white p-6 rounded-2xl shadow-md w-full space-y-6">
              <h2 className="text-xl font-semibold mb-4">Choose Delivery</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium">Standard Delivery</p>
                    <p className="text-sm text-gray-500">3-5 business days</p>
                  </div>
                  <input
                    type="radio"
                    checked={delivery === "standard"}
                    onChange={() => setDelivery("standard")}
                  />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium">Express Delivery</p>
                    <p className="text-sm text-gray-500">1-2 business days</p>
                  </div>
                  <input
                    type="radio"
                    checked={delivery === "express"}
                    onChange={() => setDelivery("express")}
                  />
                </label>
              </div>
              <div className="flex justify-between mt-6 flex-wrap gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg shadow hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-all duration-200"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Payment */}
          {step === 3 && (
            <div className="bg-white p-6 rounded-2xl shadow-md w-full space-y-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
                  <input type="radio" name="payment" value="card" />
                  <span>Credit / Debit Card</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
                  <input type="radio" name="payment" value="paypal" />
                  <span>PayPal</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
                  <input type="radio" name="payment" value="cod" />
                  <span>Cash on Delivery</span>
                </label>
              </div>
              <div className="flex justify-between mt-6 flex-wrap gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-300 rounded-lg shadow hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 4 - Review */}
          {step === 4 && (
            <div className="bg-white p-6 rounded-2xl shadow-md w-full space-y-6">
              <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>

              <div className="divide-y">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-4 flex-col sm:flex-row gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover shadow"
                      />
                      <div>
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-700">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t pt-4 space-y-2 text-gray-700">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping ({delivery})</span><span>${shippingCost}</span></div>
                <div className="flex justify-between"><span>Tax (5%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>

              <div className="flex justify-between mt-6 flex-wrap gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border border-gray-300 rounded-lg shadow hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700"
                >
                  Place Order
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Order Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-md lg:sticky lg:top-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center mb-3">
              <span>{item.name} (x{item.quantity})</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t mt-4 pt-4 space-y-2 text-gray-700">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>${shippingCost}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      {/* Confirm Modal (same as your original) */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-emerald-700">Confirm Your Order</h2>
            <div className="divide-y mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-4 text-gray-700">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${shippingCost}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
            <div className="flex justify-between mt-6 flex-wrap gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
              <button
                onClick={() => {
                  alert("🎉 Order Placed Successfully!");
                  setShowConfirm(false);
                }}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
