
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCart } from "../context/CartContext";
import axiosClient from "../api/axiosClient";
import { Package, ShoppingBag, ChevronRight, Plus, MapPin, Truck, DollarSign, CheckCircle, AlertCircle, Home, MapPinIcon } from "lucide-react";

// Get backend URL from axiosClient configuration
const BACKEND_URL = axiosClient.defaults.baseURL || "http://localhost:3000";

export default function CheckoutPage() {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Selected items from cart
  const selectedItems = location.state?.selectedItems || [];

  // Address selection state
  const [selectedAddress, setSelectedAddress] = useState(null);

  // New address form state
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Bangladesh"
  });

  // Fetch user profile with addresses
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoadingUser(false);
          return;
        }
        const res = await axiosClient.get("/user/profile");
        if (res.data.success && res.data.data) {
          const user = res.data.data;
          setUserInfo(user);
          
          // Set initial address selection
          if (user.deliveryAddress && user.deliveryAddress.street) {
            setSelectedAddress(user.deliveryAddress);
          } else if (user.address && user.address.street) {
            setSelectedAddress(user.address);
          }
        }
      } catch (err) {
        // Silent catch - errors handled gracefully
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUserInfo();
  }, []);
  

  // Calculate totals
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 120;
  const total = subtotal + shipping;

  // Validate new address form
  const validateNewAddress = () => {
    const { street, city, state, zipCode } = newAddress;
    if (!street || !city || !state || !zipCode) {
      toast.error("Please fill all address fields");
      return false;
    }
    return true;
  };

  // Handle adding new address
  const handleAddNewAddress = () => {
    if (!validateNewAddress()) return;
    setSelectedAddress(newAddress);
    setShowNewAddressForm(false);
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select or create a delivery address");
      return;
    }

    setPlacingOrder(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to place an order");
        navigate("/login");
        return;
      }

      // If new address was created, save it first
      if (showNewAddressForm && newAddress.street) {
        try {
          // Ensure address has correct field names
          const addressToSave = {
            street: newAddress.street,
            city: newAddress.city,
            state: newAddress.state,
            zipCode: newAddress.zipCode,
            country: newAddress.country || "Bangladesh"
          };
          
          await axiosClient.put("/user/profile", {
            deliveryAddress: addressToSave
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (addressErr) {
          toast.warning("Address not saved to profile, but order will proceed");
        }
      }

      // Create order with selected items
      
      // Ensure address has correct field names (zipCode, not postalCode)
      const formattedAddress = {
        street: selectedAddress.street || "",
        city: selectedAddress.city || "",
        state: selectedAddress.state || "",
        zipCode: selectedAddress.zipCode || selectedAddress.postalCode || "",
        country: selectedAddress.country || "Bangladesh"
      };
      
      // Generate orderId if not present
      const generateOrderId = () => {
        return `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      };
      
      const res = await axiosClient.post("/order/orders", {
        orderId: generateOrderId(),
        items: selectedItems.map(item => ({
          productId: item._id || item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image
        })),
        shippingAddress: formattedAddress,
        paymentMethod: "cash_on_delivery"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const orderDetails = {
          orderId: res.data.order?.orderId || res.data.order?._id || `ORD${Date.now()}`,
          totalAmount: total,
          shippingAddress: selectedAddress,
          paymentMethod: "cash_on_delivery",
          items: selectedItems
        };
        
        setShowConfirm(false);
        toast.success("Order placed successfully!");
        navigate("/confirmation", { state: { orderDetails } });
      } else {
        const errorMsg = res.data.message || "Failed to place order";
        toast.error(errorMsg);
      }
    } catch (err) {
      // Error handling
      if (err.response) {
        const errorMessage = err.response.data?.message || `Server error (${err.response.status})`;
        toast.error(`Error: ${errorMessage}`);
      } else if (err.request) {
        toast.error("Network error. Check your connection.");
      } else {
        toast.error(err.message || "Failed to place order");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  // Helper to get image URL
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `${BACKEND_URL}${image}`;
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-4">Add some products to place an order</p>
          <button onClick={() => navigate("/products")} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[var(--navbar-height)] min-h-screen bg-gray-50 px-3 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Checkout</h1>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm inline-block">
            {selectedItems.length} items
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between mb-4 md:mb-6 overflow-x-auto pb-2">
          {["Shipping", "Review"].map((label, i) => (
            <div key={i} className="flex-1 text-center min-w-[100px]">
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-semibold transition-all ${
                step > i + 1 ? "bg-emerald-600 text-white" : 
                step === i + 1 ? "bg-emerald-500 text-white scale-110" : "bg-gray-200 text-gray-600"
              }`}>
                {step > i + 1 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (i + 1)}
              </div>
              <p className="mt-2 text-xs md:text-sm font-medium truncate">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
            {/* Step 1: Shipping (Products + Address) */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b bg-gray-50">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Order Items & Delivery Address</h2>
                </div>

                {/* Products Section */}
                <div className="p-4 md:p-6 border-b">
                  <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-700">Items for Order</h3>
                  <div className="space-y-3">
                    {selectedItems.map((item) => (
                      <div key={item._id || item.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl">
                        <div className="flex-shrink-0">
                          {getImageUrl(item.image) ? (
                            <img src={getImageUrl(item.image)} alt={item.name} className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shadow-sm" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-emerald-50 flex items-center justify-center shadow-sm" style={{ display: getImageUrl(item.image) ? 'none' : 'flex' }}>
                            <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <p className="font-medium text-gray-900 text-sm md:text-base truncate">{item.name}</p>
                          <p className="text-xs md:text-sm text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-emerald-600 font-semibold text-sm">৳{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address Selection */}
                <div className="p-4 md:p-6 border-b">
                  <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-700">Delivery Address</h3>
                  
                  <div className="space-y-3">
                    {/* Home Address Option */}
                    {userInfo?.address?.street && (
                      <div 
                        onClick={() => {
                          setSelectedAddress(userInfo.address);
                          setShowNewAddressForm(false);
                        }}
                        className={`p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-md ${
                          selectedAddress === userInfo.address ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input 
                              type="radio" 
                              checked={selectedAddress === userInfo.address}
                              onChange={() => setSelectedAddress(userInfo.address)}
                              className="w-5 h-5 text-emerald-600 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Home className="w-5 h-5 text-emerald-600" />
                              <p className="font-semibold text-gray-800">Home Address</p>
                            </div>
                            <p className="text-sm text-gray-600 ml-7">{userInfo.address.street}</p>
                            <p className="text-sm text-gray-600 ml-7">{userInfo.address.city}, {userInfo.address.state} {userInfo.address.zipCode}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Address Option */}
                    {userInfo?.deliveryAddress?.street && userInfo.deliveryAddress !== userInfo.address && (
                      <div 
                        onClick={() => {
                          setSelectedAddress(userInfo.deliveryAddress);
                          setShowNewAddressForm(false);
                        }}
                        className={`p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-md ${
                          selectedAddress === userInfo.deliveryAddress ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input 
                              type="radio" 
                              checked={selectedAddress === userInfo.deliveryAddress}
                              onChange={() => setSelectedAddress(userInfo.deliveryAddress)}
                              className="w-5 h-5 text-emerald-600 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Truck className="w-5 h-5 text-blue-600" />
                              <p className="font-semibold text-gray-800">Delivery Address</p>
                            </div>
                            <p className="text-sm text-gray-600 ml-7">{userInfo.deliveryAddress.street}</p>
                            <p className="text-sm text-gray-600 ml-7">{userInfo.deliveryAddress.city}, {userInfo.deliveryAddress.state} {userInfo.deliveryAddress.zipCode}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* New Address Form Toggle */}
                    {!showNewAddressForm && (!selectedAddress || (newAddress.street && selectedAddress === newAddress)) && (
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        className="w-full p-4 md:p-5 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 transition font-medium flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add New Address
                      </button>
                    )}
                  </div>

                  {/* New Address Form */}
                  {showNewAddressForm && (
                    <div className="mt-4 p-4 md:p-5 border-2 border-emerald-200 rounded-xl bg-emerald-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                        <input 
                          type="text" 
                          placeholder="Street Address *" 
                          value={newAddress.street} 
                          onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                          className="p-3 md:p-4 border border-gray-200 rounded-xl w-full sm:col-span-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm md:text-base"
                        />
                        <input 
                          type="text" 
                          placeholder="City *" 
                          value={newAddress.city} 
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          className="p-3 md:p-4 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none text-sm md:text-base"
                        />
                        <input 
                          type="text" 
                          placeholder="State/District *" 
                          value={newAddress.state} 
                          onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                          className="p-3 md:p-4 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none text-sm md:text-base"
                        />
                        <input 
                          type="text" 
                          placeholder="Postal Code *" 
                          value={newAddress.zipCode} 
                          onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                          className="p-3 md:p-4 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none text-sm md:text-base"
                        />
                        <input 
                          type="text" 
                          placeholder="Country" 
                          value={newAddress.country} 
                          onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
                          className="p-3 md:p-4 border border-gray-200 rounded-xl w-full sm:col-span-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm md:text-base"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleAddNewAddress}
                          className="flex-1 px-4 py-2 md:py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm md:text-base"
                        >
                          Use This Address
                        </button>
                        <button
                          onClick={() => setShowNewAddressForm(false)}
                          className="flex-1 px-4 py-2 md:py-3 border border-gray-300 rounded-xl hover:bg-gray-100 transition font-medium text-sm md:text-base"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                <div className="p-4 md:p-6 border-t bg-gray-50 flex justify-end">
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!selectedAddress}
                    className={`flex items-center gap-2 px-5 py-3 md:px-6 md:py-4 rounded-xl shadow font-medium text-sm md:text-base transition ${
                      !selectedAddress 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    Review Order <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review Order */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b bg-gray-50">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Review Your Order</h2>
                </div>

                {/* Shipping Address */}
                <div className="p-4 md:p-6 border-b">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-700">Delivery Address</h3>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-4 rounded-2xl text-sm md:text-base text-gray-700 border border-emerald-200">
                    <p className="font-medium text-gray-900 mb-2">{selectedAddress?.street}</p>
                    <p className="text-gray-600">{selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.zipCode}</p>
                    <p className="text-gray-600">{selectedAddress?.country}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 md:p-6 border-b">
                  <h3 className="font-semibold text-gray-700 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedItems.map((item) => (
                      <div key={item._id || item.id} className="flex items-center gap-3 md:gap-4">
                        <div className="flex-shrink-0">
                          {getImageUrl(item.image) ? (
                            <img src={getImageUrl(item.image)} alt={item.name} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover shadow-sm" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-emerald-50 flex items-center justify-center shadow-sm" style={{ display: getImageUrl(item.image) ? 'none' : 'flex' }}>
                            <ShoppingBag className="w-8 h-8 text-emerald-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate text-sm md:text-base">{item.name}</p>
                          <p className="text-xs md:text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-emerald-700 text-sm md:text-base">৳{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-4 md:p-6 space-y-3 text-sm md:text-base bg-gradient-to-b from-white to-gray-50">
                  <div className="flex justify-between text-gray-700 pb-2">
                    <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Subtotal</span>
                    <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 pb-2">
                    <span>Shipping</span>
                    <span className="font-semibold">৳{shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg md:text-xl pt-3 border-t-2 border-emerald-200">
                    <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" />Total</span>
                    <span className="text-emerald-600">৳{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700 mt-4 pt-3 border-t-2">
                    <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-600" />Payment Method</span>
                    <span className="font-medium text-blue-600">Cash on Delivery</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 md:p-6 border-t bg-gray-50 flex flex-col sm:flex-row justify-between gap-3">
                  <button onClick={() => setStep(1)} className="px-5 py-3 border border-gray-300 rounded-xl shadow hover:bg-gray-100 transition font-medium text-sm md:text-base">Back</button>
                  <button onClick={() => setShowConfirm(true)} className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition-all duration-200 font-medium text-sm md:text-base">Place Order <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <aside className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {selectedItems.map((item) => (
                  <div key={item._id || item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs md:text-sm text-gray-600 truncate max-w-[120px] md:max-w-[150px]">{item.name}</span>
                      <span className="text-xs text-gray-400">x{item.quantity}</span>
                    </div>
                    <span className="font-medium text-sm md:text-base">৳{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm md:text-base">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">৳{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-medium">৳{shipping.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-emerald-600">৳{total.toFixed(2)}</span></div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <h3 className="text-2xl font-bold text-gray-800">Confirm Order</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">Are you sure you want to place this order? Payment will be collected on delivery.</p>
            
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-5 rounded-2xl mb-6 border border-emerald-200">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-bold text-2xl text-emerald-600">৳{total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Payment on delivery • Secure checkout</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700">{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} will be delivered to your address</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={placingOrder}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition font-semibold text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Placing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
