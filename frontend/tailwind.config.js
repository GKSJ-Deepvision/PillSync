/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Quicksand", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          400: "#2DD4BF",
          600: "#0D9488",
          700: "#0F766E",
        },
      },
    },
  },
  plugins: [],
}
