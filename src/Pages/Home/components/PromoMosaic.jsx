import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PromoTile from "./PromoTile";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Container from "../../../Components/Container";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function PromoMosaic({ className = "" }) {
  const [mosaic, setMosaic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMosaic() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_BASE}/api/home/mosaic?slug=home`, {
          method: "GET",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.error?.message || "Failed to load promo section");
        }

        const doc = json?.data?.mosaic || json?.data || json;

        if (!doc) {
          throw new Error("Promo content was not found");
        }

        setMosaic(normalizeMosaic(doc));
      } catch (error) {
        if (error.name !== "AbortError") {
          setErr(error?.message || "Failed to load promo section");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMosaic();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <section
        className={className}
        aria-label="Loading featured offers"
        aria-busy="true"
      >
        <MosaicSkeleton />
      </section>
    );
  }

  if (!mosaic) {
    return (
      <section className={className} aria-label="Featured offers">
        <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-error">
            Promo section is not available
          </p>
          <p className="mt-1 text-sm text-base-content/70">
            {err || "No promo content found."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={className}
      aria-labelledby="featured-offers-title"
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <JsonLd mosaic={mosaic} />
      
      <Container>
      <div className="">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
              Featured
            </p>
            <h2
              id="featured-offers-title"
              className="text-2xl font-bold tracking-tight text-base-content md:text-3xl"
            >
              Today&apos;s best offers
            </h2>
          </div>

          <Link
            to="/shop"
            className="hidden rounded-full border border-base-300 px-4 py-2 text-sm font-semibold transition hover:border-base-content hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-base-content/30 sm:inline-flex"
          >
            Shop all
          </Link>
        </div>

        <div className="rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm md:p-4">
          {/* Mobile and tablet */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <div className="col-span-2">
              <HeroSwiper slides={mosaic.heroSlides} />
            </div>

            <Tile className="row-span-2 min-h-[260px] md:min-h-[320px]">
              <PromoTile {...mosaic.leftTall} variant="tall" />
            </Tile>

            <Tile className="min-h-[130px] md:min-h-[150px]">
              <PromoTile {...mosaic.rightTop} variant="card" />
            </Tile>

            <Tile className="min-h-[130px] md:min-h-[150px]">
              <PromoTile {...mosaic.rightMid} variant="card" />
            </Tile>

            <Tile className="col-span-2 min-h-[160px] md:min-h-[190px]">
              <PromoTile {...mosaic.midWide} variant="wide" />
            </Tile>

            <Tile className="min-h-[165px] md:min-h-[190px]">
              <PromoTile {...mosaic.leftTop} variant="card" />
            </Tile>

            <Tile className="min-h-[165px] md:min-h-[190px]">
              <PromoTile {...mosaic.midLeft} variant="card" />
            </Tile>

            <Tile className="min-h-[165px] md:min-h-[190px]">
              <PromoTile {...mosaic.midRight} variant="card" />
            </Tile>

            <Tile className="min-h-[165px] md:min-h-[190px]">
              <PromoTile {...mosaic.leftBottom} variant="card" />
            </Tile>

            <Tile className="col-span-2 min-h-[240px] md:min-h-[300px]">
              <PromoTile {...mosaic.rightTall} variant="tall" />
            </Tile>
          </div>

          {/* Desktop */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-12">
            <div className="lg:col-span-3 flex flex-col gap-4">
              <Tile>
                <PromoTile {...mosaic.leftTop} variant="card" />
              </Tile>

              <Tile className="min-h-[410px]">
                <PromoTile {...mosaic.leftTall} variant="tall" />
              </Tile>

              <Tile>
                <PromoTile {...mosaic.leftBottom} variant="card" />
              </Tile>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <HeroSwiper slides={mosaic.heroSlides} />
              </div>

              <Tile>
                <PromoTile {...mosaic.midLeft} variant="card" />
              </Tile>

              <Tile>
                <PromoTile {...mosaic.midRight} variant="card" />
              </Tile>

              <Tile className="col-span-2">
                <PromoTile {...mosaic.midWide} variant="wide" />
              </Tile>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-4">
              <Tile>
                <PromoTile {...mosaic.rightTop} variant="card" />
              </Tile>

              <Tile>
                <PromoTile {...mosaic.rightMid} variant="card" />
              </Tile>

              <Tile className="min-h-[410px]">
                <PromoTile {...mosaic.rightTall} variant="tall" />
              </Tile>
            </div>
          </div>

          {err ? (
            <p className="mt-4 rounded-xl border border-base-200 bg-base-100 px-4 py-3 text-sm text-base-content/70">
              <span className="font-semibold text-base-content">Note:</span>{" "}
              {err}
            </p>
          ) : null}
        </div>

        <noscript>
          <p className="mt-4 rounded-xl border border-base-200 bg-base-100 p-4 text-sm">
            Please enable JavaScript to view the latest featured offers.
          </p>
        </noscript>
      </div>
      </Container>
    </section>
  );
}

function Tile({ children, className = "" }) {
  return (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border border-base-200 bg-base-100",
        "shadow-sm transition duration-200 ease-out",
        "hover:-translate-y-1 hover:border-base-content/20 hover:shadow-md",
        "focus-within:border-base-content/30 focus-within:ring-2 focus-within:ring-base-content/20",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      ].join(" ")}
    >
      {children}
    </article>
  );
}

function HeroSwiper({ slides = [] }) {
  const hasMultipleSlides = slides.length > 1;

  if (!slides.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-base-200 bg-base-200 text-sm text-base-content/60 sm:h-[260px] md:h-[320px]">
        No featured offers available
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-sm">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={
          hasMultipleSlides
            ? { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }
            : false
        }
        pagination={hasMultipleSlides ? { clickable: true } : false}
        loop={hasMultipleSlides}
        className="h-[220px] sm:h-[260px] md:h-[320px]"
      >
        {slides.map((slide, index) => {
          const title = slide?.title || "Featured offer";
          const subtitle = slide?.subtitle || "";
          const href = slide?.href || "/shop";

          return (
            <SwiperSlide key={`${title}-${index}`}>
              <Link
                to={href}
                className="group/hero relative block h-full w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-base-content/30"
                aria-label={`${title}${subtitle ? ` - ${subtitle}` : ""}`}
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={String(index + 1)} />
                <meta itemProp="url" content={href} />

                {slide?.image ? (
                  <img
                    src={slide.image}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover/hero:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/hero:scale-100"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                    width="960"
                    height="480"
                  />
                ) : (
                  <div className="absolute inset-0 bg-base-200" />
                )}

                <div className="absolute inset-0 bg-black/35" />

                <div className="relative flex h-full flex-col justify-between p-5 text-white md:p-6">
                  <div>
                    {slide?.badge ? (
                      <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black">
                        {slide.badge}
                      </span>
                    ) : null}

                    <h3
                      className="mt-3 max-w-xl text-2xl font-black leading-tight tracking-tight sm:text-3xl md:text-4xl"
                      itemProp="name"
                    >
                      {title}
                    </h3>

                    {subtitle ? (
                      <p className="mt-2 max-w-lg text-sm text-white/90 md:text-base">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition group-hover/hero:bg-base-200">
                      {slide?.cta || "Shop now"}
                    </span>

                    {slide?.note ? (
                      <span className="text-xs font-medium text-white/85">
                        {slide.note}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <style>{`
        .swiper-pagination-bullets {
          bottom: 12px !important;
        }

        .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          opacity: 0.55;
          background: rgba(255, 255, 255, 0.8);
        }

        .swiper-pagination-bullet-active {
          opacity: 1;
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}

function MosaicSkeleton() {
  return (
    <div className="mx-auto max-w-7xl rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm md:p-4">
      <div className="mb-4 space-y-2">
        <Skel h="h-4" className="w-24" />
        <Skel h="h-8" className="w-64" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <Skel h="h-[220px]" span />
        <Skel h="h-[260px]" />
        <Skel h="h-[130px]" />
        <Skel h="h-[130px]" />
        <Skel h="h-[160px]" span />
        <Skel h="h-[165px]" />
        <Skel h="h-[165px]" />
        <Skel h="h-[165px]" />
        <Skel h="h-[165px]" />
        <Skel h="h-[240px]" span />
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-12">
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

function Skel({ h = "h-40", span = false, className = "" }) {
  return (
    <div
      className={[
        "animate-pulse rounded-2xl bg-base-200",
        h,
        span ? "col-span-2" : "",
        className,
      ].join(" ")}
    />
  );
}

function JsonLd({ mosaic }) {
  const slides = Array.isArray(mosaic?.heroSlides) ? mosaic.heroSlides : [];

  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured offers",
    itemListElement: slides.map((slide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: slide?.title || "Featured offer",
      url: slide?.href || "/shop",
      image: slide?.image || undefined,
      description: slide?.subtitle || undefined,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
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