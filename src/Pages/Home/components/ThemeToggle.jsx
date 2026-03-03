import React, { useContext } from "react";
// import { ThemeContext } from "../Provider/ThemeProvider";
import { FiMoon, FiSun } from "react-icons/fi";
import { ThemeContext } from "../../../Provider/ThemeProvider";

const ThemeToggle = ({ className = "" }) => {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    // If ThemeProvider isn't wrapped, fail safely
    return null;
  }

  const { isDark, toggleTheme } = ctx;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        "group inline-flex items-center gap-2 rounded-full px-3 py-2",
        "border border-base-200/80 bg-base-100/70 backdrop-blur",
        "shadow-sm hover:shadow-md transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#DC2626]",
        className,
      ].join(" ")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-full",
          "border border-base-200/70 bg-base-200/50",
          "group-hover:scale-[1.03] transition-transform",
        ].join(" ")}
      >
        {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
      </span>

      <div className="hidden xl:flex flex-col items-start leading-tight">
        <span className="text-[11px] uppercase tracking-wide text-base-content/60 font-semibold">
          Theme
        </span>
        <span className="text-sm font-bold text-base-content">
          {isDark ? "Dark" : "Light"}
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;
