import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductRail from "./ProductRail";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function HeroWithRail({
  // If you pass these, it will behave like your old version (no fetch)
  title: titleProp,
  banner: bannerProp,
  railTitle: railTitleProp,
  viewAllHref: viewAllHrefProp,
  items: itemsProp,

  // Dynamic mode controls
  slug = "home",
  sectionKey = "gifts-holiday", // DB key for this hero section
  className = "",
}) {
  const propsProvided =
    titleProp ||
    bannerProp ||
    railTitleProp ||
    viewAllHrefProp ||
    Array.isArray(itemsProp);

  const [data, setData] = useState(() => ({
    title: titleProp || "",
    viewAllHref: viewAllHrefProp || "",
    railTitle: railTitleProp || "",
    railKey: "", // comes from DB
    banner: bannerProp || {},
  }));
  const [loading, setLoading] = useState(!propsProvided);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (propsProvided) {
      setData({
        title: titleProp || "",
        viewAllHref: viewAllHrefProp || "",
        railTitle: railTitleProp || "",
        railKey: "",
        banner: bannerProp || {},
      });
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(
          `${API_BASE}/api/home/hero-with-rail?slug=${slug}&key=${sectionKey}`,
          { method: "GET", headers: { "content-type": "application/json" } }
        );

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error?.message || "Failed to load hero section");
        }

        const incoming = json?.data || json;
        const normalized = normalizeHeroWithRail(incoming);

        if (mounted) setData(normalized);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load hero section");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [propsProvided, titleProp, bannerProp, railTitleProp, viewAllHrefProp, itemsProp, slug, sectionKey]);

  const title = data.title || titleProp || "";
  const banner = data.banner || bannerProp || {};
  const railTitle = data.railTitle || railTitleProp || "Top picks";
  const viewAllHref = data.viewAllHref || viewAllHrefProp || "";
  const railKey = data.railKey || "";

  const hasInlineItems = Array.isArray(itemsProp) && itemsProp.length > 0;

  if (loading) {
    return (
      <section className={className}>
        <HeroWithRailSkeleton />
      </section>
    );
  }

  if (!title && !banner?.title && !railKey && !hasInlineItems) {
    return (
      <section className={className}>
        <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
          <p className="text-sm text-error font-semibold">Hero section not available</p>
          <p className="mt-1 text-sm text-slate-500">
            {err || "No doc found. Insert a document in MongoDB and try again."}
          </p>
          <div className="mt-4 text-xs text-slate-500">
            Try opening:{" "}
            <span className="font-mono">
              {API_BASE}/api/home/hero-with-rail?slug={slug}&key={sectionKey}
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
        {viewAllHref ? (
          <Link to={viewAllHref} className="link link-hover text-sm">
            Shop
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-3">
        {/* Left banner */}
        <Link
          to={banner?.href || "/shop"}
          className="relative overflow-hidden rounded-3xl border border-base-200 shadow-sm hover:shadow-xl transition min-h-[220px]"
        >
          {banner?.image ? (
            <img
              src={banner.image}
              alt={banner.title || "Promo"}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/25 to-transparent" />

          <div className="relative p-6 text-white flex flex-col h-full justify-between">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold">
                {banner?.title}
              </h3>
              <p className="mt-2 text-sm text-white/90">{banner?.subtitle}</p>
            </div>

            <span className="btn btn-sm rounded-full bg-white text-black border-0 w-fit">
              {banner?.cta || "Shop"}
            </span>
          </div>
        </Link>

        {/* Right rail */}
        <div className="rounded-3xl border border-base-200 bg-base-100">
          <div className="p-3">
            {/* If you passed itemsProp, it uses those; otherwise ProductRail fetches via railKey */}
            <ProductRail
              title={railTitle}
              viewAllHref={viewAllHref}
              items={hasInlineItems ? itemsProp : undefined}
              slug={slug}
              railKey={hasInlineItems ? "default" : railKey || "top-picks"}
            />
          </div>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-base-200 bg-base-100 p-3 text-sm">
          <span className="text-warning font-semibold">Note:</span>{" "}
          <span className="text-slate-600">{err}</span>
        </div>
      ) : null}
    </section>
  );
}

function normalizeHeroWithRail(d) {
  const banner = d.banner && typeof d.banner === "object" ? d.banner : {};
  return {
    title: String(d.title || ""),
    viewAllHref: d.viewAllHref ? String(d.viewAllHref) : "",
    railTitle: d.railTitle ? String(d.railTitle) : "",
    railKey: d.railKey ? String(d.railKey) : "",
    banner: {
      title: String(banner.title || ""),
      subtitle: String(banner.subtitle || ""),
      href: String(banner.href || "/shop"),
      image: String(banner.image || ""),
      cta: String(banner.cta || "Shop"),
      badge: banner.badge ? String(banner.badge) : "",
      theme: banner.theme ? String(banner.theme) : "",
    },
  };
}

function HeroWithRailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-3">
      <Skel h="min-h-[220px]" />
      <Skel h="min-h-[220px]" />
    </div>
  );
}

function Skel({ h = "h-40" }) {
  return (
    <div
      className={[
        "rounded-3xl border border-base-200 bg-base-100 overflow-hidden relative",
        "shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)]",
        h,
      ].join(" ")}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />
    </div>
  );
}
