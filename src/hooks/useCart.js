// src/hooks/useCart.js

import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside <CartProvider />"
    );
  }

  const items = Array.isArray(context.items)
    ? context.items
    : [];

  const subtotal = Number(context.subtotal ?? 0);
  const cartCount = Number(context.cartCount ?? 0);

  const addItem =
    context.addItem ?? context.addToCart;

  const removeItem =
    context.removeItem ?? context.removeFromCart;

  return {
    // Direct/original API
    ...context,

    items,
    subtotal,
    cartCount,

    addItem,
    removeItem,
    setQty: context.setQty,
    clearCart: context.clearCart,
    clearCartStorage: context.clearCartStorage,

    incQty: context.incQty,
    decQty: context.decQty,

    hydrateCartByProductsMap:
      context.hydrateCartByProductsMap,

    hydrated: Boolean(context.hydrated),
    storageKey: context.storageKey,

    // Alternative normalized API
    cart: {
      items,
      subtotal,
      count: cartCount,
    },

    addToCart: addItem,
    removeFromCart: removeItem,

    isCartProviderAvailable: true,
  };
}