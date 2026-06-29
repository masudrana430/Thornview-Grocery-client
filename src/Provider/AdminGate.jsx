import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiGet } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function AdminGate({ children, allow = ["admin", "manager"] }) {
  const { user, loading: authLoading, sessionReady } = useAuth();
  const [roleLoading, setRoleLoading] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!user || !sessionReady) return;

    const ctrl = new AbortController();

    (async () => {
      try {
        setRoleLoading(true);
        const res = await apiGet("/api/users/me", { signal: ctrl.signal });
        setRole(res?.data?.user?.role || "");
      } catch {
        setRole("");
      } finally {
        setRoleLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [user, sessionReady]);

  if (authLoading) return <div className="p-6">Loading…</div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (!sessionReady) return <div className="p-6">Preparing session…</div>;
  if (roleLoading) return <div className="p-6">Loading access…</div>;

  if (!allow.includes(role)) return <Navigate to="/" replace />;

  return children;
}
