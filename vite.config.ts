/**
 * vite.config.ts — Mimo Job Command Center
 *
 * SECURITY FIX: The previous version contained:
 *   define: { 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) }
 *
 * This inlined the API key as a plaintext string into the compiled JavaScript
 * bundle served to every browser visitor. Any user who opened DevTools or
 * ran `strings` on the bundle would have your API key.
 *
 * The corrected architecture:
 *   - The React app calls /api/ai (a relative URL)
 *   - The Cloudflare Worker (src/worker.ts) receives the request
 *   - The Worker reads env.GEMINI_API_KEY from its secret store
 *   - The Worker calls Gemini and returns the result
 *   - The API key is never sent to the browser
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
  ],

  // ── REMOVED: define block that exposed GEMINI_API_KEY in client bundle ──
  // API keys must never be embedded at build time for a public-facing app.
  // All AI calls now go through the /api/ai Worker proxy endpoint.

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  build: {
    // Cloudflare Workers expects output in ./dist
    outDir: 'dist',
    // Emit sourcemaps for production debugging in Cloudflare Logpush
    sourcemap: false,
  },

  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    // Proxy /api/* to the local Wrangler dev server during development
    // Run: npx wrangler dev --port 8787 in a separate terminal
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
