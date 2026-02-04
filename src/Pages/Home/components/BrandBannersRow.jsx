import React, { useEffect, useMemo, useState } from "react";
import PromoTile from "./PromoTile";

// ✅ set in .env (frontend) -> VITE_API_BASE_URL=http://localhost:5000
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function BrandBannersRow({
  title = "Brands for you",
  items: itemsProp,          // optional
  slug = "home",             // optional: lets you reuse for other pages
  className = "",            // optional
}) {
  const [items, setItems] = useState(Array.isArray(itemsProp) ? itemsProp : []);
  const [loading, setLoading] = useState(!Array.isArray(itemsProp));
  const [err, setErr] = useState("");

  useEffect(() => {
    // If parent provides items, don't fetch
    if (Array.isArray(itemsProp)) {
      setItems(itemsProp);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_BASE}/api/home/brand-banners?slug=${slug}`, {
          method: "GET",
          headers: { "content-type": "application/json" },
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error?.message || "Failed to load brand banners");
        }

        // expected shape: { data: { items: [...] } }
        const incoming = json?.data?.items || json?.data || json;
        const normalized = normalizeItems(incoming);

        if (mounted) setItems(normalized);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load brand banners");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [itemsProp, slug]);

  const content = useMemo(() => items || [], [items]);

  if (loading) {
    return (
      <section className={className}>
        <BrandRowSkeleton />
      </section>
    );
  }

  if (!content.length) {
    return (
      <section className={className}>
        <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
          <p className="text-sm text-error font-semibold">Brand banners not available</p>
          <p className="mt-1 text-sm text-slate-500">
            {err || "No items found. Insert a document in MongoDB and try again."}
          </p>
          <div className="mt-4 text-xs text-slate-500">
            Try opening:{" "}
            <span className="font-mono">
              {API_BASE}/api/home/brand-banners?slug={slug}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg md:text-xl font-extrabold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {content.map((b) => (
          <PromoTile
            key={b.id}
            title={b.title}
            subtitle={b.subtitle}
            href={b.href}
            image={b.image}
            theme="light"
            sponsored={b.sponsored}
            className="h-[140px] md:h-[160px]"
          />
        ))}
      </div>

      {/* Optional error note (non-blocking) */}
      {err ? (
        <div className="mt-4 rounded-xl border border-base-200 bg-base-100 p-3 text-sm">
          <span className="text-warning font-semibold">Note:</span>{" "}
          <span className="text-slate-600">{err}</span>
        </div>
      ) : null}
    </section>
  );
}

/** Keeps your UI stable even if DB misses some fields */
function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((x = {}) => ({
      id: String(x.id || x._id || Math.random().toString(16).slice(2)),
      title: String(x.title || ""),
      subtitle: String(x.subtitle || ""),
      href: String(x.href || "/shop"),
      image: String(x.image || ""),
      sponsored: Boolean(x.sponsored),
    }))
    .filter((x) => x.title || x.image);
}

function BrandRowSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Skel h="h-[140px] md:h-[160px]" />
      <Skel h="h-[140px] md:h-[160px]" />
      <Skel h="h-[140px] md:h-[160px]" />
    </div>
  );
}

function Skel({ h = "h-40" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-base-200 bg-base-100 overflow-hidden",
        "shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)]",
        "relative",
        h,
      ].join(" ")}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />
    </div>
  );
}
