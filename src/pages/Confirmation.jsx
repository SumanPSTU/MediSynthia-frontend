import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Package, MapPin, CreditCard, Calendar, Truck, Clock, ArrowRight } from "lucide-react";

export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(30);
  
  // Get order details from navigation state
  const orderDetails = location.state?.orderDetails;

  // Auto-redirect to profile after 30 seconds
  useEffect(() => {
    setCountdown(30);
    const timer = setTimeout(() => {
      navigate("/profile?tab=orders", { replace: true });
    }, 30000);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  // If no order details, show loading or redirect
  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
          <button
            onClick={() => navigate("/profile?tab=orders")}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Go to My Orders
          </button>
        </div>
      </div>
    );
  }

  const { orderId, totalAmount, shippingAddress, paymentMethod, items } = orderDetails;

  return (
    <div className="pt-[var(--navbar-height)] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-6 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
              <CheckCircle className="w-14 h-14 md:w-16 md:h-16 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">Order Confirmed!</h1>
          <p className="text-gray-600 text-base md:text-lg">Thank you for your purchase. Your order has been successfully placed.</p>
        </div>

        {/* Main Order Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100">
          {/* Header with Order ID and Amount */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 md:p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="flex flex-col">
                <span className="text-emerald-100 text-sm font-medium uppercase tracking-wide mb-2">Order ID</span>
                <span className="text-2xl md:text-3xl font-bold font-mono break-all">{orderId}</span>
              </div>
              <div className="flex flex-col md:text-right">
                <span className="text-emerald-100 text-sm font-medium uppercase tracking-wide mb-2">Total Amount</span>
                <span className="text-2xl md:text-3xl font-bold">
                  ৳{totalAmount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 md:p-8 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Package className="w-6 h-6 text-emerald-600" />
              Ordered Items ({items?.length || 0})
            </h2>
            <div className="space-y-4">
              {items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition">
                  <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={item.image?.startsWith('http') ? item.image : `${import.meta.env.VITE_BACKEND_URL}${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="10" dy=".3em">Product</text></svg>';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-base md:text-lg">{item.name}</p>
                    <p className="text-gray-600 text-sm mt-1">Quantity: <span className="font-medium">{item.quantity}</span> × <span className="font-medium">৳{item.price.toFixed(2)}</span></p>
                    <p className="text-emerald-600 font-semibold mt-2 text-base">
                      ৳{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6 md:p-8 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-emerald-600" />
              Delivery Address
            </h2>
            <div className="bg-emerald-50 rounded-xl p-4 md:p-6 border border-emerald-200">
              <p className="text-gray-700 text-base md:text-lg font-medium">{shippingAddress?.street}</p>
              <p className="text-gray-600 text-base mt-2">
                {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.zipCode}
              </p>
              <p className="text-gray-600 text-base">{shippingAddress?.country}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-6 md:p-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              Payment Method
            </h2>
            <div className="inline-block px-4 md:px-6 py-3 bg-blue-50 text-blue-700 rounded-lg font-semibold capitalize border border-blue-200">
              {paymentMethod?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border-2 border-emerald-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-gray-800">Order Placed</h3>
            </div>
            <p className="text-gray-600 text-sm">Your order has been confirmed</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-gray-800">Processing</h3>
            </div>
            <p className="text-gray-600 text-sm">We're preparing your order</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-6 h-6 text-purple-600" />
              <h3 className="font-bold text-gray-800">On the Way</h3>
            </div>
            <p className="text-gray-600 text-sm">Delivery coming soon</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-6 md:p-8 border-2 border-emerald-200">
          <div className="flex items-start gap-4">
            <Calendar className="w-7 h-7 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">What's Next?</h3>
              <ul className="space-y-2 text-gray-700 text-sm md:text-base">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                  You'll receive a confirmation email shortly with your order details
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                  Track your order from your account dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                  Expected delivery within 3-5 business days
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/products")}
            className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:shadow-lg transition font-semibold text-base md:text-lg flex items-center justify-center gap-2 transform hover:scale-105"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/profile?tab=orders")}
            className="px-6 md:px-8 py-3 md:py-4 border-2 border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition font-semibold text-base md:text-lg transform hover:scale-105"
          >
            View My Orders
          </button>
        </div>

        {/* Auto-redirect message */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm md:text-base">
            Redirecting to your orders in <span className="font-bold text-emerald-600">{countdown}s</span>...
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 max-w-xs mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-green-600 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 30) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

