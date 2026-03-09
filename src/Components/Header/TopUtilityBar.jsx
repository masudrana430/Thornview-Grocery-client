// src/Components/Header/TopUtilityBar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiMapPin,
  FiHelpCircle,
  FiPhone,
  FiX,
  FiCrosshair,
  FiSearch,
  FiTrash2,
  FiCheck,
  FiChevronRight,
} from "react-icons/fi";
import Container from "../Container";

/**
 * Premium Location Picker (OpenStreetMap + Leaflet)
 * - Add location (map click / drag pin / search / my location)
 * - Change/edit location anytime (same modal)
 * - Persist to localStorage (backward compatible with old "string" value)
 * - Emits: window.dispatchEvent(new CustomEvent("thomview:locationChanged", { detail }))
 */

const LS_KEYS = {
  mode: "thomview_fulfillment_mode", // pickup | delivery
  location: "thomview_location", // old: string, new: JSON
};

const DEFAULT_CENTER = { lat: 23.8103, lng: 90.4125 }; // Dhaka

function safeJsonParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function readStoredLocation() {
  const raw = localStorage.getItem(LS_KEYS.location);
  if (!raw) return null;

  const parsed = safeJsonParse(raw);
  if (parsed && typeof parsed === "object") {
    return {
      label: String(parsed.label || "").trim(),
      lat: Number(parsed.lat || 0) || DEFAULT_CENTER.lat,
      lng: Number(parsed.lng || 0) || DEFAULT_CENTER.lng,
      city: String(parsed.city || "").trim(),
      area: String(parsed.area || "").trim(),
      zip: String(parsed.zip || "").trim(),
      updatedAt: parsed.updatedAt ? String(parsed.updatedAt) : "",
    };
  }

  // backward compat: old value was just a string label
  return {
    label: String(raw || "").trim(),
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    city: "",
    area: "",
    zip: "",
    updatedAt: "",
  };
}

function trimLabel(s, n = 26) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function buildPrettyLabel(loc) {
  if (!loc) return "";
  if (loc.label) return loc.label;
  const parts = [loc.area, loc.city, loc.zip].filter(Boolean);
  return parts.join(", ");
}

