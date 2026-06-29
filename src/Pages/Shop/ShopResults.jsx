import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import Container from "../../Components/Container";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const SORTS = [
  { value: "featured", label: "Best match" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export default function ShopResults() {
  const [sp, setSp] = useSearchParams();

  // ✅ accept both q and search
  const q = (sp.get("q") || sp.get("search") || "").trim();
  const category = (sp.get("category") || "").trim();
  const sort = sp.get("sort") || "featured";
  const page = sp.get("page") || "1";
  const limit = sp.get("limit") || "20";

  const selectedBrands = sp.getAll("brand");
  const selectedTags = sp.getAll("tag");
  const inStock = sp.get("inStock"); // "true" | "false" | null
  const minPrice = sp.get("minPrice") || "";
  const maxPrice = sp.get("maxPrice") || "";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Local UI inputs
  const [searchLocal, setSearchLocal] = useState(q);
  const [minLocal, setMinLocal] = useState(minPrice);
  const [maxLocal, setMaxLocal] = useState(maxPrice);

  // keep locals in sync when URL changes
  useEffect(() => setSearchLocal(q), [q]);
  useEffect(() => setMinLocal(minPrice), [minPrice]);
  useEffect(() => setMaxLocal(maxPrice), [maxPrice]);

  const spKey = sp.toString();
  const { addToCart } = useCart();

  // ✅ one-time: if URL had ?search=, migrate to ?q=
  useEffect(() => {
    const hasSearch = sp.get("search");
    const hasQ = sp.get("q");
    if (hasSearch && !hasQ) {
      const next = new URLSearchParams(sp);
      next.set("q", hasSearch);
      next.delete("search");
      next.set("page", "1");
      setSp(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateParams(mutator) {
    const next = new URLSearchParams(sp);
    mutator(next);

    // Always keep these sane
    if (!next.get("sort")) next.set("sort", "featured");
    if (!next.get("page")) next.set("page", "1");
    if (!next.get("limit")) next.set("limit", limit);

    setSp(next, { replace: true });
  }

  function setParam(key, value) {
    updateParams((next) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
  }

  function toggleMulti(key, value) {
    updateParams((next) => {
      const all = next.getAll(key);
      const exists = all.includes(value);
      next.delete(key);
      const updated = exists ? all.filter((x) => x !== value) : [...all, value];
      updated.forEach((v) => next.append(key, v));
      next.set("page", "1");
    });
  }

  function clearFiltersOnly() {
    updateParams((next) => {
      // Keep q + category + sort
      const keepQ = next.get("q") || "";
      const keepCat = next.get("category") || "";
      const keepSort = next.get("sort") || "featured";

      next.forEach((_v, k) => next.delete(k));

      if (keepQ) next.set("q", keepQ);
      if (keepCat) next.set("category", keepCat);
      next.set("sort", keepSort);
      next.set("page", "1");
      next.set("limit", limit);
    });
  }

  function applyPrice() {
    updateParams((next) => {
      if (minLocal) next.set("minPrice", String(minLocal));
      else next.delete("minPrice");

      if (maxLocal) next.set("maxPrice", String(maxLocal));
      else next.delete("maxPrice");

      next.set("page", "1");
    });
  }

  // ✅ debounce search into URL (won’t fight sort/filter changes)
  useEffect(() => {
    const t = setTimeout(() => {
      const v = (searchLocal || "").trim();
      if (v === q) return;

      updateParams((next) => {
        if (v) next.set("q", v);
        else next.delete("q");

        // remove legacy param if exists
        next.delete("search");
        next.set("page", "1");
      });
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocal, spKey]); // include spKey so closure stays fresh

  // ✅ Fetch from API whenever URL params change
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const url = new URL(`${API_BASE}/api/products`);
        url.search = sp.toString();

        // ensure page/limit exist
        if (!url.searchParams.get("page")) url.searchParams.set("page", page);
        if (!url.searchParams.get("limit"))
          url.searchParams.set("limit", limit);

        const res = await fetch(url.toString(), { signal: controller.signal });
        const json = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(json?.error?.message || "Failed to load products");

        setData(json.data || null);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Failed to load products", e);
          setErr(e?.message || "Failed to load products");
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spKey]);

  const facets = data?.facets || {
    brands: [],
    tags: [],
    priceRange: { min: 0, max: 0 },
  };
  const items = data?.items || [];
  const meta = data?.pagination || {
    total: 0,
    page: Number(page) || 1,
    pages: 1,
    limit: Number(limit) || 20,
  };

  const title = useMemo(() => {
    if (q) return `Results for “${q}”`;
    if (category) return category.replace(/-/g, " ").toUpperCase();
    return "Shop";
  }, [q, category]);

  const hasFilters = Boolean(
    selectedBrands.length ||
      selectedTags.length ||
      inStock ||
      minPrice ||
      maxPrice
  );

  return (
    <Container>
    <div className=" my-8">
      {/* Premium Top Bar */}
      <div className="sticky top-[72px] z-40 bg-base-100/95 backdrop-blur border-b border-base-200">
        <div className="py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-2xl font-black">{title}</h1>
            <span className="text-xs md:text-sm text-slate-500">
              {Number(meta.total || 0).toLocaleString()} items
            </span>
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <form
              className="join w-full sm:w-[420px]"
              onSubmit={(e) => {
                e.preventDefault();
                const v = searchLocal.trim();
                updateParams((next) => {
                  if (v) next.set("q", v);
                  else next.delete("q");
                  next.delete("search");
                  next.set("page", "1");
                });
              }}
            >
              <input
                className="input input-bordered join-item w-full rounded-l-full"
                placeholder="Search products…"
                value={searchLocal}
                onChange={(e) => setSearchLocal(e.target.value)}
              />
              <button className="btn join-item rounded-r-full" type="submit">
                Search
              </button>
            </form>

            <select
              className="select select-bordered w-full sm:w-[220px] rounded-full"
              value={sort}
              onChange={(e) => {
                setParam("sort", e.target.value);
                setParam("page", "1");
              }}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter chips */}
        <div className="pb-4 flex flex-wrap items-center gap-2">
          {hasFilters ? (
            <>
              <button
                className="btn btn-xs rounded-full"
                onClick={clearFiltersOnly}
              >
                Clear filters
              </button>

              {selectedBrands.map((b) => (
                <Chip
                  key={`b-${b}`}
                  label={`Brand: ${b}`}
                  onRemove={() => toggleMulti("brand", b)}
                />
              ))}
              {selectedTags.map((t) => (
                <Chip
                  key={`t-${t}`}
                  label={`Tag: ${t}`}
                  onRemove={() => toggleMulti("tag", t)}
                />
              ))}
              {inStock ? (
                <Chip
                  label={inStock === "true" ? "In stock" : "Out of stock"}
                  onRemove={() => setParam("inStock", "")}
                />
              ) : null}
              {minPrice ? (
                <Chip
                  label={`Min ৳${minPrice}`}
                  onRemove={() => setParam("minPrice", "")}
                />
              ) : null}
              {maxPrice ? (
                <Chip
                  label={`Max ৳${maxPrice}`}
                  onRemove={() => setParam("maxPrice", "")}
                />
              ) : null}
            </>
          ) : (
            <span className="text-xs text-slate-500">
              Use filters to narrow results.
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* LEFT FILTERS */}
        <aside className="lg:col-span-3">
          <div className="sticky top-[150px]">
            <div className="rounded-3xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-base-200 flex items-center justify-between">
                <div className="font-black">Filters</div>
                <button
                  className="btn btn-xs rounded-full"
                  onClick={clearFiltersOnly}
                >
                  Reset
                </button>
              </div>

              <div className="p-4 space-y-4">
                <Accordion title="Availability" defaultOpen>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={inStock === "true"}
                      onChange={() =>
                        setParam("inStock", inStock === "true" ? "" : "true")
                      }
                    />
                    <span className="text-sm font-medium">In stock</span>
                  </label>
                </Accordion>

                <Accordion title="Price">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input input-bordered input-sm rounded-xl"
                      placeholder="Min"
                      value={minLocal}
                      onChange={(e) => setMinLocal(e.target.value)}
                    />
                    <input
                      className="input input-bordered input-sm rounded-xl"
                      placeholder="Max"
                      value={maxLocal}
                      onChange={(e) => setMaxLocal(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-sm mt-2 w-full rounded-full"
                    onClick={applyPrice}
                  >
                    Apply
                  </button>

                  <p className="text-xs text-slate-500 mt-2">
                    Range: ৳{Math.round(facets.priceRange?.min || 0)} – ৳
                    {Math.round(facets.priceRange?.max || 0)}
                  </p>
                </Accordion>

                <Accordion title="Brand">
                  <div className="space-y-2 max-h-52 overflow-auto pr-1">
                    {(facets.brands || []).map((b) => (
                      <label
                        key={b.name}
                        className="flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedBrands.includes(b.name)}
                            onChange={() => toggleMulti("brand", b.name)}
                          />
                          <span className="text-sm font-medium">{b.name}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {b.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </Accordion>

                <Accordion title="Dietary tags">
                  <div className="space-y-2 max-h-52 overflow-auto pr-1">
                    {(facets.tags || []).map((t) => (
                      <label
                        key={t.name}
                        className="flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedTags.includes(t.name)}
                            onChange={() => toggleMulti("tag", t.name)}
                          />
                          <span className="text-sm font-medium capitalize">
                            {t.name}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {t.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </Accordion>
              </div>
            </div>
          </div>
        </aside>

        {/* RESULTS */}
        <section className="lg:col-span-9">
          {err ? (
            <div className="mb-4 rounded-2xl border border-base-200 bg-base-100 p-4">
              <div className="font-bold text-error">Error</div>
              <div className="text-sm text-slate-500 mt-1">{err}</div>
            </div>
          ) : null}

          {loading ? (
            <GridSkeleton />
          ) : items.length ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((p) => (
                  <ProductCard
                    key={String(p._id)}
                    p={p}
                    onAdd={() => addToCart(p, 1)} // ✅ saves to cart (localStorage via provider)
                  />
                ))}
              </div>

              <Pagination
                page={Number(meta.page) || 1}
                pages={Number(meta.pages) || 1}
                onPage={(nextPage) => setParam("page", String(nextPage))}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
              <p className="font-bold">No results found.</p>
              <p className="text-sm text-slate-500 mt-1">
                Try removing some filters or changing your search.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
    </Container>
  );
}

/* ---------------- UI bits ---------------- */

function Accordion({ title, children, defaultOpen = false }) {
  return (
    <div className="collapse collapse-arrow bg-base-100 border border-base-200 rounded-2xl">
      <input type="checkbox" defaultChecked={defaultOpen} />
      <div className="collapse-title text-sm font-black">{title}</div>
      <div className="collapse-content">{children}</div>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <button
      onClick={onRemove}
      className="btn btn-xs rounded-full bg-base-200 hover:bg-base-300 border-0"
      title="Remove"
    >
      {label} ✕
    </button>
  );
}

function ProductCard({ p, onAdd }) {
  const price = Number(p.price || 0);
  const old = p.oldPrice != null ? Number(p.oldPrice) : null;

  return (
    <Link
      to={`/product/${p.slug || p._id}`}
      className="group rounded-3xl border border-base-200 bg-base-100 hover:shadow-xl transition-all overflow-hidden"
    >
      <div className="relative p-3">
        <button
          type="button"
          className="absolute right-3 top-3 btn btn-circle btn-xs bg-base-100 border border-base-200"
          title="Wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          ♡
        </button>

        <div className="aspect-square rounded-2xl bg-base-200 overflow-hidden">
          <img
            src={p.image || "https://picsum.photos/seed/fallback/800/800"}
            alt={p.name || "Product"}
            className="h-full w-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
            loading="lazy"
          />
        </div>

        <button
          type="button"
          className="btn btn-sm rounded-full bg-blue-600 text-white border-0 mt-3 w-full"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd?.(); // ✅ adds to cart
          }}
          disabled={!p.inStock}
        >
          {p.inStock ? "+ Add to cart" : "Out of stock"}
        </button>
      </div>

      <div className="px-3 pb-4">
        <div className="text-xs text-slate-500">{p.brand || "Brand"}</div>
        <div className="font-semibold text-sm line-clamp-2 min-h-[40px]">
          {p.name}
        </div>

        <div className="mt-2">
          {old ? (
            <div className="text-xs text-slate-500 line-through">
              ৳{old.toLocaleString()}
            </div>
          ) : null}
          <div className="text-lg font-black text-emerald-700">
            ৳{price.toLocaleString()}
          </div>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          {p.inStock ? "Pickup today / Delivery available" : "Out of stock"}
        </div>
      </div>
    </Link>
  );
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;

  const nums = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        className="btn btn-sm rounded-full"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Prev
      </button>

      {start > 1 ? (
        <>
          <button className="btn btn-sm rounded-full" onClick={() => onPage(1)}>
            1
          </button>
          <span className="px-1 text-slate-500">…</span>
        </>
      ) : null}

      {nums.map((n) => (
        <button
          key={n}
          className={`btn btn-sm rounded-full ${
            n === page ? "btn-primary" : ""
          }`}
          onClick={() => onPage(n)}
        >
          {n}
        </button>
      ))}

      {end < pages ? (
        <>
          <span className="px-1 text-slate-500">…</span>
          <button
            className="btn btn-sm rounded-full"
            onClick={() => onPage(pages)}
          >
            {pages}
          </button>
        </>
      ) : null}

      <button
        className="btn btn-sm rounded-full"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-base-200 bg-base-100 overflow-hidden"
        >
          <div className="p-3">
            <div className="aspect-square rounded-2xl bg-base-200 animate-pulse" />
            <div className="h-10 bg-base-200 rounded-full mt-3 animate-pulse" />
          </div>
          <div className="px-3 pb-4 space-y-2">
            <div className="h-3 bg-base-200 rounded animate-pulse" />
            <div className="h-4 bg-base-200 rounded animate-pulse" />
            <div className="h-5 bg-base-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
