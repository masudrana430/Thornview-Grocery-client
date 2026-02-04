// src/Pages/Account/MyOrdersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api";
import Container from "../../Components/Container";

// Fallback image (use your own local asset if you want)
const FALLBACK_IMG =
  "https://dummyimage.com/96x96/e5e7eb/111827.png&text=Order";

function fmtBDT(n) {
  const num = Number(n || 0);
  return `৳${num.toLocaleString()}`;
}

function safeDate(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function pickOrderTitle(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return order?.orderNumber ? `Order ${order.orderNumber}` : "Order";
  const first = items[0];
  const firstName = first?.name || "Order";
  const more = items.length - 1;
  return more > 0 ? `${firstName} + ${more} more` : firstName;
}

function pickOrderImage(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const first = items[0];
  return first?.image || FALLBACK_IMG;
}

function badgeClassForStatus(status) {
  const s = String(status || "").toLowerCase();

  if (["delivered"].includes(s)) return "badge-success";
  if (["out_for_delivery", "shipped"].includes(s)) return "badge-info";
  if (["processing", "confirmed"].includes(s)) return "badge-primary";
  if (["pending_payment", "pending"].includes(s)) return "badge-warning";
  if (["cancelled", "canceled", "failed"].includes(s)) return "badge-error";

  // default
  return "badge-ghost";
}

function badgeClassForPayment(paymentStatus) {
  const s = String(paymentStatus || "").toLowerCase();
  if (["paid", "succeeded"].includes(s)) return "badge-success";
  if (["processing", "requires_capture"].includes(s)) return "badge-info";
  if (["requires_payment", "unpaid", "pending"].includes(s)) return "badge-warning";
  return "badge-ghost";
}

export default function MyOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [orders, setOrders] = useState([]);

  async function loadOrders(signal) {
    setErrMsg("");
    setLoading(true);

    try {
      // ✅ Your backend should return something like:
      // { data: { orders: [...] } } OR { data: { items: [...] } } OR { data: [...] }
      const res = await apiGet("/api/orders", { signal });

      const data = res?.data;
      const list =
        (Array.isArray(data?.orders) && data.orders) ||
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data) && data) ||
        [];

      setOrders(list);
    } catch (e) {
      // ✅ IMPORTANT: ignore abort errors (React StrictMode triggers these in dev)
      if (e?.name === "AbortError") return;
      if (String(e?.message || "").toLowerCase().includes("aborted")) return;

      setErrMsg(e?.message || "Could not load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    loadOrders(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const sortedOrders = useMemo(() => {
    const copy = [...orders];
    copy.sort((a, b) => {
      const ad = new Date(a?.createdAt || 0).getTime();
      const bd = new Date(b?.createdAt || 0).getTime();
      return bd - ad;
    });
    return copy;
  }, [orders]);

  return (
    <Container>
    <div className=" my-8 px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">My Orders</h1>

        <button
          className={`btn btn-sm ${loading ? "btn-disabled" : ""}`}
          onClick={() => {
            const ctrl = new AbortController();
            loadOrders(ctrl.signal);
          }}
        >
          Refresh
        </button>
      </div>

      {errMsg ? (
        <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-4">
          <div className="font-bold text-error">Could not load orders</div>
          <div className="text-sm text-slate-500 mt-1">{errMsg}</div>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-base-200 bg-base-100 p-4 flex gap-4"
            >
              <div className="skeleton h-16 w-16 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-2/3" />
                <div className="skeleton h-4 w-1/3" />
              </div>
              <div className="w-24 space-y-2">
                <div className="skeleton h-5 w-full" />
                <div className="skeleton h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !errMsg && sortedOrders.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-6">
          <div className="font-bold">No orders yet</div>
          <p className="text-sm text-slate-500 mt-1">
            When you place an order, it will appear here.
          </p>
          <Link to="/shop" className="btn btn-primary rounded-full mt-4">
            Start shopping
          </Link>
        </div>
      ) : null}

      {!loading && !errMsg && sortedOrders.length > 0 ? (
        <div className="mt-4 space-y-3">
          {sortedOrders.map((o) => {
            const id = o?._id;
            const title = pickOrderTitle(o);
            const img = pickOrderImage(o);

            const orderNumber = o?.orderNumber ? String(o.orderNumber) : "";
            const mode = String(o?.mode || "").toUpperCase(); // PICKUP/DELIVERY
            const status = String(o?.status || "placed");
            const paymentMethod = String(o?.payment?.method || "cod").toUpperCase();
            const paymentStatus = String(o?.payment?.status || "unpaid");

            return (
              <Link
                key={id || orderNumber}
                to={id ? `/orders/${id}` : "#"}
                className="block rounded-2xl border border-base-200 bg-base-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-base-200 overflow-hidden shrink-0">
                    <img
                      src={img}
                      alt={title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-black text-base line-clamp-1">
                          {title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {orderNumber ? (
                            <span className="mr-2">#{orderNumber}</span>
                          ) : null}
                          {safeDate(o?.createdAt)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black">
                          {fmtBDT(o?.total)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {mode || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`badge ${badgeClassForStatus(status)}`}>
                        {String(status).replaceAll("_", " ")}
                      </span>

                      <span className="badge badge-outline">
                        {paymentMethod}
                      </span>

                      <span className={`badge ${badgeClassForPayment(paymentStatus)}`}>
                        {String(paymentStatus).replaceAll("_", " ")}
                      </span>

                      {/* Helpful “mini summary” */}
                      <span className="text-xs text-slate-500 ml-auto">
                        {Array.isArray(o?.items) ? `${o.items.length} item(s)` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
    </Container>
  );
}
