import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Talk to the Django dev server without CORS in development.
    // 127.0.0.1, not localhost: Node resolves "localhost" to IPv6 ::1 first,
    // while Django's runserver binds IPv4 only - so the proxy would silently
    // miss it (and can land on whatever else holds the IPv6 port).
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', '**/*.test.{js,jsx}'],
    },
  },
});
