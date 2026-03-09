import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { FiSearch, FiX } from "react-icons/fi";
import useDebounce from "../../hooks/useDebounce";
import { apiGet } from "../../services/api";

export default function SearchBox({ className = "" }) {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 250);
  const trimmed = useMemo(() => debounced.trim(), [debounced]);

  const [open, setOpen] = useState(false); // overlay open
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inlineInputRef = useRef(null);
  const overlayInputRef = useRef(null);

  // Open overlay + focus overlay input
  const openOverlay = () => {
    setOpen(true);
    setActiveIndex(-1);
    // blur inline input so we don't have two focused inputs
    inlineInputRef.current?.blur?.();
    setTimeout(() => overlayInputRef.current?.focus?.(), 30);
  };

  const closeOverlay = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  // Lock body scroll while overlay open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // fetch suggestions
  useEffect(() => {
    if (!trimmed) {
      setItems([]);
      setActiveIndex(-1);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const res = await apiGet(
          `/api/products/suggest?q=${encodeURIComponent(trimmed)}&limit=10`,
          { signal: ctrl.signal }
        );

        const list = res?.data?.items || [];
        setItems(Array.isArray(list) ? list : []);
        setActiveIndex(-1);
      } catch (e) {
        if (e?.name !== "AbortError") setItems([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [trimmed]);

  function goSearch(value) {
    const v = String(value || "").trim();
    if (!v) return;
    closeOverlay();
    navigate(`/shop?q=${encodeURIComponent(v)}&page=1&sort=featured`);
  }

  function onSubmit(e) {
    e.preventDefault();
    goSearch(q);
  }

  function onKeyDown(e) {
    // open suggestions on enter/down
    if ((e.key === "ArrowDown" || e.key === "Enter") && !open) openOverlay();

    if (!open) return;

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

  // ===== Inline compact input (in header) =====
  // This acts like Walmart: click/tap opens the big overlay search.
  return (
    <>
      <div className={`w-full ${className}`}>
        <button
          type="button"
          onClick={openOverlay}
          className={[
            "w-full",
            "flex items-center gap-2",
            "h-10 md:h-11",
            "rounded-full",
            "border border-base-200 bg-base-100",
            "px-4",
            "shadow-sm hover:shadow-md transition",
            "text-left",
          ].join(" ")}
          aria-label="Open search"
        >
          <FiSearch className="opacity-60" />
          <span className="flex-1 min-w-0 truncate opacity-70">
            {q ? q : "Search products (e.g., rice, oil, milk)…"}
          </span>
        </button>

        {/* keep an invisible input just for keyboard users tabbing; optional */}
        <input
          ref={inlineInputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={openOverlay}
          onKeyDown={onKeyDown}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* ===== Overlay (Portal) ===== */}
      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000000]"
              role="dialog"
              aria-modal="true"
            >
              {/* Backdrop */}
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                aria-label="Close search"
                onClick={closeOverlay}
              />

              {/* Panel */}
              <div className="absolute inset-x-0 top-0 md:top-4">
                <div
                  className={[
                    "mx-auto w-full md:max-w-4xl",
                    "bg-base-100",
                    "border-b md:border border-base-200",
                    "md:rounded-3xl",
                    "shadow-2xl",
                    "overflow-hidden",
                  ].join(" ")}
                >
                  {/* Top row: big input + cancel on mobile */}
                  <div className="p-3 md:p-4 border-b border-base-200">
                    <form
                      onSubmit={onSubmit}
                      className="flex items-center gap-2"
                    >
                      <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60" />
                        <input
                          ref={overlayInputRef}
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          onKeyDown={onKeyDown}
                          className={[
                            "input input-bordered w-full",
                            "rounded-full",
                            "pl-12 pr-12",
                            "h-11 md:h-12",
                            "text-base",
                          ].join(" ")}
                          placeholder="Search Walmart-style…"
                          autoComplete="off"
                        />

                        {/* clear */}
                        {q ? (
                          <button
                            type="button"
                            onClick={() => {
                              setQ("");
                              setItems([]);
                              setActiveIndex(-1);
                              overlayInputRef.current?.focus?.();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm rounded-full"
                            aria-label="Clear"
                          >
                            <FiX className="text-lg" />
                          </button>
                        ) : null}
                      </div>

                      {/* Cancel (mobile visible) */}
                      <button
                        type="button"
                        onClick={closeOverlay}
                        className="btn btn-ghost rounded-full md:hidden"
                      >
                        Cancel
                      </button>

                      {/* Search button (desktop) */}
                      <button
                        type="submit"
                        className="btn rounded-full hidden md:inline-flex"
                      >
                        {loading ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          "Search"
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Suggestions */}
                  <div className="bg-base-100">
                    <div className="px-4 py-2 text-xs opacity-70 flex items-center justify-between border-b border-base-200">
                      <span>Suggestions</span>
                      <span className="hidden md:inline">Esc to close</span>
                    </div>

                    {!q.trim() ? (
                      <div className="px-4 py-5 text-sm opacity-70">
                        Start typing to see suggestions.
                      </div>
                    ) : items.length === 0 ? (
                      <div className="px-4 py-5 text-sm opacity-70">
                        {loading
                          ? "Searching…"
                          : `No suggestions. Press Enter to search “${q.trim()}”.`}
                      </div>
                    ) : (
                      <ul className="max-h-[60vh] md:max-h-[420px] overflow-auto">
                        {items.slice(0, 10).map((p, idx) => {
                          const title = p?.name || p?.title || "Product";
                          const img = p?.image || p?.images?.[0];
                          const price =
                            typeof p?.price === "number" ? p.price : null;
                          const href = `/product/${p?.slug || p?._id}`;

                          return (
                            <li key={p?._id || idx}>
                              <Link
                                to={href}
                                onClick={closeOverlay}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={[
                                  "flex items-center gap-3 px-4 py-3",
                                  "border-b border-base-200/60",
                                  "hover:bg-base-200/60",
                                  idx === activeIndex ? "bg-base-200/60" : "",
                                ].join(" ")}
                              >
                                <div className="h-11 w-11 rounded-xl bg-base-200 overflow-hidden flex items-center justify-center">
                                  {img ? (
                                    <img
                                      src={img}
                                      alt={title}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs opacity-60">
                                      IMG
                                    </span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold line-clamp-1">
                                    {title}
                                  </div>
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

                    {/* bottom action */}
                    {q.trim() ? (
                      <div className="p-3 border-t border-base-200">
                        <button
                          className="btn w-full rounded-full"
                          type="button"
                          onClick={() => goSearch(q)}
                        >
                          Search for “{q.trim()}”
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}