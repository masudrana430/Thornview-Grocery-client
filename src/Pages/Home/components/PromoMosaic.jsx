import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PromoTile from "./PromoTile";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function PromoMosaic({ className = "" }) {
  const [mosaic, setMosaic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_BASE}/api/home/mosaic?slug=home`, {
          method: "GET",
          headers: { "content-type": "application/json" },
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error?.message || "Failed to load mosaic");

        const doc = json?.data?.mosaic || json?.data || json;
        if (!doc) throw new Error("Mosaic not found in response");

        if (mounted) setMosaic(normalizeMosaic(doc));
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load mosaic");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const content = useMemo(() => mosaic, [mosaic]);

  if (loading) {
    return (
      <section className={className}>
        <MosaicSkeleton />
      </section>
    );
  }

  if (!content) {
    return (
      <section className={className}>
        <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
          <p className="text-sm text-error font-semibold">Promo mosaic not available</p>
          <p className="mt-1 text-sm text-slate-500">
            {err || "No mosaic doc found. Insert a document in MongoDB and try again."}
          </p>
          <div className="mt-4 text-xs text-slate-500">
            Try opening:{" "}
            <span className="font-mono">{API_BASE}/api/home/mosaic?slug=home</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      {/* Simple premium frame (FAST) */}
      <div className="rounded-3xl border border-base-200 bg-base-100 p-3 md:p-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
          {/* LEFT */}
          <div className="lg:col-span-3 flex flex-col gap-3 md:gap-4">
            <Tile><PromoTile {...content.leftTop} variant="card" /></Tile>
            <Tile><PromoTile {...content.leftTall} variant="tall" /></Tile>
            <Tile><PromoTile {...content.leftBottom} variant="card" /></Tile>
          </div>

          {/* MIDDLE */}
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <HeroSwiper slides={content.heroSlides || []} />
            <Tile><PromoTile {...content.midLeft} variant="card" /></Tile>
            <Tile><PromoTile {...content.midRight} variant="card" /></Tile>
            <Tile className="md:col-span-2">
              <PromoTile {...content.midWide} variant="wide" />
            </Tile>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3 flex flex-col gap-3 md:gap-4">
            <Tile><PromoTile {...content.rightTop} variant="card" /></Tile>
            <Tile><PromoTile {...content.rightMid} variant="card" /></Tile>
            <Tile><PromoTile {...content.rightTall} variant="tall" /></Tile>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-base-200 bg-base-100 p-3 text-sm">
            <span className="text-warning font-semibold">Note:</span>{" "}
            <span className="text-slate-600">{err}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Tile({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl overflow-hidden",
        "border border-base-200/70",
        "bg-base-100",
        "shadow-sm",
        "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function normalizeMosaic(doc) {
  return {
    leftTop: doc.leftTop || {},
    leftTall: doc.leftTall || {},
    leftBottom: doc.leftBottom || {},
    heroSlides: Array.isArray(doc.heroSlides) ? doc.heroSlides : [],
    midLeft: doc.midLeft || {},
    midRight: doc.midRight || {},
    midWide: doc.midWide || {},
    rightTop: doc.rightTop || {},
    rightMid: doc.rightMid || {},
    rightTall: doc.rightTall || {},
  };
}

function HeroSwiper({ slides = [] }) {
  return (
    <div className="md:col-span-2 rounded-2xl overflow-hidden border border-base-200/70 shadow-sm">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="h-[260px] md:h-[320px] lg:h-[320px]"
      >
        {slides.map((s, idx) => (
          <SwiperSlide key={idx}>
            <Link to={s.href || "/shop"} className="relative block h-full w-full">
              {s?.image ? (
                <img
                  src={s.image}
                  alt={s.title || "Promo"}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="absolute inset-0 bg-base-200" />
              )}

              <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/25 to-transparent" />

              <div className="relative h-full p-5 md:p-6 text-white flex flex-col justify-between">
                <div>
                  {s.badge ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-extrabold tracking-wide">
                      {s.badge}
                    </span>
                  ) : null}

                  <h3 className="mt-3 text-3xl md:text-4xl font-black leading-tight">
                    {s.title}
                  </h3>

                  {s.subtitle ? (
                    <p className="mt-2 text-sm md:text-base text-white/85 max-w-lg">
                      {s.subtitle}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <span className="btn btn-sm rounded-full border-0 bg-white text-black hover:bg-white">
                    {s.cta || "Shop"}
                  </span>
                  {s.note ? <span className="text-xs text-white/80">{s.note}</span> : null}
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      <style>{`
        .swiper-pagination-bullets { bottom: 10px !important; }
        .swiper-pagination-bullet { opacity: .6; }
        .swiper-pagination-bullet-active { opacity: 1; }
      `}</style>
    </div>
  );
}

function MosaicSkeleton() {
  return (
    <div className="rounded-3xl border border-base-200 bg-base-100 p-3 md:p-4 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
        <div className="lg:col-span-3 flex flex-col gap-3 md:gap-4">
          <Skel h="h-[190px]" />
          <Skel h="h-[410px]" />
          <Skel h="h-[190px]" />
        </div>

        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <Skel h="h-[320px]" span />
          <Skel h="h-[190px]" />
          <Skel h="h-[190px]" />
          <Skel h="h-[170px]" span />
        </div>

        <div className="lg:col-span-3 flex flex-col gap-3 md:gap-4">
          <Skel h="h-[190px]" />
          <Skel h="h-[190px]" />
          <Skel h="h-[410px]" />
        </div>
      </div>
    </div>
  );
}

function Skel({ h = "h-40", span = false }) {
  return (
    <div
      className={[
        "rounded-2xl border border-base-200 bg-base-100 overflow-hidden relative",
        "shadow-sm",
        h,
        span ? "md:col-span-2" : "",
      ].join(" ")}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />
    </div>
  );
}
