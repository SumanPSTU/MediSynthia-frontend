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

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify/:token" element={<EmailVerify />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />        
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/order/:orderId" element={<OrderDetails />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/aboutUs" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<Faqs />} />
      </Routes>
    </ErrorBoundary>
  );
}
