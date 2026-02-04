// src/context/CartContext.jsx
import { useContext, useMemo } from "react";
import CartProvider, { CartContext } from "../Provider/CartProvider";

// Re-export provider so you can import from /context if you want
export { CartProvider };

export function useCart() {
  const ctx = useContext(CartContext);

  // If provider missing, return a safe empty cart (prevents crash)
  if (!ctx) {
    return {
      cart: { items: [], subtotal: 0, count: 0 },
      addToCart: () => {},
      setQty: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
    };
  }

  const cart = useMemo(
    () => ({
      items: ctx.items,
      subtotal: ctx.subtotal,
      count: ctx.cartCount,
    }),
    [ctx.items, ctx.subtotal, ctx.cartCount]
  );

  return {
    cart,

    // map your provider actions to Walmart-style names
    addToCart: ctx.addItem,
    setQty: ctx.setQty,
    removeFromCart: ctx.removeItem,
    clearCart: ctx.clearCart,

    // optional extras
    incQty: ctx.incQty,
    decQty: ctx.decQty,
    hydrateCartByProductsMap: ctx.hydrateCartByProductsMap,
  };
}
