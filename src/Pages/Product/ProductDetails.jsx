import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth"; // adjust path if needed
import Container from "../../Components/Container";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ProductDetails() {
  const { idOrSlug } = useParams();

  const { user } = useAuth();
  const { addItem } = useCart();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState("");

  const [related, setRelated] = useState([]);
  const [fbt, setFbt] = useState({ base: null, items: [] });

  // qty & cart
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [bundleAdding, setBundleAdding] = useState(false);

  // wishlist
  const wishlistKey = useMemo(
    () => `thomview_wishlist_v1:${user?.uid || "guest"}`,
    [user?.uid]
  );
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    let mounted = true;
    const ctrl = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setErr("");

        // product
        const pRes = await fetch(`${API_BASE}/api/products/${idOrSlug}`, { signal: ctrl.signal });
        const pJson = await pRes.json().catch(() => ({}));
        if (!pRes.ok) throw new Error(pJson?.error?.message || "Failed to load product");
        const p = pJson?.data?.product;

        if (!p) throw new Error("Product not found in response");
        if (!mounted) return;

        const imgs = normalizeImages(p);
        const normalized = { ...p, images: imgs };
        setProduct(normalized);
        setActiveImg(imgs[0] || "");

        // wishlist state for this product
        setWishlisted(isInWishlist(wishlistKey, normalized));

        // related + fbt
        const [rRes, fRes] = await Promise.all([
          fetch(`${API_BASE}/api/products/${idOrSlug}/related?limit=12`, { signal: ctrl.signal }),
          fetch(`${API_BASE}/api/products/${idOrSlug}/fbt?limit=3`, { signal: ctrl.signal }),
        ]);

        const rJson = await rRes.json().catch(() => ({}));
        const fJson = await fRes.json().catch(() => ({}));

        if (mounted) {
          setRelated((rJson?.data?.items || []).map(normalizeCard));
          setFbt({
            base: fJson?.data?.base ? normalizeCard(fJson.data.base) : null,
            items: (fJson?.data?.items || []).map(normalizeCard),
          });
        }
      } catch (e) {
        if (mounted) {
          setErr(e?.message || "Failed to load product");
          setProduct(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [idOrSlug, wishlistKey]);

  const price = Number(product?.price || 0);
  const oldPrice = product?.oldPrice != null ? Number(product.oldPrice) : null;
  const save = oldPrice && oldPrice > price ? oldPrice - price : 0;
  const inStock = product?.inStock !== false;

  const highlights = useMemo(() => {
    const h = product?.highlights;
    if (Array.isArray(h) && h.length) return h;
    const tags = Array.isArray(product?.tags) ? product.tags : [];
    return [
      product?.brand ? `Brand: ${product.brand}` : null,
      product?.categorySlug ? `Category: ${product.categorySlug}` : null,
      tags.length ? `Tags: ${tags.slice(0, 4).join(", ")}` : null,
      inStock ? "Available for delivery / pickup" : "Currently out of stock",
    ].filter(Boolean);
  }, [product, inStock]);

  // ✅ Add-to-cart uses your CartProvider
  async function handleAddToCart() {
    if (!product || !inStock) return;

    setAdding(true);
    try {
      const item = {
        ...product,
        productId: String(product._id || product.id || product.slug),
        image: product.images?.[0] || product.image || "",
      };
      addItem(item, qty);
    } finally {
      setAdding(false);
    }
  }

  // ✅ Wishlist toggle (user-specific localStorage)
  function handleToggleWishlist() {
    if (!product) return;
    const next = toggleWishlist(wishlistKey, product);
    setWishlisted(next);
  }

  if (loading) return <PageSkeleton />;

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-3xl border border-base-200 bg-base-100 p-6">
          <div className="text-xl font-black">Product not available</div>
          <div className="text-sm text-slate-500 mt-1">{err || "Not found."}</div>
          <Link to="/shop" className="btn mt-4 rounded-full">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Container>
    <div className=" px-4 py-6">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 mb-4">
        <Link className="hover:underline" to="/">Home</Link> {" / "}
        <Link className="hover:underline" to="/shop">Shop</Link>
        {product.categorySlug ? (
          <>
            {" / "}
            <Link className="hover:underline" to={`/shop?category=${encodeURIComponent(product.categorySlug)}`}>
              {product.categorySlug}
            </Link>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Gallery */}
        <section className="lg:col-span-7">
          <div className="rounded-3xl border border-base-200 bg-base-100 overflow-hidden shadow-sm">
            <div className="p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2 order-2 md:order-1">
                  <div className="flex md:flex-col gap-2 overflow-auto md:overflow-visible">
                    {product.images.map((src, i) => {
                      const active = src === activeImg;
                      return (
                        <button
                          key={src + i}
                          type="button"
                          onClick={() => setActiveImg(src)}
                          className={[
                            "rounded-2xl border overflow-hidden bg-base-100",
                            "h-16 w-16 md:h-20 md:w-20 shrink-0",
                            active ? "border-blue-600 ring-2 ring-blue-200" : "border-base-200 hover:border-base-300",
                          ].join(" ")}
                        >
                          <img src={src} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-10 order-1 md:order-2">
                  <div className="aspect-square rounded-3xl bg-base-200 overflow-hidden relative">
                    <img
                      src={activeImg || product.images?.[0] || product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {save > 0 ? (
                      <div className="absolute left-4 top-4">
                        <div className="badge badge-error text-white font-black px-3 py-3">
                          Save ৳{save.toLocaleString()}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StockPill inStock={inStock} />
                    {product.brand ? <div className="badge badge-ghost font-semibold">{product.brand}</div> : null}
                    {Array.isArray(product.tags) && product.tags.slice(0, 4).map((t) => (
                      <div key={t} className="badge badge-outline">{t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description / Highlights */}
          <div className="mt-6 rounded-3xl border border-base-200 bg-base-100 shadow-sm">
            <div className="p-5">
              <div className="text-lg font-black">About this item</div>

              {product.description ? (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{product.description}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  No description yet. Add <span className="font-mono">description</span> field in MongoDB.
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {highlights.map((h, i) => (
                  <div key={i} className="rounded-2xl border border-base-200 bg-base-100 p-4">
                    <div className="text-sm font-semibold">{h}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right: Buy Box */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-[92px] space-y-4">
            <div className="rounded-3xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="text-2xl md:text-3xl font-black leading-tight">{product.name}</div>

                <div className="mt-2 flex items-center gap-3">
                  <Rating rating={product.rating} count={product.reviewCount} />
                </div>

                <div className="mt-4">
                  {oldPrice ? (
                    <div className="text-sm text-slate-500 line-through">
                      ৳{oldPrice.toLocaleString()}
                    </div>
                  ) : null}

                  <div className="text-3xl font-black text-emerald-700">
                    ৳{price.toLocaleString()}
                  </div>

                  {save > 0 ? (
                    <div className="mt-1 text-sm font-semibold text-error">
                      You save ৳{save.toLocaleString()}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <StockPill inStock={inStock} />
                  <div className="text-xs text-slate-500">
                    {inStock ? "Pickup / delivery available" : "Notify me (coming soon)"}
                  </div>
                </div>

                {/* Quantity + Add to cart */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="join">
                    <button type="button" className="btn btn-sm join-item" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <input
                      className="input input-bordered input-sm join-item w-16 text-center"
                      value={qty}
                      onChange={(e) => {
                        const v = parseInt(e.target.value || "1", 10);
                        setQty(Number.isFinite(v) ? Math.max(1, v) : 1);
                      }}
                    />
                    <button type="button" className="btn btn-sm join-item" onClick={() => setQty((q) => q + 1)}>+</button>
                  </div>

                  <button
                    className="btn btn-primary rounded-full flex-1"
                    disabled={!inStock || adding}
                    onClick={handleAddToCart}
                  >
                    {adding ? <span className="loading loading-spinner loading-sm" /> : "Add to cart"}
                  </button>
                </div>

                {/* ✅ Wishlist */}
                <button
                  className={`btn rounded-full w-full mt-3 ${wishlisted ? "btn-secondary" : "btn-outline"}`}
                  onClick={handleToggleWishlist}
                >
                  {wishlisted ? "✓ Added to wishlist" : "Add to wishlist"}
                </button>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                  <PolicyRow title="Free returns" note="7 days easy return policy" />
                  <PolicyRow title="Secure checkout" note="SSL + trusted payments" />
                  <PolicyRow title="Fast delivery" note="Same-day in selected areas" />
                </div>
              </div>
            </div>

            {/* ✅ Frequently bought together (Add bundle works) */}
            <FrequentlyBoughtTogether
              base={normalizeCard(product)}
              items={fbt.items}
              adding={bundleAdding}
              onAddAll={(list) => {
                setBundleAdding(true);
                try {
                  list.forEach((it) => {
                    addItem(
                      {
                        ...it,
                        productId: String(it._id || it.id || it.slug),
                        image: it.image || it.images?.[0] || "",
                      },
                      1
                    );
                  });
                } finally {
                  setBundleAdding(false);
                }
              }}
            />
          </div>
        </aside>
      </div>

      {/* Related items */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div className="text-xl font-black">Related items</div>
          <Link to="/shop" className="text-sm font-semibold hover:underline">View more</Link>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {related.slice(0, 12).map((p) => (
            <MiniProductCard key={String(p._id || p.slug)} p={p} />
          ))}
        </div>
      </div>
    </div>
    </Container>
  );
}

/* ---------------- wishlist helpers ---------------- */

function readWishlist(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isInWishlist(key, product) {
  const list = readWishlist(key);
  const id = String(product?._id || product?.id || product?.slug || "");
  return list.some((x) => String(x.id) === id);
}

function toggleWishlist(key, product) {
  const list = readWishlist(key);
  const id = String(product?._id || product?.id || product?.slug || "");
  if (!id) return false;

  const idx = list.findIndex((x) => String(x.id) === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event("wishlist:updated"));
    return false;
  }

  const images = normalizeImages(product);
  list.unshift({
    id,
    slug: product.slug || "",
    name: product.name || "Product",
    price: Number(product.price || 0),
    image: images[0] || product.image || "",
    inStock: product.inStock !== false,
    addedAt: new Date().toISOString(),
  });

  localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event("wishlist:updated"));
  return true;
}

/* ---------------- existing helpers (unchanged) ---------------- */

function normalizeImages(p) {
  const arr = Array.isArray(p?.images) ? p.images : [];
  const img = p?.image ? [p.image] : [];
  const out = [...arr, ...img].filter(Boolean);
  return Array.from(new Set(out));
}

function normalizeCard(p) {
  const images = normalizeImages(p);
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name || p.title || "Product",
    price: p.price,
    oldPrice: p.oldPrice,
    brand: p.brand,
    inStock: p.inStock !== false,
    image: p.image || images[0] || "",
    images,
    rating: p.rating,
    reviewCount: p.reviewCount,
  };
}

function Rating({ rating = 0, count = 0 }) {
  const r = Math.max(0, Math.min(5, Number(rating || 0)));
  return (
    <div className="flex items-center gap-2">
      <div className="rating rating-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <input key={i} type="radio" className="mask mask-star-2 bg-orange-400" checked={i < Math.round(r)} readOnly />
        ))}
      </div>
      <div className="text-sm text-slate-600">
        {r.toFixed(1)} <span className="text-slate-400">({Number(count || 0).toLocaleString()})</span>
      </div>
    </div>
  );
}

function StockPill({ inStock }) {
  return inStock ? (
    <div className="badge badge-success text-white font-bold px-3 py-3">In stock</div>
  ) : (
    <div className="badge badge-ghost font-bold px-3 py-3">Out of stock</div>
  );
}

function PolicyRow({ title, note }) {
  return (
    <div className="rounded-2xl border border-base-200 bg-base-100 p-3">
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-slate-500">{note}</div>
    </div>
  );
}

function MiniProductCard({ p }) {
  const price = Number(p.price || 0);
  const img = p.image || p.images?.[0] || "https://picsum.photos/seed/fallback/600/600";

  return (
    <Link to={`/product/${p.slug || p._id}`} className="group rounded-2xl border border-base-200 bg-base-100 hover:shadow-lg transition-all overflow-hidden">
      <div className="p-3">
        <div className="aspect-square rounded-xl bg-base-200 overflow-hidden">
          <img src={img} alt={p.name} className="h-full w-full object-cover group-hover:scale-[1.04] transition-transform" />
        </div>
        <div className="mt-3 text-xs text-slate-500">{p.brand || "Brand"}</div>
        <div className="text-sm font-semibold line-clamp-2 min-h-[40px]">{p.name}</div>
        <div className="mt-2 text-emerald-700 font-black">৳{price.toLocaleString()}</div>
        <div className="mt-1 text-xs text-slate-500">{p.inStock ? "Pickup / Delivery" : "Out of stock"}</div>
      </div>
    </Link>
  );
}

function FrequentlyBoughtTogether({ base, items, onAddAll, adding }) {
  const [checked, setChecked] = useState(() => items.map(() => true));

  useEffect(() => setChecked(items.map(() => true)), [items]);

  const list = useMemo(() => {
    const chosen = items.filter((_, idx) => checked[idx]);
    return [base, ...chosen].filter(Boolean);
  }, [base, items, checked]);

  const total = useMemo(
    () => list.reduce((sum, p) => sum + Number(p.price || 0), 0),
    [list]
  );

  return (
    <div className="rounded-3xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-base-200">
        <div className="text-lg font-black">Frequently bought together</div>
        <div className="text-sm text-slate-500 mt-1">Add these items and save time at checkout.</div>
      </div>

      <div className="p-5 space-y-3">
        {items.length ? (
          items.map((p, idx) => (
            <label key={String(p._id || p.slug) + idx} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={checked[idx] || false}
                onChange={() => setChecked((c) => c.map((v, i) => (i === idx ? !v : v)))}
              />
              <div className="h-12 w-12 rounded-xl bg-base-200 overflow-hidden">
                <img src={p.image || p.images?.[0] || "https://picsum.photos/seed/fbt/600/600"} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold line-clamp-1">{p.name}</div>
                <div className="text-xs text-slate-500">{p.brand || ""}</div>
              </div>
              <div className="font-black text-emerald-700">৳{Number(p.price || 0).toLocaleString()}</div>
            </label>
          ))
        ) : (
          <div className="text-sm text-slate-500">No bundle suggestions yet.</div>
        )}

        <div className="pt-3 border-t border-base-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Bundle total</div>
            <div className="text-xl font-black text-emerald-700">৳{total.toLocaleString()}</div>
          </div>

          <button className="btn btn-primary rounded-full" disabled={adding || list.length <= 1} onClick={() => onAddAll(list)}>
            {adding ? <span className="loading loading-spinner loading-sm" /> : "Add bundle"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-3xl border border-base-200 bg-base-100 p-6">
          <div className="aspect-square bg-base-200 rounded-3xl animate-pulse" />
          <div className="mt-6 h-5 bg-base-200 rounded animate-pulse w-2/3" />
          <div className="mt-3 h-4 bg-base-200 rounded animate-pulse w-1/2" />
        </div>
        <div className="lg:col-span-5 rounded-3xl border border-base-200 bg-base-100 p-6">
          <div className="h-6 bg-base-200 rounded animate-pulse w-3/4" />
          <div className="mt-3 h-10 bg-base-200 rounded animate-pulse w-1/2" />
          <div className="mt-6 h-12 bg-base-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
