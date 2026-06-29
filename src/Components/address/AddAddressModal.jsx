import React, { useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { apiGet, apiPost } from "../../services/api";

const libraries = ["places"];

export default function AddAddressModal({ open, onClose, onSaved, initialName = "", initialPhone = "" }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries,
  });

  const [pin, setPin] = useState({ lat: 23.8103, lng: 90.4125 }); // Dhaka default
  const [geoErr, setGeoErr] = useState("");
  const [auto, setAuto] = useState(null);
  const [loadingFill, setLoadingFill] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    label: "Home",
    fullName: initialName,
    phone: initialPhone,
    city: "",
    area: "",
    houseNo: "",
    floorNo: "",
    block: "",
    flatNo: "",
    line1: "",
    zip: "",
    notes: "",
    placeId: "",
    formattedAddress: "",
  });

  const canSave = useMemo(() => {
    return (
      form.fullName.trim() &&
      form.phone.trim() &&
      form.city.trim() &&
      form.area.trim() &&
      (form.line1.trim() || form.formattedAddress.trim())
    );
  }, [form]);

  async function fillFromPin(nextPin) {
    try {
      setLoadingFill(true);
      const res = await apiGet(`/api/geo/reverse?lat=${nextPin.lat}&lng=${nextPin.lng}`);
      const d = res?.data;
      if (!d?.ok) return;

      setForm((p) => ({
        ...p,
        city: d.city || p.city,
        area: d.area || p.area,
        houseNo: d.houseNo || p.houseNo,
        line1: d.road || p.line1,
        zip: d.zip || p.zip,
        placeId: d.placeId || p.placeId,
        formattedAddress: d.formattedAddress || p.formattedAddress,
      }));
    } finally {
      setLoadingFill(false);
    }
  }

  // Get current location when modal opens
  useEffect(() => {
    if (!open) return;

    setGeoErr("");
    if (!navigator.geolocation) {
      setGeoErr("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPin(next);
        await fillFromPin(next);
      },
      (err) => {
        setGeoErr(err?.message || "Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
     
  }, [open]);

  async function handleSave() {
    try {
      setSaving(true);

      const payload = {
        ...form,
        location: pin,
      };

      const res = await apiPost("/api/users/me/addresses", payload);
      const saved = res?.data?.address;
      if (!saved) throw new Error("Address saved but missing response.");

      onSaved?.(saved);
      onClose?.();
    } catch (e) {
      alert(e?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-3">
      <div className="w-full max-w-5xl rounded-2xl bg-base-100 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
          <h3 className="font-black text-lg">Add new address</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT: MAP */}
          <div className="p-4 border-b lg:border-b-0 lg:border-r border-base-200">
            {!isLoaded ? (
              <div className="rounded-2xl border border-base-200 p-6">Loading map…</div>
            ) : (
              <>
                <div className="mb-3">
                  <Autocomplete onLoad={setAuto} onPlaceChanged={async () => {
                    if (!auto) return;
                    const place = auto.getPlace();
                    const loc = place?.geometry?.location;
                    if (!loc) return;
                    const next = { lat: loc.lat(), lng: loc.lng() };
                    setPin(next);
                    await fillFromPin(next);
                  }}>
                    <input
                      className="input input-bordered w-full"
                      placeholder="Search your address here"
                    />
                  </Autocomplete>
                  {geoErr ? <div className="text-xs text-error mt-2">{geoErr}</div> : null}
                </div>

                <div className="rounded-2xl overflow-hidden border border-base-200">
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "420px" }}
                    center={pin}
                    zoom={15}
                    onClick={async (e) => {
                      const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                      setPin(next);
                      await fillFromPin(next);
                    }}
                    options={{ streetViewControl: false, mapTypeControl: false }}
                  >
                    <Marker
                      position={pin}
                      draggable
                      onDragEnd={async (e) => {
                        const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                        setPin(next);
                        await fillFromPin(next);
                      }}
                    />
                  </GoogleMap>
                </div>

                <div className="text-xs text-slate-500 mt-2">
                  Drag the pin or click on the map to set your delivery area.
                </div>
              </>
            )}
          </div>

          {/* RIGHT: FORM */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label"><span className="label-text">City *</span></label>
                <input className="input input-bordered w-full"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="label"><span className="label-text">Area *</span></label>
                <input className="input input-bordered w-full"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
              </div>

              <div>
                <label className="label"><span className="label-text">House no</span></label>
                <input className="input input-bordered w-full"
                  value={form.houseNo}
                  onChange={(e) => setForm({ ...form, houseNo: e.target.value })}
                />
              </div>
              <div>
                <label className="label"><span className="label-text">Floor No</span></label>
                <input className="input input-bordered w-full"
                  value={form.floorNo}
                  onChange={(e) => setForm({ ...form, floorNo: e.target.value })}
                />
              </div>

              <div>
                <label className="label"><span className="label-text">Block/Sector</span></label>
                <input className="input input-bordered w-full"
                  value={form.block}
                  onChange={(e) => setForm({ ...form, block: e.target.value })}
                />
              </div>
              <div>
                <label className="label"><span className="label-text">Flat No</span></label>
                <input className="input input-bordered w-full"
                  value={form.flatNo}
                  onChange={(e) => setForm({ ...form, flatNo: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="label"><span className="label-text">Road/Street *</span></label>
                <input className="input input-bordered w-full"
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                />
                {loadingFill ? (
                  <div className="text-xs text-slate-500 mt-1">Auto-filling from location…</div>
                ) : form.formattedAddress ? (
                  <div className="text-xs text-slate-500 mt-1">{form.formattedAddress}</div>
                ) : null}
              </div>

              <div className="col-span-2">
                <label className="label"><span className="label-text">Name *</span></label>
                <input className="input input-bordered w-full"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="label"><span className="label-text">Phone *</span></label>
                <input className="input input-bordered w-full"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="label"><span className="label-text">Delivery Notes</span></label>
                <input className="input input-bordered w-full"
                  placeholder="E.g: Drop at door, Don't ring bell..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="label"><span className="label-text">Label</span></label>
                <div className="join">
                  {["Home", "Work", "Other"].map((x) => (
                    <button
                      key={x}
                      type="button"
                      className={`btn btn-sm join-item ${form.label === x ? "btn-primary" : ""}`}
                      onClick={() => setForm({ ...form, label: x })}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2 pt-2">
                <button
                  type="button"
                  className="btn btn-primary w-full rounded-full"
                  disabled={!canSave || saving}
                  onClick={handleSave}
                >
                  {saving ? "Saving..." : "Save Address"}
                </button>
                <div className="text-xs text-slate-500 mt-2">
                  We save your pin location too (lat/lng) for delivery area tracking.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
