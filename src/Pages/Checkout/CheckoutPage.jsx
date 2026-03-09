// src/Pages/Checkout/CheckoutPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../services/api";
import useCart from "../../hooks/useCart";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "react-toastify";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Container from "../../Components/Container";

// -----------------------------
// Helpers
// -----------------------------
function money(n) {
  return `৳${Number(n || 0).toLocaleString()}`;
}

function safeStr(v) {
  return String(v || "").trim();
}

function normalizeBangladeshAddress(nominatim) {
  const a = nominatim?.address || {};
  const city =
    a.city ||
    a.town ||
    a.municipality ||
    a.county ||
    a.state_district ||
    a.state ||
    "";
  const area =
    a.suburb ||
    a.neighbourhood ||
    a.quarter ||
    a.city_district ||
    a.hamlet ||
    "";
  const zip = a.postcode || "";

  const house = a.house_number || "";
  const road = a.road || a.street || "";
  const neighbourhood = a.neighbourhood || a.suburb || "";
  const line1 = [house, road, neighbourhood].filter(Boolean).join(", ");

  const display =
    nominatim?.display_name ||
    [line1, area, city, zip].filter(Boolean).join(", ");

  return { city, area, zip, line1, displayName: display };
}

function pickNiceLine1(existingLine1, fallbackLine1) {
  const a = safeStr(existingLine1);
  if (a) return a;
  return safeStr(fallbackLine1);
}

// -----------------------------
// Leaflet Map helpers
// -----------------------------
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position?.lat || !position?.lng) return;
    map.flyTo([position.lat, position.lng], map.getZoom(), { duration: 0.6 });
  }, [position?.lat, position?.lng, map]);
  return null;
}

