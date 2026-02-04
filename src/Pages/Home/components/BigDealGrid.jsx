import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PromoTile from "./PromoTile";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Premium BigDealGrid
 * - uses DB by default: GET /api/home/big-deals?slug=home
 * - still supports static itemsProp (fallback)
 * - upgrades UI without changing backend
 */
export default function BigDealGrid({
  title = "This week’s highlights",
  items: itemsProp, // optional; if not passed -> fetch from DB
  slug = "home",
  className = "",
  viewAllHref = "/shop?deals=1",
  rightText = "View all",
  eyebrow = "Curated deals", // ✅ new
}) {
  const [items, setItems] = useState(Array.isArray(itemsProp) ? itemsProp : []);
  const [loading, setLoading] = useState(!Array.isArray(itemsProp));
  const [err, setErr] = useState("");

  useEffect(() => {
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

        const res = await fetch(`${API_BASE}/api/home/big-deals?slug=${slug}`, {
          method: "GET",
          headers: { "content-type": "application/json" },
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error?.message || "Failed to load big deals");

        const incoming = json?.data?.items || json?.data || json;
        const normalized = normalizeItems(incoming);

        if (mounted) setItems(normalized);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load big deals");
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

  // Choose a “featured” tile (best: first, or the one with row-span-2)
  const featuredId = useMemo(() => {
    const found = content.find((x) => String(x.span || "").includes("row-span-2"));
    return (found || content[0] || {})?.id;
  }, [content]);

  return (
    <section className={className}>
      <div className="rounded-[28px] border border-base-200 bg-base-100/75 backdrop-blur p-4 md:p-6 shadow-[0_22px_70px_-45px_rgba(0,0,0,0.55)]">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-200/60 text-[11px] font-extrabold tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {eyebrow}
            </div>

            <h2 className="mt-3 text-xl md:text-3xl font-black leading-tight">
              {title}
            </h2>

            <div className="mt-2 h-[3px] w-24 rounded-full bg-gradient-to-r from-primary/70 via-primary/30 to-transparent" />
          </div>

          <Link
            to={viewAllHref}
            className="btn btn-sm rounded-full bg-base-100 border border-base-200 hover:shadow-md"
          >
            {rightText}
          </Link>
        </div>

        {loading ? (
          <BigDealSkeleton />
        ) : !content.length ? (
          <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
            <p className="text-sm text-error font-semibold">Big deals not available</p>
            <p className="mt-1 text-sm text-slate-500">
              {err || "No items found. Insert a document in MongoDB and try again."}
            </p>
            <div className="mt-4 text-xs text-slate-500">
              Try opening:{" "}
              <span className="font-mono">
                {API_BASE}/api/home/big-deals?slug={slug}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3 auto-rows-[115px] md:auto-rows-[155px] lg:auto-rows-[175px]">
            {content.map((x) => {
              const isFeatured = x.id === featuredId;

              // Featured tiles get a premium overlay + CTA
              if (isFeatured) {
                return (
                  <PremiumDealTile
                    key={x.id}
                    className={`${x.span} min-h-[160px]`}
                    href={x.href}
                    title={x.title}
                    subtitle={x.subtitle}
                    image={x.image}
                    theme={x.theme}
                    priceTag={x.priceTag}
                    badge={x.sponsored ? "Sponsored" : x.badge}
                    cta="Shop now"
                  />
                );
              }

              // Regular tiles continue using PromoTile (your existing component)
              return (
                <div
                  key={x.id}
                  className={[
                    x.span,
                    "rounded-[26px] overflow-hidden",
                    "shadow-[0_14px_46px_-35px_rgba(0,0,0,0.55)]",
                    "transition-transform duration-300 hover:-translate-y-[2px]",
                  ].join(" ")}
                >
                  <PromoTile
                    title={x.title}
                    subtitle={x.subtitle}
                    href={x.href}
                    image={x.image}
                    theme={x.theme}
                    // If your PromoTile supports badge/eyebrow/cta/price later, it will use them
                    badge={x.sponsored ? "Sponsored" : x.badge}
                    className="rounded-[26px]" // ✅ requires PromoTile to accept className (recommended)
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Non-blocking error note */}
        {err && !loading ? (
          <div className="mt-4 rounded-2xl border border-base-200 bg-base-100 p-3 text-sm">
            <span className="text-warning font-semibold">Note:</span>{" "}
            <span className="text-slate-600">{err}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((x = {}) => ({
      id: String(x.id || x._id || Math.random().toString(16).slice(2)),
      title: String(x.title || ""),
      subtitle: String(x.subtitle || ""),
      href: String(x.href || "/shop?deals=1"),
      image: String(x.image || ""),
      theme: String(x.theme || "neutral"),
      priceTag: x.priceTag ? String(x.priceTag) : "",
      span: String(x.span || "col-span-12 md:col-span-6 row-span-1"),
      sponsored: Boolean(x.sponsored),
      badge: x.badge ? String(x.badge) : "",
    }))
    .filter((x) => x.title || x.image);
}

/** Featured tile (premium look) */
function PremiumDealTile({
  className = "",
  href = "/shop",
  title,
  subtitle,
  image,
  badge,
  priceTag,
  cta = "Shop",
}) {
  return (
    <Link
      to={href}
      className={[
        className,
        "group relative isolate block overflow-hidden rounded-[28px] border border-base-200",
        "shadow-[0_22px_70px_-48px_rgba(0,0,0,0.75)]",
        "transition-transform duration-300 hover:-translate-y-[2px]",
      ].join(" ")}
    >
      {/* Image */}
      {image ? (
        <img
          src={image}
          alt={title || "Deal"}
          className="absolute inset-0 h-full w-full object-cover z-0 transition-transform duration-700 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 bg-base-200" />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/18 to-transparent" />
      <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)]" />

      {/* Content */}
      <div className="relative z-20 h-full p-5 md:p-6 text-white flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            {badge ? (
              <span className="inline-flex px-3 py-1 rounded-full bg-white/15 text-[11px] font-extrabold tracking-wide">
                {badge}
              </span>
            ) : null}

            {priceTag ? (
              <span className="inline-flex px-3 py-1 rounded-full bg-white text-black text-[11px] font-extrabold">
                {priceTag}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-2xl md:text-3xl font-black leading-tight drop-shadow-sm">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-2 text-sm md:text-base text-white/85 max-w-[46ch]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="btn btn-sm rounded-full border-0 bg-white text-black hover:bg-white shadow-sm">
            {cta}
          </span>
          <span className="text-xs text-white/80">Free returns • Fast delivery</span>
        </div>
      </div>
    </Link>
  );
}

function BigDealSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-[115px] md:auto-rows-[155px] lg:auto-rows-[175px]">
      <Shimmer span="col-span-12 lg:col-span-6 row-span-2" />
      <Shimmer span="col-span-12 lg:col-span-6 row-span-1" />
      <Shimmer span="col-span-6 lg:col-span-3 row-span-1" />
      <Shimmer span="col-span-6 lg:col-span-3 row-span-1" />
      <Shimmer span="col-span-12 lg:col-span-3 row-span-2" />
    </div>
  );
}

function Shimmer({ span = "col-span-12", h = "min-h-[160px]" }) {
  return (
    <div
      className={[
        span,
        h,
        "rounded-[28px] border border-base-200 bg-base-100 overflow-hidden relative",
        "shadow-[0_14px_46px_-35px_rgba(0,0,0,0.55)]",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-base-200/70" />
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
