// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useMemo } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Add item to cart
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id || i._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id || i._id === item._id
            ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  // Remove item completely
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id && i._id !== id));
  };

  // Update quantity
  const updateQuantity = (id, qty) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id || i._id === id ? { ...i, quantity: qty } : i
      )
    );
  };

  // Clear all cart
  const clearCart = () => setCart([]);

  // Calculate total price
  const totalPrice = useMemo(
    () => cart.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0),
    [cart]
  );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
