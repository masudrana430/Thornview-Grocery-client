import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function DepartmentScroller({
  // static props (optional)
  title: titleProp,
  viewAllHref: viewAllHrefProp,
  items: itemsProp,

  // dynamic controls
  slug = "home",
  className = "",
}) {
  const propsProvided = titleProp || viewAllHrefProp || Array.isArray(itemsProp);

  const [data, setData] = useState(() => ({
    title: titleProp || "",
    viewAllHref: viewAllHrefProp || "",
    items: Array.isArray(itemsProp) ? itemsProp : [],
  }));
  const [loading, setLoading] = useState(!propsProvided);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (propsProvided) {
      setData({
        title: titleProp || "",
        viewAllHref: viewAllHrefProp || "",
        items: Array.isArray(itemsProp) ? itemsProp : [],
      });
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_BASE}/api/home/departments?slug=${slug}`, {
          method: "GET",
          headers: { "content-type": "application/json" },
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error?.message || "Failed to load departments");
        }

        const payload = json?.data || json;
        const normalized = normalizeDepartments(payload);

        if (mounted) setData(normalized);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load departments");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [propsProvided, titleProp, viewAllHrefProp, itemsProp, slug]);

  const title = data.title || "Shop by department";
  const viewAllHref = data.viewAllHref || "/shop";
  const items = useMemo(() => data.items || [], [data.items]);

  if (loading) {
    return (
      <section className={className}>
        <div className="rounded-3xl border border-base-200 bg-base-100 p-3">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-[78px]">
                <div className="h-14 w-14 rounded-2xl bg-base-200 animate-pulse mx-auto" />
                <div className="mt-2 h-3 rounded bg-base-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className={className}>
        <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
          <p className="text-sm text-error font-semibold">Departments not available</p>
          <p className="mt-1 text-sm text-slate-500">
            {err || "Departments not configured yet"}
          </p>
          <div className="mt-4 text-xs text-slate-500">
            Try opening:{" "}
            <span className="font-mono">{API_BASE}/api/home/departments?slug={slug}</span>
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
            View all
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="rounded-3xl border border-base-200 bg-base-100 p-3">
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={10}
          slidesPerView={4.2}
          breakpoints={{
            480: { slidesPerView: 6.2 },
            768: { slidesPerView: 9.2 },
            1024: { slidesPerView: 11.2 },
          }}
        >
          {items.map((d) => (
            <SwiperSlide key={d.id}>
              <Link
                to={d.href || "/shop"}
                className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-base-200/60 transition"
              >
                <div className="h-14 w-14 rounded-2xl bg-base-200 overflow-hidden flex items-center justify-center">
                  {d.image ? (
                    <img
                      src={d.image}
                      alt={d.label || "Department"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="text-sm font-bold">{(d.label || "?")[0]}</span>
                  )}
                </div>

                <div className="text-[11px] md:text-xs font-semibold text-center line-clamp-1">
                  {d.label}
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
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

function normalizeDepartments(d) {
  const items = Array.isArray(d?.items) ? d.items : [];
  return {
    title: String(d?.title || "Shop by department"),
    viewAllHref: d?.viewAllHref ? String(d.viewAllHref) : "/shop",
    items: items.map((x = {}) => ({
      id: String(x.id || x._id || Math.random().toString(16).slice(2)),
      label: String(x.label || x.title || ""),
      href: String(x.href || "/shop"),
      image: x.image ? String(x.image) : "",
    })),
  };
}
