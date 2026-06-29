import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";

const THEME_KEY = "bloodcare_theme";
const DEFAULT_THEME = "light";

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);

    // Prevent invalid values from being used as a theme.
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,

      toggleTheme: () => {
        setTheme((currentTheme) =>
          currentTheme === "light" ? "dark" : "light"
        );
      },

      isDark: theme === "dark",
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;