import React from "react";
import { Navigate } from "react-router-dom";
import useMe from "../hooks/useMe";
import { useAuth } from "../Provider/AuthProvider";

export default function AdminRoute({ children, allow = ["admin", "manager"] }) {
  const { user, loading: authLoading } = useAuth();
  const { me, loading: meLoading } = useMe();

  if (authLoading || meLoading) {
    return (
      <div className="p-6">
        <div className="loading loading-spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;

  const role = me?.role || "";
  if (!allow.includes(role)) return <Navigate to="/" replace />;

  return children;
}
