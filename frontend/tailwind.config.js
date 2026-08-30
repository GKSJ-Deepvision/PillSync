/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#101A2E",
          soft: "#1A2740",
          fog: "#7C879C",
        },
        porcelain: {
          DEFAULT: "#F6F8FC",
          dim: "#EAEEF6",
        },
        rose: {
          DEFAULT: "#FF5D73",
          soft: "#FFE3E7",
          deep: "#E23F58",
        },
        indigo: {
          DEFAULT: "#5B5FEF",
          soft: "#E7E7FD",
          deep: "#4144C4",
        },
        mint: {
          DEFAULT: "#22D3A6",
          soft: "#D9FBEF",
          deep: "#149C79",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        soft: "0 20px 45px -20px rgba(16, 26, 46, 0.35)",
        card: "0 1px 2px rgba(16,26,46,0.04), 0 12px 24px -12px rgba(16,26,46,0.12)",
      },
      keyframes: {
        "ring-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "ring-rotate": "ring-rotate 60s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
