import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from "../theme/themes";

const ThemeContext = createContext(undefined);

function applyTheme(themeKey) {
  const theme = THEMES[themeKey] ?? THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  root.setAttribute("data-theme", theme.key);
  root.style.setProperty("--brand", theme.brand);
  root.style.setProperty("--brand-soft", theme.brandSoft);
  root.style.setProperty("--brand-deep", theme.brandDeep);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-soft", theme.accentSoft);
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    return window.localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(themeKey);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeKey);
  }, [themeKey]);

  const setTheme = useCallback((key) => {
    if (THEMES[key]) setThemeKey(key);
  }, []);

  const value = useMemo(
    () => ({
      themeKey,
      theme: THEMES[themeKey] ?? THEMES[DEFAULT_THEME],
      themes: Object.values(THEMES),
      setTheme,
    }),
    [themeKey, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
