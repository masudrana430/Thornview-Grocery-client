// src/Provider/AppProviders.jsx
import React from "react";
import { useAuth } from "./AuthProvider";
import CartProvider from "./CartProvider";

function CartGate({ children }) {
  const { user, loading } = useAuth();

  return (
    <CartProvider userKey={user?.uid || "guest"} ready={!loading}>
      {children}
    </CartProvider>
  );
}

export default function AppProviders({ children }) {
  return <CartGate>{children}</CartGate>;
}
