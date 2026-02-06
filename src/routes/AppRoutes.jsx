import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Products from "../pages/Products.jsx";
import ProductDetails from "../pages/ProductDetails.jsx";
import Cart from "../pages/Cart.jsx";
import Checkout from "../pages/Checkout.jsx";
import Confirmation from "../pages/Confirmation.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Profile from "../pages/Profile.jsx";
import OrderDetails from "../pages/OrderDetails.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import EmailVerify from "../pages/EmailVerify.jsx";
import ResendVerification from "../pages/ResendVerification.jsx";
import ErrorBoundary from '../pages/ErrorBoundary.jsx';
import AboutUs from '../pages/AboutUs.jsx';
import Contact from "../pages/Contact.jsx";
import Faqs from "../pages/Faqs.jsx";
import PrivateRoute from "../components/PrivateRoute.jsx";

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/verify/:token" element={<EmailVerify />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/aboutUs" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<Faqs />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/confirmation" element={<PrivateRoute><Confirmation /></PrivateRoute>} />
        <Route path="/order/:orderId" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
      </Routes>
    </ErrorBoundary>
  );
}
