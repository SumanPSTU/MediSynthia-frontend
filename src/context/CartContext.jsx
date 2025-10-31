import React, { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  
  const fetchCart = async () => {
    try {
      const res = await axiosClient.get("/cart");
      if (res.data.success) setCart(res.data.cart.items);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const addToCart = async (product) => {
    try {
      const res = await axiosClient.post("/cart", {
        productId: product.productId,
        quantity: product.quantity
      });
      if (res.data.success) {
        setCart(res.data.cart.items);
        setTotalPrice(res.data.cart.totalPrice);
        toast.success(`${product.name} added to cart!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await axiosClient.delete(`/carts/cart/${itemId}`);
      if (res.data.success) {
        setCart(res.data.cart.items);
        setTotalPrice(res.data.cart.totalPrice);
        toast.success("Item removed from cart");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await axiosClient.put(`/carts/cart`, { itemId, quantity });
      if (res.data.success) {
        setCart(res.data.cart.items);
        setTotalPrice(res.data.cart.totalPrice);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quantity");
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
      console.error(err);
      toast.error("Failed to clear cart");
    }
  };

  return (
    <CartContext.Provider value={{ cart, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
