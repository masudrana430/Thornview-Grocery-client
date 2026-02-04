import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FiHeart } from "react-icons/fi";
import "swiper/css";
import "swiper/css/navigation";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Price({ price, salePrice }) {
  if (typeof salePrice === "number" && !Number.isNaN(salePrice)) {
    return (
      <div className="flex items-end gap-2">
        <span className="text-emerald-700 font-extrabold">Now ৳{salePrice}</span>
        <span className="text-xs line-through opacity-60">৳{price}</span>
      </div>
    );
  }
  return <div className="font-extrabold">৳{price}</div>;
}

export default function ProductRail({
  title: titleProp,
  viewAllHref: viewAllHrefProp,
  items: itemsProp,      // optional
  slug = "home",
  railKey = "default",   // ✅ allows multiple rails in DB
}) {
  const [data, setData] = useState(() => ({
    title: titleProp || "",
    viewAllHref: viewAllHrefProp || "",
    items: Array.isArray(itemsProp) ? itemsProp : [],
  }));
  const [loading, setLoading] = useState(!Array.isArray(itemsProp));
  const [err, setErr] = useState("");

  useEffect(() => {
    // If parent provides items, don't fetch
    if (Array.isArray(itemsProp)) {
      setData({
        title: titleProp || "",
        viewAllHref: viewAllHrefProp || "",
        items: itemsProp,
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
          `${API_BASE}/api/home/product-rail?slug=${slug}&key=${railKey}`,
          { method: "GET", headers: { "content-type": "application/json" } }
        );

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error?.message || "Failed to load product rail");
        }

        const incoming = json?.data || json;
        const normalized = normalizeRail(incoming);

        if (mounted) setData(normalized);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load product rail");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [itemsProp, slug, railKey, titleProp, viewAllHrefProp]);

  const content = useMemo(() => data.items || [], [data.items]);

  // keep same behavior: if no items, show nothing (but when dynamic, show error box)
  if (!loading && !content.length && !err) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg md:text-xl font-extrabold">{data.title || titleProp}</h2>
        {(data.viewAllHref || viewAllHrefProp) ? (
          <Link className="link link-hover text-sm" to={data.viewAllHref || viewAllHrefProp}>
            View all
          </Link>
        ) : null}
      </div>

      {loading ? (
        <RailSkeleton />
      ) : !content.length ? (
        <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
          <p className="text-sm text-error font-semibold">Product rail not available</p>
          <p className="mt-1 text-sm text-slate-500">
            {err || "No items found. Insert a document in MongoDB and try again."}
          </p>
          <div className="mt-4 text-xs text-slate-500">
            Try opening:{" "}
            <span className="font-mono">
              {API_BASE}/api/home/product-rail?slug={slug}&key={railKey}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-base-200 bg-base-100 p-3">
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={12}
            slidesPerView={1.25}
            breakpoints={{
              480: { slidesPerView: 2.2 },
              768: { slidesPerView: 3.2 },
              1024: { slidesPerView: 5.2 },
            }}
          >
            {content.map((p) => (
              <SwiperSlide key={p._id}>
                <div className="rounded-3xl border border-base-200 bg-base-100 overflow-hidden hover:shadow-lg transition">
                  <div className="relative h-40 bg-base-200">
                    {p.badge ? (
                      <span className="absolute left-2 top-2 badge badge-error badge-sm">
                        {p.badge}
                      </span>
                    ) : null}

                    <button
                      className="absolute right-2 top-2 btn btn-xs btn-circle bg-base-100/80 border-0"
                      type="button"
                      title="Save"
                    >
                      <FiHeart />
                    </button>

                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title || "Product"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="text-sm font-semibold line-clamp-2">{p.title}</div>
                    <Price price={p.price} salePrice={p.salePrice} />

                    <div className="flex gap-2">
                      <button className="btn btn-sm rounded-full flex-1" type="button">
                        + Add
                      </button>
                      <button className="btn btn-sm rounded-full btn-outline" type="button">
                        Options
                      </button>
                    </div>

                    <div className="text-[11px] opacity-70">Delivery • Pickup today</div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Optional non-blocking error note */}
      {err && content.length ? (
        <div className="mt-4 rounded-xl border border-base-200 bg-base-100 p-3 text-sm">
          <span className="text-warning font-semibold">Note:</span>{" "}
          <span className="text-slate-600">{err}</span>
        </div>
      ) : null}
    </section>
  );
}

function normalizeRail(d) {
  const items = Array.isArray(d.items) ? d.items : [];
  return {
    title: String(d.title || ""),
    viewAllHref: d.viewAllHref ? String(d.viewAllHref) : "",
    items: items
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
      }))
      .filter((p) => p.title || p.image),
  };
}

function RailSkeleton() {
  return (
    <div className="rounded-3xl border border-base-200 bg-base-100 p-3">
      <div className="flex gap-3 overflow-hidden">
        <SkelCard />
        <SkelCard />
        <SkelCard />
        <SkelCard />
        <SkelCard />
      </div>
    </div>
  );
}

function SkelCard() {
  return (
    <div className="w-[220px] flex-shrink-0 rounded-3xl border border-base-200 bg-base-100 overflow-hidden">
      <div className="h-40 bg-slate-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
