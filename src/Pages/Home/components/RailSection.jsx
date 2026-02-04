import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "./SectionHeader";
import ProductStrip from "./ProductStrip";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function RailSection({
  // static props (optional)
  title: titleProp,
  viewAllHref: viewAllHrefProp,
  rightText: rightTextProp,
  items: itemsProp,

  // dynamic controls
  slug = "home",
  sectionKey = "weekly-flyer",
  className = "",
}) {
  const propsProvided =
    titleProp || viewAllHrefProp || rightTextProp || Array.isArray(itemsProp);

  const [cfg, setCfg] = useState(() => ({
    title: titleProp || "",
    viewAllHref: viewAllHrefProp || "",
    rightText: rightTextProp || "",
    railKey: "",
  }));
  const [items, setItems] = useState(Array.isArray(itemsProp) ? itemsProp : []);
  const [loading, setLoading] = useState(!propsProvided);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (propsProvided) {
      setCfg({
        title: titleProp || "",
        viewAllHref: viewAllHrefProp || "",
        rightText: rightTextProp || "",
        railKey: "",
      });
      setItems(Array.isArray(itemsProp) ? itemsProp : []);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        // 1) load section config
        const resCfg = await fetch(
          `${API_BASE}/api/home/rail-section?slug=${slug}&key=${sectionKey}`,
          { method: "GET", headers: { "content-type": "application/json" } }
        );

        const jsonCfg = await resCfg.json().catch(() => ({}));
        if (!resCfg.ok) {
          throw new Error(jsonCfg?.error?.message || "Failed to load rail section");
        }

        const cfgPayload = jsonCfg?.data || jsonCfg;
        const normalizedCfg = normalizeCfg(cfgPayload);

        if (!normalizedCfg.railKey) {
          throw new Error("railKey missing in rail section config");
        }

        // 2) load items (reuse product rail endpoint)
        const resRail = await fetch(
          `${API_BASE}/api/home/product-rail?slug=${slug}&key=${normalizedCfg.railKey}`,
          { method: "GET", headers: { "content-type": "application/json" } }
        );

        const jsonRail = await resRail.json().catch(() => ({}));
        if (!resRail.ok) {
          throw new Error(jsonRail?.error?.message || "Failed to load rail items");
        }

        const railPayload = jsonRail?.data || jsonRail;
        const normalizedItems = Array.isArray(railPayload?.items) ? railPayload.items : [];

        if (mounted) {
          setCfg(normalizedCfg);
          setItems(normalizedItems);
        }
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load rail section");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [
    propsProvided,
    slug,
    sectionKey,
    titleProp,
    viewAllHrefProp,
    rightTextProp,
    itemsProp,
  ]);

  const title = cfg.title || titleProp || "";
  const viewAllHref = cfg.viewAllHref || viewAllHrefProp || "";
  const rightText = cfg.rightText || rightTextProp || "";

  const list = useMemo(
    () => (Array.isArray(itemsProp) ? itemsProp : items),
    [itemsProp, items]
  );

  if (loading) {
    return (
      <section className={className}>
        <div className="rounded-3xl border border-base-200 bg-base-100 p-3">
          <div className="h-40 rounded-2xl bg-base-200 animate-pulse" />
        </div>
      </section>
    );
  }

  if (!list.length) {
    return (
      <section className={className}>
        <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
          <p className="text-sm text-error font-semibold">Rail section not available</p>
          <p className="mt-1 text-sm text-slate-500">
            {err || "Rail section not configured yet"}
          </p>
          <div className="mt-4 text-xs text-slate-500">
            Try opening:{" "}
            <span className="font-mono">
              {API_BASE}/api/home/rail-section?slug={slug}&key={sectionKey}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <SectionHeader title={title} viewAllHref={viewAllHref} rightText={rightText} />

      <div className="rounded-3xl border border-base-200 bg-base-100 p-3">
        <ProductStrip items={list} />
      </div>
    </section>
  );
}

function normalizeCfg(d) {
  return {
    title: String(d?.title || ""),
    viewAllHref: d?.viewAllHref ? String(d.viewAllHref) : "",
    rightText: d?.rightText ? String(d.rightText) : "",
    railKey: d?.railKey ? String(d.railKey) : "",
  };
}
