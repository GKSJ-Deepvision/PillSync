/**
 * Named color themes. Each theme only swaps the *brand* accent — the
 * neutral ink/porcelain palette from Milestone 1 stays put so text
 * contrast and the Dose Ring (which is intentionally theme-independent,
 * see components/common/DoseRing.jsx) never break.
 *
 * Applied by ThemeContext as CSS custom properties on <html>, so any
 * component can opt in with e.g. `bg-[var(--brand)]` or `text-[var(--brand-deep)]`.
 */
export const THEMES = {
  dose: {
    key: "dose",
    name: "Dose Indigo",
    swatch: "#5B5FEF",
    brand: "#5B5FEF",
    brandSoft: "#E7E7FD",
    brandDeep: "#4144C4",
    accent: "#FF5D73",
    accentSoft: "#FFE3E7",
  },
  ocean: {
    key: "ocean",
    name: "Ocean",
    swatch: "#0EA5B7",
    brand: "#0EA5B7",
    brandSoft: "#D7F5F8",
    brandDeep: "#0B7C8A",
    accent: "#F59E0B",
    accentSoft: "#FEF1D6",
  },
  sunset: {
    key: "sunset",
    name: "Sunset",
    swatch: "#F2712B",
    brand: "#F2712B",
    brandSoft: "#FDE7D8",
    brandDeep: "#C2551A",
    accent: "#5B5FEF",
    accentSoft: "#E7E7FD",
  },
  forest: {
    key: "forest",
    name: "Forest",
    swatch: "#22A366",
    brand: "#22A366",
    brandSoft: "#DDF5E7",
    brandDeep: "#177A4B",
    accent: "#F2712B",
    accentSoft: "#FDE7D8",
  },
  grape: {
    key: "grape",
    name: "Grape",
    swatch: "#8B5CF6",
    brand: "#8B5CF6",
    brandSoft: "#EDE5FE",
    brandDeep: "#6D28D9",
    accent: "#22D3A6",
    accentSoft: "#D9FBEF",
  },
};

export const DEFAULT_THEME = "dose";
export const THEME_STORAGE_KEY = "pillsync-theme";
