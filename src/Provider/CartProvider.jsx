// src/Provider/CartProvider.jsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export const CartContext = createContext(null);

const BASE_KEY = "thomview_cart_v1";

function safeParse(json) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function clampQty(qty) {
  const n = Number(qty);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(99, Math.floor(n)));
}

export default function CartProvider({ children, userKey, ready = true }) {
  // ✅ userKey must be stable: "guest" OR firebase uid
  const storageKey = `${BASE_KEY}:${userKey || "guest"}`;

  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // ✅ hydrate from localStorage whenever userKey changes (guest -> uid, uid -> guest, etc.)
  useEffect(() => {
    if (!ready) return; // wait for auth to finish

    const raw = localStorage.getItem(storageKey);
    const loaded = raw ? safeParse(raw) : [];
    setItems(loaded);
    setHydrated(true);
  }, [storageKey, ready]);

  // ✅ persist ONLY after hydration (prevents overwriting with [])
  useEffect(() => {
    if (!ready) return;
    if (!hydrated) return;

    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey, hydrated, ready]);

  const cartCount = useMemo(
    () => items.reduce((sum, it) => sum + clampQty(it.qty || 1), 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const price = Number(it.price || 0);
        const qty = clampQty(it.qty || 1);
        return sum + price * qty;
      }, 0),
    [items]
  );

  const addItem = useCallback((product, qty = 1) => {
    if (!product) return;
    const productId = product.productId || product._id || product.id;
    if (!productId) return;

    const nextQty = clampQty(qty);

    setItems((prev) => {
      const idx = prev.findIndex((p) => p.productId === productId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: clampQty((copy[idx].qty || 1) + nextQty) };
        return copy;
      }

      return [
        ...prev,
        {
          productId,
          slug: product.slug || "",
          name: product.name || "",
          image: product.image || "",
          price: Number(product.price || 0),
          oldPrice: product.oldPrice != null ? Number(product.oldPrice) : undefined,
          inStock: product.inStock !== false,
          qty: nextQty,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const setQty = useCallback((productId, qty) => {
    const nextQty = clampQty(qty);
    setItems((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, qty: nextQty } : p))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const clearCartStorage = useCallback(() => {
    localStorage.removeItem(storageKey);
    setItems([]);
  }, [storageKey]);

  const value = useMemo(
    () => ({
      items,
      cartCount,
      subtotal,
      addItem,
      removeItem,
      setQty,
      clearCart,
      clearCartStorage,
      hydrated,
      storageKey,
    }),
    [items, cartCount, subtotal, addItem, removeItem, setQty, clearCart, clearCartStorage, hydrated, storageKey]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
