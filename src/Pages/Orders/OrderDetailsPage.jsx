import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiGet } from "../../services/api";
import Container from "../../Components/Container";
import LoadingSpinner from "../../Components/LoadingSpinner";

function money(n) {
  return `৳${Number(n || 0).toLocaleString()}`;
}

function Badge({ children, className = "" }) {
  return (
    <span className={`badge badge-outline ${className}`.trim()}>
      {children}
    </span>
  );
}

export default function OrderDetailsPage() {
  const { orderId } = useParams(); // route: /orders/:orderId
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await apiGet(`/api/orders/${orderId}`);
        const o = res?.data?.order;

        if (!o) throw new Error("Order not found in response.");

        if (alive) setOrder(o);
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load order");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [orderId]);

  const created = useMemo(() => {
    if (!order?.createdAt) return "";
    const d = new Date(order.createdAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }, [order]);

  if (loading) {

    return (
      <Container>
      <LoadingSpinner />
      </Container>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
        <div className="font-bold text-lg">Could not load order</div>
        <div className="text-sm text-slate-500 mt-2">{error || "Unknown error"}</div>
        <div className="mt-4 flex gap-2">
          <button className="btn" onClick={() => nav(-1)}>Back</button>
          <Link className="btn btn-primary" to="/shop">Go shopping</Link>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = Number(order.total || 0);

  const mode = order.mode || "delivery";
  const status = order.status || "placed";
  const payMethod = order?.payment?.method || "cod";
  const payStatus = order?.payment?.status || "unpaid";

  return (
    <Container>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT */}
      <div className="lg:col-span-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">Order details</h1>
            <div className="text-sm text-slate-500 mt-1">
              Order ID: <span className="font-mono">{order._id}</span>
            </div>
            {created ? (
              <div className="text-xs text-slate-500 mt-1">Created: {created}</div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge className="badge-primary">{String(status).toUpperCase()}</Badge>
            <Badge>{mode === "pickup" ? "PICKUP" : "DELIVERY"}</Badge>
            <Badge>{String(payMethod).toUpperCase()}</Badge>
            <Badge className={payStatus === "paid" ? "badge-success" : "badge-ghost"}>
              {String(payStatus).toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Address / Slot */}
        <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-5">
          <div className="font-black text-lg">Fulfillment</div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Mode</div>
              <div className="font-semibold">{mode === "pickup" ? "Pickup" : "Delivery"}</div>
            </div>

            <div>
              <div className="text-slate-500">Slot</div>
              <div className="font-semibold">
                {order?.slot?.label ? order.slot.label : "—"}
              </div>
              {order?.slot?.arrivesText ? (
                <div className="text-xs text-slate-500 mt-1">{order.slot.arrivesText}</div>
              ) : null}
            </div>

            {mode === "delivery" ? (
              <div className="md:col-span-2">
                <div className="text-slate-500">Delivery address</div>
                <div className="font-semibold">
                  {order?.address?.fullName || "—"} ({order?.address?.phone || "—"})
                </div>
                <div className="text-sm">
                  {order?.address?.line1 || ""}{" "}
                  {order?.address?.area ? `, ${order.address.area}` : ""}{" "}
                  {order?.address?.city ? `, ${order.address.city}` : ""}{" "}
                  {order?.address?.zip ? `- ${order.address.zip}` : ""}
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 text-slate-500">
                Pickup selected — no address required.
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-5">
          <div className="font-black text-lg">Items</div>

          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-sm text-slate-500">No items found.</div>
            ) : (
              items.map((it, idx) => {
                const qty = Number(it.qty || 1);
                const price = Number(it.price || 0);
                return (
                  <div
                    key={it.productId || it._id || idx}
                    className="flex gap-4 rounded-2xl border border-base-200 p-4"
                  >
                    <div className="h-20 w-20 rounded-2xl bg-base-200 overflow-hidden shrink-0">
                      {it.image ? (
                        <img src={it.image} alt={it.name || "Item"} className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="flex-1">
                      <div className="font-bold line-clamp-2">{it.name || "Unnamed item"}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Qty: <span className="font-semibold">{qty}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold">{money(price)}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Line: <span className="font-semibold">{money(price * qty)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="btn" onClick={() => nav(-1)}>Back</button>
          <Link className="btn" to="/shop">Continue shopping</Link>
        </div>
      </div>

      {/* RIGHT SUMMARY */}
      <div className="lg:col-span-4">
        <div className="sticky top-[90px] rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
          <div className="text-lg font-black">Summary</div>

          <div className="mt-3 space-y-2 text-sm">
            <Row label="Subtotal" value={money(subtotal)} />
            <Row label="Delivery fee" value={money(deliveryFee)} />
            <div className="border-t border-base-200 pt-2">
              <Row label={<span className="font-black">Total</span>} value={<span className="font-black">{money(total)}</span>} />
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Payment: <span className="font-semibold">{String(payMethod).toUpperCase()}</span> —{" "}
            <span className="font-semibold">{String(payStatus).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
    </Container>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
