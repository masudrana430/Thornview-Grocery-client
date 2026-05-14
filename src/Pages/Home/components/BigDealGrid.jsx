import React, { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function BigDealGrid({
  title = "This week’s highlights",
  items: itemsProp,
  slug = "home",
  className = "",
  viewAllHref = "/shop?deals=1",
  rightText = "View all",
}) {
  const headingId = useId();
  const hasItemsFromParent = Array.isArray(itemsProp);

  const [items, setItems] = useState(
    hasItemsFromParent ? normalizeItems(itemsProp) : []
  );
  const [loading, setLoading] = useState(!hasItemsFromParent);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (Array.isArray(itemsProp)) {
      setItems(normalizeItems(itemsProp));
      setLoading(false);
      setErr("");
      return;
    }

    const controller = new AbortController();

    async function loadBigDeals() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(
          `${API_BASE}/api/home/big-deals?slug=${encodeURIComponent(slug)}`,
          {
            method: "GET",
            headers: { "content-type": "application/json" },
            signal: controller.signal,
          }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.error?.message || "Failed to load big deals");
        }

        const incoming = json?.data?.items || json?.data || json;
        setItems(normalizeItems(incoming));
      } catch (error) {
        if (error.name !== "AbortError") {
          setErr(error?.message || "Failed to load big deals");
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBigDeals();

    return () => controller.abort();
  }, [itemsProp, slug]);

  const visibleItems = useMemo(() => items.slice(0, 5), [items]);

  if (loading) {
    return (
      <section
        className={className}
        aria-labelledby={headingId}
        aria-busy="true"
      >
        <SectionHeader
          headingId={headingId}
          title={title}
          viewAllHref={viewAllHref}
          rightText={rightText}
        />
        <BigDealSkeleton />
      </section>
    );
  }

  if (!visibleItems.length) {
    return (
      <section className={className} aria-labelledby={headingId}>
        <SectionHeader
          headingId={headingId}
          title={title}
          viewAllHref={viewAllHref}
          rightText={rightText}
        />

        <div className="rounded-md border border-base-200 bg-base-100 p-5">
          <p className="text-sm font-semibold text-error">
            Big deals not available
          </p>
          <p className="mt-1 text-sm text-base-content/70">
            {err || "No deal items found."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={className}
      aria-labelledby={headingId}
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <BigDealsJsonLd title={title} items={visibleItems} />

      <SectionHeader
        headingId={headingId}
        title={title}
        viewAllHref={viewAllHref}
        rightText={rightText}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:auto-rows-[95px]">
        {visibleItems.map((item, index) => (
          <DealCard
            key={item.id}
            item={item}
            index={index}
            className={getDesktopLayout(index)}
          />
        ))}
      </div>

      {err ? (
        <p className="mt-4 rounded-md border border-base-200 bg-base-100 p-3 text-sm text-base-content/70">
          <span className="font-semibold text-base-content">Note:</span> {err}
        </p>
      ) : null}

      <noscript>
        <p className="mt-4 rounded-md border border-base-200 bg-base-100 p-4 text-sm text-base-content/70">
          Please enable JavaScript to view the latest deals.
        </p>
      </noscript>
    </section>
  );
}

function SectionHeader({ headingId, title, viewAllHref, rightText }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2
        id={headingId}
        className="text-base font-bold tracking-tight text-base-content md:text-lg"
      >
        {title}
      </h2>

      {viewAllHref ? (
        <Link
          to={viewAllHref}
          className="rounded-full border border-base-300 bg-base-100 px-4 py-2 text-xs font-semibold text-base-content"
        >
          {rightText}
        </Link>
      ) : null}
    </div>
  );
}

