import React from "react";
import { Link } from "react-router-dom";

/**
 * PromoTile (Walmart-style promo tile)
 * Props:
 * - title, subtitle, eyebrow, cta, href
 * - image (url)
 * - theme: "green" | "red" | "blue" | "yellow" | "neutral"
 * - variant: "card" | "tall" | "wide"
 * - price: { now, was, currency="৳", suffix }  // optional
 * - align: "left" | "center"
 * - badge: string (optional)
 */
export default function PromoTile({
  title,
  subtitle,
  eyebrow = "Shop",
  cta = "Shop",
  href = "/shop",
  image,
  theme = "neutral",
  variant = "card",
  price,
  align = "left",
  badge,
  className = "", // ✅ add
}) {
  const themeMeta = getTheme(theme);

  const heightClass =
    variant === "tall"
      ? "min-h-[420px] lg:min-h-[430px]"
      : variant === "wide"
      ? "min-h-[150px] lg:min-h-[170px]"
      : "min-h-[190px] lg:min-h-[210px]"; // "card"

  const padClass =
    variant === "wide" ? "p-5 md:p-6" : "p-5 md:p-6";

  const alignClass =
    align === "center"
      ? "items-center text-center"
      : "items-start text-left";

  // Image sizing per variant (Walmart-ish)
  const imageFit =
    variant === "wide" ? "object-cover" : "object-cover";

  const hasImage = Boolean(image);

  return (
    <Link
      to={href}
      className={[
        "group relative block w-full h-full overflow-hidden rounded-2xl", // ✅ block + fill
        "border border-base-200/80 bg-base-100",
        "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]",
        "hover:shadow-[0_18px_44px_-22px_rgba(0,0,0,0.35)]",
        "transition-all duration-300",
        "hover:-translate-y-0.5",
        heightClass,
        className, // ✅ add
      ].join(" ")}
      aria-label={title ? `Promo: ${title}` : "Promo tile"}
    >
      {/* Background layer */}
      <div className={`absolute inset-0 ${themeMeta.bg}`} />

      {/* Background image */}
      {hasImage ? (
        <img
          src={image}
          alt={title || "Promo"}
          className={[
            "absolute inset-0 h-full w-full",
            imageFit,
            "transition-transform duration-500 group-hover:scale-[1.03]",
            themeMeta.imageOpacity,
          ].join(" ")}
          loading="lazy"
          decoding="async"
          onError={() => console.warn("PromoTile image failed:", image)}
        />
      ) : null}

      {/* Overlay gradient (Walmart-like: readable but image visible) */}
      <div
        className={[
          "absolute inset-0",
          themeMeta.overlay,
        ].join(" ")}
      />

      {/* Soft shine */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div
        className={[
          "relative h-full flex flex-col justify-between",
          padClass,
          themeMeta.text,
        ].join(" ")}
      >
        {/* Top text */}
        <div className={`flex flex-col gap-2 ${alignClass}`}>
          {/* badge */}
          {badge ? (
            <span
              className={[
                "inline-flex w-fit items-center gap-1",
                "px-2.5 py-1 rounded-full",
                "text-[10px] font-extrabold tracking-wide",
                themeMeta.badge,
              ].join(" ")}
            >
              {badge}
            </span>
          ) : null}

          {/* eyebrow */}
          {eyebrow ? (
            <div className={["text-[11px] font-bold uppercase tracking-[0.18em]", themeMeta.eyebrow].join(" ")}>
              {eyebrow}
            </div>
          ) : null}

          {/* title */}
          {title ? (
            <h3
              className={[
                "font-black leading-tight",
                variant === "wide" ? "text-xl md:text-2xl" : "text-2xl md:text-3xl",
              ].join(" ")}
            >
              {title}
            </h3>
          ) : null}

          {/* subtitle */}
          {subtitle ? (
            <p className={["text-sm md:text-[15px] leading-snug max-w-[38ch]", themeMeta.subText].join(" ")}>
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Bottom row */}
        <div className="mt-4 flex items-end justify-between gap-3">
          {/* CTA */}
          <span
            className={[
              "inline-flex items-center justify-center",
              "h-9 px-4 rounded-full text-sm font-bold",
              "transition-all duration-200",
              themeMeta.cta,
              "group-hover:scale-[1.02]",
            ].join(" ")}
          >
            {cta}
          </span>

          {/* Price (optional) */}
          {price ? (
            <div className="text-right leading-tight">
              {typeof price.was === "number" ? (
                <div className={["text-xs line-through", themeMeta.priceWas].join(" ")}>
                  {price.currency || "৳"}
                  {price.was}
                  {price.suffix ? <span> {price.suffix}</span> : null}
                </div>
              ) : null}

              <div className={["font-black", variant === "wide" ? "text-2xl" : "text-3xl"].join(" ")}>
                {price.currency || "৳"}
                {price.now}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function getTheme(theme) {
  switch (theme) {
    case "green":
      return {
        bg: "bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-700",
        overlay: "bg-gradient-to-br from-black/55 via-black/18 to-transparent",
        text: "text-white",
        subText: "text-white/85",
        eyebrow: "text-white/90",
        badge: "bg-white/15 text-white",
        cta: "bg-white text-slate-900 hover:bg-white",
        priceWas: "text-white/70",
        imageOpacity: "opacity-90",
      };

    case "red":
      return {
        bg: "bg-gradient-to-b from-rose-800 via-rose-700 to-rose-700",
        overlay: "bg-gradient-to-br from-black/55 via-black/18 to-transparent",
        text: "text-white",
        subText: "text-white/85",
        eyebrow: "text-white/90",
        badge: "bg-white/15 text-white",
        cta: "bg-white text-slate-900 hover:bg-white",
        priceWas: "text-white/70",
        imageOpacity: "opacity-92",
      };

    case "blue":
      return {
        bg: "bg-gradient-to-b from-blue-900 via-blue-700 to-sky-600",
        overlay: "bg-gradient-to-br from-black/55 via-black/18 to-transparent",
        text: "text-white",
        subText: "text-white/85",
        eyebrow: "text-white/90",
        badge: "bg-white/15 text-white",
        cta: "bg-white text-slate-900 hover:bg-white",
        priceWas: "text-white/70",
        imageOpacity: "opacity-92",
      };

    case "yellow":
      return {
        bg: "bg-gradient-to-b from-yellow-100 via-yellow-50 to-yellow-50",
        overlay: "bg-gradient-to-br from-white/70 via-white/25 to-transparent",
        text: "text-slate-900",
        subText: "text-slate-700",
        eyebrow: "text-slate-700",
        badge: "bg-black/10 text-slate-900",
        cta: "bg-slate-900 text-white hover:bg-slate-800",
        priceWas: "text-slate-600",
        imageOpacity: "opacity-95",
      };

    default:
      return {
        bg: "bg-base-100",
        overlay: "bg-gradient-to-br from-black/35 via-black/10 to-transparent",
        text: "text-slate-900",
        subText: "text-slate-600",
        eyebrow: "text-slate-500",
        badge: "bg-black/10 text-slate-900",
        cta: "bg-slate-900 text-white hover:bg-slate-800",
        priceWas: "text-slate-500",
        imageOpacity: "opacity-95",
      };
  }
}
