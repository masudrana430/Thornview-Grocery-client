import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import ProductStrip from "./ProductStrip";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function RailWithBanner({
  // Optional old props (static mode)
  title: titleProp,
  viewAllHref: viewAllHrefProp,
  items: itemsProp,
  banner: bannerProp,
  bannerSide: bannerSideProp,

  // Dynamic controls
  slug = "home",
  sectionKey = "save-for-season",
}) {
  const propsProvided =
    titleProp ||
    viewAllHrefProp ||
    bannerProp ||
    bannerSideProp ||
    Array.isArray(itemsProp);

  const [cfg, setCfg] = useState(() => ({
    title: titleProp || "",
    viewAllHref: viewAllHrefProp || "",
    bannerSide: bannerSideProp || "right",
    railKey: "", // comes from config API
    banner: bannerProp || {},
  }));

  const [railItems, setRailItems] = useState(
    Array.isArray(itemsProp) ? itemsProp : [],
  );
  const [loading, setLoading] = useState(!propsProvided);
  const [err, setErr] = useState("");

  useEffect(() => {
    // ✅ Static mode: parent passes items/banner etc
    if (propsProvided) {
      setCfg({
        title: titleProp || "",
        viewAllHref: viewAllHrefProp || "",
        bannerSide: bannerSideProp || "right",
        railKey: "",
        banner: bannerProp || {},
      });
      setRailItems(Array.isArray(itemsProp) ? itemsProp : []);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        // 1) Load config
        const resCfg = await fetch(
          `${API_BASE}/api/home/rail-with-banner?slug=${slug}&key=${sectionKey}`,
          { method: "GET", headers: { "content-type": "application/json" } },
        );

        const jsonCfg = await resCfg.json().catch(() => ({}));
        if (!resCfg.ok) {
          throw new Error(
            jsonCfg?.error?.message || "Failed to load rail-with-banner config",
          );
        }

        // ✅ FIX: always read from jsonCfg.data first
        const cfgPayload = jsonCfg?.data || jsonCfg;
        const normalizedCfg = normalizeCfg(cfgPayload);

        if (!normalizedCfg.railKey) {
          throw new Error(
            "railKey missing in config. Set railKey in MongoDB doc.",
          );
        }

        // 2) Load rail items via product-rail endpoint
        const resRail = await fetch(
          `${API_BASE}/api/home/product-rail?slug=${slug}&key=${normalizedCfg.railKey}`,
          { method: "GET", headers: { "content-type": "application/json" } },
        );

        const jsonRail = await resRail.json().catch(() => ({}));
        if (!resRail.ok) {
          throw new Error(
            jsonRail?.error?.message || "Failed to load rail items",
          );
        }

        // ✅ FIX: always read from jsonRail.data first
        const railPayload = jsonRail?.data || jsonRail;
        const normalizedItems = normalizeItems(railPayload?.items);

        if (mounted) {
          setCfg(normalizedCfg);
          setRailItems(normalizedItems);
        }
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load rail with banner");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [
    propsProvided,
    slug,
    sectionKey,
    titleProp,
    viewAllHrefProp,
    bannerProp,
    bannerSideProp,
    itemsProp,
  ]);

  const title = cfg.title || titleProp || "";
  const viewAllHref = cfg.viewAllHref || viewAllHrefProp || "";
  const bannerSide = cfg.bannerSide || bannerSideProp || "right";
  const banner = cfg.banner || bannerProp || {};

  console.log("BANNER IMAGE:", banner?.image);

  const items = useMemo(
    () => (Array.isArray(itemsProp) ? itemsProp : railItems),
    [itemsProp, railItems],
  );

  if (loading) {
    return (
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <Skel className="lg:col-span-7 min-h-[240px]" />
          <Skel className="lg:col-span-5 min-h-[240px]" />
        </div>
      </section>
    );
  }
 
  const Banner = (
  <Link
    to={banner?.href || "/shop"}
    className="relative isolate block overflow-hidden rounded-3xl border border-base-200 hover:shadow-xl transition h-[240px] md:h-[360px] "
  >
    {/* Image layer */}
    {banner?.image ? (
      <img
        src={banner.image}
        alt={banner.title || "Promo"}
        className="absolute inset-0 h-full w-full object-cover z-0"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    ) : null}

    {/* Overlay layer */}
    <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/20 to-transparent z-10" />

    {/* Content layer */}
    <div className="relative z-20 p-6 text-white flex flex-col h-full justify-between">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
          {banner?.badge || "Featured"}
        </div>

        <h3 className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight">
          {banner?.title}
        </h3>

        {banner?.subtitle ? (
          <p className="mt-2 text-sm text-white/90">{banner.subtitle}</p>
        ) : null}
      </div>

      <span className="btn btn-sm rounded-full bg-white text-black border-0 w-fit">
        {banner?.cta || "Shop"}
      </span>
    </div>
  </Link>
);


  const Rail = (
    <div className="rounded-3xl border border-base-200 bg-base-100 p-3">
      <ProductStrip items={items} />
    </div>
  );

  return (
    <section>
      <SectionHeader title={title} viewAllHref={viewAllHref} />

      {!items.length && err ? (
        <div className="rounded-2xl border border-base-200 bg-base-100 p-6 mb-3">
          <p className="text-sm text-error font-semibold">
            Rail section not available
          </p>
          <p className="mt-1 text-sm text-slate-500">{err}</p>
          <div className="mt-4 text-xs text-slate-500">
            Try opening:{" "}
            <span className="font-mono">
              {API_BASE}/api/home/rail-with-banner?slug={slug}&key={sectionKey}
            </span>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
  {bannerSide === "left" ? (
    <>
      <div className="lg:col-span-5">{Banner}</div>
      <div className="lg:col-span-7">{Rail}</div>
    </>
  ) : (
    <>
      <div className="lg:col-span-7">{Rail}</div>
      <div className="lg:col-span-5">{Banner}</div>
    </>
  )}
</div>


      {err && items.length ? (
        <div className="mt-4 rounded-xl border border-base-200 bg-base-100 p-3 text-sm">
          <span className="text-warning font-semibold">Note:</span>{" "}
          <span className="text-slate-600">{err}</span>
        </div>
      ) : null}
    </section>
  );
}

function normalizeCfg(d) {
  const banner = d?.banner && typeof d.banner === "object" ? d.banner : {};
  return {
    title: String(d?.title || ""),
    viewAllHref: d?.viewAllHref ? String(d.viewAllHref) : "",
    bannerSide: d?.bannerSide === "left" ? "left" : "right",
    railKey: d?.railKey ? String(d.railKey) : "",
    banner: {
      title: String(banner.title || ""),
      subtitle: String(banner.subtitle || ""),
      href: String(banner.href || "/shop"),
      // ✅ keep exactly banner.image
      image: String(banner.image || ""),
      cta: String(banner.cta || "Shop"),
      badge: String(banner.badge || "Featured"),
    },
  };
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((p = {}) => ({
      _id: String(p._id || p.id || Math.random().toString(16).slice(2)),
      title: String(p.title || ""),
      price: typeof p.price === "number" ? p.price : Number(p.price || 0),
      salePrice:
        p.salePrice === null || p.salePrice === undefined || p.salePrice === ""
          ? undefined
          : typeof p.salePrice === "number"
            ? p.salePrice
            : Number(p.salePrice),
      image: String(p.image || ""),
      badge: p.badge ? String(p.badge) : "",
      href: p.href ? String(p.href) : "",
    }))
    .filter((p) => p.title || p.image);
}

function Skel({ className = "" }) {
  return (
    <div
      className={[
        "rounded-3xl border border-base-200 bg-base-100 overflow-hidden relative",
        "shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)]",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />
    </div>
  );
}
