import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api";
import { toast } from "react-toastify";

function moneyBDT(n) {
  return `৳${Number(n || 0).toLocaleString()}`;
}

function Badge({ children, className = "" }) {
  return <span className={`badge badge-outline ${className}`}>{children}</span>;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [overview, setOverview] = useState(null);

  async function loadOverview(signal) {
    setErr("");
    setLoading(true);
    try {
      const res = await apiGet("/api/admin/overview", { signal });
      setOverview(res?.data || null);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Failed to load overview");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    loadOverview(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const totals = overview?.totals || {};
  const byStatus = Array.isArray(overview?.byStatus) ? overview.byStatus : [];

  const topStatuses = useMemo(() => {
    return [...byStatus].slice(0, 8);
  }, [byStatus]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of users, products, and orders.
          </p>
        </div>

        <button
          className={`btn btn-sm ${loading ? "btn-disabled" : ""}`}
          onClick={() => {
            const ctrl = new AbortController();
            loadOverview(ctrl.signal);
            toast.info("Refreshing dashboard…");
          }}
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-4">
          <div className="font-bold text-error">Could not load dashboard</div>
          <div className="text-sm text-slate-500 mt-1">{err}</div>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-base-200 bg-base-100 p-5">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-32 mt-3" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && overview ? (
        <>
          {/* Summary cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Users" value={totals.users} />
            <Card title="Products" value={totals.products} />
            <Card title="Orders" value={totals.orders} />
            <Card title="Paid orders" value={totals.paidOrders} />
            <Card title="Unpaid orders" value={totals.unpaidOrders} />
            <Card title="Revenue" value={moneyBDT(totals.revenue)} />
          </div>

          {/* Quick actions */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-base-200 bg-base-100 p-5">
              <div className="font-black text-lg">Quick links</div>
              <div className="mt-3 flex flex-col gap-2">
                <Link to="/admin/orders" className="btn btn-sm btn-outline">
                  Manage Orders
                </Link>
                <Link to="/admin/products" className="btn btn-sm btn-outline">
                  Manage Products
                </Link>
                <Link to="/admin/users" className="btn btn-sm btn-outline">
                  Manage Users
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-base-200 bg-base-100 p-5">
              <div className="flex items-center justify-between">
                <div className="font-black text-lg">Orders by status</div>
                <Link to="/admin/orders" className="link link-primary text-sm">
                  View all
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {topStatuses.length ? (
                  topStatuses.map((s) => (
                    <Badge key={s.status}>
                      {String(s.status)}: <span className="font-bold ml-1">{s.count}</span>
                    </Badge>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No status data yet.</div>
                )}
              </div>

              <div className="mt-4 text-xs text-slate-500">
                Tip: update order status from <span className="font-semibold">Admin Orders</span>.
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-2xl border border-base-200 bg-base-100 p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-3xl font-black mt-2">{value ?? 0}</div>
    </div>
  );
}
