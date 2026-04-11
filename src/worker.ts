/// <reference types="@cloudflare/workers-types" />

/**
 * Mimo Job Command Center — Cloudflare Worker Entry Point
 *
 * This file is the mandatory "main" script that Cloudflare requires.
 * Without it, the deployment is treated as static-assets-only, which:
 *   1. Disables all secrets/environment variables
 *   2. Disables all triggers
 *   3. Causes ERR_SSL_VERSION_OR_CIPHER_MISMATCH on workers.dev subdomains
 *
 * This Worker does two things:
 *   A) Proxies all AI requests to Google Gemini (server-side, key never exposed)
 *   B) Serves the React SPA static assets for all other requests
 */

export interface Env {
  ASSETS: Fetcher;
  GEMINI_API_KEY: string;
  CLAUDE_API: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ─── AI Proxy Endpoint ───────────────────────────────────────────────────
    // All Gemini calls from the React app are routed through /api/ai
    // This keeps the API key server-side and out of the browser bundle.
    if (url.pathname === '/api/ai' && request.method === 'POST') {
      return handleAIRequest(request, env);
    }

    // ─── Static Asset Fallback ───────────────────────────────────────────────
    // All other requests (/, /index.html, /assets/*, etc.) are served
    // from the compiled React build via the ASSETS binding.
    return env.ASSETS.fetch(request);
  },
};

async function handleAIRequest(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      model?: string;
      prompt: string;
      responseFormat?: 'text' | 'json';
    };

    if (!body.prompt) {
      return jsonError('Missing required field: prompt', 400);
    }

    const model = body.model || 'gemini-1.5-flash';
    // Handle both uppercase and lowercase to prevent configuration errors
    const apiKey = env.GEMINI_API_KEY || (env as any).gemini_api_key;

    if (!apiKey) {
      return jsonError('Server configuration error: GEMINI_API_KEY is missing on Cloudflare. Please ensure the secret name is all uppercase in your dashboard.', 503);
    }

    // Call Google Gemini REST API directly
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiPayload: Record<string, unknown> = {
      contents: [{ parts: [{ text: body.prompt }] }],
    };

    if (body.responseFormat === 'json') {
      geminiPayload.generationConfig = {
        responseMimeType: 'application/json',
      };
    }

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    const geminiData = await geminiRes.json() as any;

    if (!geminiRes.ok) {
      const errorMessage = geminiData.error?.message || `Gemini API error: ${geminiRes.status}`;
      console.error('Gemini API error:', geminiRes.status, geminiData);
      return jsonError(errorMessage, 502);
    }

    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return new Response(
      JSON.stringify({ text }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (err) {
    console.error('AI proxy error:', err);
    return jsonError('Internal server error', 500);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    }
  );
}
