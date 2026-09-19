import { defineConfig } from 'vite';

export default defineConfig({
  // Serve Pallavi's static HTML pages from public/ as the web root
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    // Talk to the Django dev server without CORS in development.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
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
    },
  },
});