function ClickToSetMarker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// -----------------------------
// Address Picker Modal (OSM + Leaflet + Nominatim)
// -----------------------------
function AddressPickerModal({ open, onClose, onApply, initial }) {
  const [pos, setPos] = useState(() => ({
    lat: initial?.lat || 23.8103, // Dhaka fallback
    lng: initial?.lng || 90.4125,
  }));

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [reverseLoading, setReverseLoading] = useState(false);
  const [picked, setPicked] = useState({
    line1: initial?.line1 || "",
    city: initial?.city || "",
    area: initial?.area || "",
    zip: initial?.zip || "",
    displayName: "",
  });

  const debounceRef = useRef(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // When modal opens, sync initial
  useEffect(() => {
    if (!open) return;
    setPos({
      lat: initial?.lat || 23.8103,
      lng: initial?.lng || 90.4125,
    });
    setPicked((p) => ({
      ...p,
      line1: initial?.line1 || p.line1 || "",
      city: initial?.city || p.city || "",
      area: initial?.area || p.area || "",
      zip: initial?.zip || p.zip || "",
      displayName: "",
    }));
    setQuery("");
    setResults([]);
  }, [
    open,
    initial?.lat,
    initial?.lng,
    initial?.line1,
    initial?.city,
    initial?.area,
    initial?.zip,
  ]);

  async function reverseGeocode(nextPos) {
    try {
      setReverseLoading(true);

      // NOTE: Nominatim is free, but rate-limited. Avoid spamming requests.
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        nextPos.lat,
      )}&lon=${encodeURIComponent(nextPos.lng)}&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          "accept-language": "en",
        },
      });

      const json = await res.json();
      const norm = normalizeBangladeshAddress(json);

      if (!aliveRef.current) return;

      setPicked((p) => ({
        ...p,
        line1: pickNiceLine1(p.line1, norm.line1),
        city: p.city || norm.city,
        area: p.area || norm.area,
        zip: p.zip || norm.zip,
        displayName: norm.displayName || "",
      }));
    } catch {
      // don’t hard-fail; allow manual entry
    } finally {
      if (aliveRef.current) setReverseLoading(false);
    }
  }

  function setPosition(nextPos) {
    setPos(nextPos);

    // debounce reverse geocode
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      reverseGeocode(nextPos);
    }, 450);
  }

  async function searchPlaces() {
    const q = safeStr(query);
    if (!q) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        q,
      )}&addressdetails=1&limit=6&countrycodes=bd`;

      const res = await fetch(url, {
        headers: {
          "accept-language": "en",
        },
      });

      const json = await res.json();
      if (!aliveRef.current) return;

      setResults(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error("Search failed:", e);
      toast.error("Search failed. Try again.");
      setResults([]);
    } finally {
      if (aliveRef.current) setSearching(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        toast.success("Location detected. Adjust the pin if needed.");
      },
      (err) => {
        toast.error(
          err?.message ||
            "Could not get your location. Allow location permission.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function apply() {
    const line1 = safeStr(picked.line1);
    const city = safeStr(picked.city);
    const area = safeStr(picked.area);

    if (!line1 || !city) {
      toast.error("Please fill address line and city (you can type manually).");
      return;
    }

    onApply?.({
      line1,
      city,
      area,
      zip: safeStr(picked.zip),
      lat: pos.lat,
      lng: pos.lng,
      displayName: picked.displayName || "",
    });
    onClose?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999999] overflow-y-auto">
      {/* backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />

      {/* modal shell */}
      <div className="relative min-h-full p-3 md:p-6 flex items-start justify-center">
        <div
          className={[
            "relative w-full max-w-6xl",
            "rounded-3xl border border-white/10",
            "bg-base-100 shadow-2xl",
            "max-h-[calc(100vh-1.5rem)] md:max-h-[calc(100vh-3rem)]",
            "overflow-hidden flex flex-col",
          ].join(" ")}
        >
          {/* header (sticky) */}
          <div className="sticky top-0 z-10 bg-base-100/90 backdrop-blur border-b border-base-200">
            <div className="flex items-center justify-between px-4 md:px-5 py-4">
              <div>
                <div className="text-lg font-black">Add delivery address</div>
                <div className="text-xs text-slate-500">
                  Search, use current location, or drag the pin.
                </div>
              </div>

              <button
                className="btn btn-sm btn-ghost rounded-full"
                onClick={onClose}
                type="button"
              >
                ✕
              </button>
            </div>
          </div>

          {/* body scroll area */}
          <div className="flex-1 overflow-y-auto">
            {/* stack on small/medium, split on lg */}
            <div className="flex flex-col lg:grid lg:grid-cols-12">
              {/* MAP SECTION */}
              <div className="lg:col-span-7 bg-base-200/30">
                <div className="p-3 md:p-4">
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                      <div className="join w-full">
                        <input
                          className="input input-bordered join-item w-full"
                          placeholder="Search your address (e.g. Badda, Gulshan, Banani)..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
                        />
                        <button
                          className={`btn join-item ${searching ? "btn-disabled" : "btn-primary"}`}
                          onClick={searchPlaces}
                          type="button"
                        >
                          {searching ? "Searching..." : "Search"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={useCurrentLocation}
                    >
                      📍 Use my location
                    </button>
                  </div>

                  {results.length > 0 ? (
                    <div className="mt-3 rounded-2xl border border-base-200 bg-base-100 p-2 max-h-44 overflow-auto">
                      {results.map((r) => (
                        <button
                          key={r.place_id}
                          type="button"
                          className="w-full text-left rounded-xl px-3 py-2 hover:bg-base-200/60 transition"
                          onClick={() => {
                            const lat = Number(r.lat);
                            const lng = Number(r.lon);
                            setPosition({ lat, lng });
                            const norm = normalizeBangladeshAddress(r);
                            setPicked((p) => ({
                              ...p,
                              line1: pickNiceLine1(p.line1, norm.line1),
                              city: norm.city || p.city,
                              area: norm.area || p.area,
                              zip: norm.zip || p.zip,
                              displayName: norm.displayName || "",
                            }));
                            setResults([]);
                          }}
                        >
                          <div className="text-sm font-semibold line-clamp-1">
                            {r.display_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {Number(r.lat).toFixed(5)},{" "}
                            {Number(r.lon).toFixed(5)}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* responsive map height */}
                  <div className="mt-4 rounded-3xl overflow-hidden border border-base-200 bg-base-100">
                    <div className="h-[240px] sm:h-[300px] md:h-[360px] lg:h-[420px] w-full">
                      <MapContainer
                        center={[pos.lat, pos.lng]}
                        zoom={15}
                        scrollWheelZoom
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FlyTo position={pos} />
                        <ClickToSetMarker onPick={setPosition} />
                        <Marker
                          position={[pos.lat, pos.lng]}
                          draggable
                          eventHandlers={{
                            dragend: (e) => {
                              const p = e.target.getLatLng();
                              setPosition({ lat: p.lat, lng: p.lng });
                            },
                          }}
                        />
                      </MapContainer>
                    </div>

                    <div className="px-4 py-3 border-t border-base-200 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Click on map or drag the pin to select your location.
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FORM SECTION */}
              <div className="lg:col-span-5 p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black">Address details</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {reverseLoading
                        ? "Detecting address from pin..."
                        : "You can also edit manually."}
                    </div>
                  </div>
                  {picked.displayName ? (
                    <span className="badge badge-outline">Detected</span>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input input-bordered"
                    placeholder="City *"
                    value={picked.city}
                    onChange={(e) =>
                      setPicked((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                  <input
                    className="input input-bordered"
                    placeholder="Area / Thana"
                    value={picked.area}
                    onChange={(e) =>
                      setPicked((p) => ({ ...p, area: e.target.value }))
                    }
                  />
                  <input
                    className="input input-bordered md:col-span-2"
                    placeholder="Road / House / Address line *"
                    value={picked.line1}
                    onChange={(e) =>
                      setPicked((p) => ({ ...p, line1: e.target.value }))
                    }
                  />
                  <input
                    className="input input-bordered"
                    placeholder="ZIP"
                    value={picked.zip}
                    onChange={(e) =>
                      setPicked((p) => ({ ...p, zip: e.target.value }))
                    }
                  />

                  <div className="rounded-2xl border border-base-200 p-3 text-xs text-slate-500 md:col-span-2">
                    <div className="font-semibold text-slate-700">Tip</div>
                    <div className="mt-1">
                      Drag the pin exactly on your building/house, then confirm.
                    </div>
                  </div>
                </div>

                {/* sticky actions on mobile so buttons never disappear */}
                <div className="mt-5 sticky bottom-0 bg-base-100/95 backdrop-blur pt-3 border-t border-base-200">
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary flex-1 rounded-full"
                      type="button"
                      onClick={apply}
                    >
                      Deliver here
                    </button>
                  </div>

                  {picked.displayName ? (
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-semibold">Detected:</span>{" "}
                      {picked.displayName}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Checkout Page
// -----------------------------
export default function CheckoutPage() {
  const nav = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const cartCtx = useCart();
  const items = cartCtx?.items ?? cartCtx?.cart?.items ?? [];
  const subtotalRaw = cartCtx?.subtotal ?? cartCtx?.cart?.subtotal ?? 0;
  const subtotal = Number(subtotalRaw || 0);

  const clearCart =
    cartCtx?.clearCart ??
    cartCtx?.clearCartStorage ??
    cartCtx?.cart?.clearCart ??
    (() => {});

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState("delivery");

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    area: "",
    zip: "",
    lat: null,
    lng: null,
    displayName: "",
  });

  const [slotDate, setSlotDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");

  const [addrModalOpen, setAddrModalOpen] = useState(false);

  const deliveryFee = mode === "delivery" ? (subtotal >= 2000 ? 0 : 60) : 0;
  const total = subtotal + deliveryFee;

  const orderItems = useMemo(() => {
    return (items || [])
      .filter((it) => it?.productId)
      .map((it) => ({
        productId: String(it.productId),
        qty: Number(it.qty || 1),
      }));
  }, [items]);

  // Load slots
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoadingSlots(true);
        const res = await apiGet(
          `/api/delivery/slots?mode=${encodeURIComponent(mode)}&date=${encodeURIComponent(slotDate)}`,
          { signal: ctrl.signal },
        );
        setSlots(res?.data?.slots || []);
        setSlot(null);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setSlots([]);
          toast.error(e?.message || "Failed to load slots");
        }
      } finally {
        setLoadingSlots(false);
      }
    })();
    return () => ctrl.abort();
  }, [mode, slotDate]);

  const canNext = useMemo(() => {
    if (items.length === 0) return false;
    if (step === 1) {
      const okName = safeStr(address.fullName).length >= 2;
      const okPhone = safeStr(address.phone).length >= 6;
      const okAddress =
        mode === "pickup" ? true : safeStr(address.line1).length >= 4;
      return okName && okPhone && okAddress;
    }
    if (step === 2) return !!slot;
    if (step === 3) return paymentMethod === "cod" || paymentMethod === "card";
    return true;
  }, [
    step,
    address.fullName,
    address.phone,
    address.line1,
    mode,
    slot,
    paymentMethod,
    items.length,
  ]);

  async function placeOrderCOD() {
    if (!orderItems.length) return toast.error("Cart is empty.");

    try {
      setPlacing(true);

      const payload = {
        mode,
        address: mode === "delivery" ? address : null,
        slot,
        paymentMethod: "cod",
        items: orderItems,
      };

      const res = await apiPost("/api/orders", payload);
      const id = res?.data?.order?._id;

      if (!id) throw new Error("Order created but missing order id.");

      setCreatedOrderId(id);
      toast.success("Order placed (Cash on Delivery).");
      clearCart?.();
      nav(`/orders/${id}`);
    } catch (e) {
      toast.error(e?.message || "Failed to place COD order");
    } finally {
      setPlacing(false);
    }
  }

  async function payWithStripeCard() {
    if (!orderItems.length) return toast.error("Cart is empty.");
    if (!stripe || !elements)
      return toast.error("Stripe is not ready yet. Try again.");
    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return toast.error("Card input not ready.");

    try {
      setPlacing(true);

      const createRes = await apiPost("/api/payments/create-intent", {
        mode,
        address: mode === "delivery" ? address : null,
        slot,
        items: orderItems,
      });

      const clientSecret =
        createRes?.data?.clientSecret ||
        createRes?.clientSecret ||
        createRes?.data?.client_secret ||
        createRes?.client_secret;

      const orderId =
        createRes?.data?.orderId ||
        createRes?.orderId ||
        createRes?.data?.order?._id ||
        createRes?.order?._id;

      if (!clientSecret || !orderId) {
        // helpful debug
        console.log("create-intent response:", createRes);
        throw new Error(
          "Payment initialization failed (missing clientSecret/orderId).",
        );
      }

      const confirmRes = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: {
            name: address.fullName || "Customer",
            phone: address.phone || "",
          },
        },
      });

      if (confirmRes?.error)
        throw new Error(confirmRes.error.message || "Card payment failed");
      const pi = confirmRes?.paymentIntent;
      if (!pi?.id)
        throw new Error("Payment succeeded but missing paymentIntent id.");

      const finalizeRes = await apiPost("/api/payments/finalize", {
        orderId,
        paymentIntentId: pi.id,
      });

      const finalOrderId = finalizeRes?.data?.order?._id || orderId;
      setCreatedOrderId(finalOrderId);

      toast.success("Payment successful. Order confirmed.");
      clearCart?.();
      nav(`/orders/${finalOrderId}`);
    } catch (e) {
      toast.error(e?.message || "Stripe payment failed");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <Container>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Address Modal */}
        <AddressPickerModal
          open={addrModalOpen}
          onClose={() => setAddrModalOpen(false)}
          initial={address}
          onApply={(picked) => {
            setAddress((a) => ({
              ...a,
              line1: picked.line1,
              city: picked.city,
              area: picked.area,
              zip: picked.zip,
              lat: picked.lat,
              lng: picked.lng,
              displayName: picked.displayName || "",
            }));
          }}
        />

        {/* LEFT */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-black">Checkout</h1>
            {mode === "delivery" ? (
              <button
                type="button"
                className="btn btn-sm btn-outline rounded-full"
                onClick={() => setAddrModalOpen(true)}
              >
                📍 Pick from map
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-base-200 bg-base-100 p-6">
              <div className="font-bold">Your cart is empty</div>
              <p className="text-sm text-slate-500 mt-1">
                Add products to your cart before checkout.
              </p>
            </div>
          ) : null}

          <ul className="steps w-full mt-4">
            <li className={`step ${step >= 1 ? "step-primary" : ""}`}>
              Address
            </li>
            <li className={`step ${step >= 2 ? "step-primary" : ""}`}>
              Delivery slot
            </li>
            <li className={`step ${step >= 3 ? "step-primary" : ""}`}>
              Payment
            </li>
          </ul>

          <div className="mt-5 rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            {/* Step 1 */}
            {step === 1 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="font-black text-lg">Delivery method</div>
                  <div className="join">
                    <button
                      type="button"
                      className={`btn btn-sm join-item ${mode === "delivery" ? "btn-primary" : ""}`}
                      onClick={() => setMode("delivery")}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm join-item ${mode === "pickup" ? "btn-primary" : ""}`}
                      onClick={() => setMode("pickup")}
                    >
                      Pickup
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input input-bordered"
                    placeholder="Full name"
                    value={address.fullName}
                    onChange={(e) =>
                      setAddress({ ...address, fullName: e.target.value })
                    }
                  />
                  <input
                    className="input input-bordered"
                    placeholder="Phone"
                    value={address.phone}
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value })
                    }
                  />
                </div>

                {mode === "delivery" ? (
                  <>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline rounded-full"
                        onClick={() => setAddrModalOpen(true)}
                      >
                        📍 Choose on map
                      </button>

                      {address.lat && address.lng ? (
                        <span className="text-xs text-slate-500">
                          Pin:{" "}
                          <span className="font-mono">
                            {Number(address.lat).toFixed(5)},{" "}
                            {Number(address.lng).toFixed(5)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Tip: choose on map for accurate delivery.
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="input input-bordered md:col-span-2"
                        placeholder="Address line"
                        value={address.line1}
                        onChange={(e) =>
                          setAddress({ ...address, line1: e.target.value })
                        }
                      />
                      <input
                        className="input input-bordered"
                        placeholder="City"
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                      />
                      <input
                        className="input input-bordered"
                        placeholder="Area"
                        value={address.area}
                        onChange={(e) =>
                          setAddress({ ...address, area: e.target.value })
                        }
                      />
                      <input
                        className="input input-bordered"
                        placeholder="ZIP"
                        value={address.zip}
                        onChange={(e) =>
                          setAddress({ ...address, zip: e.target.value })
                        }
                      />
                    </div>

                    {address.displayName ? (
                      <div className="mt-2 text-xs text-slate-500">
                        <span className="font-semibold">Detected:</span>{" "}
                        {address.displayName}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="mt-3 text-sm text-slate-500">
                    Pickup selected: you will choose a pickup time next.
                  </div>
                )}
              </>
            ) : null}

            {/* Step 2 */}
            {step === 2 ? (
              <>
                <div className="font-black text-lg">
                  Choose a {mode === "delivery" ? "delivery" : "pickup"} slot
                </div>

                <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3">
                  <input
                    type="date"
                    className="input input-bordered"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                  />
                  <div className="text-xs text-slate-500">
                    Slots update automatically.
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {loadingSlots ? (
                    <div className="md:col-span-2 text-sm text-slate-500">
                      Loading slots…
                    </div>
                  ) : slots.length ? (
                    slots.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setSlot(s)}
                        className={[
                          "text-left rounded-2xl border p-4 transition-all",
                          slot?.id === s.id
                            ? "border-primary bg-primary/5 shadow-lg"
                            : "border-base-200 hover:shadow-md",
                        ].join(" ")}
                      >
                        <div className="font-extrabold">{s.label}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {s.arrivesText}
                        </div>
                        <div className="text-xs mt-2">
                          <span className="badge badge-outline">
                            Remaining: {s.remaining}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="md:col-span-2 text-sm text-slate-500">
                      No slots available for this date.
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {/* Step 3 */}
            {step === 3 ? (
              <>
                <div className="font-black text-lg">Payment</div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={[
                      "rounded-2xl border p-4 text-left transition-all",
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-base-200 hover:shadow-md",
                    ].join(" ")}
                  >
                    <div className="font-extrabold">Cash on Delivery</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Pay when your order arrives.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={[
                      "rounded-2xl border p-4 text-left transition-all",
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-base-200 hover:shadow-md",
                    ].join(" ")}
                  >
                    <div className="font-extrabold">Card (Stripe)</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Pay securely by card.
                    </div>
                  </button>
                </div>

                {paymentMethod === "card" ? (
                  <div className="mt-4 rounded-2xl border border-base-200 p-4">
                    <div className="text-sm font-semibold mb-2">
                      Card details
                    </div>
                    <div className="rounded-xl border border-base-200 p-3">
                      <CardElement options={{ hidePostalCode: true }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Your payment is processed by Stripe.
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {/* Navigation buttons */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="btn"
              disabled={step === 1 || placing}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </button>

            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary rounded-full"
                disabled={!canNext || placing}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary rounded-full"
                disabled={!canNext || placing}
                onClick={() => {
                  if (paymentMethod === "cod") return placeOrderCOD();
                  return payWithStripeCard();
                }}
              >
                {placing
                  ? "Processing…"
                  : paymentMethod === "cod"
                    ? "Place order"
                    : "Pay now"}
              </button>
            )}
          </div>

          {createdOrderId ? (
            <div className="mt-3 text-xs text-slate-500">
              Latest order:{" "}
              <span className="font-semibold">{createdOrderId}</span>
            </div>
          ) : null}
        </div>

        {/* RIGHT SUMMARY */}
        <div className="lg:col-span-4">
          <div className="sticky top-[90px] rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <div className="text-lg font-black">Summary</div>

            <div className="mt-3 space-y-2 text-sm">
              <Row label="Subtotal" value={money(subtotal)} />
              <Row
                label={mode === "delivery" ? "Delivery fee" : "Pickup"}
                value={money(deliveryFee)}
              />
              <div className="border-t border-base-200 pt-2">
                <Row
                  label={<span className="font-black">Total</span>}
                  value={<span className="font-black">{money(total)}</span>}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(items || []).slice(0, 6).map((i) => (
                <div key={i.productId} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-base-200 overflow-hidden">
                    <img
                      src={i.image}
                      alt={i.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold line-clamp-1">
                      {i.name}
                    </div>
                    <div className="text-xs text-slate-500">Qty {i.qty}</div>
                  </div>
                  <div className="text-sm font-extrabold">{money(i.price)}</div>
                </div>
              ))}
              {items.length > 6 ? (
                <div className="text-xs text-slate-500">
                  + {items.length - 6} more items
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