// Leaflet pin icon (no asset dependency)
const pinIcon = L.divIcon({
  className: "thomview-pin",
  html: `
    <div style="
      width: 18px; height: 18px; border-radius: 999px;
      background: rgba(99,102,241,1);
      box-shadow: 0 10px 26px rgba(99,102,241,.40);
      border: 3px solid rgba(255,255,255,.95);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

async function nominatimSearch(query) {
  const q = String(query || "").trim();
  if (!q) return [];

  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6` +
    `&countrycodes=bd&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function nominatimReverse(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1` +
    `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json", "Accept-Language": "en" },
  });

  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  return data || null;
}

export default function TopUtilityBar() {
  const [mode, setMode] = useState("pickup");
  const [savedLoc, setSavedLoc] = useState(null);

  // Modal UI
  const [open, setOpen] = useState(false);

  // Draft location inside modal
  const [draft, setDraft] = useState(() => ({
    label: "",
    city: "",
    area: "",
    zip: "",
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
  }));

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [reverseing, setReverseing] = useState(false);
  const [hint, setHint] = useState("");

  // Leaflet refs
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Focus + accessibility
  const firstFieldRef = useRef(null);

  // Load LS on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(LS_KEYS.mode);
    if (savedMode === "pickup" || savedMode === "delivery") setMode(savedMode);

    const loc = readStoredLocation();
    if (loc) setSavedLoc(loc);
  }, []);

  // Persist mode
  useEffect(() => {
    localStorage.setItem(LS_KEYS.mode, mode);
  }, [mode]);

  // Scroll lock when modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Label for top bar
  const topLocationLabel = useMemo(() => {
    if (!savedLoc) return "Set location";
    const nice = buildPrettyLabel(savedLoc);
    return trimLabel(nice || "Set location", 22);
  }, [savedLoc]);

  const savedPretty = useMemo(() => {
    if (!savedLoc) return "";
    return buildPrettyLabel(savedLoc);
  }, [savedLoc]);

  const openModal = () => {
    const current = savedLoc
      ? {
          label: savedLoc.label || "",
          city: savedLoc.city || "",
          area: savedLoc.area || "",
          zip: savedLoc.zip || "",
          lat: Number(savedLoc.lat) || DEFAULT_CENTER.lat,
          lng: Number(savedLoc.lng) || DEFAULT_CENTER.lng,
        }
      : {
          label: "",
          city: "",
          area: "",
          zip: "",
          lat: DEFAULT_CENTER.lat,
          lng: DEFAULT_CENTER.lng,
        };

    setDraft(current);
    setSearch("");
    setResults([]);
    setHint("");
    setOpen(true);

    // focus after paint
    setTimeout(() => {
      firstFieldRef.current?.focus?.();
    }, 50);
  };

  const closeModal = () => {
    setOpen(false);
    setResults([]);
    setSearching(false);
    setReverseing(false);
    setHint("");
  };

  // Init Leaflet when modal opens
  useEffect(() => {
    if (!open) return;

    const el = mapElRef.current;
    if (!el) return;

    // Clean old map if any (defensive)
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
      markerRef.current = null;
    }

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
    }).setView([draft.lat, draft.lng], 15);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([draft.lat, draft.lng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);

    marker.on("dragend", async () => {
      const p = marker.getLatLng();
      setDraft((d) => ({ ...d, lat: p.lat, lng: p.lng }));
      await reverseFromLatLng(p.lat, p.lng);
    });

    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setDraft((d) => ({ ...d, lat, lng }));
      await reverseFromLatLng(lat, lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // reverse once on open if label empty
    if (!draft.label) {
      reverseFromLatLng(draft.lat, draft.lng).catch(() => {});
    }

    return () => {
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep marker/map in sync when draft lat/lng changes from search/my-location
  useEffect(() => {
    if (!open) return;
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([draft.lat, draft.lng]);
    map.setView([draft.lat, draft.lng], Math.max(map.getZoom(), 14), { animate: true });
  }, [draft.lat, draft.lng, open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    const q = String(search || "").trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const list = await nominatimSearch(q);
        setResults(list);
      } catch (e) {
        setResults([]);
        setHint(e?.message || "Search failed");
      } finally {
        setSearching(false);
      }
    }, 320);

    return () => clearTimeout(t);
  }, [search, open]);

  async function reverseFromLatLng(lat, lng) {
    try {
      setReverseing(true);
      setHint("");

      const data = await nominatimReverse(lat, lng);
      const display = data?.display_name ? String(data.display_name) : "";

      const addr = data?.address || {};
      const city =
        addr.city || addr.town || addr.village || addr.county || addr.state || "";
      const area = addr.suburb || addr.neighbourhood || addr.city_district || "";
      const zip = addr.postcode || "";

      setDraft((d) => ({
        ...d,
        label: display || d.label,
        city: String(city || d.city || ""),
        area: String(area || d.area || ""),
        zip: String(zip || d.zip || ""),
      }));
    } catch {
      setHint("Could not auto-detect address. You can still save.");
    } finally {
      setReverseing(false);
    }
  }

  function chooseResult(r) {
    const lat = Number(r?.lat || 0);
    const lng = Number(r?.lon || 0);
    const display = String(r?.display_name || "").trim();

    const addr = r?.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.county || addr.state || "";
    const area = addr.suburb || addr.neighbourhood || addr.city_district || "";
    const zip = addr.postcode || "";

    setDraft((d) => ({
      ...d,
      lat: lat || d.lat,
      lng: lng || d.lng,
      label: display || d.label,
      city: String(city || d.city || ""),
      area: String(area || d.area || ""),
      zip: String(zip || d.zip || ""),
    }));

    setResults([]);
    setSearch(display ? display.split(",")[0] : "");
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setHint("Geolocation not supported in this browser.");
      return;
    }

    setHint("");
    setReverseing(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          setDraft((d) => ({ ...d, lat, lng }));
          await reverseFromLatLng(lat, lng);
        } finally {
          setReverseing(false);
        }
      },
      (err) => {
        setReverseing(false);
        setHint(err?.message || "Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function clearSavedLocation() {
    localStorage.removeItem(LS_KEYS.location);
    setSavedLoc(null);
    window.dispatchEvent(new CustomEvent("thomview:locationChanged", { detail: null }));
  }

  function saveLocation() {
    const payload = {
      label: String(draft.label || "").trim(),
      city: String(draft.city || "").trim(),
      area: String(draft.area || "").trim(),
      zip: String(draft.zip || "").trim(),
      lat: Number(draft.lat) || DEFAULT_CENTER.lat,
      lng: Number(draft.lng) || DEFAULT_CENTER.lng,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(LS_KEYS.location, JSON.stringify(payload));
    setSavedLoc(payload);
    window.dispatchEvent(new CustomEvent("thomview:locationChanged", { detail: payload }));
    closeModal();
  }

  const statusText = useMemo(() => {
    if (mode === "delivery") return "Delivering to";
    return "Pickup near";
  }, [mode]);

  return (
    <Container>
      <>
        {/* Premium Top Bar */}
        <div className="">
          <div className="px-3 md:px-4">
            <div className="flex items-center justify-between gap-2 py-2.5">
              {/* Left cluster */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Segmented control */}
                <div className="relative inline-flex items-center p-1 rounded-full bg-base-100/60 border border-base-200/70 shadow-sm backdrop-blur">
                  <span
                    className={[
                      "absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full",
                      "bg-base-100 shadow-sm border border-base-200/70",
                      "transition-transform duration-200",
                      mode === "delivery" ? "translate-x-full" : "translate-x-0",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    className={[
                      "relative z-10 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold",
                      "transition-colors",
                      mode === "pickup" ? "text-base-content" : "text-base-content/70 hover:text-base-content",
                    ].join(" ")}
                    onClick={() => setMode("pickup")}
                    aria-pressed={mode === "pickup"}
                  >
                    Pickup
                  </button>
                  <button
                    type="button"
                    className={[
                      "relative z-10 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold",
                      "transition-colors",
                      mode === "delivery" ? "text-base-content" : "text-base-content/70 hover:text-base-content",
                    ].join(" ")}
                    onClick={() => setMode("delivery")}
                    aria-pressed={mode === "delivery"}
                  >
                    Delivery
                  </button>
                </div>

                {/* Location chip */}
                <button
                  type="button"
                  onClick={openModal}
                  className={[
                    "group inline-flex items-center gap-2 rounded-full",
                    "px-3 py-2 md:py-2.5",
                    "bg-base-100/55 hover:bg-base-100/75",
                    "border border-base-200/70 shadow-sm hover:shadow-md",
                    "transition-all duration-200 backdrop-blur",
                    "min-w-0",
                  ].join(" ")}
                  title={savedPretty || "Set your location"}
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-base-200/60">
                    <FiMapPin className="text-base" />
                  </span>

                  <span className="hidden sm:block min-w-0">
                    <span className="block text-[11px] md:text-xs opacity-70 leading-tight">
                      {statusText}
                    </span>
                    <span className="block font-semibold leading-tight truncate max-w-[12rem] md:max-w-[18rem]">
                      {topLocationLabel}
                    </span>
                  </span>

                  <span className="hidden md:inline-flex items-center gap-1 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                    {savedLoc ? "Change" : "Add"} <FiChevronRight />
                  </span>
                </button>
              </div>

              {/* Right cluster */}
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <Link
                  to="/help"
                  className="btn btn-ghost btn-xs md:btn-sm rounded-full gap-2 bg-base-100/55 hover:bg-base-100/75 border border-base-200/70 shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur"
                >
                  <FiHelpCircle className="text-base" />
                  <span className="hidden sm:inline">Help</span>
                </Link>
                <Link
                  to="/contact"
                  className="btn btn-ghost btn-xs md:btn-sm rounded-full gap-2 bg-base-100/55 hover:bg-base-100/75 border border-base-200/70 shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur"
                >
                  <FiPhone className="text-base" />
                  <span className="hidden sm:inline">Contact</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modal (Portal) */}
        {open
          ? createPortal(
              <div
                className="fixed inset-0 z-[999999] bg-black/55 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closeModal();
                }}
              >
                <div className="min-h-full w-full flex items-start justify-center p-3 md:p-6">
                  {/* Premium gradient border wrapper */}
                  <div className="relative w-full max-w-6xl">
                    <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-r from-primary/40 via-base-100/20 to-secondary/40 blur-[10px] opacity-70" />
                    <div className="relative rounded-[28px] border border-white/10 bg-base-100/90 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)]">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-base-200 bg-base-100/80 backdrop-blur">
                        <div className="min-w-0">
                          <div className="text-lg md:text-xl font-black leading-tight">
                            Set your location
                          </div>
                          <div className="text-xs md:text-sm opacity-70 mt-0.5">
                            Search, use GPS, or click/drag the pin on the map.
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm rounded-full"
                          onClick={closeModal}
                          aria-label="Close"
                          title="Close"
                        >
                          <FiX className="text-lg" />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
                        {/* Map */}
                        <div className="lg:col-span-7 p-4 md:p-5">
                          <div className="relative rounded-3xl border border-base-200/80 overflow-hidden bg-base-100 shadow-sm">
                            {/* Floating hint */}
                            <div className="absolute z-[400] left-3 top-3">
                              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-base-100/80 border border-base-200/70 shadow-sm backdrop-blur text-xs">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                Drag pin or click map
                              </div>
                            </div>

                            <div className="h-[260px] sm:h-[320px] md:h-[460px] w-full" ref={mapElRef} />

                            <div className="px-4 py-3 text-xs bg-base-100 border-t border-base-200 flex items-start justify-between gap-3">
                              <span className="truncate opacity-80">
                                {reverseing
                                  ? "Detecting address…"
                                  : draft.label
                                    ? trimLabel(draft.label, 80)
                                    : "Choose a point on the map to set your location."}
                              </span>
                              <span className="font-mono opacity-60 shrink-0">
                                {Number(draft.lat).toFixed(5)}, {Number(draft.lng).toFixed(5)}
                              </span>
                            </div>
                          </div>

                          {hint ? <div className="mt-3 text-xs text-amber-600">{hint}</div> : null}
                        </div>

                        {/* Right panel */}
                        <div className="lg:col-span-5 p-4 md:p-5 border-t lg:border-t-0 lg:border-l border-base-200">
                          {/* Quick actions */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm rounded-full gap-2 bg-base-100 border-base-200 shadow-sm hover:shadow-md"
                              onClick={useMyLocation}
                              disabled={reverseing}
                              title="Use your current GPS location"
                            >
                              <FiCrosshair />
                              My location
                            </button>

                            {savedLoc ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm rounded-full gap-2 hover:bg-base-200/60"
                                onClick={clearSavedLocation}
                                title="Clear saved location"
                              >
                                <FiTrash2 />
                                Clear saved
                              </button>
                            ) : null}
                          </div>

                          {/* Search */}
                          <div className="mt-4">
                            <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                              Search area / address
                            </label>

                            <div className="mt-2 flex items-center gap-2">
                              <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                <input
                                  ref={firstFieldRef}
                                  className="input input-bordered w-full rounded-2xl pl-10 bg-base-100/70"
                                  placeholder="e.g. Badda, Gulshan, Mirpur 10…"
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                />
                              </div>

                              <button
                                type="button"
                                className="btn btn-ghost rounded-2xl hover:bg-base-200/60"
                                onClick={() => {
                                  setSearch("");
                                  setResults([]);
                                }}
                              >
                                Clear
                              </button>
                            </div>

                            {searching ? (
                              <div className="mt-2 text-xs opacity-70">Searching…</div>
                            ) : null}

                            {results.length ? (
                              <div className="mt-3 rounded-2xl border border-base-200/80 overflow-hidden bg-base-100 shadow-sm">
                                {results.map((r) => (
                                  <button
                                    key={`${r.place_id}-${r.lat}-${r.lon}`}
                                    type="button"
                                    onClick={() => chooseResult(r)}
                                    className="w-full text-left px-4 py-3 hover:bg-base-200/60 transition-colors"
                                  >
                                    <div className="text-sm font-semibold line-clamp-1">
                                      {r.display_name}
                                    </div>
                                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] opacity-70">
                                      <span className="truncate">
                                        {String(r?.type || "place").replaceAll("_", " ")}
                                      </span>
                                      <span className="font-mono shrink-0">
                                        {Number(r.lat).toFixed(5)}, {Number(r.lon).toFixed(5)}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          {/* Manual fields */}
                          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                                Location label (optional)
                              </label>
                              <input
                                className="input input-bordered w-full rounded-2xl mt-2 bg-base-100/70"
                                placeholder="e.g. Home, Office, Badda"
                                value={draft.label}
                                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                              />
                              <div className="text-[11px] opacity-70 mt-1">
                                Tip: label improves checkout clarity and delivery/pickup context.
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                                City
                              </label>
                              <input
                                className="input input-bordered w-full rounded-2xl mt-2 bg-base-100/70"
                                value={draft.city}
                                onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                                placeholder="Dhaka"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                                Area
                              </label>
                              <input
                                className="input input-bordered w-full rounded-2xl mt-2 bg-base-100/70"
                                value={draft.area}
                                onChange={(e) => setDraft((d) => ({ ...d, area: e.target.value }))}
                                placeholder="Badda"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                                ZIP (optional)
                              </label>
                              <input
                                className="input input-bordered w-full rounded-2xl mt-2 bg-base-100/70"
                                value={draft.zip}
                                onChange={(e) => setDraft((d) => ({ ...d, zip: e.target.value }))}
                                placeholder="1212"
                              />
                            </div>
                          </div>

                          {/* Sticky actions */}
                          <div className="mt-5 sticky bottom-0 bg-base-100/90 backdrop-blur pt-4 border-t border-base-200">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                className="btn btn-ghost rounded-full hover:bg-base-200/60"
                                onClick={closeModal}
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                className="btn btn-primary rounded-full px-6 gap-2 shadow-md hover:shadow-lg"
                                onClick={saveLocation}
                                disabled={reverseing}
                                title="Save this location"
                              >
                                <FiCheck />
                                Save location
                              </button>
                            </div>

                            {savedLoc ? (
                              <div className="mt-2 text-xs opacity-70">
                                Current saved:{" "}
                                <span className="font-semibold">
                                  {trimLabel(savedPretty || "—", 56)}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Local styles (Leaflet + pin) */}
                  <style>{`
                    .thomview-pin { background: transparent; border: none; }
                    .leaflet-container { font: inherit; }
                    .leaflet-control-zoom a {
                      border-radius: 12px !important;
                      border: 1px solid rgba(148,163,184,.35) !important;
                      backdrop-filter: blur(10px);
                    }
                    .leaflet-control-attribution {
                      background: rgba(255,255,255,.7) !important;
                      border-radius: 12px;
                      margin: 8px;
                      padding: 4px 8px;
                      border: 1px solid rgba(148,163,184,.25);
                    }
                  `}</style>
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    </Container>
  );
}