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
        <div className="rounded-3xl border border-base-200/70 bg-base-100/80 backdrop-blur p-6 shadow-sm">
          <p className="text-sm text-error font-semibold">Promo mosaic not available</p>
          <p className="mt-1 text-sm opacity-70">
            {err || "No mosaic doc found. Insert a document in MongoDB and try again."}
          </p>
          <div className="mt-4 text-xs opacity-70">
            Try opening: <span className="font-mono">{API_BASE}/api/home/mosaic?slug=home</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      {/* Premium frame (neutral, no primary/secondary bg gradients) */}
      <div className="relative rounded-[28px] border border-base-200/70 bg-base-100/70 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.10)]">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/10" />

        <div className="p-3 md:p-4">
          {/* =========================
              MOBILE / TABLET ( < lg )
              Walmart-like quilt grid
              ========================= */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:hidden">
            {/* HERO ALWAYS TOP */}
            <div className="col-span-2">
              <HeroSwiper slides={content.heroSlides || []} />
            </div>

            {/* Left tall + 2 stacked right (Walmart-ish) */}
            <Tile className="row-span-2 min-h-[260px] md:min-h-[320px]">
              <PromoTile {...content.leftTall} variant="tall" />
            </Tile>

            <Tile className="min-h-[125px] md:min-h-[150px]">
              <PromoTile {...content.rightTop} variant="card" />
            </Tile>

            <Tile className="min-h-[125px] md:min-h-[150px]">
              <PromoTile {...content.rightMid} variant="card" />
            </Tile>

            {/* wide banner */}
            <Tile className="col-span-2 min-h-[160px] md:min-h-[180px]">
              <PromoTile {...content.midWide} variant="wide" />
            </Tile>

            {/* remaining promos as a clean 2-col grid */}
            <Tile className="min-h-[160px] md:min-h-[180px]">
              <PromoTile {...content.leftTop} variant="card" />
            </Tile>

            <Tile className="min-h-[160px] md:min-h-[180px]">
              <PromoTile {...content.midLeft} variant="card" />
            </Tile>

            <Tile className="min-h-[160px] md:min-h-[180px]">
              <PromoTile {...content.midRight} variant="card" />
            </Tile>

            <Tile className="min-h-[160px] md:min-h-[180px]">
              <PromoTile {...content.leftBottom} variant="card" />
            </Tile>

            {/* optional: make rightTall full width on mobile for balance */}
            <Tile className="col-span-2 min-h-[240px] md:min-h-[300px]">
              <PromoTile {...content.rightTall} variant="tall" />
            </Tile>
          </div>

          {/* =========================
              DESKTOP ( lg + )
              Your original 3-column mosaic
              ========================= */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4">
            {/* LEFT */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <Tile><PromoTile {...content.leftTop} variant="card" /></Tile>
              <Tile className="min-h-[410px]"><PromoTile {...content.leftTall} variant="tall" /></Tile>
              <Tile><PromoTile {...content.leftBottom} variant="card" /></Tile>
            </div>

            {/* MIDDLE */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <HeroSwiper slides={content.heroSlides || []} />
              <Tile><PromoTile {...content.midLeft} variant="card" /></Tile>
              <Tile><PromoTile {...content.midRight} variant="card" /></Tile>
              <Tile className="col-span-2">
                <PromoTile {...content.midWide} variant="wide" />
              </Tile>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <Tile><PromoTile {...content.rightTop} variant="card" /></Tile>
              <Tile><PromoTile {...content.rightMid} variant="card" /></Tile>
              <Tile className="min-h-[410px]"><PromoTile {...content.rightTall} variant="tall" /></Tile>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-2xl border border-base-200/70 bg-base-100/70 backdrop-blur px-4 py-3 text-sm shadow-sm">
              <span className="font-semibold">Note:</span>{" "}
              <span className="opacity-70">{err}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Tile({ children, className = "" }) {
  return (
    <div
      className={[
        "group relative rounded-2xl overflow-hidden",
        "border border-base-200/70 bg-base-100/85 backdrop-blur",
        "shadow-sm",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)]",
        "focus-within:ring-2 focus-within:ring-primary/35 focus-within:ring-offset-0",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/5" />
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
    <div className="col-span-2 relative rounded-2xl overflow-hidden border border-base-200/70 bg-base-100/80 backdrop-blur shadow-sm">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="h-[220px] sm:h-[260px] md:h-[320px] lg:h-[320px]"
      >
        {slides.map((s, idx) => (
          <SwiperSlide key={idx}>
            <Link to={s.href || "/shop"} className="relative block h-full w-full focus:outline-none">
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

              {/* contrast overlay (ok; not the forbidden primary/secondary gradient) */}
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.18),rgba(0,0,0,.55))]" />

              <div className="relative h-full p-4 sm:p-5 md:p-6 text-white flex flex-col justify-between">
                <div>
                  {s.badge ? (
                    <span className="inline-flex px-3 py-1.5 rounded-full bg-white/12 border border-white/15 text-[11px] font-extrabold tracking-wide">
                      {s.badge}
                    </span>
                  ) : null}

                  <h3 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
                    {s.title}
                  </h3>

                  {s.subtitle ? (
                    <p className="mt-2 text-sm md:text-base text-white/85 max-w-lg">
                      {s.subtitle}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <span className="btn btn-sm rounded-full border border-white/15 bg-white text-black hover:bg-white shadow-sm">
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
        .swiper-pagination-bullets { bottom: 12px !important; }
        .swiper-pagination-bullet {
          width: 8px; height: 8px;
          opacity: .55;
          border: 1px solid rgba(255,255,255,.35);
          background: rgba(255,255,255,.25);
          backdrop-filter: blur(6px);
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          transform: scale(1.15);
          background: rgba(255,255,255,.9);
        }
      `}</style>
    </div>
  );
}

function MosaicSkeleton() {
  return (
    <div className="rounded-[28px] border border-base-200/70 bg-base-100/70 backdrop-blur-xl p-3 md:p-4 shadow-[0_18px_50px_rgba(0,0,0,0.10)]">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:hidden">
        <Skel h="h-[220px]" span />
        <Skel h="h-[260px]" />
        <Skel h="h-[125px]" />
        <Skel h="h-[125px]" />
        <Skel h="h-[160px]" span />
        <Skel h="h-[160px]" />
        <Skel h="h-[160px]" />
        <Skel h="h-[160px]" />
        <Skel h="h-[160px]" />
        <Skel h="h-[240px]" span />
      </div>

      <div className="hidden lg:grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Skel h="h-[190px]" />
          <Skel h="h-[410px]" />
          <Skel h="h-[190px]" />
        </div>
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <Skel h="h-[320px]" span />
          <Skel h="h-[190px]" />
          <Skel h="h-[190px]" />
          <Skel h="h-[170px]" span />
        </div>
        <div className="lg:col-span-3 flex flex-col gap-4">
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
        "rounded-2xl border border-base-200/70 bg-base-100/70 overflow-hidden relative",
        "shadow-sm animate-pulse",
        h,
        span ? "col-span-2" : "",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-base-200/60" />
      <div className="absolute inset-0 opacity-20 bg-white" />
    </div>
  );
}