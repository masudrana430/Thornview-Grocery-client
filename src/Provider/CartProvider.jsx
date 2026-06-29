// src/Provider/CartProvider.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CartContext } from "../context/CartContext";

const BASE_KEY = "thomview_cart_v1";

function safeParse(json) {
  try {
    const parsed = JSON.parse(json);

    return Array.isArray(parsed)
      ? parsed.filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function clampQty(qty) {
  const parsedQty = Number(qty);

  if (!Number.isFinite(parsedQty)) {
    return 1;
  }

  return Math.max(
    1,
    Math.min(99, Math.floor(parsedQty))
  );
}

function normalizeProductId(productId) {
  if (productId === null || productId === undefined) {
    return "";
  }

  return String(productId);
}

export default function CartProvider({
  children,
  userKey = "guest",
  ready = true,
}) {
  const storageKey = `${BASE_KEY}:${userKey || "guest"}`;

  const [items, setItems] = useState([]);

  /*
   * Store the exact key that has completed hydration.
   * This prevents the previous user's cart from being written
   * into a newly selected storage key.
   */
  const [hydratedKey, setHydratedKey] = useState(null);

  useEffect(() => {
    if (!ready) {
      setHydratedKey(null);
      return;
    }

    const rawCart = localStorage.getItem(storageKey);
    const loadedItems = rawCart
      ? safeParse(rawCart)
      : [];

    setItems(loadedItems);
    setHydratedKey(storageKey);
  }, [storageKey, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (hydratedKey !== storageKey) {
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(items)
    );
  }, [
    items,
    storageKey,
    hydratedKey,
    ready,
  ]);

  const hydrated =
    ready && hydratedKey === storageKey;

  const cartCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + clampQty(item.qty ?? 1),
        0
      ),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const price = Number(item.price ?? 0);
        const qty = clampQty(item.qty ?? 1);

        return total + price * qty;
      }, 0),
    [items]
  );

  const addItem = useCallback(
    (product, qty = 1) => {
      if (!product) {
        return;
      }

      const productId = normalizeProductId(
        product.productId ??
          product._id ??
          product.id ??
          product.slug
      );

      if (!productId) {
        console.error(
          "Cannot add product: product ID is missing",
          product
        );
        return;
      }

      const quantityToAdd = clampQty(qty);

      setItems((previousItems) => {
        const existingIndex =
          previousItems.findIndex(
            (item) =>
              normalizeProductId(item.productId) ===
              productId
          );

        if (existingIndex >= 0) {
          return previousItems.map(
            (item, index) => {
              if (index !== existingIndex) {
                return item;
              }

              return {
                ...item,
                qty: clampQty(
                  Number(item.qty ?? 1) +
                    quantityToAdd
                ),
              };
            }
          );
        }

        const image =
          product.image ??
          product.images?.[0] ??
          "";

        return [
          ...previousItems,
          {
            productId,
            slug: product.slug ?? "",
            name:
              product.name ??
              product.title ??
              "Product",
            image,
            price: Number(product.price ?? 0),

            oldPrice:
              product.oldPrice !== null &&
              product.oldPrice !== undefined
                ? Number(product.oldPrice)
                : undefined,

            inStock: product.inStock !== false,
            qty: quantityToAdd,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((productId) => {
    const normalizedId =
      normalizeProductId(productId);

    setItems((previousItems) =>
      previousItems.filter(
        (item) =>
          normalizeProductId(item.productId) !==
          normalizedId
      )
    );
  }, []);

  const setQty = useCallback(
    (productId, qty) => {
      const normalizedId =
        normalizeProductId(productId);

      const nextQty = clampQty(qty);

      setItems((previousItems) =>
        previousItems.map((item) =>
          normalizeProductId(item.productId) ===
          normalizedId
            ? {
                ...item,
                qty: nextQty,
              }
            : item
        )
      );
    },
    []
  );

  const incQty = useCallback((productId) => {
    const normalizedId =
      normalizeProductId(productId);

    setItems((previousItems) =>
      previousItems.map((item) =>
        normalizeProductId(item.productId) ===
        normalizedId
          ? {
              ...item,
              qty: clampQty(
                Number(item.qty ?? 1) + 1
              ),
            }
          : item
      )
    );
  }, []);

  const decQty = useCallback((productId) => {
    const normalizedId =
      normalizeProductId(productId);

    setItems((previousItems) =>
      previousItems.map((item) =>
        normalizeProductId(item.productId) ===
        normalizedId
          ? {
              ...item,
              qty: clampQty(
                Number(item.qty ?? 1) - 1
              ),
            }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const clearCartStorage = useCallback(() => {
    localStorage.removeItem(storageKey);
    setItems([]);
  }, [storageKey]);

  /*
   * Refresh cart information from recently loaded products.
   *
   * Accepts:
   *   new Map([["productId", product]])
   *
   * or:
   *   { productId: product }
   */
  const hydrateCartByProductsMap = useCallback(
    (productsMap) => {
      if (!productsMap) {
        return;
      }

      setItems((previousItems) =>
        previousItems.map((item) => {
          const productId =
            normalizeProductId(item.productId);

          const product =
            productsMap instanceof Map
              ? productsMap.get(productId)
              : productsMap[productId];

          if (!product) {
            return item;
          }

          return {
            ...item,

            slug:
              product.slug ??
              item.slug ??
              "",

            name:
              product.name ??
              product.title ??
              item.name,

            image:
              product.image ??
              product.images?.[0] ??
              item.image,

            price:
              product.price !== undefined
                ? Number(product.price)
                : item.price,

            oldPrice:
              product.oldPrice !== undefined &&
              product.oldPrice !== null
                ? Number(product.oldPrice)
                : item.oldPrice,

            inStock:
              product.inStock === undefined
                ? item.inStock
                : product.inStock !== false,
          };
        })
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      items,
      cartCount,
      subtotal,

      addItem,
      removeItem,
      setQty,

      incQty,
      decQty,

      clearCart,
      clearCartStorage,
      hydrateCartByProductsMap,

      hydrated,
      storageKey,
    }),
    [
      items,
      cartCount,
      subtotal,
      addItem,
      removeItem,
      setQty,
      incQty,
      decQty,
      clearCart,
      clearCartStorage,
      hydrateCartByProductsMap,
      hydrated,
      storageKey,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}