import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";

export default function CartDrawer({ open, onClose }) {
  const { cart, setQty, removeFromCart } = useCart();

  return (
    <div className={`fixed inset-0 z-[80] ${open ? "" : "pointer-events-none"}`}>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/35 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* panel */}
      <div
        className={[
          "absolute right-0 top-0 h-full w-full max-w-[420px]",
          "bg-base-100 shadow-2xl border-l border-base-200",
          "transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="p-4 border-b border-base-200 flex items-center justify-between">
          <div>
            <div className="text-lg font-black">Your cart</div>
            <div className="text-xs text-slate-500">{cart.totalQty} items</div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="p-4 space-y-3 overflow-auto h-[calc(100%-180px)]">
          {cart.items.length === 0 ? (
            <div className="rounded-2xl border border-base-200 p-4 text-sm text-slate-500">
              Cart is empty. Add items to see them here.
            </div>
          ) : (
            cart.items.map((it) => (
              <div key={it.productId} className="rounded-2xl border border-base-200 p-3 flex gap-3">
                <div className="h-16 w-16 rounded-xl bg-base-200 overflow-hidden shrink-0">
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm line-clamp-2">{it.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">৳{Number(it.price).toLocaleString()}</div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="join">
                      <button className="btn btn-xs join-item" onClick={() => setQty(it.productId, Math.max(1, it.qty - 1))}>−</button>
                      <div className="btn btn-xs join-item pointer-events-none">{it.qty}</div>
                      <button className="btn btn-xs join-item" onClick={() => setQty(it.productId, it.qty + 1)}>+</button>
                    </div>
                    <button className="btn btn-xs btn-ghost text-error" onClick={() => removeFromCart(it.productId)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-base-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-extrabold">৳{Number(cart.subtotal || 0).toLocaleString()}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link to="/cart" onClick={onClose} className="btn rounded-full">
              View cart
            </Link>
            <Link to="/checkout" onClick={onClose} className="btn btn-primary rounded-full">
              Checkout
            </Link>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Delivery fee may apply. Final total shown at checkout.
          </div>
        </div>
      </div>
    </div>
  );
}
