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
    {
      name: 'local-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Match /api/ai exactly
          if (req.url === '/api/ai' && req.method === 'POST') {
            try {
              let body = '';
              for await (const chunk of req) body += chunk;
              const parsedBody = JSON.parse(body);
              const { prompt, model, responseFormat, provider } = parsedBody;

              const selectedProvider = provider || 'auto';
              const geminiKey = process.env.GEMINI_API_KEY;
              const claudeKey = process.env.CLAUDE_API;

              // Simple local implementation of the provider logic
              if (selectedProvider === 'claude' || (selectedProvider === 'auto' && !geminiKey && claudeKey)) {
                if (!claudeKey) {
                  res.statusCode = 503;
                  res.end(JSON.stringify({ error: 'CLAUDE_API not found in environment' }));
                  return;
                }
                // Call Claude
                const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': claudeKey,
                    'anthropic-version': '2023-06-01'
                  },
                  body: JSON.stringify({
                    model: model || 'claude-3-5-haiku-20241022',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                  })
                });
                const data: any = await claudeRes.json();
                if (!claudeRes.ok) {
                  res.statusCode = claudeRes.status;
                  res.end(JSON.stringify({ error: data.error?.message || 'Claude API error' }));
                  return;
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text: data.content[0].text }));
                return;
              }

              // Default to Gemini
              if (!geminiKey) {
                res.statusCode = 503;
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY not found in environment' }));
                return;
              }

              // Match the worker.ts logic for v1 vs v1beta
              const geminiModel = model || 'gemini-1.5-flash';
              let apiVersion = 'v1';
              let modelId = geminiModel;

              if (geminiModel.includes('2.0') || geminiModel.includes('2.5')) {
                apiVersion = 'v1beta';
              } else if (geminiModel === 'gemini-1.5-flash') {
                modelId = 'gemini-1.5-flash-latest';
              }

              const geminiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelId}:generateContent?key=${geminiKey}`;
              
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
              console.error('Local API error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal server error' }));
            }
            return;
          }
          next();
        });
      },
    }
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
    // Local API handler for AI Studio preview is now in the plugins section
  },
});
