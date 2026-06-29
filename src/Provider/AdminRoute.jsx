// src/routes/AdminRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../services/api";

export default function AdminRoute({ children, allow = ["admin", "manager"] }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        // wait for firebase auth to settle
        if (loading) return;

        // not logged in
        if (!user) {
          if (alive) setChecking(false);
          return;
        }

        setChecking(true);
        const res = await apiGet("/api/users/me");
        const r = String(res?.data?.user?.role || "");
        if (alive) setRole(r);
      } catch {
        // if backend session missing/expired, role stays empty
        if (alive) setRole("");
      } finally {
        if (alive) setChecking(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [user, loading]);

  // Loading screen while auth/role check is happening
  if (loading || checking) {
    return (
      <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
        <div className="font-bold">Loading…</div>
        <div className="text-sm text-slate-500 mt-1">Checking permissions</div>
      </div>
    );
  }

  // Not logged in -> go login
  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: loc.pathname }} />;
  }

  // Logged in but not admin/manager -> go home
  const ok = allow.includes(String(role).toLowerCase());
  if (!ok) {
    return <Navigate to="/" replace />;
  }

  return children;
}
