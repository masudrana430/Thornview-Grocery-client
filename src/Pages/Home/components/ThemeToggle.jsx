// src/Pages/Home/components/ThemeToggle.jsx

import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../../../hooks/useTheme";

const ThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        "group inline-flex items-center gap-2 rounded-full px-3 py-2",
        "border border-base-200/80 bg-base-100/70 backdrop-blur",
        "shadow-sm transition-all hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#DC2626] focus-visible:ring-offset-2",
        className,
      ].join(" ")}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-full",
          "border border-base-200/70 bg-base-200/50",
          "transition-transform group-hover:scale-[1.03]",
        ].join(" ")}
      >
        {isDark ? (
          <FiSun className="h-5 w-5" />
        ) : (
          <FiMoon className="h-5 w-5" />
        )}
      </span>

      <div className="hidden flex-col items-start leading-tight xl:flex">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
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