import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  Calendar,
  AlertCircle,
  Check,
  XCircle,
  Edit2,
  Save,
  X,
} from "lucide-react";

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const BACKEND_URL = axiosClient.defaults.baseURL || "http://localhost:3000";

  // Edit states
  const [isAddressEditing, setIsAddressEditing] = useState(false);
  const [isItemsEditing, setIsItemsEditing] = useState(false);
  const [editData, setEditData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  });
  const [editItems, setEditItems] = useState([]);
  const [saving, setSaving] = useState(false);

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/order/orders/${orderId}`);
      if (res.data.success) {
        setOrder(res.data.order);
        // Initialize edit data with current shipping address
        setEditData({
          street: res.data.order.shippingAddress?.street || "",
          city: res.data.order.shippingAddress?.city || "",
          state: res.data.order.shippingAddress?.state || "",
          zipCode: res.data.order.shippingAddress?.zipCode || "",
          country: res.data.order.shippingAddress?.country || ""
        });
        // Initialize edit items with current order items
        setEditItems(res.data.order.items?.map(item => ({
          _id: item._id,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        })) || []);
      } else {
        toast.error(res.data.message || "Failed to fetch order details");
        navigate("/profile?tab=orders");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Order not found");
        navigate("/profile?tab=orders");
      } else {
        toast.error("Failed to load order details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Cancel order
  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const res = await axiosClient.put(`/order/orders/${orderId}`, {
        orderStatus: "Cancelled"
      });
      if (res.data.success) {
        toast.success("Order cancelled successfully");
        setOrder(res.data.order);
        setShowCancelModal(false);
      } else {
        toast.error(res.data.message || "Failed to cancel order");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  // Handle edit change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save address changes
  const handleSaveAddress = async () => {
    if (!editData.street || !editData.city || !editData.state || !editData.zipCode || !editData.country) {
      toast.error("All address fields are required");
      return;
    }

    try {
      setSaving(true);
      const res = await axiosClient.put(`/order/orders/${orderId}/address`, {
        shippingAddress: {
          street: editData.street,
          city: editData.city,
          state: editData.state,
          zipCode: editData.zipCode,
          country: editData.country
        }
      });
      
      if (res.data.success) {
        setOrder(res.data.order);
        toast.success("Shipping address updated successfully");
        setIsAddressEditing(false);
      } else {
        toast.error(res.data.message || "Failed to update address");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update address");
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditData({
      street: order.shippingAddress?.street || "",
      city: order.shippingAddress?.city || "",
      state: order.shippingAddress?.state || "",
      zipCode: order.shippingAddress?.zipCode || "",
      country: order.shippingAddress?.country || ""
    });
    setIsAddressEditing(false);
  };

  // Handle items edit change
  const handleItemQuantityChange = (index, newQuantity) => {
    const qty = Math.max(1, parseInt(newQuantity) || 1);
    setEditItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: qty };
      return updated;
    });
  };

  // Remove item from edit list
  const handleRemoveItem = (index) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save items changes
  const handleSaveItems = async () => {
    if (editItems.length === 0) {
      toast.error("Order must have at least one item");
      return;
    }

    try {
      setSaving(true);
      const res = await axiosClient.put(`/order/orders/${orderId}/items`, {
        items: editItems
      });
      
      if (res.data.success) {
        setOrder(res.data.order);
        toast.success("Order items updated successfully");
        setIsItemsEditing(false);
      } else {
        toast.error(res.data.message || "Failed to update items");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update items");
    } finally {
      setSaving(false);
    }
  };

  // Cancel items edit
  const handleCancelItemsEdit = () => {
    setEditItems(order.items?.map(item => ({
      _id: item._id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image
    })) || []);
    setIsItemsEditing(false);
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-700",
      Confirmed: "bg-blue-100 text-blue-700",
      Processing: "bg-indigo-100 text-indigo-700",
      Shipped: "bg-purple-100 text-purple-700",
      Delivered: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <Check className="w-5 h-5" />;
      case "Cancelled":
        return <XCircle className="w-5 h-5" />;
      case "Shipped":
        return <Truck className="w-5 h-5" />;
      case "Processing":
        return <Package className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 lg:py-8 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Order Not Found</h2>
            <p className="text-gray-500 text-sm sm:text-base">The order you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const canCancel = order.orderStatus !== "Cancelled" && order.orderStatus !== "Delivered" && order.orderStatus !== "Shipped";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4 sm:mb-6 text-sm sm:text-base transition"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Orders
        </button>

        {/* Order Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 text-white shadow-lg mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold break-words">{order.orderId}</h1>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                Ordered on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusIcon(order.orderStatus)}
              <span className={`px-3 py-1.5 rounded-full font-semibold text-xs sm:text-base ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Order Items
                </h2>
                {!isItemsEditing && order.orderStatus !== "Delivered" && order.orderStatus !== "Shipped" && order.orderStatus !== "Cancelled" && (
                  <button
                    onClick={() => setIsItemsEditing(true)}
                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {!isItemsEditing ? (
                <div className="space-y-3 sm:space-y-4">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl hover:shadow-md transition">
                      {/* Item Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image?.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="12" dy=".3em">No Image</text></svg>';
                          }}
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                          {item.name}
                        </h3>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Qty: {item.quantity}</p>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-lg sm:text-xl font-bold text-emerald-600">
                            ৳{(item.price * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-400">
                            ৳{item.price.toFixed(2)} each
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-emerald-200 rounded-lg sm:rounded-xl bg-emerald-50">
                      {/* Item Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image?.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="12" dy=".3em">No Image</text></svg>';
                          }}
                        />
                      </div>

                      {/* Item Edit Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                          {item.name}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-gray-600 text-xs sm:text-sm">Quantity:</label>
                          <div className="flex items-center gap-1 bg-white rounded border border-gray-300">
                            <button
                              onClick={() => handleItemQuantityChange(idx, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-gray-100 transition"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                              min="1"
                              className="w-12 text-center border-none outline-none text-sm"
                            />
                            <button
                              onClick={() => handleItemQuantityChange(idx, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-gray-100 transition"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-lg sm:text-xl font-bold text-emerald-600">
                            ৳{(item.price * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-400">
                            ৳{item.price.toFixed(2)} each
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium mt-2 transition"
                        >
                          Remove Item
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Save/Cancel Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={handleCancelItemsEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveItems}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Shipping Address
                </h2>
                {!isAddressEditing && order.orderStatus !== "Delivered" && order.orderStatus !== "Shipped" && order.orderStatus !== "Cancelled" && (
                  <button
                    onClick={() => setIsAddressEditing(true)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {!isAddressEditing ? (
                order.shippingAddress && (
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                    <p className="text-gray-700 text-sm sm:text-base">
                      <span className="font-semibold">{order.shippingAddress.street}</span>
                    </p>
                    <p className="text-gray-700 text-sm sm:text-base">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p className="text-gray-700 text-sm sm:text-base">
                      {order.shippingAddress.country}
                    </p>
                  </div>
                )
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      value={editData.street}
                      onChange={handleEditChange}
                      className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter street address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={editData.city}
                      onChange={handleEditChange}
                      className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State/District *</label>
                    <input
                      type="text"
                      name="state"
                      value={editData.state}
                      onChange={handleEditChange}
                      className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter state/district"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={editData.zipCode}
                      onChange={handleEditChange}
                      className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter postal code"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={editData.country}
                      onChange={handleEditChange}
                      className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter country"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAddress}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            {/* Summary Card */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-24 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>

              <div className="space-y-2 sm:space-y-3 text-sm pb-4 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-800">৳{(order.subtotal || (order.totalAmount - (order.deliveryCharge || 120)))?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery charge</span>
                  <span className="font-medium text-gray-800">৳{(order.deliveryCharge || 120).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 mb-3">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="text-lg sm:text-2xl font-bold text-emerald-600">
                  ৳{order.totalAmount?.toFixed(2)}
                </span>
              </div>

              {/* Payment Info */}
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  Payment
                </h3>
                <p className="text-gray-700 text-xs sm:text-sm capitalize">
                  {order.paymentMethod?.replace(/_/g, ' ')}
                </p>
                <p className={`text-xs sm:text-sm mt-1 px-2 py-1 rounded inline-block font-medium ${
                  order.paymentStatus === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : order.paymentStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                </p>
              </div>

              {/* Cancel Order Button */}
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full mt-4 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                >
                  Cancel Order
                </button>
              )}

              {order.orderStatus === "Cancelled" && (
                <div className="w-full mt-4 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg text-center font-medium text-sm border border-red-200">
                  This order has been cancelled
                </div>
              )}

              {order.orderStatus === "Delivered" && (
                <div className="w-full mt-4 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-center font-medium text-sm border border-green-200">
                  ✓ Order Delivered
                </div>
              )}
            </div>

            {/* Additional Info */}
            {order.trackingNumber && (
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Tracking Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Tracking Number</p>
                    <p className="font-mono text-gray-800">{order.trackingNumber}</p>
                  </div>
                  {order.carrier && (
                    <div>
                      <p className="text-gray-600">Carrier</p>
                      <p className="text-gray-800 capitalize">{order.carrier}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Cancel Order?</h3>
            </div>

            <p className="text-gray-600 text-sm sm:text-base mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 text-sm"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cancelling...
                  </>
                ) : (
                  'Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
