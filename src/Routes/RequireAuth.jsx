import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../Provider/AuthProvider";

export default function RequireAuth() {
  const { user, initializing } = useContext(AuthContext);
  const location = useLocation();

  if (initializing) return <div className="p-6">Loading…</div>;
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
