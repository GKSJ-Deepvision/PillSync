/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // KORU-inspired Mint/Sage Wellness Palette
        primary: {
          50:  '#f0faf8',
          100: '#d6f3ed',
          200: '#aee7da',
          300: '#7dcfc2',
          400: '#50b8a9',
          500: '#3a9e90',
          600: '#2d8275',
          700: '#22655b',
          800: '#1a4f47',
          900: '#123b35',
        },
        mint: {
          50:  '#edfaf7',
          100: '#c6f0e8',
          200: '#92e2d3',
          300: '#5dcfbe',
          400: '#35baa8',
          500: '#25a090',
          600: '#1d8474',
          700: '#166659',
        },
        sage: {
          50:  '#f4f7f5',
          100: '#e4ede8',
          200: '#c3d8cb',
          300: '#97bda8',
          400: '#699d83',
          500: '#4e7f67',
          600: '#3c6450',
          700: '#2f4e3f',
        },
        success: {
          50:  '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50:  '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50:  '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        warm: {
          50:  '#faf9f7',
          100: '#f0ede8',
          200: '#e0d8ce',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'wellness': '0 4px 24px -4px rgba(58, 158, 144, 0.18)',
        'card':     '0 2px 12px -2px rgba(0,0,0,0.08), 0 1px 4px -1px rgba(0,0,0,0.04)',
        'float':    '0 8px 32px -8px rgba(58, 158, 144, 0.25)',
      },
    },
  },
  plugins: [],
}
