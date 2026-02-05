import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const fetchCart = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return;
      }
      const res = await axiosClient.get("/cart");
      if (res.data.success && res.data.cart) {
        setCart(res.data.cart?.items || []);
        setTotalPrice(res.data.cart?.totalPrice || 0);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        // User not authenticated, cart not loaded
      }
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (product) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast("Please login to add items to cart", { icon: "ℹ️" });
      return;
    }
    
    try {
      const res = await axiosClient.post("/cart", {
        productId: product.productId,
        quantity: product.quantity || 1
      });
      if (res.data.success) {
        setCart(res.data.cart.items);
        setTotalPrice(res.data.cart.totalPrice);
        toast.success(`${product.name} added to cart!`);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast("Please login to add items to cart", { icon: "ℹ️" });
      } else if (err.response?.status === 404) {
        toast.error("Cart service not available");
      } else {
        toast.error("Failed to add to cart");
      }
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await axiosClient.delete(`/cart/item/${itemId}`);
      if (res.data.success) {
        setCart(res.data.cart.items);
        setTotalPrice(res.data.cart.totalPrice);
        toast.success("Item removed from cart");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast("Please login to manage cart", { icon: "ℹ️" });
      } else {
        toast.error("Failed to remove item");
      }
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await axiosClient.put(`/cart/item/${itemId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.cart.items);
        setTotalPrice(res.data.cart.totalPrice);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast("Please login to manage cart", { icon: "ℹ️" });
      } else {
        toast.error("Failed to update quantity");
      }
    }
  };

  const clearCart = async () => {
    try {
      const res = await axiosClient.delete("/cart");
      if (res.data.success) {
        setCart([]);
        setTotalPrice(0);
        toast.success("Cart cleared");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast("Please login to manage cart", { icon: "ℹ️" });
      } else {
        toast.error("Failed to clear cart");
      }
    }
  };

  return (
    <CartContext.Provider value={{ cart, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
