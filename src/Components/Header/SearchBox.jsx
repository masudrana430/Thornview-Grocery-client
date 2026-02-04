import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useDebounce from "../../hooks/useDebounce";
import { apiGet } from "../../services/api";

export default function SearchBox({ className = "" }) {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 250);
  const trimmed = useMemo(() => debounced.trim(), [debounced]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // fetch suggestions
  useEffect(() => {
    if (!trimmed) {
      setItems([]);
      setActiveIndex(-1);
      return;
    }

    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);

        // ✅ Backend route you added:
        // GET /api/products/suggest?q=milk&limit=8
        const res = await apiGet(
          `/api/products/suggest?q=${encodeURIComponent(trimmed)}&limit=8`,
          { signal: ctrl.signal }
        );

        const list = res?.data?.items || [];
        setItems(Array.isArray(list) ? list : []);
        setActiveIndex(-1);
        setOpen(true);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [trimmed]);

  function goSearch(value) {
    const v = String(value || "").trim();
    if (!v) return;
    setOpen(false);
    setActiveIndex(-1);

    // ✅ IMPORTANT: ShopResults reads `q`
    navigate(`/shop?q=${encodeURIComponent(v)}&page=1&sort=featured`);
  }

  function onSubmit(e) {
    e.preventDefault();
    goSearch(q);
  }

  function onKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      if (q.trim()) setOpen(true);
    }

    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const p = items[activeIndex];
      const label = p?.name || p?.title || "";
      if (label) goSearch(label);
    }
  }

  return (
    <div ref={boxRef} className={`relative w-full ${className}`}>
      <form onSubmit={onSubmit} className="join w-full">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim() && setOpen(true)}
          onKeyDown={onKeyDown}
          className="input input-bordered join-item w-full rounded-l-full"
          placeholder="Search products (e.g., rice, oil, milk)…"
        />

        <button className="btn join-item rounded-r-full" type="submit">
          {loading ? <span className="loading loading-spinner loading-sm" /> : "Search"}
        </button>
      </form>

      {/* Suggestions */}
      {open && q.trim() ? (
        <div className="absolute z-[70] mt-2 w-full overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-2xl">
          <div className="px-4 py-2 text-xs text-slate-500 border-b border-base-200 flex items-center justify-between">
            <span>Suggestions</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setOpen(false)}
            >
              Esc
            </button>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">
              No suggestions. Press Enter to search “{q.trim()}”.
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto">
              {items.slice(0, 8).map((p, idx) => {
                const title = p?.name || p?.title || "Product";
                const img = p?.image || p?.images?.[0];
                const price = typeof p?.price === "number" ? p.price : null;
                const href = `/product/${p?.slug || p?._id}`;

                return (
                  <li key={p?._id || idx}>
                    <Link
                      to={href}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={[
                        "flex items-center gap-3 px-4 py-3",
                        "hover:bg-base-200",
                        idx === activeIndex ? "bg-base-200" : "",
                      ].join(" ")}
                    >
                      <div className="h-11 w-11 rounded-xl bg-base-200 overflow-hidden flex items-center justify-center">
                        {img ? (
                          <img src={img} alt={title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs opacity-60">IMG</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold line-clamp-1">{title}</div>
                        <div className="text-xs opacity-70">
                          {p?.brand ? `${p.brand} • ` : ""}
                          {price != null ? `৳${price}` : ""}
                        </div>
                      </div>

                      <span className="text-xs opacity-60">↵</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="px-4 py-2 border-t border-base-200">
            <button
              className="btn btn-sm w-full rounded-full"
              type="button"
              onClick={() => goSearch(q)}
            >
              Search for “{q.trim()}”
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
