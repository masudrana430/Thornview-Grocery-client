import React, { useEffect, useId, useState } from "react";
import PromoTile from "./PromoTile";

// .env frontend:
// VITE_API_BASE_URL=http://localhost:5000
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function BrandBannersRow({
  title = "Brands for you",
  items: itemsProp,
  slug = "home",
  className = "",
}) {
  const headingId = useId();

  const hasItemsFromParent = Array.isArray(itemsProp);

  const [items, setItems] = useState(hasItemsFromParent ? normalizeItems(itemsProp) : []);
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

    async function loadBrandBanners() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(
          `${API_BASE}/api/home/brand-banners?slug=${encodeURIComponent(slug)}`,
          {
            method: "GET",
            headers: {
              "content-type": "application/json",
            },
            signal: controller.signal,
          }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.error?.message || "Failed to load brand banners");
        }

        const incoming = json?.data?.items || json?.data || json;
        setItems(normalizeItems(incoming));
      } catch (error) {
        if (error.name !== "AbortError") {
          setErr(error?.message || "Failed to load brand banners");
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBrandBanners();

    return () => controller.abort();
  }, [itemsProp, slug]);

  if (loading) {
    return (
      <section
        className={className}
        aria-labelledby={headingId}
        aria-busy="true"
      >
        <SectionHeader id={headingId} title={title} />
        <BrandRowSkeleton />
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className={className} aria-labelledby={headingId}>
        <SectionHeader id={headingId} title={title} />

        <div className="rounded-xl border border-base-200 bg-base-100 p-5">
          <p className="text-sm font-semibold text-error">
            Brand banners not available
          </p>

          <p className="mt-1 text-sm text-base-content/70">
            {err || "No brand banner items found."}
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
      <BrandBannersJsonLd title={title} items={items} />

      <SectionHeader id={headingId} title={title} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((brand, index) => (
          <article
            key={brand.id}
            className="rounded-xl border border-base-200 bg-base-100"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content={String(index + 1)} />
            <meta itemProp="name" content={brand.title} />
            <meta itemProp="url" content={brand.href} />

            <PromoTile
              title={brand.title}
              subtitle={brand.subtitle}
              href={brand.href}
              image={brand.image}
              theme="light"
              sponsored={brand.sponsored}
              className="h-[140px] md:h-[160px]"
            />
          </article>
        ))}
      </div>

      {err ? (
        <p className="mt-4 rounded-xl border border-base-200 bg-base-100 p-3 text-sm text-base-content/70">
          <span className="font-semibold text-base-content">Note:</span> {err}
        </p>
      ) : null}

      <noscript>
        <p className="mt-4 rounded-xl border border-base-200 bg-base-100 p-4 text-sm text-base-content/70">
          Please enable JavaScript to view brand banners.
        </p>
      </noscript>
    </section>
  );
}

function SectionHeader({ id, title }) {
  return (
    <div className="mb-3">
      <h2
        id={id}
        className="text-lg font-bold tracking-tight text-base-content md:text-xl"
      >
        {title}
      </h2>
    </div>
  );
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item = {}, index) => {
      const id = item.id || item._id || `${item.title || "brand"}-${index}`;

      return {
        id: String(id),
        title: String(item.title || "").trim(),
        subtitle: String(item.subtitle || "").trim(),
        href: String(item.href || "/shop"),
        image: String(item.image || ""),
        sponsored: Boolean(item.sponsored),
      };
    })
    .filter((item) => item.title || item.image);
}

function BrandRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Skel />
      <Skel />
      <Skel />
    </div>
  );
}

function Skel() {
  return (
    <div className="h-[140px] rounded-xl border border-base-200 bg-base-200 md:h-[160px]">
      <span className="sr-only">Loading brand banner</span>
    </div>
  );
}

function BrandBannersJsonLd({ title, items }) {
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