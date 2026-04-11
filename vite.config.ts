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
    // Local API handler for AI Studio preview
    // This allows /api/ai to work without a separate Wrangler process
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/ai' && req.method === 'POST') {
          try {
            let body = '';
            for await (const chunk of req) body += chunk;
            const { prompt, model, responseFormat } = JSON.parse(body);

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.statusCode = 503;
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY not found in environment' }));
              return;
            }

            const geminiModel = model || 'gemini-1.5-flash';
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
            
            const payload: any = {
              contents: [{ parts: [{ text: prompt }] }]
            };
            if (responseFormat === 'json') {
              payload.generationConfig = { responseMimeType: 'application/json' };
            }

            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const data: any = await geminiRes.json();
            
            if (!geminiRes.ok) {
              res.statusCode = geminiRes.status;
              res.end(JSON.stringify({ error: data.error?.message || 'Gemini API error' }));
              return;
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ text }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return;
        }
        next();
      });
    },
    // Keep proxy for other environments if needed
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
