import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

/** A row of tappable color swatches; the active one gets a ring. Collapses
 * into a popover on small screens so it never crowds the mobile header. */
export default function ThemeSwitcher({ className = "" }) {
  const { theme, themes, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change color theme"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white shadow-sm transition-transform active:scale-95"
        style={{ boxShadow: `inset 0 0 0 2px ${theme.brand}` }}
      >
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.brand }} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-ink/10 bg-white p-3 shadow-soft">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-fog">
            Color theme
          </p>
          <div className="grid grid-cols-5 gap-2">
            {themes.map((t) => (
              <button
                key={t.key}
                type="button"
                title={t.name}
                onClick={() => {
                  setTheme(t.key);
                  setOpen(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: t.swatch,
                  boxShadow:
                    t.key === theme.key ? "0 0 0 2px white, 0 0 0 4px currentColor" : "none",
                  color: t.swatch,
                }}
                aria-label={t.name}
                aria-pressed={t.key === theme.key}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
