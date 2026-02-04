import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api";
import { toast } from "react-toastify";

function moneyBDT(n) {
  return `৳${Number(n || 0).toLocaleString()}`;
}

function safeDate(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    p.set(k, s);
  });
  const out = p.toString();
  return out ? `?${out}` : "";
}

const STATUS_OPTIONS = [
  "placed",
  "pending_payment",
  "processing",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "ready_for_pickup",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [mode, setMode] = useState("");
  const [q, setQ] = useState("");

  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  async function loadOrders(signal, overrides = {}) {
    setErr("");
    setLoading(true);
    try {
      const params = {
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        status: overrides.status ?? status,
        payment: overrides.payment ?? payment,
        mode: overrides.mode ?? mode,
        q: overrides.q ?? q,
      };

      const res = await apiGet(`/api/admin/orders${qs(params)}`, { signal });
      const list = res?.data?.orders || [];
      const pag = res?.data?.pagination || {};

      setOrders(Array.isArray(list) ? list : []);
      setPagination({
        total: Number(pag.total || 0),
        pages: Number(pag.pages || 1),
      });
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Failed to load orders");
      setOrders([]);
      setPagination({ total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }

  // Load when filters change
  useEffect(() => {
    const ctrl = new AbortController();
    loadOrders(ctrl.signal, { page: 1 });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, payment, mode, limit]);

  // Debounce search
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => loadOrders(ctrl.signal, { page: 1 }), 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Page change
  useEffect(() => {
    const ctrl = new AbortController();
    loadOrders(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function updateOrderStatus(orderId, newStatus) {
    const prev = orders;

    // ✅ optimistic update
    setOrders((list) =>
      list.map((o) => (String(o._id) === String(orderId) ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await apiPatch(`/api/admin/orders/${orderId}/status`, {
        status: newStatus,
        note: "",
      });

      const updated = res?.data?.order;
      if (updated?._id) {
        setOrders((list) =>
          list.map((o) => (String(o._id) === String(updated._id) ? updated : o))
        );
      }

      toast.success("Order status updated");
      // ✅ background sync (ensures correctness)
      const ctrl = new AbortController();
      loadOrders(ctrl.signal);
    } catch (e) {
      setOrders(prev); // rollback
      toast.error(e?.message || "Failed to update status");
    }
  }

  const totalShowing = orders.length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Admin Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Filter and update order statuses.
          </p>
        </div>

        <button
          className={`btn btn-sm ${loading ? "btn-disabled" : ""}`}
          onClick={() => {
            const ctrl = new AbortController();
            loadOrders(ctrl.signal);
            toast.info("Refreshing orders…");
          }}
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            className="input input-bordered md:col-span-2"
            placeholder="Search by orderNumber, email, or ObjectId…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select className="select select-bordered" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select className="select select-bordered" value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="">Any payment</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="requires_payment">Requires payment</option>
          </select>

          <select className="select select-bordered" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="">Delivery + Pickup</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold">{totalShowing}</span> orders (page {page}/{pagination.pages})
          </div>

          <div className="flex items-center gap-2">
            <select
              className="select select-bordered select-sm"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}/page</option>
              ))}
            </select>

            <button className="btn btn-sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <button
              className="btn btn-sm"
              disabled={page >= pagination.pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-4">
          <div className="font-bold text-error">Could not load orders</div>
          <div className="text-sm text-slate-500 mt-1">{err}</div>
        </div>
      ) : null}

      {/* Table */}
      <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>User</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}>
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : orders.length ? (
                orders.map((o) => {
                  const id = o?._id;
                  const orderNumber = o?.orderNumber || "—";
                  const email = o?.email || "—";
                  const oMode = o?.mode || "—";
                  const oStatus = o?.status || "—";
                  const payMethod = o?.payment?.method || "—";
                  const payStatus = o?.payment?.status || "—";
                  const total = o?.total ?? 0;

                  return (
                    <tr key={String(id)}>
                      <td className="font-semibold">
                        <div className="flex flex-col">
                          <span>#{orderNumber}</span>
                          <span className="text-xs text-slate-500 font-mono">{String(id)}</span>
                        </div>
                      </td>

                      <td>{email}</td>
                      <td className="uppercase text-xs">{oMode}</td>

                      <td>
                        <select
                          className="select select-bordered select-sm"
                          value={oStatus}
                          onChange={(e) => updateOrderStatus(id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="text-xs">
                        <div className="flex flex-col">
                          <span className="uppercase">{payMethod}</span>
                          <span className="text-slate-500">{payStatus}</span>
                        </div>
                      </td>

                      <td className="font-bold">{moneyBDT(total)}</td>
                      <td className="text-xs text-slate-500">{safeDate(o?.createdAt)}</td>

                      <td className="text-right">
                        <Link to={`/orders/${id}`} className="btn btn-sm btn-outline">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center text-slate-500 py-8">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
