import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api";
import { toast } from "react-toastify";
import {
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiCreditCard,
  FiTruck,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiClock,
} from "react-icons/fi";

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

function statusTone(status = "") {
  const s = String(status).toLowerCase();
  if (["delivered"].includes(s)) {
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  }
  if (["processing", "confirmed", "packed", "shipped", "out_for_delivery", "ready_for_pickup"].includes(s)) {
    return "bg-sky-500/10 text-sky-600 border-sky-500/20";
  }
  if (["pending_payment", "placed"].includes(s)) {
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }
  if (["cancelled"].includes(s)) {
    return "bg-rose-500/10 text-rose-600 border-rose-500/20";
  }
  return "bg-base-200 text-base-content border-base-300";
}

function paymentTone(status = "") {
  const s = String(status).toLowerCase();
  if (s === "paid") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (s === "unpaid" || s === "requires_payment") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-base-200 text-base-content border-base-300";
}

function modeTone(mode = "") {
  return String(mode).toLowerCase() === "delivery"
    ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
    : "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
}

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

  useEffect(() => {
    const ctrl = new AbortController();
    loadOrders(ctrl.signal, { page: 1 });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, payment, mode, limit]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => loadOrders(ctrl.signal, { page: 1 }), 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const ctrl = new AbortController();
    loadOrders(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function updateOrderStatus(orderId, newStatus) {
    const prev = orders;

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
      const ctrl = new AbortController();
      loadOrders(ctrl.signal);
    } catch (e) {
      setOrders(prev);
      toast.error(e?.message || "Failed to update status");
    }
  }

  const totalShowing = orders.length;

  const summary = useMemo(() => {
    const paid = orders.filter((o) => String(o?.payment?.status || "").toLowerCase() === "paid").length;
    const delivery = orders.filter((o) => String(o?.mode || "").toLowerCase() === "delivery").length;
    const processing = orders.filter((o) =>
      ["processing", "confirmed", "packed", "shipped", "out_for_delivery"].includes(
        String(o?.status || "").toLowerCase()
      )
    ).length;

    return { paid, delivery, processing };
  }, [orders]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-base-100/55 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.10)]">
        <div className="pointer-events-none absolute -top-16 right-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-white/[0.03]" />

        <div className="relative p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-base-100/45 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                Orders management
              </div>

              <h1 className="mt-3 text-2xl md:text-3xl font-black tracking-tight">
                Admin Orders
              </h1>

              <p className="mt-2 text-sm opacity-70 max-w-2xl">
                Review, filter, and update order statuses with a cleaner operational workflow.
              </p>
            </div>

            <button
              className={`btn btn-sm md:btn-md rounded-full ${loading ? "btn-disabled" : ""}`}
              onClick={() => {
                const ctrl = new AbortController();
                loadOrders(ctrl.signal);
                toast.info("Refreshing orders…");
              }}
              type="button"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Summary chips */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniStat
              icon={<FiShoppingBag />}
              label="Visible orders"
              value={totalShowing}
              note={`of ${pagination.total} total`}
            />
            <MiniStat
              icon={<FiCreditCard />}
              label="Paid in current view"
              value={summary.paid}
              note="Payment-complete orders"
            />
            <MiniStat
              icon={<FiTruck />}
              label="Delivery orders"
              value={summary.delivery}
              note={`${summary.processing} currently in progress`}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 rounded-[28px] border border-white/10 bg-base-100/50 backdrop-blur-2xl shadow-[0_14px_40px_rgba(0,0,0,0.08)] p-4 md:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              className="input input-bordered w-full rounded-2xl pl-11 bg-base-100/65 backdrop-blur border-white/10"
              placeholder="Search by order number, email, or ObjectId…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="select select-bordered rounded-2xl bg-base-100/65 backdrop-blur border-white/10 lg:col-span-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            className="select select-bordered rounded-2xl bg-base-100/65 backdrop-blur border-white/10 lg:col-span-2"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
          >
            <option value="">Any payment</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="requires_payment">Requires payment</option>
          </select>

          <select
            className="select select-bordered rounded-2xl bg-base-100/65 backdrop-blur border-white/10 lg:col-span-2"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="">Delivery + Pickup</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>

          <select
            className="select select-bordered rounded-2xl bg-base-100/65 backdrop-blur border-white/10 lg:col-span-2"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs opacity-65">
            Showing <span className="font-semibold">{totalShowing}</span> orders · page{" "}
            <span className="font-semibold">
              {page}/{pagination.pages}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm rounded-full"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              type="button"
            >
              <FiChevronLeft />
              Prev
            </button>
            <button
              className="btn btn-sm rounded-full"
              disabled={page >= pagination.pages || loading}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <div className="font-bold text-rose-600">Could not load orders</div>
          <div className="text-sm opacity-70 mt-1">{err}</div>
        </div>
      ) : null}

      {/* Desktop table */}
      <div className="mt-5 hidden lg:block rounded-[28px] border border-white/10 bg-base-100/50 backdrop-blur-2xl shadow-[0_14px_40px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="border-b border-white/10">
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
                      <div className="skeleton h-10 w-full rounded-xl" />
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
                    <tr key={String(id)} className="hover:bg-base-100/35">
                      <td className="font-semibold">
                        <div className="flex flex-col">
                          <span>#{orderNumber}</span>
                          <span className="text-xs opacity-55 font-mono">{String(id)}</span>
                        </div>
                      </td>

                      <td>
                        <div className="max-w-[220px] truncate">{email}</div>
                      </td>

                      <td>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${modeTone(oMode)}`}>
                          {String(oMode).toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(oStatus)}`}>
                            {String(oStatus).replaceAll("_", " ")}
                          </span>

                          <select
                            className="select select-bordered select-sm rounded-xl bg-base-100/70 border-white/10"
                            value={oStatus}
                            onChange={(e) => updateOrderStatus(id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="uppercase font-semibold opacity-80">{payMethod}</span>
                          <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${paymentTone(payStatus)}`}>
                            {payStatus}
                          </span>
                        </div>
                      </td>

                      <td className="font-bold">{moneyBDT(total)}</td>
                      <td className="text-xs opacity-65">{safeDate(o?.createdAt)}</td>

                      <td className="text-right">
                        <Link to={`/orders/${id}`} className="btn btn-sm rounded-full bg-base-100/70 border border-white/10">
                          <FiEye />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center opacity-65 py-10">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-white/10 bg-base-100/50 backdrop-blur-2xl p-4 shadow-sm"
            >
              <div className="skeleton h-5 w-28" />
              <div className="skeleton h-4 w-40 mt-3" />
              <div className="skeleton h-20 w-full mt-4 rounded-2xl" />
            </div>
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
              <div
                key={String(id)}
                className="rounded-[24px] border border-white/10 bg-base-100/50 backdrop-blur-2xl p-4 shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black">#{orderNumber}</div>
                    <div className="text-xs opacity-55 font-mono mt-1 break-all">{String(id)}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black">{moneyBDT(total)}</div>
                    <div className="text-xs opacity-60 mt-1">{safeDate(o?.createdAt)}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <InfoRow label="Customer" value={email} />
                  <InfoRow
                    label="Mode"
                    value={
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${modeTone(oMode)}`}>
                        {String(oMode).toUpperCase()}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Payment"
                    value={
                      <div className="flex flex-col items-start gap-1">
                        <span className="uppercase text-xs font-semibold opacity-80">{payMethod}</span>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${paymentTone(payStatus)}`}>
                          {payStatus}
                        </span>
                      </div>
                    }
                  />
                  <InfoRow
                    label="Created"
                    value={
                      <span className="inline-flex items-center gap-1.5 text-sm opacity-70">
                        <FiClock />
                        {safeDate(o?.createdAt)}
                      </span>
                    }
                  />
                </div>

                <div className="mt-4">
                  <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(oStatus)}`}>
                    {String(oStatus).replaceAll("_", " ")}
                  </div>

                  <select
                    className="select select-bordered w-full rounded-2xl bg-base-100/70 border-white/10 mt-3"
                    value={oStatus}
                    onChange={(e) => updateOrderStatus(id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <Link
                    to={`/orders/${id}`}
                    className="btn w-full rounded-full bg-base-100/70 border border-white/10"
                  >
                    <FiEye />
                    View order
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[24px] border border-white/10 bg-base-100/50 backdrop-blur-2xl p-8 text-center opacity-65">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-base-100/45 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide opacity-55">{label}</div>
          <div className="text-2xl font-black mt-1">{value}</div>
          <div className="text-xs opacity-60 mt-1">{note}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-base-100/65 border border-white/10 text-base">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs uppercase tracking-wide opacity-50">{label}</div>
      <div className="text-right text-sm max-w-[68%] break-words">{value}</div>
    </div>
  );
}