function DealCard({ item, index, className = "" }) {
  const isLeftLarge = index === 0;
  const isRightTall = index === 4;
  const isLarge = isLeftLarge || isRightTall;
  const textColor = getTextColor(item);

  return (
    <article
      className={[
        "relative overflow-hidden rounded-md border border-base-200 bg-base-100",
        "min-h-[190px]",
        className,
      ].join(" ")}
      itemProp="itemListElement"
      itemScope
      itemType="https://schema.org/ListItem"
    >
      <meta itemProp="position" content={String(index + 1)} />
      <meta itemProp="name" content={item.title} />
      <meta itemProp="url" content={item.href} />

      <Link
        to={item.href}
        className="relative block h-full min-h-[190px] w-full focus:outline-none focus:ring-2 focus:ring-base-content/30"
        aria-label={buildAriaLabel(item)}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title || "Deal product image"}
            className="absolute inset-0 h-full w-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            width={isLarge ? "640" : "420"}
            height={isLarge ? "460" : "230"}
            itemProp="image"
          />
        ) : (
          <div className="absolute inset-0 bg-base-200" />
        )}

        <div className="absolute inset-0 bg-white/5" />

        <div
          className={[
            "relative z-10 flex h-full flex-col p-4",
            textColor,
            isLarge ? "justify-between" : "justify-start",
            isLeftLarge ? "md:p-5" : "",
          ].join(" ")}
        >
          <div>
            {item.subtitle ? (
              <p
                className={[
                  "font-medium leading-tight",
                  isLarge ? "text-sm" : "text-xs",
                ].join(" ")}
                itemProp="description"
              >
                {item.subtitle}
              </p>
            ) : null}

            <h3
              className={[
                "mt-1 font-extrabold leading-tight tracking-tight",
                isLeftLarge
                  ? "max-w-[12ch] text-3xl md:text-5xl"
                  : isRightTall
                  ? "max-w-[13ch] text-2xl md:text-3xl"
                  : "max-w-[13ch] text-lg md:text-2xl",
              ].join(" ")}
              itemProp="name"
            >
              {item.title}
            </h3>

            <span className="mt-3 inline-flex text-xs font-semibold underline underline-offset-2">
              Shop
            </span>
          </div>

          {(item.badge || item.priceTag) && (
            <div className="mt-4">
              {item.badge ? (
                <span className="inline-flex rounded-sm bg-red-600 px-2 py-1 text-xs font-bold text-white">
                  {item.badge}
                </span>
              ) : null}

              {item.priceTag ? (
                <p
                  className={[
                    "mt-1 font-black leading-none text-white",
                    isLarge ? "text-5xl md:text-6xl" : "text-4xl",
                  ].join(" ")}
                >
                  {item.priceTag}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

function getDesktopLayout(index) {
  const layouts = [
    // Big left card
    "lg:col-start-1 lg:col-span-5 lg:row-start-1 lg:row-span-4 lg:min-h-[428px]",

    // Middle top wide card
    "lg:col-start-6 lg:col-span-4 lg:row-start-1 lg:row-span-2 lg:min-h-[206px]",

    // Middle bottom left card
    "lg:col-start-6 lg:col-span-2 lg:row-start-3 lg:row-span-2 lg:min-h-[206px]",

    // Middle bottom right card
    "lg:col-start-8 lg:col-span-2 lg:row-start-3 lg:row-span-2 lg:min-h-[206px]",

    // Right tall card
    "lg:col-start-10 lg:col-span-3 lg:row-start-1 lg:row-span-4 lg:min-h-[428px]",
  ];

  return layouts[index] || "lg:col-span-3 lg:row-span-2";
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item = {}, index) => {
      const id = item.id || item._id || `${item.title || "deal"}-${index}`;

      return {
        id: String(id),
        title: String(item.title || "").trim(),
        subtitle: String(item.subtitle || "").trim(),
        href: String(item.href || "/shop?deals=1"),
        image: String(item.image || ""),
        theme: String(item.theme || "light").toLowerCase(),
        priceTag: item.priceTag ? String(item.priceTag).trim() : "",
        sponsored: Boolean(item.sponsored),
        badge: item.sponsored
          ? "Sponsored"
          : item.badge
          ? String(item.badge).trim()
          : "",
      };
    })
    .filter((item) => item.title || item.image);
}

function getTextColor(item) {
  if (
    item.theme === "dark" ||
    item.theme === "black" ||
    item.theme === "image-dark"
  ) {
    return "text-white";
  }

  return "text-slate-950";
}

function buildAriaLabel(item) {
  const parts = [item.title, item.subtitle, item.priceTag].filter(Boolean);
  return parts.join(" - ") || "Shop deal";
}

function BigDealSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:auto-rows-[95px]">
      <Skel className="lg:col-start-1 lg:col-span-5 lg:row-start-1 lg:row-span-4 lg:min-h-[428px]" />
      <Skel className="lg:col-start-6 lg:col-span-4 lg:row-start-1 lg:row-span-2 lg:min-h-[206px]" />
      <Skel className="lg:col-start-6 lg:col-span-2 lg:row-start-3 lg:row-span-2 lg:min-h-[206px]" />
      <Skel className="lg:col-start-8 lg:col-span-2 lg:row-start-3 lg:row-span-2 lg:min-h-[206px]" />
      <Skel className="lg:col-start-10 lg:col-span-3 lg:row-start-1 lg:row-span-4 lg:min-h-[428px]" />
    </div>
  );
}

function Skel({ className = "" }) {
  return (
    <div
      className={[
        "min-h-[190px] rounded-md border border-base-200 bg-base-200",
        className,
      ].join(" ")}
    >
      <span className="sr-only">Loading deal</span>
    </div>
  );
}

function BigDealsJsonLd({ title, items }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: item.href,
      image: item.image || undefined,
      description: item.subtitle || undefined,
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