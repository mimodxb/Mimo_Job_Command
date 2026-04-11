# DEPLOYMENT GUIDE — MIMO JOB COMMAND CENTER
# ═══════════════════════════════════════════════════════════════════════════════
# Apply in this exact order. Do not skip steps.
# ═══════════════════════════════════════════════════════════════════════════════

## STEP 1 — Create the Worker entry point

Create the file: src/worker.ts
Use the content from: mimo-fixes/src/worker.ts

This is the most critical fix. Without this file, Cloudflare has nothing to
run on the edge — it falls back to static-CDN mode which disables all secrets
and causes the SSL handshake failure.


## STEP 2 — Create the AI client utility

Create the file: src/lib/ai.ts
Use the content from: mimo-fixes/src/lib/ai.ts

This module routes all AI requests through /api/ai instead of calling Gemini
directly from the browser. The API key stays server-side permanently.


## STEP 3 — Replace wrangler.jsonc

Replace the root wrangler.jsonc with the content from: mimo-fixes/wrangler.jsonc

Key changes:
  - Added "main": "src/worker.ts"
  - Added "assets.directory": "./dist"
  - Added "assets.binding": "ASSETS"
  - Added "assets.not_found_handling": "single-page-application"


## STEP 4 — Replace vite.config.ts

Replace vite.config.ts with the content from: mimo-fixes/vite.config.ts

Key changes:
  - Removed the 'define' block that exposed GEMINI_API_KEY in the browser bundle
  - Added dev-server proxy so local development still works


## STEP 5 — Replace src/components/AutomationHub.tsx

Replace with: mimo-fixes/src/components/AutomationHub.tsx

Fix: Moved Table2 and Clock imports to the top of the file.
The original had them at the bottom causing ReferenceError in strict mode.


## STEP 6 — Replace src/components/MimoAssistant.tsx

Replace with: mimo-fixes/src/components/MimoAssistant.tsx

Fix: Removed direct GoogleGenAI instantiation.
Now uses generateText() from src/lib/ai.ts which routes through the Worker.


## STEP 7 — Update remaining AI components

The following components also instantiate GoogleGenAI directly and must be
updated to import { generateText, generateJSON } from '../lib/ai' instead:

  - src/components/ContentAI.tsx
  - src/components/JobHunt.tsx
  - src/components/LinkedInEngine.tsx

Pattern to replace in each file:

  BEFORE:
    import { GoogleGenAI } from "@google/genai";
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({ model: "...", contents: prompt });
    const text = response.text;

  AFTER:
    import { generateText } from '../lib/ai';
    const text = await generateText(prompt, { model: 'gemini-2.0-flash' });

  FOR JSON RESPONSES:
    BEFORE:
      const response = await ai.models.generateContent({
        model: "...", contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || "{}");

    AFTER:
      import { generateJSON } from '../lib/ai';
      const result = await generateJSON<YourType>(prompt);


## STEP 8 — Verify secrets in Cloudflare dashboard

Go to: Workers & Pages → mimojobcommand → Settings → Variables and Secrets

Confirm these secrets exist (they already do per your audit):
  ✓ GEMINI_API_KEY
  ✓ CLAUDE_API
  ✓ VITE_GEMINI_API_KEY  (can be removed — no longer needed in vite.config.ts)
  ✓ GOOGLE_AI_STUDIO_URL (can be removed — not used in the Worker)

After adding src/worker.ts, the dashboard will now show:
  ✓ Variables CAN be added (Worker mode active)
  ✓ Triggers CAN be added
  ✓ Logpush CAN be configured


## STEP 9 — Local test before push

  npm install
  npm run build

  # In a second terminal:
  npx wrangler dev

  # Visit http://localhost:8787
  # Test the AI assistant — it should work via /api/ai proxy
  # Check browser DevTools → Network → /api/ai calls should return 200


## STEP 10 — Push to GitHub (triggers Cloudflare auto-deploy)

  git add src/worker.ts src/lib/ai.ts wrangler.jsonc vite.config.ts
  git add src/components/AutomationHub.tsx src/components/MimoAssistant.tsx
  git commit -m "fix: add Worker entry point, secure API proxy, fix static-only deployment

  - Add src/worker.ts: Cloudflare Worker that serves assets and proxies Gemini
  - Add src/lib/ai.ts: Client utility routing AI calls through /api/ai
  - Fix wrangler.jsonc: Add main, assets.binding, assets.directory fields
  - Fix vite.config.ts: Remove GEMINI_API_KEY exposure in client bundle
  - Fix AutomationHub.tsx: Move imports to top of file (ReferenceError fix)
  - Fix MimoAssistant.tsx: Remove direct GoogleGenAI instantiation"

  git push origin main

Cloudflare Workers will auto-deploy from the main branch.
Monitor build at: Cloudflare Dashboard → Workers & Pages → mimojobcommand → Deployments


## EXPECTED OUTCOME AFTER DEPLOYMENT

  Before:
    ✗ ERR_SSL_VERSION_OR_CIPHER_MISMATCH
    ✗ "Variables cannot be added to a Worker that only has static assets"
    ✗ "Triggers cannot be added to a Worker that only has static assets"
    ✗ GEMINI_API_KEY visible in browser bundle (security breach)
    ✗ Runtime crash in AutomationHub (ReferenceError: Table2 is not defined)

  After:
    ✓ mimojobcommand.old-glade-1bbb.workers.dev loads correctly over HTTPS
    ✓ Variables section shows all secrets accessible to the Worker
    ✓ Triggers section enabled
    ✓ API key never appears in browser network traffic or JS bundle
    ✓ All AI features functional through secure server-side proxy
    ✓ AutomationHub renders without errors


## DIAGNOSTICS — If build fails after changes

  Error: "Cannot find module 'src/worker.ts'"
  → Confirm the file exists at the project root level: ./src/worker.ts

  Error: "No asset directory found"
  → Run 'npm run build' first. The ./dist directory must exist before wrangler deploys.

  Error: "ASSETS binding not found" in worker.ts
  → Confirm wrangler.jsonc has: "assets": { "binding": "ASSETS", "directory": "./dist" }

  AI calls return 503
  → Go to Cloudflare dashboard → confirm GEMINI_API_KEY secret is set
  → It must be set AFTER src/worker.ts is deployed (static-only workers can't read secrets)
