import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import {
  User,
  Phone,
  Mail,
  Edit2,
  Save,
  X,
  Shield,
  Package,
  Copy,
  Check,
  Home,
  Truck,
  LogOut
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [copiedToDelivery, setCopiedToDelivery] = useState(false);
  const [useHomeAsDelivery, setUseHomeAsDelivery] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API
      await axiosClient.post("/user/logout").catch(() => {
        // Ignore API errors
      });

      // Use auth context logout
      logout();

      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      // Even if there's an error, user should be logged out
      logout();
      navigate("/login", { replace: true });
      toast.error("Logged out");
    }
  };

  const [user, setUser] = useState({
    username: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Bangladesh"
    },
    deliveryAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Bangladesh"
    }
  });

  const [editData, setEditData] = useState({
    username: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Bangladesh"
    },
    deliveryAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Bangladesh"
    }
  });

  const [errors, setErrors] = useState({});

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/user/profile");
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        setEditData({
          username: userData.username || "",
          phone: userData.phone || "",
          address: userData.address || {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "Bangladesh"
          },
          deliveryAddress: userData.deliveryAddress || {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "Bangladesh"
          }
        });
        // Check if delivery address matches home address
        if (userData.deliveryAddress && userData.address &&
          JSON.stringify(userData.deliveryAddress) === JSON.stringify(userData.address)) {
          setUseHomeAsDelivery(true);
        }
      } else {
        toast.error(res.data.message || "Failed to fetch profile");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Please login to view profile");
        navigate("/login");
      } else {
        toast.error("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  // Handle basic info edit change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setEditData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setEditData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle delivery address edit change
  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      deliveryAddress: { ...prev.deliveryAddress, [name]: value }
    }));
    if (errors[`delivery.${name}`]) {
      setErrors(prev => ({ ...prev, [`delivery.${name}`]: "" }));
    }
  };

  // Toggle use home address as delivery
  const toggleUseHomeAsDelivery = (e) => {
    const checked = e.target.checked;
    setUseHomeAsDelivery(checked);
    if (checked) {
      setEditData(prev => ({
        ...prev,
        deliveryAddress: { ...prev.address }
      }));
    }
  };

  // Copy home address to delivery address
  const copyAddressToDelivery = () => {
    setEditData(prev => ({
      ...prev,
      deliveryAddress: { ...prev.address }
    }));
    setCopiedToDelivery(true);
    setTimeout(() => setCopiedToDelivery(false), 2000);
    toast.success("Home address copied to delivery address");
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return "No address";
    return [addr.street, addr.city, addr.state, addr.postalCode, addr.country]
      .filter(Boolean)
      .join(", ");
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!editData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!editData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (editData.phone && !/^\d{10,15}$/.test(editData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate delivery address
  const validateDeliveryForm = () => {
    const newErrors = {};

    if (!editData.deliveryAddress.street.trim()) {
      newErrors["delivery.street"] = "Street address is required";
    }
    if (!editData.deliveryAddress.city.trim()) {
      newErrors["delivery.city"] = "City is required";
    }
    if (!editData.deliveryAddress.state.trim()) {
      newErrors["delivery.state"] = "State/District is required";
    }
    if (!editData.deliveryAddress.postalCode.trim()) {
      newErrors["delivery.postalCode"] = "Postal code is required";
    }
    if (!editData.deliveryAddress.country.trim()) {
      newErrors["delivery.country"] = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save all (profile + delivery address)
  const saveAll = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required profile fields");
      return;
    }

    if (!useHomeAsDelivery && !validateDeliveryForm()) {
      toast.error("Please fill in all required delivery address fields");
      return;
    }

    try {
      setSaving(true);

      // Save basic info
      const basicRes = await axiosClient.put("/user/updatebasicaddress", {
        username: editData.username,
        phone: editData.phone,
        address: editData.address
      });

      if (!basicRes.data.success) {
        toast.error(basicRes.data.message || "Failed to update profile");
        return;
      }

      // Save delivery address (only if not using home address)
      if (!useHomeAsDelivery) {
        const deliveryRes = await axiosClient.put("/user/deleveryaddress", editData.deliveryAddress);

        if (!deliveryRes.data.success) {
          toast.error(deliveryRes.data.message || "Failed to update delivery address");
          return;
        }
      }

      toast.success("All changes saved successfully!");
      setUser(prev => ({
        ...prev,
        username: editData.username,
        phone: editData.phone,
        address: editData.address,
        deliveryAddress: useHomeAsDelivery ? editData.address : editData.deliveryAddress
      }));
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditData({
      username: user.username || "",
      phone: user.phone || "",
      address: user.address || {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Bangladesh"
      },
      deliveryAddress: user.deliveryAddress || {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Bangladesh"
      }
    });
    setUseHomeAsDelivery(false);
    setErrors({});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 lg:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{user.username || "User"}</h1>
                <p className="text-white/80 text-sm sm:text-base truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{user.phone || "No phone"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 self-start sm:self-center whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm mb-4 sm:mb-6 overflow-hidden">
          <div className="border-b grid grid-cols-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 lg:py-4 font-medium transition-colors text-xs sm:text-sm lg:text-base ${activeTab === "profile"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                : "text-gray-500 hover:text-emerald-600 hover:bg-gray-50"
                }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span >Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 lg:py-4 font-medium transition-colors text-xs sm:text-sm lg:text-base ${activeTab === "orders"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                : "text-gray-500 hover:text-emerald-600 hover:bg-gray-50"
                }`}
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              <span >Orders</span>
            </button>
          </div>
        </div>

        {/* Profile Tab - Now includes all address information */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gray-50">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm sm:text-base"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex flex-col xs:flex-row gap-2 w-full xs:w-auto">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={saveAll}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 text-sm"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden xs:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span className="hidden xs:inline">Save All</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6">
              {/* Basic Information Section */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {/* Username */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Username *
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          name="username"
                          value={editData.username}
                          onChange={handleEditChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm ${errors.username ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-emerald-300"
                            }`}
                          placeholder="Enter your username"
                        />
                        {errors.username && (
                          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.username}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl text-sm">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{user.username || "—"}</span>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Phone Number *
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          value={editData.phone}
                          onChange={handleEditChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm ${errors.phone ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-emerald-300"
                            }`}
                          placeholder="Enter phone number"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl text-sm">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{user.phone || "—"}</span>
                      </div>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl text-sm">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{user.email || "—"}</span>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Account Status
                    </label>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl text-sm">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isVerified
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {user.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home Address Section */}
              <div className="border-t pt-6 sm:pt-8 mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Home Address
                </h3>
                {!isEditing && user.address && (user.address.street || user.address.city) && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 flex items-center gap-2">
                      <Home className="w-4 h-4 text-blue-600" />
                      Current address:
                    </p>
                    <p className="text-sm sm:text-base text-gray-700 font-medium">{formatAddress(user.address)}</p>
                  </div>
                )}

                {isEditing && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address.street"
                        value={editData.address.street}
                        onChange={handleEditChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-300 transition-all text-sm"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={editData.address.city}
                        onChange={handleEditChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-300 transition-all text-sm"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        State/District
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        value={editData.address.state}
                        onChange={handleEditChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-300 transition-all text-sm"
                        placeholder="Enter state/district"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="address.postalCode"
                        value={editData.address.postalCode}
                        onChange={handleEditChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-300 transition-all text-sm"
                        placeholder="Enter postal code"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        name="address.country"
                        value={editData.address.country}
                        onChange={handleEditChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-300 transition-all text-sm"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address Section */}
              <div className="border-t pt-6 sm:pt-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  Delivery Address
                </h3>

                {!isEditing && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-600" />
                      Current delivery address:
                    </p>
                    {useHomeAsDelivery ? (
                      <>
                        <p className="text-sm sm:text-base text-gray-700 font-medium">{formatAddress(user.address)}</p>
                        <p className="text-xs sm:text-sm text-purple-600 mt-1 sm:mt-2 flex items-center gap-1">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" /> Using your home address
                        </p>
                      </>
                    ) : (
                      <p className="text-sm sm:text-base text-gray-700 font-medium">{formatAddress(user.deliveryAddress)}</p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div>
                    {/* Toggle Options */}
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg sm:rounded-xl border border-purple-200">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                          <input
                            type="checkbox"
                            id="useHomeAsDelivery"
                            checked={useHomeAsDelivery}
                            onChange={toggleUseHomeAsDelivery}
                            className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer mt-0.5 sm:mt-0"
                          />
                          <label htmlFor="useHomeAsDelivery" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                            <Check className={`w-4 h-4 ${useHomeAsDelivery ? 'text-green-600' : 'text-gray-400'}`} />
                            Use my home address as delivery address
                          </label>
                        </div>
                        <p className="text-xs text-gray-600 ml-6 sm:ml-7">Select this if deliveries should go to your home address</p>
                      </div>
                    </div>

                    {/* Copy Button */}
                    {!useHomeAsDelivery && (
                      <button
                        onClick={copyAddressToDelivery}
                        type="button"
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm font-medium transition w-full sm:w-auto ${copiedToDelivery
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                          }`}
                      >
                        {copiedToDelivery ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy home address
                          </>
                        )}
                      </button>
                    )}

                    {/* Delivery Address Fields */}
                    {!useHomeAsDelivery && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                        <div className="sm:col-span-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            name="street"
                            value={editData.deliveryAddress.street}
                            onChange={handleDeliveryChange}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${errors["delivery.street"] ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-emerald-300"
                              }`}
                            placeholder="Enter delivery street address"
                          />
                          {errors["delivery.street"] && (
                            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors["delivery.street"]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={editData.deliveryAddress.city}
                            onChange={handleDeliveryChange}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${errors["delivery.city"] ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-emerald-300"
                              }`}
                            placeholder="Enter city"
                          />
                          {errors["delivery.city"] && (
                            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors["delivery.city"]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            State/District *
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={editData.deliveryAddress.state}
                            onChange={handleDeliveryChange}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${errors["delivery.state"] ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-emerald-300"
                              }`}
                            placeholder="Enter state/district"
                          />
                          {errors["delivery.state"] && (
                            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors["delivery.state"]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={editData.deliveryAddress.postalCode}
                            onChange={handleDeliveryChange}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${errors["delivery.postalCode"] ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-emerald-300"
                              }`}
                            placeholder="Enter postal code"
                          />
                          {errors["delivery.postalCode"] && (
                            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors["delivery.postalCode"]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Country *
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={editData.deliveryAddress.country}
                            onChange={handleDeliveryChange}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${errors["delivery.country"] ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-emerald-300"
                              }`}
                            placeholder="Enter country"
                          />
                          {errors["delivery.country"] && (
                            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors["delivery.country"]}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <OrdersTab user={user} />
        )}
      </div>
    </div>
  );
}

// Orders Tab Component
function OrdersTab({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login to view your orders");
          setLoading(false);
          return;
        }

        const res = await axiosClient.get("/order/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setOrders(res.data.orders || []);
        } else {
          setError(res.data.message || "Failed to fetch orders");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Please login to view your orders");
        } else {
          setError("Failed to load orders");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      processing: "bg-indigo-100 text-indigo-700",
      shipped: "bg-purple-100 text-purple-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">
            {error.includes("login") ? "Login Required" : "Error"}
          </h3>
          <p className="text-gray-500 text-sm sm:text-base mb-4">{error}</p>
          <button
            onClick={() => navigate(error.includes("login") ? "/login" : "/products")}
            className="px-4 sm:px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm sm:text-base"
          >
            {error.includes("login") ? "Login" : "Browse Products"}
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">No Orders Yet</h3>
          <p className="text-gray-500 text-sm sm:text-base mb-4">Start shopping to see your orders here</p>
          <button
            onClick={() => navigate("/products")}
            className="px-4 sm:px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm sm:text-base"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b bg-gray-50">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">My Orders</h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="divide-y">
        {orders.map((order) => (
          <div key={order._id} onClick={() => navigate(`/order/${order.orderId}`)} className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{order.orderId}</h3>
                  <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Ordered on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right sm:text-right">
                <p className="text-base sm:text-lg font-semibold text-emerald-600">৳{order.totalAmount?.toFixed(2)}</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
              {order.items?.slice(0, 5).map((item, idx) => (
                <img
                  key={idx}
                  src={item.image?.startsWith('http') ? item.image : `${import.meta.env.VITE_BACKEND_URL}${item.image}`}
                  alt={item.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="10" dy=".3em">Item</text></svg>';
                  }}
                />
              ))}
              {order.items?.length > 5 && (
                <div className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm text-gray-500">+{order.items.length - 5}</span>
                </div>
              )}
            </div>

            {/* Shipping Address & Payment */}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-gray-500 font-medium">Shipping Address</p>
                <p className="text-gray-700 mt-0.5">
                  {order.shippingAddress?.street}, {order.shippingAddress?.city}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Payment</p>
                <p className="text-gray-700 mt-0.5 capitalize">
                  {order.paymentMethod?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Click for more order details
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

