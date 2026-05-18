import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiPost } from "../../services/api";
import { FiZap, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";

/**
 * Premium AI "Fix text" button:
 * - Small action button in chat toolbar
 * - Opens a popover with tone pills
 * - Calls POST /api/ai/proofread
 * - Shows preview and lets user Replace
 */
export default function FixTextBox({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const wrapRef = useRef(null);

  const canRun = useMemo(() => {
    const t = String(value || "").trim();
    return !!t && !disabled && !loading;
  }, [value, disabled, loading]);

  // close on outside click
  useEffect(() => {
    function onDocDown(e) {
      if (!open) return;
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  // close on Escape
  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function runFix() {
    const text = String(value || "").trim();
    if (!text) return;

    setLoading(true);
    setResult("");

    try {
      const res = await apiPost("/api/ai/proofread", { text, tone });
      const corrected = String(res?.data?.corrected || "").trim();
      setResult(corrected);
    } catch (e) {
      console.error(e);
      setResult("");
      alert(e?.message || "AI fix failed");
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!result) return;
    onChange?.(result);
    setOpen(false);
    setResult("");
  }

  function reset() {
    setResult("");
  }

  return (
    <div className="relative" ref={wrapRef}>
      {/* Premium toolbar button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="AI Fix text"
        title="AI Fix: grammar + spelling"
        className={[
          "group",
          "btn btn-sm rounded-full",
          "border border-base-200",
          "bg-base-100 hover:bg-base-200/50",
          "shadow-[0_10px_30px_-24px_rgba(0,0,0,0.45)]",
          "transition-all",
          disabled ? "opacity-50" : "",
        ].join(" ")}
      >
        <span className="relative inline-flex items-center gap-2">
          {/* soft glow */}
          <span className="pointer-events-none absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/15 via-secondary/10 to-primary/15" />

          <span className="relative inline-flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              {loading ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiZap className="text-primary" />
              )}
            </span>

            {/* label only on bigger screens */}
            <span className="hidden md:inline font-semibold">
              Fix
              <span className="ml-2 badge badge-ghost border border-base-200 text-[10px] px-2 py-1">
                AI
              </span>
            </span>
          </span>
        </span>
      </button>

      {/* Popover */}
      {open ? (
        <div
          className={[
            "absolute right-0 bottom-12 z-50",
            "w-[340px] max-w-[86vw]",
            "rounded-2xl border border-base-200 bg-base-100",
            "shadow-[0_20px_70px_-36px_rgba(0,0,0,0.55)]",
            "overflow-hidden",
          ].join(" ")}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-base-200 bg-gradient-to-r from-base-100 via-base-100 to-base-200/40">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-black leading-tight">AI Fix</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Spelling • Grammar • Clarity (same meaning)
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-xs rounded-full"
                onClick={() => setOpen(false)}
                aria-label="Close AI fix"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Tone pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {["friendly", "professional", "casual"].map((t) => {
                const active = tone === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={[
                      "px-3 py-2 rounded-full text-xs font-semibold border transition",
                      active
                        ? "bg-primary text-primary-content border-primary/30"
                        : "bg-base-100 border-base-200 hover:bg-base-200/50",
                    ].join(" ")}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Preview / helper */}
            {!result ? (
              <div className="rounded-2xl border border-base-200 bg-base-100 p-3 text-sm text-slate-600">
                {String(value || "").trim()
                  ? "Click “Fix now” to polish your message before sending."
                  : "Type something first, then use AI Fix."}
              </div>
            ) : (
              <div className="rounded-2xl border border-base-200 bg-base-100 p-3">
                <div className="text-xs text-slate-500 mb-2">Preview</div>
                <div className="text-sm whitespace-pre-wrap max-h-36 overflow-auto pr-1">
                  {result}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              {!result ? (
                <button
                  type="button"
                  onClick={runFix}
                  disabled={!canRun}
                  className={[
                    "btn btn-primary rounded-2xl flex-1",
                    "shadow-sm hover:shadow-md transition",
                  ].join(" ")}
                >
                  {loading ? "Fixing..." : "Fix now"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={reset}
                    className="btn btn-ghost rounded-2xl"
                    title="Try again"
                  >
                    <FiRefreshCw />
                    Retry
                  </button>

                  <button
                    type="button"
                    onClick={apply}
                    className="btn btn-primary rounded-2xl flex-1"
                    title="Replace your message with the corrected text"
                  >
                    <FiCheck />
                    Replace
                  </button>
                </>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              Tip: You can still edit after replacing.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
