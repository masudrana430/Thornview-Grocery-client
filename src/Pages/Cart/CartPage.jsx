import React from "react";
import { Link } from "react-router-dom";
import useCart from "../../hooks/useCart";
import Container from "../../Components/Container";

export default function CartPage() {
  const { items, subtotal, setQty, removeItem, clearCart } = useCart();

  return (
    <Container>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">Cart</h1>
          {items.length ? (
            <button className="btn btn-sm" onClick={clearCart}>
              Clear cart
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
              <div className="font-bold">Your cart is empty</div>
              <p className="text-sm text-slate-500 mt-1">
                Browse items and add to cart.
              </p>
              <Link to="/shop" className="btn btn-primary rounded-full mt-4">
                Shop now
              </Link>
            </div>
          ) : (
            items.map((it) => (
              <div
                key={it.productId}
                className="rounded-2xl border border-base-200 bg-base-100 p-4 flex gap-4"
              >
                <div className="h-24 w-24 rounded-2xl bg-base-200 overflow-hidden shrink-0">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <Link
                    to={`/product/${it.slug || it.productId}`}
                    className="font-bold hover:underline line-clamp-2"
                  >
                    {it.name}
                  </Link>

                  <div className="text-xs text-slate-500 mt-1">
                    {it.inStock ? "In stock" : "Out of stock"}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="join">
                      <button
                        className="btn btn-sm join-item"
                        onClick={() => setQty(it.productId, Math.max(1, (it.qty || 1) - 1))}
                      >
                        −
                      </button>
                      <div className="btn btn-sm join-item pointer-events-none">
                        {it.qty || 1}
                      </div>
                      <button
                        className="btn btn-sm join-item"
                        onClick={() => setQty(it.productId, (it.qty || 1) + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {it.oldPrice != null ? (
                          <div className="text-xs line-through text-slate-500">
                            ৳{Number(it.oldPrice).toLocaleString()}
                          </div>
                        ) : null}

                        <div className="text-lg font-black text-emerald-700">
                          ৳{Number(it.price || 0).toLocaleString()}
                        </div>
                      </div>

                      <button
                        className="btn btn-sm btn-ghost text-error"
                        onClick={() => removeItem(it.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="sticky top-[90px] rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm">
          <div className="text-lg font-black">Order summary</div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-extrabold">
              ৳{Number(subtotal || 0).toLocaleString()}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-500">
            Delivery fee shown at checkout (free over ৳2000).
          </div>

          <Link
            to="/checkout"
            className={`btn btn-primary w-full rounded-full mt-4 ${
              items.length ? "" : "btn-disabled"
            }`}
          >
            Checkout
          </Link>

          <Link to="/shop" className="btn w-full rounded-full mt-2">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
    </Container>
  );
}
