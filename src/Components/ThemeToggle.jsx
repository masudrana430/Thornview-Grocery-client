// src/Components/ThemeToggle.jsx
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <label className={`swap swap-rotate ${className}`}>
      <input
        type="checkbox"
        className="hidden"
        checked={isDark}
        onChange={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle dark mode"
      />
      {/* sun (light) */}
      <svg className="swap-off h-6 w-6 fill-current" viewBox="0 0 24 24">
        <path d="M5.64 17l-1.41 1.41 1.41 1.41L7.05 18.4 5.64 17zM1 13h3v-2H1v2zm10-9h2V1h-2v3zm7.36 3.64L19.77 6.6l1.41-1.41-1.41-1.41-1.41 1.41 1.41 1.41zM12 7a5 5 0 100 10 5 5 0 000-10zm8 4v2h3v-2h-3zm-1.36 6.36l1.41 1.41 1.41-1.41-1.41-1.41-1.41 1.41zM11 23h2v-3h-2v3zM4.23 6.6L2.82 5.18 1.41 6.6l1.41 1.41L4.23 6.6z"/>
      </svg>
      {/* moon (dark) */}
      <svg className="swap-on h-6 w-6 fill-current" viewBox="0 0 24 24">
        <path d="M21.64 13a9 9 0 01-11.31 8.65A9 9 0 1012 3a7 7 0 009.64 10z"/>
      </svg>
    </label>
  );
}
