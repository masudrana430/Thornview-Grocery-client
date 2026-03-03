import React, { createContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext(null);

const THEME_KEY = "bloodcare_theme";
const DEFAULT_THEME = "light"; // or "dark"

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // Load saved theme on first mount
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) setTheme(saved);
  }, []);

  // Apply theme to <html data-theme="...">
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      isDark: theme === "dark",
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
